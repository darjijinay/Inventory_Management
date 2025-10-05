const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const role = require('../middleware/role');
const {
  getCategories,
  addCategory,
  updateCategory,
  deleteCategory,
} = require('../controllers/categoryController');

// All authenticated users can manage categories
router.get('/', auth, getCategories);
router.post('/', auth, addCategory);
router.put('/:id', auth, updateCategory);
router.delete('/:id', auth, deleteCategory);

module.exports = router;
