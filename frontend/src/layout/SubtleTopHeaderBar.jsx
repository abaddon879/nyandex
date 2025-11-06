import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import AccountDropdown from './AccountDropdown.jsx';

function SubtleTopHeaderBar() {
  // We'll add a better title solution later
  const pageTitle = "Dashboard"; 

  return (
    <header className="top-header-bar">
      {/* Mobile Hamburger (will be hidden by default) */}
      {/* <button className="hamburger-btn">[☰]</button> */}
      
      <h1 style={{ margin: 0, fontSize: '1.5rem' }}>{pageTitle}</h1>
      
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <Link to="/help">[?] Help</Link>
        <AccountDropdown />
      </div>
    </header>
  );
}
export default SubtleTopHeaderBar;