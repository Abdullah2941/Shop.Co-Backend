const router = require('express').Router();
const c = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.post('/register', c.register);
router.post('/login', c.login);
router.post('/admin-login', c.adminLogin);
router.route('/me').get(protect, c.getMe).put(protect, c.updateMe);

module.exports = router;
