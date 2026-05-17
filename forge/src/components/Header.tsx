import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import '../styles/Header.css';

interface HeaderProps {
  title?: string;
  onMenuToggle?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ title = 'Forge', onMenuToggle }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="header">
      <div className="header-left">
        {onMenuToggle && (
          <button className="menu-toggle" onClick={onMenuToggle} aria-label="Toggle menu">
            <span></span>
            <span></span>
            <span></span>
          </button>
        )}
        <h1 className="header-title">{title}</h1>
      </div>
      
      <div className="header-right">
        <div className="user-info">
          <span className="user-name">{user?.email}</span>
          {user?.role && <span className="user-role">{user.role.toUpperCase()}</span>}
        </div>
        <button className="logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </header>
  );
};
