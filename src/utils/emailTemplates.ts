import { IOrder, IOrderItem } from '../models/order.model';

interface PopulatedUserBase {
  _id: any;
  name?: string;
  email?: string;
}

interface GenericOrder {
  _id: any;
  user?: PopulatedUserBase | any;
  [key: string]: any;
}

interface PopulatedOrder extends Omit<IOrder, 'user'> {
  user: {
    name: string;
    email: string;
  };
}

export const getOrderCreatedTemplate = (order: PopulatedOrder): string => {
  const itemsHtml = order.orderItems
    .map(
      (item: IOrderItem) => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.name}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">L.E ${item.price.toFixed(2)}</td>
    </tr>
  `
    )
    .join('');

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
      <h2 style="color: #2e7d32;">Order Confirmation</h2>
      <p>Thank you for your order, <strong>${order.user.name || 'Valued Customer'}</strong>!</p>
      <p>Your order ID is: <strong>${order._id}</strong></p>
      
      <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
        <thead>
          <tr style="background-color: #f8f8f8;">
            <th style="padding: 10px; text-align: left;">Item</th>
            <th style="padding: 10px; text-align: center;">Qty</th>
            <th style="padding: 10px; text-align: right;">Price</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>
      
      <div style="margin-top: 20px; text-align: right;">
        <p>Subtotal: L.E ${order.itemsPrice.toFixed(2)}</p>
        <p>Shipping: L.E ${order.shippingPrice.toFixed(2)}</p>
        <p>Tax: L.E ${order.taxPrice.toFixed(2)}</p>
        <hr style="border: 0; border-top: 1px solid #eee;">
        <h3 style="color: #2e7d32;">Total: L.E ${order.totalPrice.toFixed(2)}</h3>
      </div>
      
      <div style="margin-top: 30px; padding: 20px; background-color: #f1f8e9; border-radius: 5px;">
        <h4 style="margin-top: 0;">Shipping Address</h4>
        <p style="margin-bottom: 0;">
          ${order.shippingAddress.street}<br>
          ${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.zipCode}<br>
          ${order.shippingAddress.country}
        </p>
      </div>
      
      <p style="margin-top: 30px; font-size: 12px; color: #777;">
        If you have any questions, please contact our support team.
      </p>
    </div>
  `;
};

export const getOrderAcceptedTemplate = (order: GenericOrder): string => {
  const itemsHtml = (order.orderItems || [])
    .map(
      (item: any) => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.name}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">L.E ${item.price.toFixed(2)}</td>
    </tr>
  `
    )
    .join('');

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
      <div style="padding: 20px; text-align: center; border-bottom: 3px solid #2D4B38; background-color: #f1f8e9;">
        <h1 style="color: #2D4B38; margin: 0;">Alpac Pharmacom</h1>
      </div>
      <div style="padding: 30px;">
        <h2 style="color: #2D4B38; margin-top: 0;">🎉 Your Order Has Been Accepted!</h2>
        <p>Hello <strong>${order.user?.name || 'Valued Customer'}</strong>,</p>
        <p>Great news! Your order has been reviewed and <strong style="color: #2D4B38;">accepted</strong> by our team. We are now preparing your botanical selections for dispatch.</p>
        <p>Order Reference: <strong>#${String(order._id).slice(-8).toUpperCase()}</strong></p>

        ${
          order.adminNote
            ? `
        <div style="margin: 20px 0; padding: 15px; background-color: #e8f5e9; border-left: 4px solid #2D4B38; border-radius: 4px;">
          <p style="margin: 0; font-style: italic; color: #1a2e1f;"><strong>Note from our team:</strong> ${order.adminNote}</p>
        </div>`
            : ''
        }

        <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
          <thead>
            <tr style="background-color: #f1f8e9;">
              <th style="padding: 10px; text-align: left;">Item</th>
              <th style="padding: 10px; text-align: center;">Qty</th>
              <th style="padding: 10px; text-align: right;">Price</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <div style="margin-top: 20px; text-align: right;">
          <p>Subtotal: L.E ${(order.itemsPrice || 0).toFixed(2)}</p>
          ${order.discountPrice ? `<p style="color: #2D4B38;">Discount: -L.E ${order.discountPrice.toFixed(2)}</p>` : ''}
          <p>Shipping: ${order.shippingPrice === 0 ? 'Complimentary' : `L.E ${(order.shippingPrice || 0).toFixed(2)}`}</p>
          <hr style="border: 0; border-top: 1px solid #eee;">
          <h3 style="color: #2D4B38;">Total: L.E ${(order.totalPrice || 0).toFixed(2)}</h3>
        </div>

        <p style="margin-top: 20px;">You will receive another update once your order has been shipped.</p>
        <p style="margin-top: 30px; font-size: 12px; color: #777;">Thank you for choosing Alpac Pharmacom.</p>
      </div>
    </div>
  `;
};

