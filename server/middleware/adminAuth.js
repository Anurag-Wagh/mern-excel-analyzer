const User = require('../models/User');

module.exports = async function (req, res, next) {
  try {
    // Get user from the auth middleware
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    if (user.role !== 'admin') {
      return res.status(403).json({ msg: 'Access denied. Admin only.' });
    }

    next();
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
};
