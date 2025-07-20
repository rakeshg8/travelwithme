// routes/guide-auth.js
const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();
const Guide = require('../models/Guide');
// routes/guide-dashboard.js
const GuideBooking = require('../models/GuideBooking');
// GET guide registration form
router.get('/guides/register', (req, res) => {
  res.render('guide-register');
});

// POST guide registration
router.post('/guides/register', async (req, res) => {
  const { name, email, password, phone, city, experience, pricePerDay } = req.body;

  const existing = await Guide.findOne({ email });
  if (existing) return res.send("Guide already exists.");

  const hashed = await bcrypt.hash(password, 10);
  await Guide.create({
    name,
    email,
    password: hashed,
    phone,
    city,
    experience,
    pricePerDay,
    available: false // Must be approved by admin
  });

  res.send("✅ Registration submitted. Wait for admin approval.");
});

router.get('/guide/dashboard', async (req, res) => {
  const guide = await Guide.findById(req.session.guideId);
  const requests = guide.pendingRequests;
  const history = await GuideBooking.find({ guide: guide._id }).populate('user group');

  res.render('guide-dashboard', { guide, requests, bookings: history });
});

router.post('/guide/approve/:index', async (req, res) => {
  const guide = await Guide.findById(req.session.guideId);
  const request = guide.pendingRequests[req.params.index];

  await GuideBooking.create({
    user: request.user,
    group: request.group,
    guide: guide._id
  });

  guide.pendingRequests.splice(req.params.index, 1);
  await guide.save();

  res.redirect('/guide/dashboard');
});

router.get('/guide/login', (req, res) => {
  res.render('guide-login');
});

// In guide.js
router.get('/guides/login', (req, res) => {
  res.render('guide-login');
});

router.post('/guides/login', async (req, res) => {
  const { email, password } = req.body;
  const guide = await Guide.findOne({ email });

  if (!guide || !await bcrypt.compare(password, guide.password)) {
    return res.send("Invalid credentials");
  }

  if (!guide.available) return res.send("❌ Not yet approved by admin.");

  req.session.guideId = guide._id;
  res.redirect('/guide/dashboard');
});
router.get('/guide/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/guide/login');
  });
});

module.exports = router;
