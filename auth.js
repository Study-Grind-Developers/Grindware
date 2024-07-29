const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user.js');

const router = express.Router();

// Sign up route
router.post('/signup', async (req, res) => {
  const { username, email, password } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 12);
    const newUser = new User({ username, email, password: hashedPassword });
    await newUser.save();
    res.status(201).json({ message: 'User created successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error creating user', error: err });
  }
});
// auth.js
router.get('/auth/check', async (req, res) => {
  if (req.session.userId) {
    return res.status(200).json({ message: 'Authenticated' });
  } else {
    return res.status(401).json({ message: 'Unauthorized' });
  }
});


// Login route
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    req.session.userId = user._id;
    res.status(200).json({ message: 'Logged in successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error logging in', error: err });
  }
});

// Profile settings route (requires authentication)
router.get('/profile', async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  try {
    const user = await User.findById(req.session.userId).select('-password');
    res.status(200).json({ user });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching profile', error: err });
  }
});

// Update profile route (requires authentication)
router.put('/profile', async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  const { username, email, password } = req.body;
  try {
    const user = await User.findById(req.session.userId);
    if (username) user.username = username;
    if (email) user.email = email;
    if (password) user.password = await bcrypt.hash(password, 12);
    await user.save();
    res.status(200).json({ message: 'Profile updated successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error updating profile', error: err });
  }
});

module.exports = router;
