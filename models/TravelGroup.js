// models/TravelGroup.js
const mongoose = require('mongoose');

const travelGroupSchema = new mongoose.Schema({
  name: { type: String, required: true },
  destination: { type: String, required: true },
  date: {
  type: Date,
  required: true,
  validate: {
    validator: function (value) {
      return value >= new Date();
    },
    message: 'Travel date must be in the future.'
  }
}, // 👈 This stores the selected travel date
  description: { type: String },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
  pendingRequests: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // ✅ Add this line

});

module.exports = mongoose.model('TravelGroup', travelGroupSchema);
