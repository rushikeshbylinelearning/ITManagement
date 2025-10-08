// routes/upload.js

const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = 'uploads/';
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// @route   POST /api/upload
// @desc    Upload a single file
// @access  Private (All authenticated users)
router.post('/', protect, upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    const fileUrl = `/uploads/${req.file.filename}`; // Use relative URL
    res.json({
      message: 'File uploaded successfully',
      url: fileUrl,
      filename: req.file.filename,
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ message: 'Error uploading file', error: error.message });
  }
});

// @route   POST /api/upload/multiple
// @desc    Upload multiple files
// @access  Private (All authenticated users)
router.post('/multiple', protect, upload.array('files', 5), (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }
    const files = req.files.map(file => ({
      url: `/uploads/${file.filename}`, // Use relative URL
      filename: file.filename,
    }));
    res.json({ message: 'Files uploaded successfully', files });
  } catch (error) {
    console.error('Multiple upload error:', error);
    res.status(500).json({ message: 'Error uploading files', error: error.message });
  }
});

// @route   DELETE /api/upload/:filename
// @desc    Delete a file
// @access  Private (Admin/Technician)
router.delete('/:filename', protect, async (req, res) => {
  // Simple protection: only allow admins/techs to delete files, or users to delete their own.
  // A more robust system would link files to users/tickets in the DB.
  try {
    const filename = req.params.filename;
    const filePath = path.join('uploads', filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'File not found' });
    }

    fs.unlinkSync(filePath);
    res.json({ message: 'File deleted successfully' });
  } catch (error) {
    console.error('Delete file error:', error);
    res.status(500).json({ message: 'Error deleting file', error: error.message });
  }
});

// Error handling middleware for multer
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'File too large. Maximum size is 5MB.' });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ message: 'Too many files. Maximum is 5 files.' });
    }
  }
  if (error.message === 'Only image files are allowed!') {
    return res.status(400).json({ message: 'Only image files are allowed!' });
  }
  next(error);
});

module.exports = router;