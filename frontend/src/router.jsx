import React from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import AppShell from './layout/AppShell';
import DashboardPage from './pages/DashboardPage';
import CatalogPage from './pages/CatalogPage';
import CatDetailPage from './pages/CatDetailPage';
import AccountPage from './pages/AccountPage';
import InventoryPage from './pages/InventoryPage.jsx';

// Define all routes as children of the AppShell
const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    // These components will be rendered inside AppShell's <Outlet />
    children: [
      {
        index: true, // Default page (matches '/')
        element: <DashboardPage />,
        title: 'Dashboard'
      },
      {
        path: 'dashboard',
        element: <DashboardPage />,
        title: 'Dashboard'
      },
      {
        path: 'catalog',
        element: <CatalogPage />,
        title: 'Cat Catalog'
      },
      {
        path: 'detail/:id',
        element: <CatDetailPage />,
        title: 'Unit Details'
      },
      {
        path: 'inventory',
        element: <InventoryPage />,
        title: 'Inventory'
      },
      {
        path: 'account',
        element: <AccountPage />,
        title: 'My Account'
      },
    ],
  },
]);

// A simple component to export the router provider
export function AppRouter() {
  return <RouterProvider router={router} />;
}