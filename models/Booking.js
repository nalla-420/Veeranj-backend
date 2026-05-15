const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  bookingNumber: { type: String, unique: true },
  customer: {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, required: true },
  },
  date: { type: Date, required: true },
  timeSlot: { type: String, required: true }, // e.g. "7:00 PM"
  guests: { type: Number, required: true, min: 1, max: 20 },
  tableNumber: { type: Number, default: null },
  occasion: {
    type: String,
    enum: ['Birthday', 'Anniversary', 'Business Dinner', 'Family Gathering', 'Date', 'Other', ''],
    default: ''
  },
  specialRequests: { type: String, default: '' },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'completed', 'no_show'],
    default: 'pending',
  },
  adminNote: { type: String, default: '' },
}, { timestamps: true });

bookingSchema.pre('save', async function (next) {
  if (!this.bookingNumber) {
    const count = await mongoose.model('Booking').countDocuments();
    this.bookingNumber = 'BK' + String(count + 1).padStart(4, '0');
  }
  next();
});

module.exports = mongoose.model('Booking', bookingSchema);