export const getOrderDeclinedTemplate = (order: GenericOrder): string => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
      <div style="padding: 20px; text-align: center; border-bottom: 3px solid #2D4B38; background-color: #f1f8e9;">
        <h1 style="color: #2D4B38; margin: 0;">Alpac Pharmacom</h1>
      </div>
      <div style="padding: 30px;">
        <h2 style="color: #c62828; margin-top: 0;">Order Update — Action Required</h2>
        <p>Hello <strong>${order.user?.name || 'Valued Customer'}</strong>,</p>
        <p>We regret to inform you that your order <strong>#${String(order._id).slice(-8).toUpperCase()}</strong> could not be fulfilled at this time and has been <strong style="color: #c62828;">declined</strong>.</p>

        ${
          order.adminNote
            ? `
        <div style="margin: 20px 0; padding: 15px; background-color: #fdecea; border-left: 4px solid #c62828; border-radius: 4px;">
          <p style="margin: 0; font-style: italic; color: #b71c1c;"><strong>Reason from our team:</strong> ${order.adminNote}</p>
        </div>`
            : ''
        }

        <p>No charge has been made. You are welcome to place a new order or contact our support team for assistance.</p>
        <p style="margin-top: 30px; font-size: 12px; color: #777;">Thank you for your understanding. We hope to serve you again soon.</p>
      </div>
    </div>
  `;
};

export const getOrderCancelledTemplate = (order: GenericOrder): string => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
      <h2 style="color: #c62828;">Order Cancelled</h2>
      <p>Hello,</p>
      <p>Your order with ID <strong>${order._id}</strong> has been cancelled.</p>
      <p>If this was not expected, please contact our support team immediately.</p>
      
      <p style="margin-top: 30px; font-size: 12px; color: #777;">
        Thank you for choosing Alpac.
      </p>
    </div>
  `;
};

export const getPasswordResetTemplate = (resetUrl: string): string => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333; line-height: 1.6;">
      <div style="padding: 20px; text-align: center; border-bottom: 2px solid #3d6b4f;">
        <h1 style="color: #3d6b4f; margin: 0;">Alpac Pharmacom</h1>
      </div>
      <div style="padding: 30px; border: 1px solid #eee; border-top: none; border-radius: 0 0 5px 5px;">
        <h2 style="margin-top: 0; color: #1a1a1a;">Reset Your Password</h2>
        <p>We received a request to reset your Alpac account password. Click the button below to proceed:</p>
        <div style="text-align: center; margin: 35px 0;">
          <a href="${resetUrl}" style="background-color: #3d6b4f; color: white; padding: 14px 28px; text-decoration: none; border-radius: 4px; font-weight: 600; font-size: 16px;">
            Reset Password
          </a>
        </div>
        <p style="color: #666; font-size: 14px;">This link will expire in 10 minutes for your security. If you didn't request this, you can safely ignore this email.</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 25px 0;">
        <p style="color: #999; font-size: 12px;">If you're having trouble clicking the button, copy and paste the URL below into your web browser:</p>
        <p style="color: #3d6b4f; font-size: 12px; word-break: break-all;">${resetUrl}</p>
      </div>
    </div>
  `;
};
