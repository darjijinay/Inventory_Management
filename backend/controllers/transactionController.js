const Transaction = require('../models/Transaction');
const Inventory = require('../models/Inventory');

exports.createTransaction = async (req, res) => {
  const { items, customerName, paymentMethod } = req.body;

  try {
    // Validate stock availability
    for (const item of items) {
      const inventoryItem = await Inventory.findById(item.item);
      if (!inventoryItem) {
        return res.status(404).json({ msg: `Item not found: ${item.item}` });
      }
      if (inventoryItem.quantity < item.quantity) {
        return res.status(400).json({ msg: `Insufficient stock for ${inventoryItem.name}. Available: ${inventoryItem.quantity}, Requested: ${item.quantity}` });
      }
    }

    // Calculate total amount
    const totalAmount = items.reduce((sum, item) => sum + item.total, 0);

    // Create transaction
    const transaction = new Transaction({
      items,
      totalAmount,
      user: req.user.id,
      customerName,
      paymentMethod,
    });

    await transaction.save();

    // Update stock levels
    for (const item of items) {
      await Inventory.findByIdAndUpdate(item.item, {
        $inc: { quantity: -item.quantity }
      });
    }

    // Populate the transaction with item details
    await transaction.populate('items.item', 'name category');

    res.json(transaction);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

exports.getTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find({ user: req.user.id })
      .populate('items.item', 'name category')
      .sort({ createdAt: -1 });
    res.json(transactions);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

exports.getTransactionById = async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id)
      .populate('items.item', 'name category')
      .populate('user', 'name email');

    if (!transaction) {
      return res.status(404).json({ msg: 'Transaction not found' });
    }

    if (transaction.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized' });
    }

    res.json(transaction);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

exports.getSalesReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

  const mongoose = require('mongoose');
  let matchConditions = { user: mongoose.Types.ObjectId(req.user.id) };

    if (startDate && endDate) {
      matchConditions.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    const transactions = await Transaction.aggregate([
      { $match: matchConditions },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          totalSales: { $sum: '$totalAmount' },
          transactionCount: { $sum: 1 },
          itemsSold: { $sum: { $sum: '$items.quantity' } },
        },
      },
      { $sort: { '_id': -1 } },
    ]);

    res.json(transactions);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};
