import { Response } from 'express';
import mongoose from 'mongoose';
import { asyncHandler } from '../utils/asyncHandler';
import { Order, IOrder } from '../models/order.model';
import { Product } from '../models/product.model';
import { Cart } from '../models/cart.model';
import { AuthRequest } from '../middleware/auth.middleware';
import { successResponse } from '../utils/apiResponse';
import { sendEmail } from '../utils/sendEmail';
import { getOrderCreatedTemplate, getOrderCancelledTemplate } from '../utils/emailTemplates';

interface PopulatedUser {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
}

interface PopulatedOrder extends Omit<IOrder, 'user'> {
  user: PopulatedUser;
}

/**
 * Helper to check if it's the user's first order
 */
async function checkIsFirstOrder(userId: string | mongoose.Types.ObjectId): Promise<boolean> {
  const count = await Order.countDocuments({ user: userId });
  return count === 0;
}

export const createOrder = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { orderItems, shippingAddress } = req.body;

  if (!orderItems || orderItems.length === 0) {
    res.status(400);
    throw new Error('No order items provided');
  }

  if (!shippingAddress) {
    res.status(400);
    throw new Error('Shipping address is required');
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Validate each item and build order items with price snapshots
    const validatedItems = [];

    for (const item of orderItems) {
      const product = await Product.findById(item.product).session(session);

      if (!product) {
        res.status(404);
        throw new Error(`Product not found: ${item.product}`);
      }

      const qty = Number(item.quantity) || 1;

      if (product.countInStock < qty) {
        res.status(400);
        throw new Error(
          `Insufficient stock for "${product.name}". `
        );
      }

      const effectivePrice = Number(product.price.toFixed(2));
      let itemPrice = effectivePrice * qty;

      // Apply Buy X Get Y Offer
      if (product.offer && product.offer.isActive && product.offer.buy > 0 && product.offer.get > 0) {
        const { buy, get } = product.offer;
        const bundles = Math.floor(qty / (buy + get));
        const remainder = qty % (buy + get);
        const paidQuantity = (bundles * buy) + Math.min(remainder, buy);
        itemPrice = effectivePrice * paidQuantity;
      }

      validatedItems.push({
        product: product._id,
        name: product.name,
        image: product.image,
        price: effectivePrice,
        quantity: qty,
        totalItemPrice: Number(itemPrice.toFixed(2)),
      });
    }

    // Calculate prices
    const itemsPrice = validatedItems.reduce((sum, item) => sum + (item as any).totalItemPrice, 0);

    // First Order Discount (10% on itemsPrice)
    const isFirstOrder = await checkIsFirstOrder(req.user._id);
    const discountPrice = isFirstOrder ? Number((itemsPrice * 0.1).toFixed(2)) : 0;

    const shippingPrice = 0;
    const taxPrice = 0;
    const totalPrice = Number((itemsPrice - discountPrice).toFixed(2));

    // Decrement stock
    for (const item of validatedItems) {
      await Product.findByIdAndUpdate(
        item.product,
        { $inc: { countInStock: -item.quantity } },
        { session }
      );
    }

    // Create order
    const [order] = await Order.create(
      [
        {
          user: req.user._id,
          orderItems: validatedItems,
          shippingAddress,
          itemsPrice,
          discountPrice,
          shippingPrice,
          taxPrice,
          totalPrice,
          isFirstOrder,
        },
      ],
      { session }
    );

    // Clear user's cart after successful order
    await Cart.findOneAndUpdate({ user: req.user._id }, { items: [] }, { session });

    await session.commitTransaction();

    // Trigger Email Notification (Non-blocking)
    if (req.user.email) {
      sendEmail({
        email: req.user.email,
        subject: `Order Confirmation - ${order._id}`,
        message: `Thank you for your order! Your order ID is ${order._id}.`,
        html: getOrderCreatedTemplate(order),
      });
    }

    successResponse(res, order, 'Order created successfully', 201);
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
});

export const getMyOrders = asyncHandler(async (req: AuthRequest, res: Response) => {
  const orders = await Order.find({ user: req.user._id })
    .sort({ createdAt: -1 })
    .populate('orderItems.product', 'name image price');

  successResponse(res, orders, 'My orders retrieved successfully');
});

