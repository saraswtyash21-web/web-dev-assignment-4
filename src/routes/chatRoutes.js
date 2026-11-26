const router = require('express').Router();
const { getHistory } = require('../controllers/chatController');
const { authenticate } = require('../middleware/auth');

router.get('/messages', authenticate, getHistory);

module.exports = router;
