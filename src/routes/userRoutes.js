const router = require('express').Router();
const { listUsers, deleteUser } = require('../controllers/userController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate, authorize('admin')); // RBAC: admin only

router.get('/', listUsers);
router.delete('/:id', deleteUser);

module.exports = router;
