const express = require('express');
const router = express.Router();
const User = require('../models/User');
const TravelGroup = require('../models/TravelGroup');
const Guide = require('../models/Guide');
const GuideBooking = require('../models/GuideBooking');
const Notification = require('../models/Notification');
const GroupLog = require('../models/GroupLog');
const isAdmin = require('../middleware/isAdmin'); // 👈 use middleware
router.get('/admin/dashboard', isAdmin, async (req, res) => {
  const [users, groups, guides, bookings, notifications, logs] = await Promise.all([
    User.find(),
    TravelGroup.find().populate('createdBy'),
    Guide.find(),
    GuideBooking.find().populate('guide').populate('group'),
    Notification.find().populate('user'),
    GroupLog.find().populate('group').populate('admin').populate('targetUser')
  ]);
// Delete a user
router.post('/admin/users/:id/delete', isAdmin, async (req, res) => {
  const userId = req.params.id;

  try {
    const userToDelete = await User.findById(userId);
    if (!userToDelete) {
      return res.status(404).send("User not found");
    }

    // 🔐 Prevent admin deletion
    if (userToDelete.email === 'admin@travelwm.com') {
      return res.send("❌ You can't delete the admin account.");
    }

    await User.findByIdAndDelete(userId);
    res.redirect('/admin/dashboard');
  } catch (err) {
    console.error("Error deleting user:", err);
    res.status(500).send("Failed to delete user");
  }
});

// Delete a group
router.post('/admin/groups/:id/delete', isAdmin, async (req, res) => {
  const groupId = req.params.id;
  try {
    await TravelGroup.findByIdAndDelete(groupId);
    res.redirect('/admin/dashboard');
  } catch (err) {
    console.error("Error deleting group:", err);
    res.status(500).send("Failed to delete group");
  }
});
// Approve a guide
router.post('/admin/guides/:id/approve', isAdmin, async (req, res) => {
  await Guide.findByIdAndUpdate(req.params.id, { available: true });
  res.redirect('/admin/dashboard');
});

  res.render('admin-dashboard', {
    users,
    groups,
    guides,
    bookings,
    notifications,
    logs
  });
});

module.exports = router;
