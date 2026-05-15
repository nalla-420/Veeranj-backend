const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Booking = require('../models/Booking');
const MenuItem = require('../models/MenuItem');
const Contact = require('../models/Contact');
const { protect } = require('../middleware/auth');

// Dashboard stats
router.get('/stats', protect, async (req, res) => {
  try {
    const today = new Date(); today.setHours(0,0,0,0);
    const todayEnd = new Date(); todayEnd.setHours(23,59,59,999);
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    const [totalOrders, todayOrders, pendingOrders, totalBookings, todayBookings, pendingBookings, menuItems, unreadMsgs, revenueData, chartData] = await Promise.all([
      Order.countDocuments(),
      Order.countDocuments({ createdAt: { $gte: today, $lte: todayEnd } }),
      Order.countDocuments({ status: { $in: ['pending','confirmed','preparing'] } }),
      Booking.countDocuments(),
      Booking.countDocuments({ date: { $gte: today, $lte: todayEnd } }),
      Booking.countDocuments({ status: 'pending' }),
      MenuItem.countDocuments({ isAvailable: true }),
      Contact.countDocuments({ isRead: false }),
      Order.aggregate([{ $match: { status: 'delivered', createdAt: { $gte: monthStart } } }, { $group: { _id: null, total: { $sum: '$totalAmount' } } }]),
      Order.aggregate([
        { $match: { createdAt: { $gte: new Date(Date.now() - 7*24*60*60*1000) } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, orders: { $sum: 1 }, revenue: { $sum: '$totalAmount' } } },
        { $sort: { _id: 1 } }
      ])
    ]);

    res.json({ success: true, data: {
      orders: { total: totalOrders, today: todayOrders, pending: pendingOrders },
      bookings: { total: totalBookings, today: todayBookings, pending: pendingBookings },
      menu: { totalItems: menuItems },
      messages: { unread: unreadMsgs },
      revenue: { thisMonth: revenueData[0]?.total || 0 },
      chart: chartData,
    }});
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// Recent activity
router.get('/recent', protect, async (req, res) => {
  try {
    const [recentOrders, recentBookings] = await Promise.all([
      Order.find().sort({ createdAt: -1 }).limit(5),
      Booking.find().sort({ createdAt: -1 }).limit(5),
    ]);
    res.json({ success: true, data: { recentOrders, recentBookings } });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
