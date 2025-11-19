import React from 'react';
import { Link, useMatches } from 'react-router-dom';
import AccountDropdown from './AccountDropdown.jsx';

function SubtleTopHeaderBar({ onToggleMenu }) {
  // 1. Dynamic Title Logic
  const matches = useMatches();
  // Find the deepest match that has a 'handle.title' defined
  const currentMatch = matches.findLast((m) => m.handle?.title);
  const pageTitle = currentMatch?.handle?.title || 'NyanDex';

  return (
    <header className="top-header-bar">
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {/* 2. Mobile Hamburger Button (Visible only on mobile via CSS) */}
        <button 
            className="hamburger-btn" 
            onClick={onToggleMenu}
            aria-label="Toggle Menu"
        >
            ☰
        </button>
        
        <h1 style={{ margin: 0, fontSize: '1.25rem' }}>{pageTitle}</h1>
      </div>
      
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <Link to="/help" style={{ textDecoration: 'none', color: 'var(--color-text-secondary)' }}>
            [?] Help
        </Link>
        <AccountDropdown />
      </div>
    </header>
  );
}

export default SubtleTopHeaderBar;