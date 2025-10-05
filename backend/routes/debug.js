const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const debugController = require('../controllers/debugController');

// GET /api/debug/transactions
router.get('/transactions', auth, debugController.userTransactionsDebug);

module.exports = router;
