import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

const Signup = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Staff');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/api/auth/signup', { name, email, password, role });
      alert('Signup successful! Please login.');
      navigate('/');
    } catch (err) {
      alert(err.response?.data?.msg || 'Signup failed');
    }
  };
  return (
    <div className="container" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', maxWidth: '400px' }}>
      <form onSubmit={handleSubmit} className="card" style={{ margin: '60px auto 0 auto', maxWidth: '400px' }}>
        <h2 style={{ textAlign: 'center', color: '#2a3b8f', marginBottom: '30px', fontSize: '2em' }}>Sign Up</h2>
        <input
          type="text"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
        >
          <option value="Admin">Admin</option>
          <option value="Manager">Manager</option>
          <option value="Staff">Staff</option>
        </select>
        <button className="btn" type="submit" style={{ width: '100%' }}>Sign Up</button>
        <p style={{ textAlign: 'center', marginTop: '20px', color: '#666' }}>
          Already have an account? <Link to="/" style={{ color: '#2a3b8f', textDecoration: 'none', fontWeight: 'bold' }}>Login</Link>
        </p>
      </form>
    </div>
  );
};

export default Signup;
