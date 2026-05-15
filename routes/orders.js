const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const { protect } = require('../middleware/auth');

// POST /api/orders  — public (customer places order)
router.post('/', async (req, res) => {
  try {
    const { customer, orderType, deliveryAddress, items, subtotal, deliveryCharge, discount, totalAmount, paymentMethod, specialInstructions } = req.body;

    if (!items || items.length === 0) return res.status(400).json({ success: false, message: 'Order must have items' });
    if (orderType === 'delivery' && !deliveryAddress?.street) {
      return res.status(400).json({ success: false, message: 'Delivery address required for delivery orders' });
    }

    const order = await Order.create({
      customer, orderType, deliveryAddress, items, subtotal,
      deliveryCharge: deliveryCharge || 0, discount: discount || 0,
      totalAmount, paymentMethod: paymentMethod || 'cod',
      specialInstructions,
    });

    res.status(201).json({ success: true, message: 'Order placed successfully!', data: { orderNumber: order.orderNumber, _id: order._id, status: order.status } });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// GET /api/orders  — admin only
router.get('/', protect, async (req, res) => {
  try {
    const { status, date, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (date) {
      const start = new Date(date); start.setHours(0, 0, 0, 0);
      const end = new Date(date); end.setHours(23, 59, 59, 999);
      filter.createdAt = { $gte: start, $lte: end };
    }

    const orders = await Order.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Order.countDocuments(filter);
    res.json({ success: true, total, page: Number(page), data: orders });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/orders/:id  — admin or track by orderNumber
router.get('/:id', async (req, res) => {
  try {
    const order = await Order.findOne({
      $or: [{ _id: req.params.id.match(/^[0-9a-fA-F]{24}$/) ? req.params.id : null }, { orderNumber: req.params.id }]
    });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    res.json({ success: true, data: order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/orders/:id/status  — admin only
router.put('/:id/status', protect, async (req, res) => {
  try {
    const { status, note, estimatedTime } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    order.status = status;
    order.statusHistory.push({ status, note: note || '', time: new Date() });
    if (estimatedTime) order.estimatedTime = estimatedTime;
    if (status === 'delivered') order.paymentStatus = 'paid';

    await order.save();
    res.json({ success: true, message: 'Order status updated', data: order });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

module.exports = router;
