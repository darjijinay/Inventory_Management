import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Navbar from './Navbar';

const Sales = () => {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [customerName, setCustomerName] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!token) {
      navigate('/');
      return;
    }
    loadItems();
    loadCategories();
  }, [token, navigate]);

  const loadItems = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/inventory', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setItems(res.data);
    } catch (err) {
      alert('Failed to load inventory');
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

  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === '' || (item.category && item.category._id === selectedCategory);
    return matchesSearch && matchesCategory;
  });

  const addItemToSale = (item) => {
    const existingItem = selectedItems.find(selected => selected.item._id === item._id);
    if (existingItem) {
      if (existingItem.quantity < item.quantity) {
        setSelectedItems(selectedItems.map(selected =>
          selected.item._id === item._id
            ? { ...selected, quantity: selected.quantity + 1 }
            : selected
        ));
      } else {
        alert(`Only ${item.quantity} units available for ${item.name}`);
      }
    } else {
      setSelectedItems([...selectedItems, {
        item,
        quantity: 1,
        price: item.price,
        total: item.price,
      }]);
    }
  };

  const updateItemQuantity = (index, quantity) => {
    if (quantity <= 0) {
      removeItemFromSale(index);
      return;
    }

    const item = selectedItems[index];
    if (quantity > item.item.quantity) {
      alert(`Only ${item.item.quantity} units available for ${item.item.name}`);
      return;
    }

    const updatedItems = [...selectedItems];
    updatedItems[index] = {
      ...item,
      quantity: parseInt(quantity),
      total: item.price * quantity,
    };
    setSelectedItems(updatedItems);
  };

  const removeItemFromSale = (index) => {
    setSelectedItems(selectedItems.filter((_, i) => i !== index));
  };

  const calculateTotal = () => {
    return selectedItems.reduce((sum, item) => sum + item.total, 0);
  };

  const handleSale = async () => {
    if (selectedItems.length === 0) {
      alert('Please add items to the sale');
      return;
    }

    try {
      const saleData = {
        items: selectedItems.map(item => ({
          item: item.item._id,
          quantity: item.quantity,
          price: item.price,
          total: item.total,
        })),
        customerName,
        paymentMethod,
      };

      await axios.post('http://localhost:5000/api/transactions', saleData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert('Sale completed successfully!');
      setSelectedItems([]);
      setCustomerName('');
      setPaymentMethod('Cash');
      loadItems(); // Refresh inventory to show updated stock
  // Navigate to dashboard with a timestamp query so Dashboard reloads data (SPA style)
  navigate('/dashboard?ts=' + Date.now());
    } catch (err) {
      const msg = err?.response?.data?.msg || err.message || 'Unknown error';
      alert('Failed to complete sale: ' + msg);
    }
  };

  return (
    <div className="container" style={{ minHeight: '100vh' }}>
      <Navbar />
      {/* Title shown in navbar */}
      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', flexDirection: window.innerWidth < 768 ? 'column' : 'row' }}>
        {/* Left Panel - Item Selection */}
        <div className="card" style={{ flex: 1, minWidth: '320px' }}>
          <h3>Select Items</h3>

          {/* Search and Filter */}
          <div style={{ marginBottom: '20px', display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            <input
              type="text"
              placeholder="Search items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="">All Categories</option>
              {categories.map(cat => (
                <option key={cat._id} value={cat._id}>{cat.name}</option>
              ))}
            </select>
          </div>

          {/* Available Items */}
          <div style={{ border: '1px solid #ddd', height: '400px', overflowY: 'auto', padding: '10px', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
            {filteredItems.map(item => (
              <div key={item._id} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '15px',
                borderBottom: '1px solid #eee',
                backgroundColor: '#fff',
                borderRadius: '8px',
                marginBottom: '10px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
              }}>
                <div>
                  <strong style={{ fontSize: '16px' }}>{item.name}</strong>
                  {item.category && <div style={{ fontSize: '0.9em', color: '#666' }}>{item.category.name}</div>}
                  <div style={{ color: '#007bff' }}>Stock: {item.quantity} | Price: ₹{Number(item.price).toLocaleString('en-IN')}</div>
                </div>
                <button className="btn" style={{ background: item.quantity > 0 ? 'linear-gradient(90deg, #28a745 0%, #4f8cff 100%)' : '#ccc', cursor: item.quantity > 0 ? 'pointer' : 'not-allowed' }} onClick={() => addItemToSale(item)} disabled={item.quantity === 0}>Add to Sale</button>
              </div>
            ))}
          </div>
        </div>

        {/* Right Panel - Sale Details */}
        <div className="card" style={{ flex: 1, minWidth: '320px' }}>
          <h3>Sale Details</h3>

          {/* Customer Info */}
          <div style={{ marginBottom: '20px', display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            <input
              type="text"
              placeholder="Customer Name (optional)"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
            />
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
            >
              <option value="Cash">Cash</option>
              <option value="Card">Card</option>
              <option value="Online">Online</option>
            </select>
          </div>

          {/* Selected Items */}
          <div style={{
            border: '1px solid #ddd',
            height: '300px',
            overflowY: 'auto',
            padding: '10px',
            backgroundColor: '#f9f9f9',
            borderRadius: '8px',
            marginBottom: '20px'
          }}>
            {selectedItems.map((selectedItem, index) => (
              <div key={index} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '15px',
                borderBottom: '1px solid #eee',
                backgroundColor: '#fff',
                borderRadius: '8px',
                marginBottom: '10px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
              }}>
                <div>
                  <strong style={{ fontSize: '16px' }}>{selectedItem.item.name}</strong>
                  <div style={{ color: '#007bff' }}>Price: ₹{Number(selectedItem.price).toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})} | Total: ₹{Number(selectedItem.total).toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <input
                    type="number"
                    min="1"
                    max={selectedItem.item.quantity}
                    value={selectedItem.quantity}
                    onChange={(e) => updateItemQuantity(index, e.target.value)}
                  />
                  <button className="btn" style={{ background: 'linear-gradient(90deg, #e74c3c 0%, #4f8cff 100%)' }} onClick={() => removeItemFromSale(index)}>Remove</button>
                </div>
              </div>
            ))}
          </div>

          {/* Total and Complete Sale */}
          <div style={{ textAlign: 'right', marginBottom: '20px' }}>
            <h3 style={{ color: '#333', fontSize: '1.5em', marginBottom: '10px' }}>Total: ₹{Number(calculateTotal()).toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</h3>
            <button className="btn" style={{ background: selectedItems.length > 0 ? 'linear-gradient(90deg, #28a745 0%, #4f8cff 100%)' : '#ccc', cursor: selectedItems.length > 0 ? 'pointer' : 'not-allowed' }} onClick={handleSale} disabled={selectedItems.length === 0}>Complete Sale</button>
          </div>
        </div>
      </div>

      <div style={{ marginTop: '40px', textAlign: 'center' }}>
        <button className="btn" style={{ background: 'linear-gradient(90deg, #6c757d 0%, #4f8cff 100%)' }} onClick={() => navigate('/inventory')}>Back to Inventory</button>
      </div>
    </div>
  );
};

export default Sales;
