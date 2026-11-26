const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const appEvents = require('../events/appEvents');

const SALT_ROUNDS = 10;

const signToken = (user) =>
  jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '1d',
  });

// POST /api/auth/signup
exports.signup = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'name, email and password are required.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
    }

    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) {
      return res.status(409).json({ success: false, message: 'Email already registered.' });
    }

    const hashed = await bcrypt.hash(password, SALT_ROUNDS);
    // Roles are never taken from the request body (prevents self-promotion to admin)
    const role = process.env.ADMIN_EMAIL && email.toLowerCase() === process.env.ADMIN_EMAIL.toLowerCase() ? 'admin' : 'user';

    const user = await User.create({ name, email, password: hashed, role });
    appEvents.emit('user:signup', user);

    res.status(201).json({
      success: true,
      message: 'Signup successful.',
      token: signToken(user),
      user,
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/login
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'email and password are required.' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    const ok = user && (await bcrypt.compare(password, user.password));

    if (!ok) {
      appEvents.emit('user:login-failed', email.toLowerCase());
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    appEvents.emit('user:login', user);
    res.json({ success: true, message: 'Login successful.', token: signToken(user), user });
  } catch (err) {
    next(err);
  }
};

// GET /api/auth/me   (protected)
exports.me = (req, res) => {
  res.json({ success: true, user: req.user });
};
