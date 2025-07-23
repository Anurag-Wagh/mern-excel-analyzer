const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const User = require('../models/User');
const History = require('../models/History');
const ActivityLog = require('../models/ActivityLog');

// Get all users
router.get('/users', auth, admin, async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ msg: 'Error fetching users', error: err.message });
  }
});

// Block/unblock user
router.patch('/users/:id/block', auth, admin, async (req, res) => {
   // Prevent admin from blocking themselves
  if (req.user.id === req.params.id) {
    return res.status(400).json({ msg: "You cannot block your own account" });
  }

  const user = await User.findById(req.params.id);
  if (!user) {
    return res.status(404).json({ msg: 'User not found' });
  }
  
  // Toggle the role
  user.role = user.role === 'blocked' ? 'user' : 'blocked';
  await user.save();
  
  // Send back a success message with the typo fixed
  res.json({ msg: `User ${user.role === 'blocked' ? 'blocked' : 'unblocked'}` });
});

// Delete user
router.delete('/users/:id', auth, admin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ msg: 'User not found' });
    
    await User.findByIdAndDelete(req.params.id);
    res.json({ msg: 'User deleted successfully' });
  } catch (err) {
    res.status(500).json({ msg: 'Error deleting user', error: err.message });
  }
});

// Platform analytics
router.get('/analytics', auth, admin, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ role: { $ne: 'blocked' } });
    const totalFiles = await History.countDocuments();
    
    // Calculate average processing time (mock data for now)
    const avgProcessingTime = 1500; // milliseconds
    
    res.json({
      totalUsers,
      activeUsers,
      totalFiles,
      avgProcessingTime
    });
  } catch (err) {
    res.status(500).json({ msg: 'Error fetching analytics', error: err.message });
  }
});

// Get activity logs
router.get('/activity-logs', auth, admin, async (req, res) => {
  try {
    const { page = 1, limit = 50, userId, action, startDate, endDate } = req.query;
    
    const query = {};
    
    if (userId) query.userId = userId;
    if (action) query.action = action;
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }
    
    const logs = await ActivityLog.find(query)
      .populate('userId', 'name email')
      .sort({ timestamp: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();
    
    const total = await ActivityLog.countDocuments(query);
    
    res.json({
      logs,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (err) {
    res.status(500).json({ msg: 'Error fetching activity logs', error: err.message });
  }
});

module.exports = router;
