const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const { protect } = require('../middleware/auth');

// POST /api/bookings  — public
router.post('/', async (req, res) => {
  try {
    const { customer, date, timeSlot, guests, occasion, specialRequests } = req.body;

    // Check if slot is available (max 6 bookings per slot)
    const existing = await Booking.countDocuments({
      date: { $gte: new Date(date).setHours(0,0,0,0), $lte: new Date(date).setHours(23,59,59,999) },
      timeSlot,
      status: { $in: ['pending', 'confirmed'] }
    });
    if (existing >= 6) {
      return res.status(400).json({ success: false, message: 'This time slot is fully booked. Please choose another.' });
    }

    const booking = await Booking.create({ customer, date, timeSlot, guests, occasion, specialRequests });
    res.status(201).json({
      success: true,
      message: 'Table booked successfully! We will confirm shortly.',
      data: { bookingNumber: booking.bookingNumber, status: booking.status }
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// GET /api/bookings  — admin only
router.get('/', protect, async (req, res) => {
  try {
    const { status, date, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (date) {
      const start = new Date(date); start.setHours(0, 0, 0, 0);
      const end = new Date(date); end.setHours(23, 59, 59, 999);
      filter.date = { $gte: start, $lte: end };
    }

    const bookings = await Booking.find(filter)
      .sort({ date: 1, timeSlot: 1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Booking.countDocuments(filter);
    res.json({ success: true, total, data: bookings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/bookings/slots?date=2024-01-15  — public: check available slots
router.get('/slots', async (req, res) => {
  try {
    const { date } = req.query;
    if (!date) return res.status(400).json({ success: false, message: 'Date required' });

    const allSlots = ['12:00 PM','1:00 PM','2:00 PM','7:00 PM','7:30 PM','8:00 PM','8:30 PM','9:00 PM','9:30 PM','10:00 PM'];

    const start = new Date(date); start.setHours(0,0,0,0);
    const end = new Date(date); end.setHours(23,59,59,999);

    const booked = await Booking.aggregate([
      { $match: { date: { $gte: start, $lte: end }, status: { $in: ['pending', 'confirmed'] } } },
      { $group: { _id: '$timeSlot', count: { $sum: 1 } } }
    ]);

    const bookedMap = {};
    booked.forEach(b => bookedMap[b._id] = b.count);

    const slots = allSlots.map(slot => ({
      time: slot,
      available: (bookedMap[slot] || 0) < 6,
      remaining: Math.max(0, 6 - (bookedMap[slot] || 0))
    }));

    res.json({ success: true, data: slots });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/bookings/:id  — admin only
router.put('/:id', protect, async (req, res) => {
  try {
    const booking = await Booking.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    res.json({ success: true, message: 'Booking updated', data: booking });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

module.exports = router;
