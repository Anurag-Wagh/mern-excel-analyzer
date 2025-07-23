const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { logActivity } = require('../utils/activityLogger');
const router = express.Router();
const auth = require('../middleware/auth');

// Register
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
  try {
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ msg: 'User already exists' });
    user = new User({ name, email, password });
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    await user.save();
    
    // Log registration activity
    await logActivity(user._id, 'login', 'User registered successfully', req);
    
    const payload = { user: { id: user.id, role: user.role } };
    jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' }, (err, token) => {
      if (err) throw err;
      res.json({ token });
    });
  } catch (err) {
    res.status(500).send('Server error');
  }
});

// Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ msg: 'Invalid credentials' });
    if (user.role === 'blocked') {
      return res.status(403).json({ msg: 'Your account has been blocked. Please contact support.' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ msg: 'Invalid credentials' });
    
    // Log login activity
    await logActivity(user._id, 'login', 'User logged in successfully', req);
    
    const payload = { user: { id: user.id, role: user.role } };
    jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' }, (err, token) => {
      if (err) throw err;
      res.json({ token });
    });
  } catch (err) {
    res.status(500).send('Server error');
  }
});

// Get current user's profile
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ msg: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ msg: 'Failed to fetch profile', error: err.message });
  }
});

// Update current user's profile
router.put('/me', auth, async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ msg: 'User not found' });
    
    const changes = [];
    if (name && name !== user.name) {
      user.name = name;
      changes.push('name');
    }
    if (email && email !== user.email) {
      user.email = email;
      changes.push('email');
    }
    if (password) {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
      changes.push('password');
    }
    
    if (changes.length > 0) {
      await user.save();
      
      // Log profile update activity
      await logActivity(user._id, 'profile_update', `Profile updated: ${changes.join(', ')}`, req, { changes });
    }
    
    res.json({ msg: 'Profile updated' });
  } catch (err) {
    res.status(500).json({ msg: 'Failed to update profile', error: err.message });
  }
});

module.exports = router; 