
const TravelGroup = require('../models/TravelGroup');
const User = require('../models/User');
const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const Notification = require('../models/Notification');
router.post('/groups/create', async (req, res) => {
  const { name, destination, date } = req.body;
  const allowedCities = require('../public/data/indian_cities.json');
if (!allowedCities.includes(destination)) {
  return res.send("❌ Invalid city. Please choose from the suggestions.");
}
  const newGroup = await TravelGroup.create({
    name,
    destination,
   date: new Date(date),
    createdBy: req.session.userId,
    members: [req.session.userId]
  });
  res.redirect('/dashboard');
});

router.get('/groups/create', (req, res) => {
  if (!req.session.userId) return res.redirect('/login');
  res.render('create-group');
});



router.post('/groups/join/:id', async (req, res) => {
  const groupId = req.params.id;
  const userId = req.session.userId;

  const group = await TravelGroup.findById(groupId).populate('members');

  
  if (!group) return res.status(404).send("Group not found");

  if (
    group.members.includes(userId) ||
    group.pendingRequests.includes(userId)
  ) {
    return res.send("Already joined or requested.");
  }

  group.pendingRequests.push(userId);
  await group.save();

  res.send("✅ Request sent. Waiting for approval from group admin.");

  res.redirect('/dashboard');
});
const GroupLog = require('../models/GroupLog');
// view group details with member management for admins
 router.get('/groups/:id/details', async (req, res) => {
  const group = await TravelGroup.findById(req.params.id)
    .populate('members')
    .populate('pendingRequests')
    .populate('createdBy');
 const logs = await GroupLog.find({ group: group._id })
    .populate('admin')
    .populate('targetUser')
    .sort({ timestamp: -1 });
  if (!group) return res.status(404).send('Group not found');

  const isAdmin = group.createdBy._id.toString() === req.session.userId;


  if (!isAdmin) return res.status(403).send('Not authorized');

   res.render('group-details', {
    group,
    userId: req.session.userId,
    logs
  });
});
// Approve member
router.post('/groups/:groupId/approve/:userId', async (req, res) => {
  const { groupId, userId } = req.params;

  const group = await TravelGroup.findById(groupId);
  if (!group) return res.status(404).send('Group not found');

  if (group.createdBy.toString() !== req.session.userId) {
    return res.status(403).send('Not authorized');
  }

  group.members.push(userId);
  group.pendingRequests = group.pendingRequests.filter(
    id => id.toString() !== userId
  );
  await group.save();
await GroupLog.create({
  group: groupId,
  action: "approve",
  admin: req.session.userId,
  targetUser: userId,
  timestamp: new Date()
});

  res.redirect(`/groups/${groupId}/details`);
});

// Remove member with reason
router.post('/groups/:groupId/remove/:userId', async (req, res) => {
  const { groupId, userId } = req.params;
  const { reason } = req.body;

  const group = await TravelGroup.findById(groupId);
  if (!group) return res.status(404).send('Group not found');

  if (group.createdBy.toString() !== req.session.userId) {
    return res.status(403).send('Not authorized');
  }

  group.members = group.members.filter(id => id.toString() !== userId);
  await group.save();
await GroupLog.create({
  group: groupId,
  action: "remove",
  admin: req.session.userId,
  targetUser: userId,
  reason,
  timestamp: new Date()
});

  // Notify or log reason if needed
  console.log(`User ${userId} removed for reason: ${reason}`);

  res.redirect(`/groups/${groupId}/details`);
});

// Send a message
router.post('/groups/:id/chat', async (req, res) => {
  const groupId = req.params.id;
  const { text } = req.body;

  if (!req.session.userId) return res.redirect('/login'); // Ensure user is logged in

  try {
    await Message.create({
      group: groupId,
      sender: req.session.userId,
      text
    });

    res.redirect(`/groups/${groupId}/chat`);
  } catch (error) {
    console.error('Message creation failed:', error);
    res.status(500).send('Failed to send message');
  }
});



router.get('/groups/:id/chat', async (req, res) => {
  if (!req.session.userId) return res.redirect('/login');

  const groupId = req.params.id;
  const userId = req.session.userId;

  const group = await TravelGroup.findById(groupId).populate('members');
  if (!group) return res.status(404).send("Group not found");

  // Ensure user is a member of the group
  const isMember = group.members.some(member => member._id.toString() === userId.toString());
  if (!isMember) return res.status(403).send("You are not a member of this group");

  // Load messages with sender populated
  const messages = await Message.find({ group: groupId })
    .populate('sender')
    .sort({ timestamp: 1 });

  res.render('chat', {
    group,
    messages,
    userId
  });
});

// Show all available travel groups
router.get('/groups', async (req, res) => {
    if (!req.session.userId) return res.redirect('/login');
    const userId = req.session.userId;
    const { destination, date } = req.query;
  
    // Build dynamic query
    let query = { members: { $ne: userId } };
    if (destination) {
      query.destination = { $regex: destination, $options: 'i' }; // case-insensitive
    }
    if (date) {
      query.date = new Date(date);
    }
  
    const groups = await TravelGroup.find(query);
    res.render('groups', { groups, destination: destination || '', date: date || '' });
  });
  
  

// DELETE group
router.post('/:id/delete', async (req, res) => {
  try {
    const group = await TravelGroup.findById(req.params.id);
    if (!group) {
      return res.status(404).send('Group not found');
    }

    // Check if the logged-in user is the creator
    if (group.createdBy.toString() !== req.session.user._id.toString()) {
      return res.status(403).send('You are not authorized to delete this group');
    }

    await TravelGroup.findByIdAndDelete(req.params.id);
    res.redirect('/dashboard'); // or wherever the dashboard is
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});
const Guide = require('../models/Guide');
const GuideBooking = require('../models/GuideBooking');

// Show available guides
router.get('/groups/:id/book-guide', async (req, res) => {
  const group = await TravelGroup.findById(req.params.id);
  if (!group) return res.status(404).send('Group not found');

  const destination = group.destination;
  const guides = await Guide.find({ city: destination, available: true });

  // ✅ Fetch current user's guide bookings for this group
  const bookings = await GuideBooking.find({
    user: req.session.userId,
    group: group._id
  }).populate('guide').populate('group');

  res.render('guide', {
    guides,
    destination,
    groupId: group._id,
    bookings // ✅ pass to the view
  });
});
router.post('/groups/:groupId/book-guide/:guideId', async (req, res) => {
  const { groupId, guideId } = req.params;

  const guide = await Guide.findById(guideId);
  if (!guide || !guide.available) return res.send("❌ Guide is not available.");

  guide.available = false;
  await guide.save();

  await GuideBooking.create({
    group: groupId,
    user: req.session.userId,
    guide: guideId
  });

  res.send(`✅ Guide ${guide.name} has been booked!`);
});
router.get('/my-guide-bookings', async (req, res) => {
  const bookings = await GuideBooking.find({ user: req.session.userId })
    .populate('guide')
    .populate('group');

  res.render('my-guide-bookings', { bookings });
});
router.post('/bookings/:bookingId/rate', async (req, res) => {
  const { rating, review } = req.body;
  const booking = await GuideBooking.findById(req.params.bookingId);

  if (!booking || booking.user.toString() !== req.session.userId) {
    return res.status(403).send("Not authorized to rate this booking.");
  }

  booking.rating = rating;
  booking.review = review;
  booking.completed = true;
  await booking.save();

  res.redirect('/my-guide-bookings');
});

module.exports = router;
