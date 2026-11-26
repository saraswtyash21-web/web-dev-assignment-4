const Message = require('../models/Message');

// GET /api/chat/messages?room=general&limit=50   (protected)
exports.getHistory = async (req, res, next) => {
  try {
    const room = req.query.room || 'general';
    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 200);
    const messages = await Message.find({ room }).sort('-createdAt').limit(limit);
    res.json({ success: true, room, count: messages.length, messages: messages.reverse() });
  } catch (err) {
    next(err);
  }
};
