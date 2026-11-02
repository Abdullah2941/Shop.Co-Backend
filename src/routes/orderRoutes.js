const router = require('express').Router();
const c = require('../controllers/orderController');
const { protect, adminOnly } = require('../middleware/auth');

router.route('/').post(protect, c.createOrder).get(protect, adminOnly, c.getAllOrders);
router.get('/my', protect, c.getMyOrders);
router.get('/:id', protect, c.getOrder);
router.put('/:id/status', protect, adminOnly, c.updateOrderStatus);

module.exports = router;
