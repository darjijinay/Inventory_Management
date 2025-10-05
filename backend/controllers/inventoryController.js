const Inventory = require('../models/Inventory');

exports.getInventory = async (req, res) => {
  try {
    const inventory = await Inventory.find({ user: req.user.id }).populate('category');
    res.json(inventory);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

exports.addItem = async (req, res) => {
  const { name, category, quantity, price } = req.body;
  try {
    const newItem = new Inventory({
      name,
      category,
      quantity,
      price,
      user: req.user.id,
    });
    const item = await newItem.save();
    res.json(item);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

exports.updateItem = async (req, res) => {
  const { name, category, quantity, price } = req.body;
  try {
    let item = await Inventory.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ msg: 'Item not found' });
    }
    if (item.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized' });
    }
    item = await Inventory.findByIdAndUpdate(req.params.id, { name, category, quantity, price }, { new: true });
    res.json(item);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

exports.deleteItem = async (req, res) => {
  try {
    let item = await Inventory.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ msg: 'Item not found' });
    }
    if (item.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized' });
    }
    await Inventory.findByIdAndRemove(req.params.id);
    res.json({ msg: 'Item removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

exports.increaseStock = async (req, res) => {
  const { amount } = req.body;
  try {
    let item = await Inventory.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ msg: 'Item not found' });
    }
    if (item.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized' });
    }
    item.quantity += amount;
    await item.save();
    res.json(item);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

exports.decreaseStock = async (req, res) => {
  const { amount } = req.body;
  try {
    let item = await Inventory.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ msg: 'Item not found' });
    }
    if (item.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized' });
    }
    if (item.quantity < amount) {
      return res.status(400).json({ msg: 'Insufficient stock' });
    }
    item.quantity -= amount;
    await item.save();
    res.json(item);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

exports.getLowStockAlerts = async (req, res) => {
  try {
    const items = await Inventory.find({ user: req.user.id, quantity: { $lte: 10 } });
    res.json(items);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};
