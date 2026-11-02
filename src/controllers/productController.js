const Product = require('../models/Product');
const asyncHandler = require('../utils/asyncHandler');

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// GET /api/products?keyword=&category=&minPrice=&maxPrice=&sort=&page=&limit=&featured=
exports.getProducts = asyncHandler(async (req, res) => {
  const { keyword, category, style, tag, minPrice, maxPrice, sort, featured } = req.query;
  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.min(parseInt(req.query.limit) || 12, 500);

  const filter = {};
  if (keyword) filter.title = { $regex: escapeRegex(keyword), $options: 'i' };
  if (category) filter.category = { $regex: `^${escapeRegex(category)}$`, $options: 'i' };
  if (style) filter.style = style;
  if (tag) filter.tag = tag;
  if (featured !== undefined) filter.isFeatured = featured === 'true';
  if (minPrice || maxPrice) {
    filter.price = {};
    if (minPrice) filter.price.$gte = Number(minPrice);
    if (maxPrice) filter.price.$lte = Number(maxPrice);
  }

  const sortMap = {
    newest: '-createdAt',
    price_asc: 'price',
    price_desc: '-price',
    rating: '-rating',
    popular: '-sold',
  };

  const [products, total] = await Promise.all([
    Product.find(filter)
      .select('-reviews')
      .sort(sortMap[sort] || '-createdAt')
      .skip((page - 1) * limit)
      .limit(limit),
    Product.countDocuments(filter),
  ]);

  res.json({ success: true, total, page, pages: Math.ceil(total / limit), products });
});

// GET /api/products/categories
exports.getCategories = asyncHandler(async (req, res) => {
  const categories = await Product.distinct('category');
  res.json({ success: true, categories });
});

// GET /api/products/:id
exports.getProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }
  res.json({ success: true, product });
});

// POST /api/products  (admin)
exports.createProduct = asyncHandler(async (req, res) => {
  const { reviews, rating, numReviews, sold, ...data } = req.body;
  if (!data.sizes || !data.sizes.length) data.sizes = ['S', 'M', 'L', 'XL'];
  const product = await Product.create(data);
  res.status(201).json({ success: true, product });
});

// PUT /api/products/:id  (admin)
exports.updateProduct = asyncHandler(async (req, res) => {
  const { reviews, rating, numReviews, sold, ...data } = req.body;
  const product = await Product.findByIdAndUpdate(req.params.id, data, {
    new: true,
    runValidators: true,
  });
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }
  res.json({ success: true, product });
});

// DELETE /api/products/:id  (admin)
exports.deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }
  res.json({ success: true, message: 'Product deleted' });
});

// POST /api/products/:id/reviews  (logged-in user)
exports.addReview = asyncHandler(async (req, res) => {
  const { rating, comment } = req.body;
  const product = await Product.findById(req.params.id);
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }
  if (product.reviews.some((r) => r.user.equals(req.user._id))) {
    res.status(400);
    throw new Error('You already reviewed this product');
  }
  product.reviews.push({ user: req.user._id, name: req.user.name, rating: Number(rating), comment });
  product.numReviews = product.reviews.length;
  product.rating = product.reviews.reduce((s, r) => s + r.rating, 0) / product.reviews.length;
  await product.save();
  res.status(201).json({ success: true, message: 'Review added', product });
});
