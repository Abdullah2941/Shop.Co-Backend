const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const generateToken = require('../utils/generateToken');

const userPayload = (u) => ({ _id: u._id, name: u.name, email: u.email, role: u.role, phone: u.phone, createdAt: u.createdAt });

// POST /api/auth/register
exports.register = asyncHandler(async (req, res) => {
  const { name, email, password, phone } = req.body;
  if (!name || !email || !password) {
    res.status(400);
    throw new Error('Name, email and password are required');
  }
  if (await User.findOne({ email })) {
    res.status(400);
    throw new Error('Email already registered');
  }
  const user = await User.create({ name, email, password, phone }); // role always "user"
  res.status(201).json({ success: true, token: generateToken(user._id), user: userPayload(user) });
});

// POST /api/auth/login
exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.matchPassword(password || ''))) {
    res.status(401);
    throw new Error('Invalid email or password');
  }
  if (!user.isActive) {
    res.status(403);
    throw new Error('Account is disabled');
  }
  res.json({ success: true, token: generateToken(user._id), user: userPayload(user) });
});

// POST /api/auth/admin-login  (admin panel uses this; rejects non-admins)
exports.adminLogin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.matchPassword(password || '')) || user.role !== 'admin') {
    res.status(401);
    throw new Error('Invalid admin credentials');
  }
  res.json({ success: true, token: generateToken(user._id), user: userPayload(user) });
});

// GET /api/auth/me
exports.getMe = asyncHandler(async (req, res) => {
  res.json({ success: true, user: userPayload(req.user) });
});

// PUT /api/auth/me
exports.updateMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('+password');
  user.name = req.body.name || user.name;
  if (req.body.phone !== undefined) user.phone = req.body.phone;
  if (req.body.email && req.body.email.toLowerCase() !== user.email) {
    const email = req.body.email.trim().toLowerCase();
    if (await User.findOne({ email, _id: { $ne: user._id } })) {
      res.status(400);
      throw new Error('Email already registered');
    }
    user.email = email;
  }
  if (req.body.password) user.password = req.body.password;
  await user.save();
  res.json({ success: true, user: userPayload(user) });
});
