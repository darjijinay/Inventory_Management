import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const toggle = () => setOpen(prev => !prev);

  const handleLogout = (e) => {
    e.preventDefault();
    localStorage.removeItem('token');
    // navigate to login/root
    navigate('/');
  };

  const location = useLocation();
  const path = location.pathname;
  const titleMap = {
    '/inventory': 'Inventory Management',
    '/dashboard': 'Reports & Dashboard',
    '/sales': 'Sales Management',
    '/': ''
  };
  const pageTitle = titleMap[path] || '';

  // Determine if container-width class should be added
  const containerWidthPaths = ['/dashboard', '/sales'];
  const navClassName = containerWidthPaths.includes(path) ? 'app-nav container-width' : 'app-nav';

  return (
    <nav className={navClassName}>
      <div className="nav-container">
        <div className="nav-left">
          <div className="nav-title">{pageTitle}</div>
        </div>

        <div
          className="nav-toggle"
          role="button"
          tabIndex={0}
          aria-label="Toggle navigation"
          aria-expanded={open}
          onClick={toggle}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); } }}
        >
          <span className={`hamburger ${open ? 'open' : ''}`} />
        </div>

        <div className={`nav-links ${open ? 'open' : ''}`} onClick={() => setOpen(false)}>
          <Link to="/dashboard" className="nav-link">Dashboard</Link>
          <Link to="/inventory" className="nav-link">Inventory</Link>
          <Link to="/sales" className="nav-link">Sales</Link>
          <a href="#" className="nav-link nav-logout" onClick={handleLogout}>Logout</a>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
