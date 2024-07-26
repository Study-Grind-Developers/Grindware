const express = require('express');
const mongodb = require('mongodb');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');

const app = express();
const port = process.env.PORT || 3000;
const mongoURI = 'mongodb://localhost:27017/tutoring'; // Replace with your MongoDB URI
const secretKey = 'b35a996c9840583959e6d12e910e56876179b79d03a279091c4ac4589248fdb9d34923730888b6764f33f278ed344beb147df73e875ab20f33ffd64777b28b54'; // Replace with your secret key for JWT

app.use(bodyParser.json());

mongodb.MongoClient.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(client => {
    console.log('Connected to MongoDB');
    const db = client.db('tutoring'); // Use the correct database name
    const usersCollection = db.collection('users'); // Collection for users

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

    // User Registration Route
    app.post('/api/register', async (req, res) => {
      const { username, password, email, role } = req.body;
      const hashedPassword = await bcrypt.hash(password, 10);

      const newUser = {
        username: username,
        password: hashedPassword,
        email: email,
        role: role || 'user', // Default to 'user' if not provided
        tutoringCredentials: {} // Initialize as an empty object or provide default values
      };

      try {
        const result = await usersCollection.insertOne(newUser);
        res.status(201).json({ message: 'User registered successfully', data: result.ops[0] });
      } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to register user' });
      }
    });

    // User Login Route
    app.post('/api/login', async (req, res) => {
      const { username, password } = req.body;

      try {
        const user = await usersCollection.findOne({ username: username });
        if (!user) {
          res.status(404).json({ message: 'User not found' });
        } else {
          const passwordMatch = await bcrypt.compare(password, user.password);
          if (passwordMatch) {
            const token = jwt.sign({ username: user.username, role: user.role }, secretKey);
            res.json({ token, role: user.role }); // Send role back to client
          } else {
            res.status(401).json({ message: 'Incorrect password' });
          }
        }
      } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Login failed' });
      }
    });

    // Protected Route for User Profile
    app.get('/api/profile', verifyToken, (req, res) => {
      jwt.verify(req.token, secretKey, (err, authData) => {
        if (err) {
          res.sendStatus(403);
        } else {
          res.json({ message: 'Profile accessed successfully', data: authData });
        }
      });
    });

    // Redirect Route Based on User Role
    app.get('/api/redirect', verifyToken, async (req, res) => {
      jwt.verify(req.token, secretKey, async (err, authData) => {
        if (err) {
          res.sendStatus(403);
        } else {
          const user = await usersCollection.findOne({ username: authData.username });
          if (user && user.role === 'tutor') {
            res.redirect('/tutor/home'); // Redirect to tutor home page
          } else {
            res.redirect('/user/home'); // Redirect to user home page
          }
        }
      });
    });

    // Serve Static Files
    app.use(express.static('public'));

    app.listen(port, () => {
      console.log(`Server is running on http://localhost:${port}`);
    });

  })
  .catch(error => {
    console.error('Error connecting to MongoDB', error);
  });
