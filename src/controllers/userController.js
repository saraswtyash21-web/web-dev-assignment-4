const User = require('../models/User');
const Note = require('../models/Note');

// GET /api/users   (admin only)
exports.listUsers = async (_req, res, next) => {
  try {
    const users = await User.find().sort('-createdAt');
    res.json({ success: true, count: users.length, users });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/users/:id   (admin only)
exports.deleteUser = async (req, res, next) => {
  try {
    if (req.params.id === String(req.user._id)) {
      return res.status(400).json({ success: false, message: 'Admins cannot delete themselves.' });
    }
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    await Note.deleteMany({ owner: user._id });
    res.json({ success: true, message: 'User and their notes deleted.' });
  } catch (err) {
    next(err);
  }
};
