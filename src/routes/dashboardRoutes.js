const router = require('express').Router();
const { getStats } = require('../controllers/dashboardController');
const { protect, adminOnly } = require('../middleware/auth');

router.get('/', protect, adminOnly, getStats);

module.exports = router;
