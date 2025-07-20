const mongoose = require('mongoose');

const guideBookingSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  group: { type: mongoose.Schema.Types.ObjectId, ref: 'TravelGroup' },
  guide: { type: mongoose.Schema.Types.ObjectId, ref: 'Guide' },
  bookingDate: { type: Date, default: Date.now },
  rating: { type: Number, min: 1, max: 5 },
  review: { type: String }
});

module.exports = mongoose.model('GuideBooking', guideBookingSchema);
