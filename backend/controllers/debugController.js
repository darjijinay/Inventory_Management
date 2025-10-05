const Transaction = require('../models/Transaction');
const mongoose = require('mongoose');

exports.userTransactionsDebug = async (req, res) => {
  try {
    const userId = req.user.id;
    const userMatch = { $or: [{ user: mongoose.Types.ObjectId(userId) }, { user: userId }] };
    const count = await Transaction.countDocuments(userMatch);
    const sample = await Transaction.findOne(userMatch).populate('items.item', 'name').lean();
    res.json({ count, sample });
  } catch (err) {
    console.error('Debug route error:', err.message);
    res.status(500).json({ message: 'Debug error' });
  }
};

// NOTE: temporary debug controller — remove after investigation
