import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import Navbar from './Navbar';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const Dashboard = () => {
  const [data, setData] = useState({
    totalProducts: 0,
    totalCategories: 0,
    lowStockItems: [],
    monthlySales: []
  });
  const [itemSalesSeries, setItemSalesSeries] = useState([]);
  const [itemTotalQuantity, setItemTotalQuantity] = useState(0);
  const [totalQuantityAll, setTotalQuantityAll] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!token) {
      navigate('/');
      return;
    }
    loadDashboardData();
  }, [token, navigate]);

  useEffect(() => {
    loadDashboardData();
  }, [location]);

  const loadDashboardData = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/dashboard', {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('Dashboard data received:', res.data);
      // If backend provides monthlySales use it, otherwise try to build it from transactions
      if (res.data && Array.isArray(res.data.monthlySales) && res.data.monthlySales.length > 0) {
        // backend returns monthlySales with month: 'YYYY-MM' (see dashboard controller)
        const ms = res.data.monthlySales.map(msItem => {
          const monthStr = msItem.month || msItem._id || msItem.month;
          let label = monthStr;
          try {
            // handle 'YYYY-MM' string
            if (/^\d{4}-\d{1,2}$/.test(monthStr)) {
              const [y,m] = monthStr.split('-').map(Number);
              const date = new Date(y, m-1, 1);
              label = date.toLocaleString('default', { month: 'short' });
            }
          } catch (e) { /* fallback to raw */ }
          return { month: label, total: msItem.total };
        });
        setData(prev => ({ ...res.data, monthlySales: ms }));
      } else {
        // set other dashboard metrics first (also preserve mostSoldItem from backend)
        setData(prev => ({ ...prev, totalProducts: res.data.totalProducts || 0, totalCategories: res.data.totalCategories || 0, lowStockItems: res.data.lowStockItems || [], mostSoldItem: res.data.mostSoldItem || null }));
        // try to fetch raw transactions and compute monthly totals
        try {
          const tRes = await axios.get('http://localhost:5000/api/transactions', { headers: { Authorization: `Bearer ${token}` } });
          const transactions = Array.isArray(tRes.data) ? tRes.data : [];
          // aggregate totals by month-year
          const map = new Map();
          transactions.forEach(tx => {
            const date = tx.createdAt ? new Date(tx.createdAt) : (tx.date ? new Date(tx.date) : null);
            if (!date || isNaN(date)) return;
            const key = `${date.getFullYear()}-${date.getMonth()+1}`; // e.g. 2025-10
            const prev = map.get(key) || 0;
            // Prefer backend totalAmount field; fall back to summing item totals
            let total = 0;
            if (typeof tx.totalAmount === 'number') total = tx.totalAmount;
            else if (tx.totalAmount) total = Number(tx.totalAmount) || 0;
            else if (Array.isArray(tx.items)) {
              total = tx.items.reduce((s, it) => s + (Number(it.total) || 0), 0);
            }
            map.set(key, prev + (isNaN(total) ? 0 : total));
          });
          // convert map to sorted array of last 12 months
          const entries = Array.from(map.entries()).map(([k,v]) => {
            const [y,m] = k.split('-').map(Number);
            const date = new Date(y, m-1, 1);
            return { date, total: v };
          });
          entries.sort((a,b) => a.date - b.date);
          const monthlySales = entries.map(e => ({ month: e.date.toLocaleString('default', { month: 'short' }), total: e.total }));
          // make sure to include mostSoldItem from backend when swapping in the computed monthlySales
          setData(prev => ({ ...prev, monthlySales, mostSoldItem: res.data.mostSoldItem || prev.mostSoldItem || null }));
          // if there is a mostSoldItem from backend it'll be set later; but compute item series when possible
        } catch (txErr) {
          console.warn('Failed to fetch transactions for chart fallback', txErr);
          setData(res.data);
        }
      }
    } catch (err) {
      alert('Failed to load dashboard data');
    }
  };

  // compute per-item monthly quantities and totals for the mostSoldItem
  const computeMostSoldItemSeries = async (itemId) => {
    if (!itemId) return;
    try {
      const tRes = await axios.get('http://localhost:5000/api/transactions', { headers: { Authorization: `Bearer ${token}` } });
      const transactions = Array.isArray(tRes.data) ? tRes.data : [];
      const map = new Map(); // month -> quantity for this item
      let totalAll = 0;
      let itemTotal = 0;
      transactions.forEach(tx => {
        const date = tx.createdAt ? new Date(tx.createdAt) : (tx.date ? new Date(tx.date) : null);
        if (!date || isNaN(date)) return;
        const key = `${date.getFullYear()}-${date.getMonth()+1}`;
        // sum all item quantities for totalAll
        if (Array.isArray(tx.items)) {
          tx.items.forEach(it => {
            const q = Number(it.quantity) || 0;
            totalAll += q;
            if (String(it.item) === String(itemId) || (it.item && it.item._id && String(it.item._id) === String(itemId))) {
              const prev = map.get(key) || 0;
              map.set(key, prev + q);
              itemTotal += q;
            }
          });
        }
      });
      // build sorted series
      const entries = Array.from(map.entries()).map(([k,v]) => {
        const [y,m] = k.split('-').map(Number);
        const date = new Date(y, m-1, 1);
        return { date, qty: v };
      });
      entries.sort((a,b) => a.date - b.date);
      const series = entries.map(e => ({ month: e.date.toLocaleString('default', { month: 'short' }), qty: e.qty }));
      setItemSalesSeries(series);
      setItemTotalQuantity(itemTotal);
      setTotalQuantityAll(totalAll);
    } catch (err) {
      console.warn('Failed to compute item series', err);
    }
  };

  useEffect(() => {
    console.log('Dashboard component rendered with data:', data);
    if (data && data.mostSoldItem && data.mostSoldItem.itemId) {
      computeMostSoldItemSeries(data.mostSoldItem.itemId);
    } else if (data && data.mostSoldItem && data.mostSoldItem._id) {
      computeMostSoldItemSeries(data.mostSoldItem._id);
    }
  }, [data]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/');
  };

  return (
    <div className="container" style={{ minHeight: '100vh' }}>
      <Navbar />
      {/* Title shown in navbar */}
      <div className="dashboard-cards" style={{ display: 'flex', justifyContent: 'space-around', marginBottom: '40px', flexWrap: 'wrap' }}>
        {data.mostSoldItem && (
          <div className="card dashboard-card" style={{ border: '2px solid #17a2b8', width: '300px', margin: '10px', flex: 1, minWidth: '260px', textAlign: 'center' }}>
            <h3 style={{ color: '#17a2b8', marginBottom: '10px' }}>Most Sold Item</h3>
            <p style={{ fontSize: '1.05em', color: '#333', fontWeight: '600' }}>{data.mostSoldItem.name || 'Unknown'}</p>
            <p style={{ fontSize: '1.5em', color: '#17a2b8', fontWeight: '700' }}>{data.mostSoldItem.totalSold || 0} units</p>
            {itemSalesSeries && itemSalesSeries.length > 0 && (
              <div style={{ height: '70px', padding: '6px' }}>
                <Bar
                  data={{ labels: itemSalesSeries.map(s => s.month), datasets: [{ data: itemSalesSeries.map(s => s.qty), backgroundColor: '#17a2b8' }] }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: { x: { display: false }, y: { display: false } },
                    plugins: { legend: { display: false }, tooltip: { callbacks: { label: (ctx) => `${ctx.parsed.y} units` } } }
                  }}
                />
              </div>
            )}
            {totalQuantityAll > 0 && (
              <p style={{ marginTop: '6px', color: '#555' }}>
                {Math.round((itemTotalQuantity / totalQuantityAll) * 100)}% of items sold
              </p>
            )}
            <p style={{ marginTop: '6px' }}><a href="/inventory" style={{ color: '#153e75', textDecoration: 'underline' }}>View in Inventory</a></p>
          </div>
        )}
        <div className="card dashboard-card" style={{ border: '2px solid #2a3b8f', width: '250px', margin: '10px', flex: 1, minWidth: '220px', textAlign: 'center' }}>
          <h3 style={{ color: '#2a3b8f', marginBottom: '10px' }}>Total Products</h3>
          <p style={{ fontSize: '2.5em', color: '#2a3b8f', fontWeight: 'bold' }}>{data.totalProducts}</p>
        </div>
        <div className="card dashboard-card" style={{ border: '2px solid #4f8cff', width: '250px', margin: '10px', flex: 1, minWidth: '220px', textAlign: 'center' }}>
          <h3 style={{ color: '#4f8cff', marginBottom: '10px' }}>Total Categories</h3>
          <p style={{ fontSize: '2.5em', color: '#4f8cff', fontWeight: 'bold' }}>{data.totalCategories}</p>
        </div>
        <div className="card dashboard-card" style={{ border: '2px solid #e74c3c', width: '250px', margin: '10px', flex: 1, minWidth: '220px', textAlign: 'center' }}>
          <h3 style={{ color: '#e74c3c', marginBottom: '10px' }}>Low Stock Items</h3>
          <p style={{ fontSize: '2.5em', color: '#e74c3c', fontWeight: 'bold' }}>{data.lowStockItems.length}</p>
        </div>
      </div>
      {data.lowStockItems.length > 0 && (
        <div style={{ backgroundColor: '#f8d7da', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)', marginBottom: '20px', border: '1px solid #f5c6cb' }}>
          <h3 style={{ color: '#721c24', marginBottom: '10px' }}>Low Stock Alerts</h3>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {data.lowStockItems.map(item => (
              <li key={item._id} style={{ color: '#721c24', padding: '10px', backgroundColor: '#f9f9f9', borderRadius: '8px', marginBottom: '5px' }}>
                <strong>{item.name}</strong> - Qty: {item.quantity} (Threshold: {item.lowStockThreshold}) - Category: {item.category?.name || 'Uncategorized'}
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className="card">
        <h3>Monthly Sales</h3>
        <button className="btn" onClick={loadDashboardData} style={{ marginBottom: '20px' }}>Refresh Data</button>
        {data.monthlySales.length > 0 ? (
          <div style={{ height: '400px' }}>
            {(() => {
              try {
                const chartData = {
                  labels: data.monthlySales.map(item => item.month),
                  datasets: [
                    {
                      label: 'Monthly Sales (₹)',
                      data: data.monthlySales.map(item => item.total),
                      backgroundColor: '#2a3b8f',
                      borderColor: '#1a2a5f',
                      borderWidth: 1,
                    },
                  ],
                };
                console.log('Chart data:', chartData);
                return (
                  <Bar
                    data={chartData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'top',
                        },
                        title: {
                          display: true,
                          text: 'Monthly Sales Overview',
                        },
                      },
                      scales: {
                        y: {
                          beginAtZero: true,
                          ticks: {
                            callback: function(value) {
                              try {
                                return '₹' + Number(value).toLocaleString('en-IN');
                              } catch (e) {
                                return '₹' + value;
                              }
                            },
                          },
                        },
                      },
                    }}
                  />
                );
              } catch (error) {
                console.error('Error rendering chart:', error);
                return <p style={{ color: 'red' }}>Error rendering chart: {error.message}</p>;
              }
            })()}
          </div>
        ) : (
          <p style={{ color: '#666', fontStyle: 'italic', textAlign: 'center', padding: '50px' }}>No sales data available. Make some sales to see the chart.</p>
        )}
      </div>
      {/* Bottom navigation removed; header navbar provides navigation */}
    </div>
  );
};

export default Dashboard;