export const cancelOrder = asyncHandler(async (req: AuthRequest, res: Response) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const order = await Order.findById(req.params.id).session(session);

    if (!order) {
      res.status(404);
      throw new Error('Order not found');
    }

    if (!order.user || order.user.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error('Not authorized to cancel this order');
    }

    if (order.status !== 'pending') {
      res.status(400);
      throw new Error(
        `Cannot cancel an order with status "${order.status}". Only pending orders can be cancelled.`
      );
    }

    for (const item of order.orderItems) {
      await Product.findByIdAndUpdate(
        item.product,
        { $inc: { countInStock: item.quantity } },
        { session }
      );
    }

    order.status = 'cancelled';
    const updatedOrder = await order.save({ session });

    await session.commitTransaction();

    // Trigger Email Notification (Non-blocking)
    const populatedOrder = (await Order.findById(order._id).populate(
      'user',
      'name email'
    )) as unknown as PopulatedOrder;

    if (populatedOrder && populatedOrder.user?.email) {
      sendEmail({
        email: populatedOrder.user.email,
        subject: `Order Cancelled - ${order._id}`,
        message: `Your order ${order._id} has been cancelled.`,
        html: getOrderCancelledTemplate(populatedOrder),
      });
    }

    successResponse(res, updatedOrder, 'Order cancelled successfully');
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
});

// ==================== ADMIN ====================

export const getOrderById = asyncHandler(async (req: AuthRequest, res: Response) => {
  const order = await Order.findById(req.params.id)
    .populate('user', 'name email')
    .populate('orderItems.product', 'name image price');

  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  if (!order.user) {
    if (!req.user.isAdmin) {
      res.status(403);
      throw new Error('Not authorized to view this order');
    }
  } else {
    const orderUserId = order.user._id ? order.user._id.toString() : order.user.toString();
    if (orderUserId !== req.user._id.toString() && !req.user.isAdmin) {
      res.status(403);
      throw new Error('Not authorized to view this order');
    }
  }

  successResponse(res, order, 'Order details retrieved successfully');
});

export const getAllOrders = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { status } = req.query;

  const filter: Record<string, unknown> = {};
  if (status && typeof status === 'string') {
    filter.status = status;
  }

  const orders = await Order.find(filter).populate('user', 'name email').sort({ createdAt: -1 });

  successResponse(res, orders, 'All orders retrieved successfully');
});

export const acceptOrder = asyncHandler(async (req: AuthRequest, res: Response) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  if (order.status !== 'pending') {
    res.status(400);
    throw new Error(
      `Cannot accept an order with status "${order.status}". Only pending orders can be accepted.`
    );
  }

  order.status = 'accepted';
  order.adminNote = req.body.note || '';

  const updatedOrder = await order.save();

  successResponse(res, updatedOrder, 'Order accepted successfully');
});

export const declineOrder = asyncHandler(async (req: AuthRequest, res: Response) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const order = await Order.findById(req.params.id).session(session);

    if (!order) {
      res.status(404);
      throw new Error('Order not found');
    }

    if (order.status !== 'pending') {
      res.status(400);
      throw new Error(`Cannot decline an order with status "${order.status}".`);
    }

    for (const item of order.orderItems) {
      await Product.findByIdAndUpdate(
        item.product,
        { $inc: { countInStock: item.quantity } },
        { session }
      );
    }

    order.status = 'declined';
    order.adminNote = req.body.note || '';

    const updatedOrder = await order.save({ session });

    await session.commitTransaction();

    // Trigger Email Notification (Non-blocking)
    const populatedOrder = (await Order.findById(order._id).populate(
      'user',
      'name email'
    )) as unknown as PopulatedOrder;

    if (populatedOrder && populatedOrder.user?.email) {
      sendEmail({
        email: populatedOrder.user.email,
        subject: `Order Declined - ${order._id}`,
        message: `Your order ${order._id} has been declined.`,
        html: getOrderCancelledTemplate(populatedOrder),
      });
    }

    successResponse(res, updatedOrder, 'Order declined successfully');
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
});

export const updateOrderStatus = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { status } = req.body;

  const validStatuses = ['processing', 'shipped', 'delivered', 'cancelled'];

  if (!status || !validStatuses.includes(status)) {
    res.status(400);
    throw new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
  }

  const order = await Order.findById(req.params.id);

  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  if (order.status === 'delivered' || order.status === 'cancelled') {
    res.status(400);
    throw new Error(`Cannot update status of an order with status "${order.status}".`);
  }

  order.status = status;

  if (status === 'delivered') {
    order.deliveredAt = new Date();
  }

  const updatedOrder = await order.save();

  // Trigger Email Notification if cancelled (Non-blocking)
  if (status === 'cancelled') {
    const populatedOrder = (await Order.findById(order._id).populate(
      'user',
      'name email'
    )) as unknown as PopulatedOrder;

    if (populatedOrder && populatedOrder.user?.email) {
      sendEmail({
        email: populatedOrder.user.email,
        subject: `Order Status Updated: Cancelled - ${order._id}`,
        message: `Your order ${order._id} has been cancelled.`,
        html: getOrderCancelledTemplate(populatedOrder),
      });
    }
  }

  successResponse(res, updatedOrder, 'Order status updated successfully');
});

export const deleteOrder = asyncHandler(async (req: AuthRequest, res: Response) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  await Order.deleteOne({ _id: order._id });

  successResponse(res, null, 'Order deleted successfully');
});
