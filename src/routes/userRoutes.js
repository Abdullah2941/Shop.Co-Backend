const router = require('express').Router();
const c = require('../controllers/userController');
const { protect, adminOnly } = require('../middleware/auth');

router.use(protect, adminOnly);
router.get('/', c.getUsers);
router.get('/customers', c.getCustomers);
router.route('/:id').get(c.getUser).put(c.updateUser).delete(c.deleteUser);

module.exports = router;
