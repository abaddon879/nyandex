import React from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import AppShell from './layout/AppShell';
import DashboardPage from './pages/DashboardPage';
import CatalogPage from './pages/CatalogPage';
import CatDetailPage from './pages/CatDetailPage';
import AccountPage from './pages/AccountPage';
import InventoryPage from './pages/InventoryPage';
import HelpPage from './pages/HelpPage'; // [NEW]

const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      {
        index: true,
        element: <DashboardPage />,
        handle: { title: 'Dashboard' } // [NEW] Metadata for Header
      },
      {
        path: 'dashboard',
        element: <DashboardPage />,
        handle: { title: 'Dashboard' }
      },
      {
        path: 'catalog',
        element: <CatalogPage />,
        handle: { title: 'Cat Catalog' }
      },
      {
        path: 'detail/:id',
        element: <CatDetailPage />,
        handle: { title: 'Unit Details' }
      },
      {
        path: 'inventory',
        element: <InventoryPage />,
        handle: { title: 'Inventory' }
      },
      {
        path: 'account',
        element: <AccountPage />,
        handle: { title: 'My Account' }
      },
      {
        path: 'help', // [NEW]
        element: <HelpPage />,
        handle: { title: 'Help & FAQ' }
      },
    ],
  },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}