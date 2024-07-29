const express = require('express');
const router = express.Router();
const path = require('path');

// Middleware to check authentication
function isAuthenticated(req, res, next) {
  if (req.session.userId) {
    return next();
  }
  res.redirect('/auth/login');
}

// Serve protected pages only if authenticated
router.get('/courses', isAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, '../public/courses.html'));
});

router.get('/booked_lessons', isAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, '../public/booked_lessons.html'));
});

router.get('/profile_settings', isAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, '../public/profile_settings.html'));
});

module.exports = router;
