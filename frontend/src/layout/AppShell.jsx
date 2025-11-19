import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import MainNavigationSidebar from './MainNavigationSidebar.jsx';
import SubtleTopHeaderBar from './SubtleTopHeaderBar.jsx';

function AppShell() {
  // State to toggle sidebar on mobile
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="app-shell">
      
      {/* Sidebar: Hidden on mobile unless toggled */}
      <div className={`sidebar-wrapper ${isMobileMenuOpen ? 'mobile-visible' : ''}`}>
        <MainNavigationSidebar onNavigate={() => setIsMobileMenuOpen(false)} />
      </div>

      {/* Overlay for mobile when menu is open */}
      {isMobileMenuOpen && (
        <div 
          className="mobile-overlay"
          onClick={() => setIsMobileMenuOpen(false)}
        ></div>
      )}

      <main className="main-content">
        <SubtleTopHeaderBar onToggleMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)} />
        <div className="page-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

export default AppShell;