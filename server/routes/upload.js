const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const xlsx = require('xlsx');
const auth = require('../middleware/auth');
const fs = require('fs');
const History = require('../models/History');
const { logActivity } = require('../utils/activityLogger');

// Multer storage (store in memory for processing, not on disk)
const storage = multer.memoryStorage();
const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname);
  if (ext !== '.xls' && ext !== '.xlsx') {
    return cb(new Error('Only Excel files are allowed'), false);
  }
  cb(null, true);
};
const upload = multer({ storage, fileFilter });

// POST /api/upload - Excel file upload and parsing
router.post('/', auth, upload.single('file'),async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ msg: 'No file uploaded' });
    }
    // Parse Excel file from buffer
    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    // Extract column headers from the first row
    const headerRow = xlsx.utils.sheet_to_json(sheet, { header: 1 })[0] || [];
    const columns = Array.isArray(headerRow) ? headerRow : [];
    const jsonData = xlsx.utils.sheet_to_json(sheet, { defval: '' });
    
    // Save history
    const history = await History.create({
      user: req.user.id,
      fileName: req.file.originalname,
      columns: columns,
      chartData: jsonData,
    });
    
    // Log file upload activity
    await logActivity(req.user.id, 'file_upload', `File uploaded: ${req.file.originalname}`, req, {
      fileName: req.file.originalname,
      fileSize: req.file.size,
      columns: columns.length,
      rows: jsonData.length,
      historyId: history._id
    });
    
    res.json({ columns, data: jsonData });
  } catch (err) {
    res.status(500).json({ msg: 'Error processing file', error: err.message });
  }
});

module.exports = router;
