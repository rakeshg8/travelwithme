const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User');

router.get('/signup', (req, res) => {
  res.render('signup');
});
router.get('/login', (req, res) => res.render('login'));
router.post('/signup', async (req, res) => {
  const { name, email, password, otp } = req.body;

  if (req.session.otp !== otp || req.session.emailForOtp !== email) {
    return res.send('❌ Invalid OTP or email mismatch.');
  }

  // Proceed to check if user exists, validate password, hash and create
  const existingUser = await User.findOne({ email });
  if (existingUser) return res.send('⚠️ Email already exists.');

  const hashed = await bcrypt.hash(password, 10);
  await User.create({ name, email, password: hashed });

  delete req.session.otp;
  delete req.session.emailForOtp;

  res.redirect('/login');
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
 if (user && await bcrypt.compare(password, user.password)) {
  req.session.userId = user._id;

  // Redirect admin to admin dashboard
  if (user.email === 'admin@travelwm.com') {
    return res.redirect('/admin/dashboard');
  }

  // Regular users go to normal dashboard
  return res.redirect('/dashboard');
}
else {
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
const nodemailer = require('nodemailer');
const crypto = require('crypto');

// Create reusable transporter (use a real Gmail or SMTP config)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});
router.post('/send-otp', async (req, res) => {
  const { email } = req.body;
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  req.session.otp = otp;
  req.session.emailForOtp = email;

  try {
    await transporter.sendMail({
      from: '"TravelWithMe" <your_gmail@gmail.com>',
      to: email,
      subject: 'Your OTP for TravelWithMe Signup',
      text: `Your OTP is ${otp}. It will expire in 10 minutes.`
    });

    res.send("✅ OTP sent to your email.");
  } catch (error) {
    console.error('OTP email error:', error);
    res.status(500).send("❌ Failed to send OTP.");
  }
});

module.exports = router;
