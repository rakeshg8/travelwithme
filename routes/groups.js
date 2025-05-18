
const TravelGroup = require('../models/TravelGroup');
const User = require('../models/User');
const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const Notification = require('../models/Notification');
router.post('/groups/create', async (req, res) => {
  const { name, destination, date } = req.body;
  const newGroup = await TravelGroup.create({
    name,
    destination,
   date: new Date(date),
    createdBy: req.session.userId,
    members: [req.session.userId]
  });
  res.redirect('/dashboard');
});


// View chat page for a group
router.get('/groups/:id/chat', async (req, res) => {
  const groupId = req.params.id;

  const group = await TravelGroup.findById(groupId);
  const messages = await Message.find({ group: groupId }).populate('sender');

  res.render('chat', { group, messages, userId: req.session.userId });
});



router.post('/groups/join/:id', async (req, res) => {
  const groupId = req.params.id;
  const userId = req.session.userId;

  const group = await TravelGroup.findById(groupId).populate('members');

  const userAlreadyJoined = group.members.some(m => m._id.equals(userId));
  if (!userAlreadyJoined) {
    group.members.push(userId);
    await group.save();

    // Notify group members (excluding the new user)
    for (const member of group.members) {
      if (!member._id.equals(userId)) {
        await Notification.create({
          user: member._id,
          message: `🚨 ${req.session.userName} joined your group "${group.name}"!`
        });
      }
    }
  }

  res.redirect('/dashboard');
});

// Send a message
router.post('/groups/:id/chat', async (req, res) => {
  const groupId = req.params.id;
  const { text } = req.body;

  await Message.create({
    group: groupId,
    sender: req.session.userId,
    text
  });

  res.redirect(`/groups/${groupId}/chat`);
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
  
  
  // Join a group
  router.post('/groups/join/:id', async (req, res) => {
    const groupId = req.params.id;
    const userId = req.session.userId;
  
    const group = await TravelGroup.findById(groupId);
  
    // Prevent duplicate joins
    if (!group.members.includes(userId)) {
      group.members.push(userId);
      await group.save();
    }
  
    res.redirect('/dashboard');
  });

// DELETE group
router.post('/:id/delete', async (req, res) => {
  try {
    const group = await TravelGroup.findById(req.params.id);
    if (!group) {
      return res.status(404).send('Group not found');
    }

    // Check if the logged-in user is the creator
    if (group.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).send('You are not authorized to delete this group');
    }

    await TravelGroup.findByIdAndDelete(req.params.id);
    res.redirect('/dashboard'); // or wherever the dashboard is
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});
module.exports = router;
