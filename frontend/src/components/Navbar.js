import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import './Navbar.css';

const Navbar = () => {
  const { user, logout } = useAuth();

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-logo">
          <span>📚 VideoApp LMS</span>
        </div>
        <ul className="navbar-menu">
          <li><a href="/courses">Courses</a></li>
          <li><a href="/batches">Batches</a></li>
          <li><a href="/videos">Videos</a></li>
        </ul>
        <div className="navbar-auth">
          {user ? (
            <>
              <span className="user-name">{user.name}</span>
              <button onClick={logout} className="btn-logout">Logout</button>
            </>
          ) : (
            <>
              <a href="/login" className="btn-login">Login</a>
              <a href="/register" className="btn-register">Register</a>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
