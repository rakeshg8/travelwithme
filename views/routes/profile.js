const express = require('express');
const router = express.Router();
const User = require('../models/User');

// View profile
router.get('/profile', async (req, res) => {
  const user = await User.findById(req.session.userId);
  res.render('profile', { user });
});

// Edit profile
router.post('/profile', async (req, res) => {
  const { bio, interests, preferredDestinations } = req.body;
  await User.findByIdAndUpdate(req.session.userId, {
    bio,
    interests,
    preferredDestinations
  });
  res.redirect('/profile');
});
const Notification = require('../models/Notification');
router.get('/notifications', async (req, res) => {
  const notifications = await Notification.find({ user: req.session.userId })
    .sort({ timestamp: -1 });
  res.render('notifications', { notifications });
});
router.post('/notifications/read/:id', async (req, res) => {
  await Notification.findByIdAndUpdate(req.params.id, { isRead: true });
  res.redirect('/notifications');
});

module.exports = router;
