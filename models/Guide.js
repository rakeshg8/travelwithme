// models/Guide.js
const mongoose = require('mongoose');

const guideSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String, // 🔐 for login
  phone: String,
  city: String,
  experience: String,
  pricePerDay: Number,
  available: { type: Boolean, default: true },
  pendingRequests: [
    {
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      group: { type: mongoose.Schema.Types.ObjectId, ref: 'TravelGroup' },
      requestedAt: { type: Date, default: Date.now }
    }
  ]
});

module.exports = mongoose.model('Guide', guideSchema);
