const Category = require('../models/Category');

exports.getCategories = async (req, res) => {
  try {
    const categories = await Category.find({ user: req.user.id });
    res.json(categories);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

exports.addCategory = async (req, res) => {
  const { name, description } = req.body;
  try {
    const newCategory = new Category({
      name,
      description,
      user: req.user.id,
    });
    const category = await newCategory.save();
    res.json(category);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

exports.updateCategory = async (req, res) => {
  const { name, description } = req.body;
  try {
    let category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ msg: 'Category not found' });
    }
    if (category.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized' });
    }
    category = await Category.findByIdAndUpdate(req.params.id, { name, description }, { new: true });
    res.json(category);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

exports.deleteCategory = async (req, res) => {
  try {
    let category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ msg: 'Category not found' });
    }
    if (category.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized' });
    }
    await Category.findByIdAndRemove(req.params.id);
    res.json({ msg: 'Category removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};
