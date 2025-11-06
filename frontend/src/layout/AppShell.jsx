import React from 'react';
import { Outlet } from 'react-router-dom';
import MainNavigationSidebar from './MainNavigationSidebar.jsx';
import SubtleTopHeaderBar from './SubtleTopHeaderBar.jsx';

function AppShell() {
  return (
    <div className="app-shell">
      <MainNavigationSidebar />
      <main className="main-content">
        <SubtleTopHeaderBar />
        <div className="page-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

export default AppShell;