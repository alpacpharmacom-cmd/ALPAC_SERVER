import { Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { Cart, ICartItem } from '../models/cart.model';
import { Product } from '../models/product.model';
import { AuthRequest } from '../middleware/auth.middleware';
import { successResponse } from '../utils/apiResponse';

export const getCart = asyncHandler(async (req: AuthRequest, res: Response) => {
  let cart = await Cart.findOne({ user: req.user._id }).populate({
    path: 'items.product',
    select: '-countInStock',
  });

  if (!cart) {
    cart = await Cart.create({ user: req.user._id, items: [] });
  } else {
    // Filter out items with null products (deleted products)
    const originalCount = cart.items.length;
    cart.items = cart.items.filter((item: any) => item.product !== null) as any;

    // If we removed any items, save the cleaned-up cart
    if (cart.items.length !== originalCount) {
      await cart.save();
    }
  }

  successResponse(res, cart, 'Cart retrieved successfully');
});

export const addToCart = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { productId } = req.params;
  const { quantity } = req.body;

  const qty = Number(quantity) || 1;

  // Check if product exists
  const product = await Product.findById(productId);
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  let cart = await Cart.findOne({ user: req.user._id });

  if (!cart) {
    cart = new Cart({
      user: req.user._id,
      items: [{ product: productId, quantity: qty }],
    });
  } else {
    // Check if product already in cart
    const itemIndex = cart.items.findIndex(
      (item: ICartItem) => item.product.toString() === productId
    );

    if (itemIndex > -1) {
      // Update quantity
      const newQuantity = cart.items[itemIndex].quantity + qty;
      cart.items[itemIndex].quantity = newQuantity;
    } else {
      cart.items.push({ product: productId, quantity: qty });
    }
  }

  await cart.save();
  await cart.populate({ path: 'items.product', select: '-countInStock' });

  // Safety filter after population to ensure no null products are sent
  cart.items = cart.items.filter((item: any) => item.product !== null) as any;

  successResponse(res, cart, 'Product added to cart successfully');
});

export const updateCartItemQuantity = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { productId } = req.params;
  const { quantity } = req.body;

  if (quantity === undefined) {
    res.status(400);
    throw new Error('Quantity is required');
  }

  const qty = Number(quantity);
  if (qty < 1) {
    res.status(400);
    throw new Error('Quantity must be at least 1');
  }

  const cart = await Cart.findOne({ user: req.user._id });

  if (!cart) {
    res.status(404);
    throw new Error('Cart not found');
  }

  const itemIndex = cart.items.findIndex(
    (item: ICartItem) => item.product.toString() === productId
  );

  if (itemIndex === -1) {
    res.status(404);
    throw new Error('Product not found in cart');
  }

  // Verify product still exists and check stock
  const product = await Product.findById(productId);
  if (!product) {
    res.status(404);
    throw new Error('Product no longer exists');
  }

  cart.items[itemIndex].quantity = qty;
  await cart.save();
  await cart.populate({ path: 'items.product', select: '-countInStock' });

  successResponse(res, cart, 'Cart item quantity updated successfully');
});

export const removeFromCart = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { productId } = req.params;

  const cart = await Cart.findOne({ user: req.user._id });

  if (!cart) {
    res.status(404);
    throw new Error('Cart not found');
  }

  const itemExists = cart.items.some((item: ICartItem) => item.product.toString() === productId);

  if (!itemExists) {
    res.status(404);
    throw new Error('Product not found in cart');
  }

  cart.items = cart.items.filter(
    (item: ICartItem) => item.product.toString() !== productId
  ) as typeof cart.items;

  await cart.save();
  await cart.populate({ path: 'items.product', select: '-countInStock' });

  successResponse(res, cart, 'Product removed from cart successfully');
});

export const clearCart = asyncHandler(async (req: AuthRequest, res: Response) => {
  const cart = await Cart.findOneAndUpdate({ user: req.user._id }, { items: [] }, { new: true });

  if (!cart) {
    res.status(404);
    throw new Error('Cart not found');
  }

  successResponse(res, cart, 'Cart cleared successfully');
});
