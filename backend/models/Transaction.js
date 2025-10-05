const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
  items: [{
    item: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Inventory',
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    total: {
      type: Number,
      required: true,
    },
  }],
  totalAmount: {
    type: Number,
    required: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  customerName: {
    type: String,
    default: 'Walk-in Customer',
  },
  paymentMethod: {
    type: String,
    enum: ['Cash', 'Card', 'Online'],
    default: 'Cash',
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Transaction', TransactionSchema);
