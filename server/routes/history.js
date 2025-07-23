const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const History = require('../models/History');

// GET /api/history - Get current user's upload/analysis history
router.get('/', auth, async (req, res) => {
  try {
    const history = await History.find({ user: req.user.id }).sort({ uploadDate: -1 });
    res.json(history);
  } catch (err) {
    res.status(500).json({ msg: 'Error fetching history', error: err.message });
  }
});

// DELETE /api/history - Clear current user's upload/analysis history
router.delete('/', auth, async (req, res) => {
  try {
    await History.deleteMany({ user: req.user.id });
    res.json({ msg: 'History cleared' });
  } catch (err) {
    res.status(500).json({ msg: 'Failed to clear history', error: err.message });
  }
});

// DELETE /api/history/:id - Delete a single history entry for the current user
router.delete('/:id', auth, async (req, res) => {
  try {
    const entry = await History.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    if (!entry) return res.status(404).json({ msg: 'Entry not found' });
    res.json({ msg: 'Entry deleted' });
  } catch (err) {
    res.status(500).json({ msg: 'Failed to delete entry', error: err.message });
  }
});

module.exports = router;
