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
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">$${item.price.toFixed(2)}</td>
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
        <p>Subtotal: $${order.itemsPrice.toFixed(2)}</p>
        <p>Shipping: $${order.shippingPrice.toFixed(2)}</p>
        <p>Tax: $${order.taxPrice.toFixed(2)}</p>
        <hr style="border: 0; border-top: 1px solid #eee;">
        <h3 style="color: #2e7d32;">Total: $${order.totalPrice.toFixed(2)}</h3>
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
