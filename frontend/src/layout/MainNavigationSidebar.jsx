import React from 'react';
import { NavLink } from 'react-router-dom';
import './MainNavigationSidebar.css';

// Component to hold the Material Icon.
const MaterialIcon = ({ name, className = '' }) => (
    <span 
        className={`material-symbols-outlined ${className}`} 
        style={{ fontSize: '1.25rem', marginRight: '12px' }}
    >
        {name}
    </span>
);

function MainNavigationSidebar({ onNavigate }) {
  return (
    <aside className="main-sidebar">
      {/* 1. Sidebar Brand Area (Matches Top Bar Height) */}
      <div className="sidebar-brand">
        <span className="brand-icon">🐾</span>
        <span className="brand-text">NyanDex</span>
      </div>

      {/* 2. Navigation Links */}
      <nav className="sidebar-nav">
        <div className="nav-group-label">Menu</div>
        
        <NavLink 
          to="/dashboard" 
          onClick={onNavigate}
          className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
        >
          <MaterialIcon name="dashboard" />
          <span>Dashboard</span>
        </NavLink>

        <NavLink 
          to="/catalog" 
          onClick={onNavigate}
          className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
        >
          <MaterialIcon name="pets" />
          <span>Catalog</span>
        </NavLink>

        <NavLink 
          to="/inventory" 
          onClick={onNavigate}
          className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
        >
          <MaterialIcon name="inventory_2" />
          <span>Inventory</span>
        </NavLink>
      </nav>

      {/* 3. Footer / Meta (Optional) */}
      <div className="sidebar-footer">
        <span className="version-text">v14.7.0 Data</span>
      </div>
    </aside>
  );
}

export default MainNavigationSidebar;