const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
// Example to use: assign this role in DB or on registration
role: { type: String, default: 'user' } // 'admin' for admin users
});

module.exports = mongoose.model('User', userSchema);
