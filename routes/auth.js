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


const TravelGroup = require('../models/TravelGroup'); // You'll create this model

router.get('/dashboard', async (req, res) => {
  if (!req.session.userId) return res.redirect('/login');
  const user = await User.findById(req.session.userId);
  const groups = await TravelGroup.find({ members: req.session.userId });

  res.render('dashboard', { user, groups });
});
// DELETE GROUP
router.post('/:id/delete', async (req, res) => {
  const groupId = req.params.id;
  const userId = req.session.userId;

  const group = await TravelGroup.findById(groupId);
  if (!group) return res.status(404).send('Group not found');
  if (group.createdBy.toString() !== userId) {
    return res.status(403).send('You are not allowed to delete this group');
  }

  await TravelGroup.findByIdAndDelete(groupId);
  res.redirect('/dashboard');
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
