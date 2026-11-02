const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');

// GET /api/dashboard  (admin)
exports.getStats = asyncHandler(async (req, res) => {
  const since = new Date();
  since.setMonth(since.getMonth() - 11);
  since.setDate(1);
  since.setHours(0, 0, 0, 0);

  const [revenueAgg, deliveredAgg, totalOrders, totalProducts, totalCustomers, byStatus, monthly, topProducts, recentOrders, lowStock] =
    await Promise.all([
      Order.aggregate([
        { $match: { status: { $ne: 'cancelled' } } },
        { $group: { _id: null, total: { $sum: '$totalPrice' } } },
      ]),
      Order.aggregate([
        { $match: { status: 'delivered' } },
        { $group: { _id: null, total: { $sum: '$totalPrice' } } },
      ]),
      Order.countDocuments(),
      Product.countDocuments(),
      User.countDocuments({ role: 'user' }),
      Order.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      Order.find({ status: { $ne: 'cancelled' }, createdAt: { $gte: since } }).select('createdAt totalPrice'),
      Product.find().sort('-sold').limit(5).select('title sold price discount images'),
      Order.find().sort('-createdAt').limit(8).populate('user', 'name email'),
      Product.find({ stock: { $lte: 5 } }).select('title stock').limit(10),
    ]);

  const buckets = {};
  monthly.forEach((o) => {
    const key = `${o.createdAt.getFullYear()}-${o.createdAt.getMonth() + 1}`;
    const b = (buckets[key] = buckets[key] || { year: o.createdAt.getFullYear(), month: o.createdAt.getMonth() + 1, sales: 0, orders: 0 });
    b.sales += o.totalPrice;
    b.orders += 1;
  });
  const monthlySales = Object.values(buckets).sort((x, y) => x.year - y.year || x.month - y.month);

  res.json({
    success: true,
    stats: {
      totalRevenue: revenueAgg[0]?.total || 0,
      deliveredRevenue: deliveredAgg[0]?.total || 0,
      totalOrders,
      totalProducts,
      totalCustomers,
      ordersByStatus: Object.fromEntries(byStatus.map((s) => [s._id, s.count])),
      monthlySales,
      topProducts,
      recentOrders,
      lowStock,
    },
  });
});
