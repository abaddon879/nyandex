import React from 'react';
import { Link, useMatches, useLocation } from 'react-router-dom';
import AccountDropdown from './AccountDropdown.jsx';

function SubtleTopHeaderBar({ onToggleMenu, searchTerm, onSearchChange }) {
  const matches = useMatches();
  const location = useLocation();
  const currentMatch = matches.findLast((m) => m.handle?.title);
  const pageTitle = currentMatch?.handle?.title || 'NyanDex';

  // Define which routes show the global search bar
  const showSearch = ['/inventory', '/help'].includes(location.pathname);

  return (
    <header className="top-header-bar">
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
        <button 
            className="hamburger-btn" 
            onClick={onToggleMenu}
            aria-label="Toggle Menu"
        >
            ☰
        </button>
        
        <h1 style={{ margin: 0, fontSize: '1.25rem', whiteSpace:'nowrap' }}>{pageTitle}</h1>

        {/* Global Search Input */}
        {showSearch && (
            <div style={{ marginLeft: '2rem', flex: 1, maxWidth: '400px' }}>
                <input 
                    type="text"
                    placeholder={`Search ${pageTitle}...`}
                    value={searchTerm}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="form-input"
                    style={{ width: '100%', padding: '8px 12px', fontSize: '0.9rem' }}
                />
            </div>
        )}
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