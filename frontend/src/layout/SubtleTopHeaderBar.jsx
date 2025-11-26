import React from 'react';
import { Link, useMatches, useLocation } from 'react-router-dom';
import AccountDropdown from './AccountDropdown.jsx';

const MaterialIcon = ({ name }) => (
    <span className="material-symbols-outlined" style={{ fontSize: '1.5rem', color: '#64748b' }}>
        {name}
    </span>
);

function SubtleTopHeaderBar({ onToggleMenu, searchTerm, onSearchChange }) {
  const matches = useMatches();
  const location = useLocation();
  const currentMatch = matches.findLast((m) => m.handle?.title);
  const pageTitle = currentMatch?.handle?.title || 'NyanDex';
  const showSearch = ['/inventory', '/help', '/catalog'].includes(location.pathname);

  return (
    <header className="top-header-bar" style={{ 
        height: '64px', /* Match Sidebar Brand height exactly */
        backgroundColor: '#ffffff', 
        borderBottom: '1px solid var(--color-border)', /* Restore line alignment */
        padding: '0 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
    }}>
      {/* Left: Toggle & Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
        <button className="hamburger-btn" onClick={onToggleMenu}>
            <MaterialIcon name="menu" />
        </button>
        
        <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '700', color: '#1e293b' }}>
            {pageTitle}
        </h2>

        {/* Search Bar */}
        {showSearch && (
            <div style={{ marginLeft: '32px', width: '100%', maxWidth: '400px' }}>
                <input 
                    type="text"
                    placeholder={`Search ${pageTitle}...`}
                    value={searchTerm}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="form-input"
                    style={{ 
                        backgroundColor: '#f8fafc', 
                        border: '1px solid #e2e8f0', 
                        padding: '8px 16px',
                        borderRadius: '6px',
                        width: '100%',
                        fontSize: '0.9rem'
                    }}
                />
            </div>
        )}
      </div>
      
      {/* Right: Actions */}
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <Link to="/help" title="Help">
          <MaterialIcon name="help" />
        </Link>
        <div style={{ width: '1px', height: '24px', background: '#e2e8f0' }}></div>
        <AccountDropdown />
      </div>
    </header>
  );
}

export default SubtleTopHeaderBar;