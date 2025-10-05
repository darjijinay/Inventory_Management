import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:5000/api/auth/login', { email, password });
      localStorage.setItem('token', res.data.token);
      navigate('/inventory');
    } catch (err) {
      alert(err.response?.data?.msg || 'Login failed');
    }
  };

  return (
    <div className="container" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', maxWidth: '400px' }}>
      <form onSubmit={handleSubmit} className="card" style={{ margin: '60px auto  auto', maxWidth: '400px' }}>
        <h2 style={{ textAlign: 'center', color: '#2a3b8f', marginBottom: '30px', fontSize: '2em' }}>Login</h2>
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
        <button className="btn" type="submit" style={{ width: '100%' }}>Login</button>
        <p style={{ textAlign: 'center', marginTop: '20px', color: '#666' }}>
          Don't have an account? <Link to="/signup" style={{ color: '#2a3b8f', textDecoration: 'none', fontWeight: 'bold' }}>Sign up</Link>
        </p>
      </form>
    </div>
  );
};

export default Login;
