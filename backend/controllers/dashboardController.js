const mongoose = require('mongoose');
const Inventory = require('../models/Inventory');
const Category = require('../models/Category');
const Transaction = require('../models/Transaction');

const getDashboardData = async (req, res) => {
  try {
    const userId = req.user.id;

    const totalProducts = await Inventory.countDocuments({ user: userId });

    const totalCategories = await Category.countDocuments({ user: userId });

    const userMatch = { $or: [{ user: new mongoose.Types.ObjectId(userId) }, { user: userId }] };

    const lowStockItems = await Inventory.aggregate([
      { $match: userMatch },
      { $match: { $expr: { $lt: ['$quantity', '$lowStockThreshold'] } } },
      { $lookup: { from: 'categories', localField: 'category', foreignField: '_id', as: 'category' } },
      { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } },
      { $project: { name: 1, quantity: 1, lowStockThreshold: 1, category: { name: '$category.name' } } }
    ]);

    // diagnostic: count transactions for this user and show a sample to help debug empty aggregation
    try {
      const txCount = await Transaction.countDocuments({ user: new mongoose.Types.ObjectId(userId) });
      console.log(`Transaction count for user ${userId}:`, txCount);
      if (txCount > 0) {
        const sampleTx = await Transaction.findOne({ user: new mongoose.Types.ObjectId(userId) }).limit(1).lean();
        console.log('Sample transaction for user:', sampleTx);
      }
    } catch (diagErr) {
      console.warn('Dashboard diagnostic failed:', diagErr.message);
    }

    const monthlySales = await Transaction.aggregate([
      { $match: userMatch },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m',
              date: '$createdAt'
            }
          },
          total: { $sum: '$totalAmount' }
        }
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          month: '$_id',
          total: 1,
          _id: 0
        }
      }
    ]);

    // compute most sold item (by quantity) for this user
    const mostSoldAgg = await Transaction.aggregate([
      { $match: userMatch },
      { $unwind: '$items' },
      { $group: { _id: '$items.item', totalSold: { $sum: '$items.quantity' } } },
      { $sort: { totalSold: -1 } },
      { $limit: 1 },
      { $lookup: { from: 'inventories', localField: '_id', foreignField: '_id', as: 'item' } },
      { $unwind: { path: '$item', preserveNullAndEmptyArrays: true } },
      { $project: { itemId: '$_id', name: '$item.name', totalSold: 1, _id: 0 } }
    ]);

    const mostSoldItem = mostSoldAgg && mostSoldAgg.length ? mostSoldAgg[0] : null;

  console.log('Most sold item aggregation result:', mostSoldItem);

    console.log('Dashboard data for user:', userId);
    console.log('Monthly sales data:', monthlySales);

    res.json({
      totalProducts,
      totalCategories,
      lowStockItems,
      monthlySales,
      mostSoldItem
    });
  } catch (error) {
    console.error('Error in getDashboardData:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getDashboardData };
