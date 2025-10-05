const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const role = require('../middleware/role');
const {
  getInventory,
  addItem,
  updateItem,
  deleteItem,
  increaseStock,
  decreaseStock,
  getLowStockAlerts,
} = require('../controllers/inventoryController');

// Admin and Manager can add, update, delete items
router.get('/', auth, getInventory);
router.post('/', auth, role('Admin', 'Manager'), addItem);
router.put('/:id', auth, role('Admin', 'Manager'), updateItem);
router.delete('/:id', auth, role('Admin', 'Manager'), deleteItem);

// Stock management - Admin and Manager can update stock
router.put('/:id/increase', auth, role('Admin', 'Manager'), increaseStock);
router.put('/:id/decrease', auth, role('Admin', 'Manager'), decreaseStock);
router.get('/low-stock', auth, getLowStockAlerts);

module.exports = router;
