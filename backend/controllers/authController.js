const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d'
  });
};

const validateEmail = (emailStr) => {
  if (!emailStr) return false;
  // 1. Basic format validation
  const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!regex.test(emailStr)) return false;

  const domainText = emailStr.split('@')[1].toLowerCase();
  
  // 2. Reject common fake provider variations (e.g., gmailXXXX, yahooXXXX)
  const commonProviders = ['gmail', 'yahoo', 'hotmail', 'outlook', 'icloud', 'protonmail', 'proton'];
  for (const provider of commonProviders) {
    if (domainText.includes(provider)) {
      const isExact = domainText === `${provider}.com` || 
                      domainText === `${provider}.co` || 
                      domainText.endsWith(`.${provider}.com`) || 
                      domainText.endsWith(`.${provider}.co`) || 
                      domainText.endsWith(`.${provider}.org`) || 
                      domainText === `${provider}.co.in` || 
                      domainText === `${provider}.net` ||
                      domainText === `${provider}.me` ||
                      domainText === `${provider}.org`;
      if (!isExact) {
        return false;
      }
    }
  }

  // 3. Reject obviously random domains (e.g., domains containing 4 or more consecutive digits)
  if (/\d{4,}/.test(domainText)) {
    return false;
  }

  // 4. Require a valid TLD (alphabetic only, length 2 to 6)
  const parts = domainText.split('.');
  const tld = parts[parts.length - 1];
  if (!/^[a-z]{2,6}$/.test(tld)) {
    return false;
  }

  return true;
};


exports.registerUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Please add all fields' });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({ success: false, message: 'Please enter a valid, original email address (e.g. name@gmail.com). Disposable or fake domains are not allowed.' });
    }

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
      const token = generateToken(user._id);
      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
      });
      return res.status(201).json({
        success: true,
        token,
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
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};


exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    const user = await User.findOne({ email }).select('+password');

    if (user && (await user.matchPassword(password))) {
      const token = generateToken(user._id);
      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
      });
      return res.status(200).json({
        success: true,
        token,
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
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};


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


exports.logoutUser = async (req, res) => {
  try {
    res.cookie('token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: new Date(0)
    });
    res.status(200).json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};
