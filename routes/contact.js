const express = require('express');
const router = express.Router();
const Contact = require('../models/Contact');
const { protect } = require('../middleware/auth');

// POST /api/contact  — public
router.post('/', async (req, res) => {
  try {
    const { name, email, phone, subject, message } = req.body;
    if (!name || !email || !subject || !message) {
      return res.status(400).json({ success: false, message: 'All fields required' });
    }
    await Contact.create({ name, email, phone, subject, message });
    res.status(201).json({ success: true, message: "Message sent! We'll get back to you soon." });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// GET /api/contact  — admin only
router.get('/', protect, async (req, res) => {
  try {
    const { isRead } = req.query;
    const filter = {};
    if (isRead !== undefined) filter.isRead = isRead === 'true';
    const messages = await Contact.find(filter).sort({ createdAt: -1 });
    const unreadCount = await Contact.countDocuments({ isRead: false });
    res.json({ success: true, data: messages, unreadCount });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/contact/:id/read  — admin only
router.put('/:id/read', protect, async (req, res) => {
  try {
    await Contact.findByIdAndUpdate(req.params.id, { isRead: true });
    res.json({ success: true, message: 'Marked as read' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/contact/:id  — admin only
router.delete('/:id', protect, async (req, res) => {
  try {
    await Contact.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Message deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
