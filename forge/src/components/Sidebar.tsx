import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/Sidebar.css';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen = true, onClose }) => {
  const { user } = useAuth();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  const menuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: '📊', roles: ['user', 'admin'] },
    { path: '/workflows', label: 'Workflows', icon: '⚙️', roles: ['user', 'admin'] },
    { path: '/workflow-builder', label: 'Workflow Builder', icon: '🔨', roles: ['user', 'admin'] },
    { path: '/agents', label: 'Agents', icon: '🤖', roles: ['user', 'admin'] },
    { path: '/api-keys', label: 'API Keys', icon: '🔑', roles: ['user', 'admin'] },
    { path: '/profile', label: 'Profile', icon: '👤', roles: ['user', 'admin'] },
    { path: '/admin', label: 'Admin Panel', icon: '⚡', roles: ['admin'] },
  ];

  const filteredItems = menuItems.filter(item => 
    item.roles.includes(user?.role || 'user')
  );

  return (
    <aside className={`sidebar ${isOpen ? 'open' : 'closed'}`}>
      <div className="sidebar-header">
        <h2 className="sidebar-logo">🚀 Forge</h2>
        {onClose && (
          <button className="sidebar-close" onClick={onClose} aria-label="Close sidebar">
            ✕
          </button>
        )}
      </div>

      <nav className="sidebar-nav">
        <ul className="menu-list">
          {filteredItems.map(item => (
            <li key={item.path}>
              <Link
                to={item.path}
                className={`menu-item ${isActive(item.path) ? 'active' : ''}`}
              >
                <span className="menu-icon">{item.icon}</span>
                <span className="menu-label">{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className="sidebar-footer">
        <p className="version">v1.0.0</p>
      </div>
    </aside>
  );
};
