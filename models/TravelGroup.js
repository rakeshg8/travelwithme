// models/TravelGroup.js
const mongoose = require('mongoose');

const travelGroupSchema = new mongoose.Schema({
  destination: String,
  description: String,
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('TravelGroup', travelGroupSchema);
