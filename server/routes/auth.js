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
    console.log('Registration attempt:', { email, name });
    
    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({ msg: 'All fields are required' });
    }
    
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ msg: 'User already exists' });
    
    user = new User({ name, email, password });
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    await user.save();
    
    console.log('User registered successfully:', { userId: user._id, email });
    
    // Log registration activity
    await logActivity(user._id, 'login', 'User registered successfully', req);
    
    const payload = { user: { id: user.id, role: user.role } };
    jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' }, (err, token) => {
      if (err) {
        console.error('JWT signing error:', err);
        throw err;
      }
      res.json({ token });
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ 
      msg: 'Server error', 
      error: process.env.NODE_ENV === 'development' ? err.message : 'Registration failed'
    });
  }
});

// Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  
  try {
    console.log('Login attempt:', { email });
    
    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({ msg: 'Email and password are required' });
    }
    
    const user = await User.findOne({ email });
    if (!user) {
      console.log('Login failed: User not found', { email });
      return res.status(400).json({ msg: 'Invalid credentials' });
    }
    
    if (user.role === 'blocked') {
      console.log('Login failed: User blocked', { email });
      return res.status(403).json({ msg: 'Your account has been blocked. Please contact support.' });
    }
    
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log('Login failed: Invalid password', { email });
      return res.status(400).json({ msg: 'Invalid credentials' });
    }
    
    console.log('User logged in successfully:', { userId: user._id, email });
    
    // Log login activity
    await logActivity(user._id, 'login', 'User logged in successfully', req);
    
    const payload = { user: { id: user.id, role: user.role } };
    jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' }, (err, token) => {
      if (err) {
        console.error('JWT signing error:', err);
        throw err;
      }
      res.json({ token });
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ 
      msg: 'Server error', 
      error: process.env.NODE_ENV === 'development' ? err.message : 'Login failed'
    });
  }
});

// Get current user's profile
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ msg: 'User not found' });
    res.json(user);
  } catch (err) {
    console.error('Profile fetch error:', err);
    res.status(500).json({ 
      msg: 'Failed to fetch profile', 
      error: process.env.NODE_ENV === 'development' ? err.message : 'Profile fetch failed'
    });
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
    console.error('Profile update error:', err);
    res.status(500).json({ 
      msg: 'Failed to update profile', 
      error: process.env.NODE_ENV === 'development' ? err.message : 'Profile update failed'
    });
  }
});

module.exports = router; 