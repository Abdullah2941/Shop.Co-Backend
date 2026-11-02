const Order = require('../models/Order');
const Product = require('../models/Product');
const asyncHandler = require('../utils/asyncHandler');

const SHIPPING_FEE = 15; // flat, same as the storefront cart
const PROMOS = { SHOPCO10: 10 }; // code -> percent off
const round2 = (n) => Math.round(n * 100) / 100;

// POST /api/orders
exports.createOrder = asyncHandler(async (req, res) => {
  const { items, shippingAddress, paymentMethod, promoCode } = req.body;
  if (!Array.isArray(items) || items.length === 0) {
    res.status(400);
    throw new Error('Order has no items');
  }

  const products = await Product.find({ _id: { $in: items.map((i) => i.product) } });

  // total qty wanted per product (same product may appear with different sizes/colors)
  const wanted = {};
  items.forEach((i) => {
    const q = Math.max(1, parseInt(i.qty) || 1);
    wanted[i.product] = (wanted[i.product] || 0) + q;
  });

  const orderItems = items.map((i) => {
    const p = products.find((x) => x._id.equals(i.product));
    if (!p) {
      res.status(404);
      throw new Error(`Product not found: ${i.product}`);
    }
    if (p.stock < wanted[i.product]) {
      res.status(400);
      throw new Error(`Not enough stock for "${p.title}" (available: ${p.stock})`);
    }
    return {
      product: p._id,
      title: p.title,
      image: p.image || p.images[0],
      price: p.finalPrice, // price always taken from DB, never from client
      qty: Math.max(1, parseInt(i.qty) || 1),
      size: i.size,
      color: i.color,
    };
  });

  const itemsPrice = round2(orderItems.reduce((s, i) => s + i.price * i.qty, 0));
  const code = (promoCode || '').trim().toUpperCase();
  const percent = PROMOS[code] || 0;
  const discountPrice = round2((itemsPrice * percent) / 100);
  const shippingPrice = SHIPPING_FEE;

  const order = await Order.create({
    user: req.user._id,
    items: orderItems,
    shippingAddress,
    paymentMethod,
    itemsPrice,
    promoCode: percent ? code : undefined,
    discountPrice,
    shippingPrice,
    totalPrice: round2(itemsPrice - discountPrice + shippingPrice),
  });

  await Product.bulkWrite(
    orderItems.map((i) => ({
      updateOne: { filter: { _id: i.product }, update: { $inc: { stock: -i.qty, sold: i.qty } } },
    }))
  );

  res.status(201).json({ success: true, order });
});

// GET /api/orders/my
exports.getMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user._id }).sort('-createdAt');
  res.json({ success: true, orders });
});

// GET /api/orders/:id  (owner or admin)
exports.getOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate('user', 'name email');
  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }
  if (req.user.role !== 'admin' && !order.user._id.equals(req.user._id)) {
    res.status(403);
    throw new Error('Not allowed to view this order');
  }
  res.json({ success: true, order });
});

// GET /api/orders?status=&page=&limit=  (admin)
exports.getAllOrders = asyncHandler(async (req, res) => {
  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.min(parseInt(req.query.limit) || 20, 100);
  const filter = req.query.status ? { status: req.query.status } : {};

  const [orders, total] = await Promise.all([
    Order.find(filter)
      .populate('user', 'name email')
      .sort('-createdAt')
      .skip((page - 1) * limit)
      .limit(limit),
    Order.countDocuments(filter),
  ]);
  res.json({ success: true, total, page, pages: Math.ceil(total / limit), orders });
});

// PUT /api/orders/:id/status  (admin)
exports.updateOrderStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const allowed = Order.schema.path('status').enumValues;
  if (!allowed.includes(status)) {
    res.status(400);
    throw new Error(`Status must be one of: ${allowed.join(', ')}`);
  }
  const order = await Order.findById(req.params.id);
  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }
  if (order.status === 'cancelled') {
    res.status(400);
    throw new Error('Cancelled order cannot be changed');
  }

  if (status === 'cancelled') {
    await Product.bulkWrite(
      order.items.map((i) => ({
        updateOne: { filter: { _id: i.product }, update: { $inc: { stock: i.qty, sold: -i.qty } } },
      }))
    );
  }
  if (status === 'delivered') {
    order.deliveredAt = new Date();
    if (!order.isPaid) {
      order.isPaid = true;
      order.paidAt = new Date();
    }
  }
  order.status = status;
  await order.save();
  res.json({ success: true, order });
});
