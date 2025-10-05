import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Navbar from './Navbar';

const Inventory = () => {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState('');
  const [stockAmount, setStockAmount] = useState('');
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [categoryName, setCategoryName] = useState('');
  const [categoryDescription, setCategoryDescription] = useState('');
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!token) {
      navigate('/');
      return;
    }
    loadInventory();
    loadLowStockAlerts();
    loadCategories();
  }, [token, navigate]);

  const loadInventory = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/inventory', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setItems(res.data);
    } catch (err) {
      alert('Failed to load inventory');
    }
  };

  const loadLowStockAlerts = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/inventory/low-stock', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setLowStockItems(res.data);
    } catch (err) {
      console.error('Failed to load low stock alerts');
    }
  };

  const loadCategories = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/categories', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCategories(res.data);
    } catch (err) {
      console.error('Failed to load categories');
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/api/inventory', { name, category, quantity, price }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setName('');
      setCategory('');
      setQuantity('');
      setPrice('');
      loadInventory();
    } catch (err) {
      alert('Failed to add item');
    }
  };

  const handleUpdate = async (id, updatedItem) => {
    try {
      await axios.put(`http://localhost:5000/api/inventory/${id}`, updatedItem, {
        headers: { Authorization: `Bearer ${token}` }
      });
      loadInventory();
    } catch (err) {
      alert('Failed to update item');
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/api/inventory/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      loadInventory();
    } catch (err) {
      alert('Failed to delete item');
    }
  };

  const handleIncreaseStock = async (id) => {
    const amount = prompt('Enter amount to increase stock');
    if (amount) {
      try {
        await axios.put(`http://localhost:5000/api/inventory/${id}/increase`, { amount: parseInt(amount) }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        loadInventory();
      } catch (err) {
        alert('Failed to increase stock');
      }
    }
  };

  const handleDecreaseStock = async (id) => {
    const amount = prompt('Enter amount to decrease stock');
    if (amount) {
      try {
        await axios.put(`http://localhost:5000/api/inventory/${id}/decrease`, { amount: parseInt(amount) }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        loadInventory();
      } catch (err) {
        alert('Failed to decrease stock');
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/');
  };

  return (
    <div className="container" style={{ minHeight: '100vh' }}>
      <Navbar />
      {/* Title shown in navbar */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <h3>Add New Item</h3>
        <form onSubmit={handleAdd} style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
          <input
            type="text"
            placeholder="Item Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            required
          >
            <option value="">Select Category</option>
            {categories.map(cat => (
              <option key={cat._id} value={cat._id}>{cat.name}</option>
            ))}
          </select>
          <input
            type="number"
            placeholder="Quantity"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            required
          />
          <input
            type="number"
            placeholder="Price"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
          />
          <button className="btn" type="submit">Add Item</button>
        </form>
      </div>
      <button className="btn" style={{ marginBottom: '20px' }} onClick={() => setShowCategoryForm(!showCategoryForm)}>
        {showCategoryForm ? 'Hide Category Form' : 'Manage Categories'}
      </button>
      {showCategoryForm && (
        <div className="card" style={{ marginBottom: '20px' }}>
          <form onSubmit={async (e) => {
            e.preventDefault();
            try {
              await axios.post('http://localhost:5000/api/categories', { name: categoryName, description: categoryDescription }, {
                headers: { Authorization: `Bearer ${token}` }
              });
              setCategoryName('');
              setCategoryDescription('');
              loadCategories();
            } catch (err) {
              alert('Failed to add category');
            }
          }}>
            <h3>Add New Category</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
              <input
                type="text"
                placeholder="Category Name"
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                required
              />
              <input
                type="text"
                placeholder="Description"
                value={categoryDescription}
                onChange={(e) => setCategoryDescription(e.target.value)}
              />
              <button className="btn" type="submit">Add Category</button>
            </div>
          </form>
        </div>
      )}
      {lowStockItems.length > 0 && (
        <div className="card" style={{ background: '#f8d7da', border: '1px solid #f5c6cb', marginBottom: '20px' }}>
          <h3 style={{ color: '#721c24' }}>Low Stock Alerts</h3>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {lowStockItems.map(item => (
              <li key={item._id} style={{ color: '#721c24', padding: '10px', backgroundColor: '#f9fafb', borderRadius: '8px', marginBottom: '5px' }}>
                <strong>{item.name}</strong> - Qty: {item.quantity}
              </li>
            ))}
          </ul>
        </div>
      )}
      {Object.entries(items.reduce((acc, item) => {
        const catName = item.category && item.category.name ? item.category.name : 'Uncategorized';
        if (!acc[catName]) acc[catName] = [];
        acc[catName].push(item);
        return acc;
      }, {})).map(([category, catItems]) => (
        <div key={category} className="card" style={{ marginBottom: '20px' }}>
          <h3 style={{ color: '#2a3b8f', marginBottom: '20px' }}>{category}</h3>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {catItems.map(item => (
              <li key={item._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px', borderBottom: '1px solid #eee', backgroundColor: '#f9fafb', borderRadius: '8px', marginBottom: '10px' }}>
                <span style={{ fontSize: '16px', fontWeight: 'bold' }}>{item.name} - Qty: {item.quantity} - Price: ₹{Number(item.price).toLocaleString('en-IN')}</span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                  <button className="btn btn-update" onClick={() => handleUpdate(item._id, { name: prompt('New name', item.name) || item.name, category: prompt('New category', item.category && item.category.name ? item.category.name : item.category) || item.category, quantity: prompt('New quantity', item.quantity) || item.quantity, price: prompt('New price', item.price) || item.price })}>Update</button>
                  <button className="btn btn-increase" onClick={() => handleIncreaseStock(item._id)}>Increase Stock</button>
                  <button className="btn btn-decrease" onClick={() => handleDecreaseStock(item._id)}>Decrease Stock</button>
                  <button className="btn btn-qr" onClick={() => window.open(`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${item._id}`, '_blank')}>QR Code</button>
                  <button className="btn btn-delete" onClick={() => handleDelete(item._id)}>Delete</button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ))}
      {/* Bottom navigation removed to keep header-only navigation */}
    </div>
  );
};

export default Inventory;
