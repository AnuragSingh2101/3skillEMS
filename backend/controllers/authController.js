const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const mockDb = require('../models/mockDb');

// Helper to generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'supersecretjwtkeyforeventmanagementsystem123!', {
    expiresIn: '30d'
  });
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.registerUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Please add all fields' });
    }

    const isMock = process.env.USE_MOCK_DB === 'true';

    if (isMock) {
      const userExists = mockDb.users.some(u => u.email.toLowerCase() === email.toLowerCase());
      if (userExists) {
        return res.status(400).json({ success: false, message: 'User already exists' });
      }

      const salt = bcrypt.genSaltSync(10);
      const hashedPassword = bcrypt.hashSync(password, salt);

      const newUser = {
        _id: 'user_' + Math.random().toString(36).substr(2, 9),
        name,
        email,
        password: hashedPassword,
        role: role || 'attendee',
        createdAt: new Date()
      };

      mockDb.users.push(newUser);

      return res.status(201).json({
        success: true,
        token: generateToken(newUser._id),
        user: {
          id: newUser._id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role
        }
      });
    } else {
      const userExists = await User.findOne({ email });
      if (userExists) {
        return res.status(400).json({ success: false, message: 'User already exists' });
      }

      const user = await User.create({
        name,
        email,
        password,
        role: role || 'attendee'
      });

      if (user) {
        return res.status(201).json({
          success: true,
          token: generateToken(user._id),
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role
          }
        });
      } else {
        return res.status(400).json({ success: false, message: 'Invalid user data' });
      }
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Authenticate a user
// @route   POST /api/auth/login
// @access  Public
exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    const isMock = process.env.USE_MOCK_DB === 'true';

    if (isMock) {
      const user = mockDb.users.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (!user) {
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
      }

      const isMatch = bcrypt.compareSync(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
      }

      return res.status(200).json({
        success: true,
        token: generateToken(user._id),
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      });
    } else {
      // Find user and include password field
      const user = await User.findOne({ email }).select('+password');

      if (user && (await user.matchPassword(password))) {
        return res.status(200).json({
          success: true,
          token: generateToken(user._id),
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role
          }
        });
      } else {
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
      }
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      user: {
        id: req.user._id || req.user.id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};
