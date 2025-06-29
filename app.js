require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const path = require('path');

const authRoutes = require('./routes/auth');
const groupRoutes = require('./routes/groups');
const profileRoutes = require('./routes/profile');

const app = express();

// Middleware
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Session setup
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false
}));

// Make user info available in views
app.use((req, res, next) => {
  res.locals.userId = req.session.userId;
  next();
});

// Routes
const adminRoutes = require('./routes/admin');
app.use('/', adminRoutes);

app.use('/', authRoutes);
app.use('/', groupRoutes);
app.use('/', profileRoutes);
const recommendationRoutes = require('./routes/recommendations');
app.use('/', recommendationRoutes);


// MongoDB connection
require('dotenv').config();
mongoose.connect(process.env.MONGO_URI)
  .then(() => {console.log("MongoDB Atlas Connected");
    app.listen(process.env.PORT, () => {
    console.log(`Server running on http://localhost:${process.env.PORT}`);
  });
  })
  .catch(err => console.log("MongoDB Connection Error: ", err));