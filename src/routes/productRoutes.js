const router = require('express').Router();
const c = require('../controllers/productController');
const { protect, adminOnly } = require('../middleware/auth');

router.get('/categories', c.getCategories);
router.route('/').get(c.getProducts).post(protect, adminOnly, c.createProduct);
router
  .route('/:id')
  .get(c.getProduct)
  .put(protect, adminOnly, c.updateProduct)
  .delete(protect, adminOnly, c.deleteProduct);
router.post('/:id/reviews', protect, c.addReview);

module.exports = router;
