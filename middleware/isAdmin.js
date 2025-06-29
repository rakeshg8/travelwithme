// middlewares/isAdmin.js
const User = require('../models/User');

module.exports = async function isAdmin(req, res, next) {
  const user = await User.findById(req.session.userId);
  if (user && user.email === 'admin@travelwm.com') {
    return next();
  }
  return res.status(403).send("Access Denied: Admins Only");
};
