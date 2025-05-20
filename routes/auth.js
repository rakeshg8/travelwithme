const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User');

router.get('/signup', (req, res) => {
  res.render('signup');
});
router.get('/login', (req, res) => res.render('login'));

router.post('/signup', async (req, res) => {
  const { name, email, password } = req.body;

  // Check if email already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.send('⚠️ Email already in use. Please try logging in.');
  }

  const hashed = await bcrypt.hash(password, 10);
  await User.create({ name, email, password: hashed });
  res.redirect('/login');
});


router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (user && await bcrypt.compare(password, user.password)) {
    req.session.userId = user._id;
    res.redirect('/dashboard');
  } else {
    res.send('Invalid credentials');
  }
});


const TravelGroup = require('../models/TravelGroup');
const Notification = require('../models/Notification');

router.get('/dashboard', async (req, res) => {
  try {
    if (!req.session.userId) return res.redirect('/login');

    const user = await User.findById(req.session.userId);

    const groups = await TravelGroup.find({ members: req.session.userId })
      .populate('members')
      .populate('createdBy');

    const notifications = await Notification.find({ user: user._id });

    res.render('dashboard', { user, groups, notifications });
  } catch (err) {
    console.error('Error loading dashboard:', err);
    res.status(500).send('Server error');
  }
});



router.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Logout error:', err);
      return res.redirect('/dashboard');
    }
    res.clearCookie('connect.sid'); // clear session cookie
    res.redirect('/login');
  });
});
module.exports = router;
