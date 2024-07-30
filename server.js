const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// MongoDB session store
const store = new MongoDBStore({
  uri: 'mongodb://localhost:27017/tutoring', // MongoDB URI
  collection: 'sessions' // Collection to store sessions
});

// Middleware setup
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(session({
  secret: process.env.SESSION_SECRET || 'b35a996c9840583959e6d12e910e56876179b79d03a279091c4ac4589248fdb9d34923730888b6764f33f278ed344beb147df73e875ab20f33ffd64777b28b54', // Secret key for session encryption
  resave: false,
  saveUninitialized: false,
  store: store
}));

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/tutoring', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected...'))
  .catch(err => console.log(err));

// Define User schema
const UserSchema = new mongoose.Schema({
  username: String,
  email: String,
  password: String,
  additionalData: Object // Additional data field for user-related information
});

// Create User model
const User = mongoose.model('User', UserSchema);

// Route to handle user signup
app.post('/auth/signup', async (req, res) => {
  const { username, email, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 12); // Hash the password
  const newUser = new User({ username, email, password: hashedPassword });
  await newUser.save(); // Save the new user to the database
  res.json({ message: 'User signed up successfully' }); // Respond to the client
});

// Route to handle user login
app.post('/auth/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email }); // Find user by email
  if (!user) {
    return res.status(401).json({ message: 'User not found' }); // Respond if user not found
  }
  const isMatch = await bcrypt.compare(password, user.password); // Compare passwords
  if (!isMatch) {
    return res.status(401).json({ message: 'Invalid password' }); // Respond if password is incorrect
  }
  req.session.isAuthenticated = true; // Set session as authenticated
  req.session.userId = user._id; // Store user ID in session
  res.json({ message: 'User logged in successfully' }); // Respond to the client
});

// Route to handle user logout
app.get('/auth/logout', (req, res) => {
  req.session.destroy(err => { // Destroy the session
    if (err) {
      return res.redirect('/tutor/home'); // Redirect on error
    }
    res.clearCookie('connect.sid'); // Clear session cookie
    res.redirect('/login.html'); // Redirect to login page
  });
});

// Middleware to protect routes
function isAuthenticated(req, res, next) {
  if (req.session.isAuthenticated) {
    return next(); // Proceed if authenticated
  }
  res.redirect('/login.html'); // Redirect if not authenticated
}

// Route for serving protected tutor home page
app.get('/tutor/home', isAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'tutor_home.html')); // Serve tutor home page
});

// Route for serving tutor dashboard
app.get('/tutor/dashboard', isAuthenticated, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId); // Find user by ID
    res.json({ message: `Hey ${user.username}, these are the lessons you have scheduled` }); // Personalized message
  } catch (err) {
    res.status(500).json({ message: 'Failed to load dashboard' }); // Handle errors
  }
});

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`); // Log server start
});
