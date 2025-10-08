// routes/roboticsInventory.js

const express = require('express');
const router = express.Router();
const multer = require('multer');
const xlsx = require('xlsx'); 
const RoboticsInventory = require('../models/RoboticsInventory');
const { protect, authorize } = require('../middleware/auth');

// ✅ SECURED: All robotics inventory routes are now protected and restricted
// to admins and technicians.
router.use(protect, authorize('admin', 'technician'));

const upload = multer({ storage: multer.memoryStorage() });

// @route   POST /api/robotics-inventory/import
// @desc    Import robotics inventory from an Excel file
// @access  Private (Admin/Technician)
router.post('/import', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ msg: 'No file uploaded.' });
  }

  try {
    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = xlsx.utils.sheet_to_json(worksheet, { defval: "" });

    if (jsonData.length === 0) {
      return res.status(400).json({ msg: 'The Excel sheet is empty or has an invalid format.' });
    }

    const bulkOps = jsonData.map(row => {
      const trimmedRow = {};
      for (const key in row) {
        if (Object.prototype.hasOwnProperty.call(row, key)) {
          trimmedRow[key.trim()] = row[key];
        }
      }
      const partName = trimmedRow['Component Name'];
      if (!partName) return null;
      const quantityString = String(trimmedRow['Quantity'] || '0');
      const parsedQuantity = parseInt(quantityString.replace(/[^0-9]/g, ''), 10);
      const updateData = {
        partName: partName,
        partType: trimmedRow['Type'] || 'Misc',
        quantity: !isNaN(parsedQuantity) ? parsedQuantity : 0,
        notes: trimmedRow['Details'] || '',
        manufacturer: trimmedRow['Manufacturer'] || '',
        location: trimmedRow['Location'] || '',
        supplier: trimmedRow['Supplier'] || '',
      };
      let filter;
      const sku = trimmedRow['SKU'] || trimmedRow['sku'];
      if (sku) {
        filter = { sku: sku };
        updateData.sku = sku;
      } else {
        filter = { partName: partName };
      }
      return {
        updateOne: { filter: filter, update: { $set: updateData }, upsert: true }
      };
    }).filter(Boolean);

    if (bulkOps.length === 0) {
      return res.status(400).json({ msg: 'No valid data found in the Excel sheet. Check column headers.' });
    }

    const result = await RoboticsInventory.bulkWrite(bulkOps);
    const createdCount = result.nUpserted;
    const updatedCount = result.nModified;
    
    res.status(201).json({ 
      msg: `Import complete. ${createdCount} items created, ${updatedCount} items updated.`,
      created: createdCount,
      updated: updatedCount,
    });

  } catch (error) {
    console.error('Import Error:', error);
    if (error.code === 11000) {
        return res.status(400).json({ msg: 'Import failed due to a critical duplicate key error that could not be resolved.' });
    }
    res.status(500).json({ msg: 'Server error during file import. Please ensure the file is valid.' });
  }
});

// GET all items
router.get('/', async (req, res) => {
  try {
    const items = await RoboticsInventory.find().sort({ updatedAt: -1 });
    res.json(items);
  } catch (err) {
    console.error("GET /api/robotics-inventory Error:", err.message);
    res.status(500).send('Server Error');
  }
});

// POST a new item
router.post('/', async (req, res) => {
  try {
    const newItem = new RoboticsInventory(req.body);
    const savedItem = await newItem.save();
    res.status(201).json(savedItem);
  } catch (err) {
    console.error(err.message);
    res.status(400).json({ msg: 'Failed to add item. Check required fields.' });
  }
});

// PUT (update) an item
router.put('/:id', async (req, res) => {
  try {
    const updatedItem = await RoboticsInventory.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );
    if (!updatedItem) return res.status(404).json({ msg: 'Item not found' });
    res.json(updatedItem);
  } catch (err) {
    console.error(err.message);
    res.status(400).json({ msg: 'Failed to update item.' });
  }
});

// DELETE an item
router.delete('/:id', async (req, res) => {
  try {
    const item = await RoboticsInventory.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ msg: 'Item not found' });
    res.json({ msg: 'Item removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// POST (delete) multiple items
router.post('/bulk-delete', async (req, res) => {
    try {
        const { ids } = req.body;
        if (!ids || !Array.isArray(ids)) {
            return res.status(400).json({ msg: 'Invalid request: "ids" array is required.' });
        }
        await RoboticsInventory.deleteMany({ _id: { $in: ids } });
        res.json({ msg: 'Items deleted successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;