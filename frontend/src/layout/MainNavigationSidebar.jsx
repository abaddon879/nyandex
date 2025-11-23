import React from 'react';
import { NavLink } from 'react-router-dom'; // Use NavLink for active styling

// Component to hold the Material Icon.
const MaterialIcon = ({ name }) => (
    <span 
        className="material-symbols-outlined" 
        style={{ fontSize: '1.2rem', marginRight: '10px' }}
    >
        {name}
    </span>
);

// New CSS file for the sidebar
import './MainNavigationSidebar.css';

function MainNavigationSidebar() {
  // This is the style that NavLink will apply when the route is active
  const activeStyle = {
    backgroundColor: 'var(--color-accent-primary)',
    color: 'var(--color-text-primary)',
    fontWeight: '600'
  };

  return (
    <aside className="main-sidebar">
      <h1 className="sidebar-title">NyanDex</h1>
      <nav className="sidebar-nav">
        <NavLink 
          to="/dashboard" 
          className="nav-link"
          style={({ isActive }) => (isActive ? activeStyle : undefined)}
        >
          <MaterialIcon name="dashboard" /> Dashboard
        </NavLink>
        <NavLink 
          to="/catalog" 
          className="nav-link"
          style={({ isActive }) => (isActive ? activeStyle : undefined)}
        >
          <MaterialIcon name="pets" /> Catalog
        </NavLink>
        <NavLink 
          to="/inventory" 
          className="nav-link"
          style={({ isActive }) => (isActive ? activeStyle : undefined)}
        >
          <MaterialIcon name="inventory_2" /> Inventory
        </NavLink>
      </nav>
    </aside>
  );
}
export default MainNavigationSidebar;