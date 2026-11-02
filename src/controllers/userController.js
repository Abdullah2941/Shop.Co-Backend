const User = require('../models/User');
const Order = require('../models/Order');
const asyncHandler = require('../utils/asyncHandler');

// GET /api/users?keyword=&page=&limit=  (admin)
exports.getUsers = asyncHandler(async (req, res) => {
  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.min(parseInt(req.query.limit) || 20, 100);
  const filter = {};
  if (req.query.keyword) {
    const rx = new RegExp(req.query.keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    filter.$or = [{ name: rx }, { email: rx }];
  }
  const [users, total] = await Promise.all([
    User.find(filter).sort('-createdAt').skip((page - 1) * limit).limit(limit),
    User.countDocuments(filter),
  ]);
  res.json({ success: true, total, page, pages: Math.ceil(total / limit), users });
});

// GET /api/users/customers  (admin) - every customer + their order stats
exports.getCustomers = asyncHandler(async (req, res) => {
  const [users, orders] = await Promise.all([
    User.find({ role: 'user' }).sort('-createdAt'),
    Order.find({ status: { $ne: 'cancelled' } }).select('user items totalPrice'),
  ]);
  const byUser = {};
  orders.forEach((o) => {
    const s = (byUser[String(o.user)] = byUser[String(o.user)] || { orders: 0, items: 0, spent: 0 });
    s.orders += 1;
    s.items += o.items.reduce((n, i) => n + i.qty, 0);
    s.spent += o.totalPrice;
  });
  const customers = users.map((u) => {
    const s = byUser[String(u._id)] || {};
    return {
      id: u._id,
      name: u.name,
      email: u.email,
      phone: u.phone,
      isActive: u.isActive,
      joinedAt: u.createdAt,
      orders: s.orders || 0,
      items: s.items || 0,
      spent: s.spent || 0,
    };
  });
  res.json({ success: true, customers });
});

// GET /api/users/:id  (admin)
exports.getUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }
  res.json({ success: true, user });
});

// PUT /api/users/:id  (admin) - change name / role / active status
exports.updateUser = asyncHandler(async (req, res) => {
  const { name, role, isActive } = req.body;
  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }
  const self = req.params.id === req.user._id.toString();
  if (self && (role === 'user' || isActive === false)) {
    res.status(400);
    throw new Error('You cannot demote or disable yourself');
  }
  if (name !== undefined) user.name = name;
  if (role !== undefined) user.role = role;
  if (isActive !== undefined) user.isActive = isActive;
  await user.save();
  res.json({ success: true, user });
});

// DELETE /api/users/:id  (admin)
exports.deleteUser = asyncHandler(async (req, res) => {
  if (req.params.id === req.user._id.toString()) {
    res.status(400);
    throw new Error('You cannot delete yourself');
  }
  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }
  res.json({ success: true, message: 'User deleted' });
});
