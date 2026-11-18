const mongoose = require('mongoose');
const Order = require('../models/Order.model');
const Customer = require('../models/Customer.model');
const Table = require('../models/Table.model');
const Review = require('../models/Review.model');
const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../middleware/asyncHandler');

const getDashboardSummary = asyncHandler(async (req, res) => {
  const tenantObjectId = new mongoose.Types.ObjectId(req.tenantId);

  // Time boundaries
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const startOfYesterday = new Date(startOfToday);
  startOfYesterday.setDate(startOfYesterday.getDate() - 1);

  const startOf7DaysAgo = new Date();
  startOf7DaysAgo.setDate(startOf7DaysAgo.getDate() - 7);
  startOf7DaysAgo.setHours(0, 0, 0, 0);

  const startOf30DaysAgo = new Date();
  startOf30DaysAgo.setDate(startOf30DaysAgo.getDate() - 30);
  startOf30DaysAgo.setHours(0, 0, 0, 0);

  // Valid revenue filter: paid orders, or completed/served orders that aren't cancelled/rejected
  const revenueFilter = {
    tenantId: tenantObjectId,
    status: { $nin: ['cancelled', 'rejected'] },
    $or: [
      { paymentStatus: 'paid' },
      { paymentMethod: { $in: ['cash', 'pay_at_counter'] }, status: { $in: ['served', 'completed'] } },
    ],
  };

  const [
    todayRevenueAgg,
    yesterdayRevenueAgg,
    totalRevenueAgg,
    todayOrdersCount,
    totalOrdersCount,
    totalCustomersCount,
    avgRatingAgg,
    tableStatsAgg,
    revenueGraphAgg,
    popularItemsAgg,
  ] = await Promise.all([
    // Today's revenue
    Order.aggregate([
      { $match: { ...revenueFilter, createdAt: { $gte: startOfToday } } },
      { $group: { _id: null, total: { $sum: '$grandTotal' } } },
    ]),
    // Yesterday's revenue
    Order.aggregate([
      { $match: { ...revenueFilter, createdAt: { $gte: startOfYesterday, $lt: startOfToday } } },
      { $group: { _id: null, total: { $sum: '$grandTotal' } } },
    ]),
    // Total revenue
    Order.aggregate([
      { $match: revenueFilter },
      { $group: { _id: null, total: { $sum: '$grandTotal' } } },
    ]),
    // Today's orders
    Order.countDocuments({ tenantId: tenantObjectId, createdAt: { $gte: startOfToday } }),
    // Total orders
    Order.countDocuments({ tenantId: tenantObjectId }),
    // Total customers
    Customer.countDocuments({ tenantId: tenantObjectId }),
    // Rating
    Review.aggregate([
      { $match: { tenantId: tenantObjectId } },
      { $group: { _id: null, avgRating: { $avg: '$overallRating' }, count: { $sum: 1 } } },
    ]),
    // Table occupancy
    Table.aggregate([
      { $match: { tenantId: tenantObjectId } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          occupied: { $sum: { $cond: [{ $eq: ['$status', 'occupied'] }, 1, 0] } },
          available: { $sum: { $cond: [{ $eq: ['$status', 'available'] }, 1, 0] } },
        },
      },
    ]),
    // Revenue over last 7 days (day by day)
    Order.aggregate([
      { $match: { ...revenueFilter, createdAt: { $gte: startOf7DaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          revenue: { $sum: '$grandTotal' },
          orders: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    // Popular items
    Order.aggregate([
      { $match: { tenantId: tenantObjectId, status: { $nin: ['cancelled', 'rejected'] } } },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.name',
          totalQuantity: { $sum: '$items.quantity' },
          totalRevenue: { $sum: '$items.subtotal' },
        },
      },
      { $sort: { totalQuantity: -1 } },
      { $limit: 5 },
    ]),
  ]);

  const todayRevenue = todayRevenueAgg[0]?.total || 0;
  const yesterdayRevenue = yesterdayRevenueAgg[0]?.total || 0;
  const totalRevenue = totalRevenueAgg[0]?.total || 0;
  const avgOrderValue = totalOrdersCount > 0 ? Math.round(totalRevenue / totalOrdersCount) : 0;
  const avgRating = avgRatingAgg[0]?.avgRating ? parseFloat(avgRatingAgg[0].avgRating.toFixed(1)) : 0;
  const reviewCount = avgRatingAgg[0]?.count || 0;

  const tableStats = tableStatsAgg[0] || { total: 0, occupied: 0, available: 0 };

  // Calculate percentage change for today vs yesterday
  let revenueChange = 0;
  if (yesterdayRevenue > 0) {
    revenueChange = Math.round(((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100);
  }

  return ApiResponse.success(res, {
    stats: {
      todayRevenue,
      yesterdayRevenue,
      revenueChange,
      totalRevenue,
      todayOrders: todayOrdersCount,
      totalOrders: totalOrdersCount,
      totalCustomers: totalCustomersCount,
      avgOrderValue,
      avgRating,
      reviewCount,
      totalTables: tableStats.total,
      occupiedTables: tableStats.occupied,
      availableTables: tableStats.available,
    },
    revenueGraph: revenueGraphAgg.map(r => ({
      date: r._id,
      revenue: r.revenue,
      orders: r.orders,
    })),
    popularItems: popularItemsAgg.map(p => ({
      name: p._id,
      quantity: p.totalQuantity,
      revenue: p.totalRevenue,
    })),
  }, 'Dashboard analytics fetched');
});

// Detailed Revenue Analytics
const getRevenueAnalytics = asyncHandler(async (req, res) => {
  const { period = '7days' } = req.query;
  const tenantObjectId = new mongoose.Types.ObjectId(req.tenantId);

  let startDate = new Date();
  if (period === '30days') startDate.setDate(startDate.getDate() - 30);
  else if (period === 'year') startDate.setFullYear(startDate.getFullYear() - 1);
  else startDate.setDate(startDate.getDate() - 7);
  startDate.setHours(0, 0, 0, 0);

  const revenueFilter = {
    tenantId: tenantObjectId,
    status: { $nin: ['cancelled', 'rejected'] },
    createdAt: { $gte: startDate },
    $or: [
      { paymentStatus: 'paid' },
      { paymentMethod: { $in: ['cash', 'pay_at_counter'] }, status: { $in: ['served', 'completed'] } },
    ],
  };

  const graph = await Order.aggregate([
    { $match: revenueFilter },
    {
      $group: {
        _id: { $dateToString: { format: period === 'year' ? '%Y-%m' : '%Y-%m-%d', date: '$createdAt' } },
        revenue: { $sum: '$grandTotal' },
        orders: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  return ApiResponse.success(res, { graph }, 'Revenue analytics fetched');
});

module.exports = {
  getDashboardSummary,
  getRevenueAnalytics,
};
