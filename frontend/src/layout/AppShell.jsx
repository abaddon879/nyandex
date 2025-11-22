import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import MainNavigationSidebar from './MainNavigationSidebar.jsx';
import SubtleTopHeaderBar from './SubtleTopHeaderBar.jsx';

function AppShell() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // --- Global Search State ---
  const [searchTerm, setSearchTerm] = useState('');
  const location = useLocation();

  // Automatically clear search when navigating to a new page
  useEffect(() => {
    setSearchTerm('');
  }, [location.pathname]);

  return (
    <div className="app-shell">
      
      <div className={`sidebar-wrapper ${isMobileMenuOpen ? 'mobile-visible' : ''}`}>
        <MainNavigationSidebar onNavigate={() => setIsMobileMenuOpen(false)} />
      </div>

      {isMobileMenuOpen && (
        <div 
          className="mobile-overlay"
          onClick={() => setIsMobileMenuOpen(false)}
        ></div>
      )}

      <main className="main-content">
        <SubtleTopHeaderBar 
            onToggleMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
        />
        <div className="page-content">
          {/* Pass the search state down to the active page */}
          <Outlet context={{ searchTerm }} />
        </div>
      </main>
    </div>
  );
}

export default AppShell;