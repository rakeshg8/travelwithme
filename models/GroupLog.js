const mongoose = require('mongoose');

const groupLogSchema = new mongoose.Schema({
  group: { type: mongoose.Schema.Types.ObjectId, ref: 'TravelGroup' },
  action: String, // "approve" or "remove"
  admin: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  targetUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reason: String,
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('GroupLog', groupLogSchema);
