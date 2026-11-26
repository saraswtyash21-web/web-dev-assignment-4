const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Verifies "Authorization: Bearer <token>" and attaches req.user
async function authenticate(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const [scheme, token] = header.split(' ');

    if (scheme !== 'Bearer' || !token) {
      return res.status(401).json({ success: false, message: 'Access denied. No token provided.' });
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.id);
    if (!user) {
      return res.status(401).json({ success: false, message: 'User no longer exists.' });
    }

    req.user = user;
    next();
  } catch (err) {
    const message = err.name === 'TokenExpiredError' ? 'Token expired. Please login again.' : 'Invalid token.';
    return res.status(401).json({ success: false, message });
  }
}

// Role-based access control: authorize('admin'), authorize('admin', 'user')
function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden. Requires role: ${roles.join(' or ')}.`,
      });
    }
    next();
  };
}

module.exports = { authenticate, authorize };
