const jwt = require('jsonwebtoken');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');

exports.protect = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    res.status(401);
    throw new Error('Not authorized, token missing');
  }
  const decoded = jwt.verify(header.split(' ')[1], process.env.JWT_SECRET);
  const user = await User.findById(decoded.id);
  if (!user) {
    res.status(401);
    throw new Error('User no longer exists');
  }
  if (!user.isActive) {
    res.status(403);
    throw new Error('Account is disabled');
  }
  req.user = user;
  next();
});

exports.adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') return next();
  res.status(403);
  next(new Error('Admin access only'));
};
