// middleware/authMiddleware.js

const jwt = require('jsonwebtoken');
const secretKey = process.env.SECRET_KEY;

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

// Middleware to check if user is a tutor
function isTutor(req, res, next) {
  jwt.verify(req.token, secretKey, (err, authData) => {
    if (err) {
      res.sendStatus(403);
    } else if (authData.role === 'tutor') {
      next();
    } else {
      res.sendStatus(403); // Forbidden
    }
  });
}

// Middleware to check if user is a regular user
function isUser(req, res, next) {
  jwt.verify(req.token, secretKey, (err, authData) => {
    if (err) {
      res.sendStatus(403);
    } else if (authData.role === 'user') {
      next();
    } else {
      res.sendStatus(403); // Forbidden
    }
  });
}

module.exports = { verifyToken, isTutor, isUser };
