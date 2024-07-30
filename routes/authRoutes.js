// routes/authRoutes.js

const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user'); // Assuming your user model is in models/user.js
const Tutor = require('../models/tutor'); // Assuming your tutor model is in models/tutor.js

const router = express.Router();
const secretKey = 'b35a996c9840583959e6d12e910e56876179b79d03a279091c4ac4589248fdb9d34923730888b6764f33f278ed344beb147df73e875ab20f33ffd64777b28b54'; // Replace with your actual secret key

// User Registration
router.post('/user/register', async (req, res) => {
  const { username, email, password } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 12);
    const newUser = new User({ username, email, password: hashedPassword });
    await newUser.save();
    res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error registering user', error: err });
  }
});

// User Login
router.post('/user/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid password' });
    const token = jwt.sign({ id: user._id, username: user.username }, secretKey, { expiresIn: '1h' });
    res.json({ token });
  } catch (err) {
    res.status(500).json({ message: 'Login failed', error: err });
  }
});

// Tutor Registration
router.post('/tutor/register', async (req, res) => {
  const { username, email, password, specialization } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 12);
    const newTutor = new Tutor({ username, email, password: hashedPassword, specialization });
    await newTutor.save();
    res.status(201).json({ message: 'Tutor registered successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error registering tutor', error: err });
  }
});

// Tutor Login
router.post('/tutor/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const tutor = await Tutor.findOne({ email });
    if (!tutor) return res.status(404).json({ message: 'Tutor not found' });
    const isMatch = await bcrypt.compare(password, tutor.password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid password' });
    const token = jwt.sign({ id: tutor._id, username: tutor.username }, secretKey, { expiresIn: '1h' });
    res.json({ token });
  } catch (err) {
    res.status(500).json({ message: 'Login failed', error: err });
  }
});

// Middleware to verify JWT token
function verifyToken(req, res, next) {
  const bearerHeader = req.headers['authorization'];
  if (typeof bearerHeader !== 'undefined') {
    const bearerToken = bearerHeader.split(' ')[1];
    req.token = bearerToken;
    next();
  } else {
    res.sendStatus(403); // Forbidden if no token
  }
}

// User Profile Route
router.get('/user/profile', verifyToken, async (req, res) => {
  jwt.verify(req.token, secretKey, async (err, authData) => {
    if (err) return res.sendStatus(403);
    try {
      const user = await User.findById(authData.id).select('-password');
      res.json({ user });
    } catch (err) {
      res.status(500).json({ message: 'Failed to fetch profile', error: err });
    }
  });
});

// Tutor Profile Route
router.get('/tutor/profile', verifyToken, async (req, res) => {
  jwt.verify(req.token, secretKey, async (err, authData) => {
    if (err) return res.sendStatus(403);
    try {
      const tutor = await Tutor.findById(authData.id).select('-password');
      res.json({ tutor });
    } catch (err) {
      res.status(500).json({ message: 'Failed to fetch profile', error: err });
    }
  });
});


router.get('/dashboard', authenticate, (req, res) => {
  if (req.isTutor) {
    // Render tutor dashboard
    res.sendFile(path.join(__dirname, '..', 'views', '../public/tutorside/tDb.html'));
  } else {
    // Render student dashboard
    res.sendFile(path.join(__dirname, '..', 'views', 'dashboard.html'));
  }
});

module.exports = router;
