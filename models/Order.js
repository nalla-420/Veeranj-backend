const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  menuItem: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem' },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true, min: 1 },
});

const orderSchema = new mongoose.Schema({
  orderNumber: { type: String, unique: true },
  customer: {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, required: true },
  },
  orderType: { type: String, enum: ['delivery', 'takeaway'], required: true },
  deliveryAddress: {
    street: String,
    city: String,
    pincode: String,
    landmark: String,
  },
  items: [orderItemSchema],
  subtotal: { type: Number, required: true },
  deliveryCharge: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },
  totalAmount: { type: Number, required: true },
  paymentMethod: { type: String, enum: ['cod', 'online', 'upi'], default: 'cod' },
  paymentStatus: { type: String, enum: ['pending', 'paid', 'failed'], default: 'pending' },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled'],
    default: 'pending',
  },
  specialInstructions: { type: String, default: '' },
  estimatedTime: { type: Number, default: 30 },
  statusHistory: [{
    status: String,
    time: { type: Date, default: Date.now },
    note: String,
  }],
}, { timestamps: true });

// Auto-generate order number
orderSchema.pre('save', async function (next) {
  if (!this.orderNumber) {
    const count = await mongoose.model('Order').countDocuments();
    this.orderNumber = 'VRJ' + String(count + 1).padStart(4, '0');
    this.statusHistory.push({ status: this.status, note: 'Order placed' });
  }
  next();
});

module.exports = mongoose.model('Order', orderSchema);
