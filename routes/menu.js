const express = require('express');
const router = express.Router();
const MenuItem = require('../models/MenuItem');
const { protect } = require('../middleware/auth');

// GET /api/menu  — public
router.get('/', async (req, res) => {
  try {
    const { category, isVeg, available } = req.query;
    const filter = {};
    if (category) filter.category = category;
    if (isVeg !== undefined) filter.isVeg = isVeg === 'true';
    if (available !== undefined) filter.isAvailable = available === 'true';
    else filter.isAvailable = true; // only show available by default

    const items = await MenuItem.find(filter).sort({ sortOrder: 1, createdAt: -1 });
    res.json({ success: true, count: items.length, data: items });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/menu/all  — admin: all items including unavailable
router.get('/all', protect, async (req, res) => {
  try {
    const items = await MenuItem.find({}).sort({ category: 1, sortOrder: 1 });
    res.json({ success: true, count: items.length, data: items });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/menu/featured  — public
router.get('/featured', async (req, res) => {
  try {
    const items = await MenuItem.find({ isFeatured: true, isAvailable: true }).limit(8);
    res.json({ success: true, data: items });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/menu/:id  — public
router.get('/:id', async (req, res) => {
  try {
    const item = await MenuItem.findById(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Item not found' });
    res.json({ success: true, data: item });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/menu  — admin only
router.post('/', protect, async (req, res) => {
  try {
    const item = await MenuItem.create(req.body);
    res.status(201).json({ success: true, message: 'Menu item added', data: item });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// PUT /api/menu/:id  — admin only
router.put('/:id', protect, async (req, res) => {
  try {
    const item = await MenuItem.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!item) return res.status(404).json({ success: false, message: 'Item not found' });
    res.json({ success: true, message: 'Item updated', data: item });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// DELETE /api/menu/:id  — admin only
router.delete('/:id', protect, async (req, res) => {
  try {
    const item = await MenuItem.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Item not found' });
    res.json({ success: true, message: 'Item deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
