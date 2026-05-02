import { Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { Order } from '../models/order.model';
import { Product } from '../models/product.model';
import { AuthRequest } from '../middleware/auth.middleware';
import mongoose from 'mongoose';

import { successResponse } from '../utils/apiResponse';

/**
 * @desc    Get dashboard statistics
 * @route   GET /api/admin/stats
 * @access  Private/Admin
 */
export const getDashboardStats = asyncHandler(async (req: AuthRequest, res: Response) => {
  // 1. Total Revenue (from non-cancelled/declined orders)
  const totalRevenueData = await Order.aggregate([
    {
      $match: {
        status: { $nin: ['cancelled', 'declined'] },
      },
    },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: '$totalPrice' },
        count: { $sum: 1 },
      },
    },
  ]);

  const totalRevenue = totalRevenueData.length > 0 ? totalRevenueData[0].totalRevenue : 0;
  const totalOrders = totalRevenueData.length > 0 ? totalRevenueData[0].count : 0;

  // 2. Daily Sales (Last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const dailySales = await Order.aggregate([
    {
      $match: {
        createdAt: { $gte: thirtyDaysAgo },
        status: { $nin: ['cancelled', 'declined'] },
      },
    },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        sales: { $sum: '$totalPrice' },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  // 3. Monthly Sales Summary (Last 12 months)
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

  const monthlySummary = await Order.aggregate([
    {
      $match: {
        createdAt: { $gte: oneYearAgo },
        status: { $nin: ['cancelled', 'declined'] },
      },
    },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
        sales: { $sum: '$totalPrice' },
        orders: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  // 4. Top Selling Products
  const topSellingProducts = await Order.aggregate([
    {
      $match: {
        status: { $nin: ['cancelled', 'declined'] },
      },
    },
    { $unwind: '$orderItems' },
    {
      $group: {
        _id: '$orderItems.product',
        name: { $first: '$orderItems.name' },
        image: { $first: '$orderItems.image' },
        totalQty: { $sum: '$orderItems.quantity' },
        totalRevenue: { $sum: { $multiply: ['$orderItems.price', '$orderItems.quantity'] } },
      },
    },
    { $sort: { totalQty: -1 } },
    { $limit: 5 },
  ]);

  // 5. Low Stock Alerts
  const lowStockProducts = await Product.find({ countInStock: { $lt: 5 } })
    .select('name image countInStock price')
    .limit(10);

  const lowStockCount = await Product.countDocuments({ countInStock: { $lt: 5 } });

  // 6. Recent Orders
  const recentOrders = await Order.find()
    .sort({ createdAt: -1 })
    .limit(5)
    .populate('user', 'name')
    .select('createdAt status totalPrice user');

  const pendingOrdersCount = await Order.countDocuments({ status: 'pending' });

  // 7. Totals
  const totalProducts = await Product.countDocuments();
  const totalUsers = await mongoose.model('User').countDocuments();

  successResponse(
    res,
    {
      totalRevenue,
      totalOrders,
      dailySales,
      monthlySummary,
      topSellingProducts,
      lowStockProducts,
      lowStockCount,
      recentOrders,
      pendingOrdersCount,
      totalProducts,
      totalUsers,
    },
    'Dashboard statistics retrieved successfully'
  );
});
