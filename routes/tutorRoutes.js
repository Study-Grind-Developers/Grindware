const express = require('express');
const jwt = require('jsonwebtoken');
const Tutor = require('../models/tutor'); // Import the Tutor model
const verifyToken = require('./middleware/verifyToken'); // Import middleware to verify JWT

const router = express.Router();
const secretKey = 'b35a996c9840583959e6d12e910e56876179b79d03a279091c4ac4589248fdb9d34923730888b6764f33f278ed344beb147df73e875ab20f33ffd64777b28b54'; // Replace with your actual secret key

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

// Get tutor profile
router.get('/profile', verifyToken, async (req, res) => {
  jwt.verify(req.token, secretKey, async (err, authData) => {
    if (err) return res.sendStatus(403);
    try {
      const tutor = await Tutor.findById(authData.id).select('-password');
      if (!tutor) return res.status(404).json({ message: 'Tutor not found' });
      res.json({ tutor });
    } catch (err) {
      res.status(500).json({ message: 'Failed to fetch tutor profile', error: err });
    }
  });
});

// Update tutor profile
router.put('/profile', verifyToken, async (req, res) => {
  jwt.verify(req.token, secretKey, async (err, authData) => {
    if (err) return res.sendStatus(403);
    const { username, email, password, specialization } = req.body;
    try {
      const tutor = await Tutor.findById(authData.id);
      if (!tutor) return res.status(404).json({ message: 'Tutor not found' });
      if (username) tutor.username = username;
      if (email) tutor.email = email;
      if (specialization) tutor.specialization = specialization;
      if (password) tutor.password = await bcrypt.hash(password, 12);
      await tutor.save();
      res.status(200).json({ message: 'Tutor profile updated successfully' });
    } catch (err) {
      res.status(500).json({ message: 'Failed to update tutor profile', error: err });
    }
  });
});

// Other tutor-specific routes (e.g., viewing scheduled lessons, managing students) can go here

module.exports = router;
