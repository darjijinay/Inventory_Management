const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  createTransaction,
  getTransactions,
  getTransactionById,
  getSalesReport,
} = require('../controllers/transactionController');

// All authenticated users can manage transactions
router.post('/', auth, createTransaction);
router.get('/', auth, getTransactions);
router.get('/report', auth, getSalesReport);
router.get('/:id', auth, getTransactionById);

module.exports = router;
