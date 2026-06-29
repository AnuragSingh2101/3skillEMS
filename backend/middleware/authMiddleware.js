const jwt = require('jsonwebtoken');
const User = require('../models/User');
const mockDb = require('../models/mockDb');

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecretjwtkeyforeventmanagementsystem123!');

      if (process.env.USE_MOCK_DB === 'true') {
        const user = mockDb.users.find(u => u._id === decoded.id);
        if (!user) {
          return res.status(401).json({ success: false, message: 'Not authorized, user not found' });
        }
        // Exclude password
        const { password, ...userWithoutPassword } = user;
        req.user = userWithoutPassword;
      } else {
        req.user = await User.findById(decoded.id).select('-password');
      }

      next();
    } catch (error) {
      console.error(error);
      return res.status(401).json({ success: false, message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized, no token' });
  }
};

// Grant access to specific roles
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role ${req.user ? req.user.role : 'guest'} is not authorized to access this route`
      });
    }
    next();
  };
};

module.exports = { protect, authorize };
