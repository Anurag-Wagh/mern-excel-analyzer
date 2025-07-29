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

// Configure multer with file size limits
const upload = multer({ 
  storage, 
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 1
  }
});

// POST /api/upload - Excel file upload and parsing
router.post('/', auth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ msg: 'No file uploaded' });
    }

    console.log('File upload attempt:', {
      fileName: req.file.originalname,
      fileSize: req.file.size,
      userId: req.user.id
    });

    // Parse Excel file from buffer
    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    
    // Extract column headers from the first row
    const headerRow = xlsx.utils.sheet_to_json(sheet, { header: 1 })[0] || [];
    const columns = Array.isArray(headerRow) ? headerRow : [];
    const jsonData = xlsx.utils.sheet_to_json(sheet, { defval: '' });
    
    console.log('File parsed successfully:', {
      columns: columns.length,
      rows: jsonData.length
    });
    
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
    
    res.json({ 
      columns, 
      data: jsonData,
      message: 'File uploaded and processed successfully'
    });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ 
      msg: 'Error processing file', 
      error: process.env.NODE_ENV === 'development' ? err.message : 'File processing failed'
    });
  }
});

// Error handling for multer
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ msg: 'File too large. Maximum size is 10MB.' });
    }
    return res.status(400).json({ msg: 'File upload error', error: error.message });
  }
  next(error);
});

module.exports = router;
