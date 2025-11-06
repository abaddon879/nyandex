import React, { useState, useEffect } from 'react';
import { AppRouter } from './router.jsx'; // Import the router
import { authStore } from './stores/authStore.js'; // Import the store

/**
 * This is the root component.
 * Its ONLY job is to initialize authentication
 * and then render the application.
 */
function App() {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // This is the "Guest-First" entry point
    async function initialize() {
      console.log("App mounting... initializing auth.");
      await authStore.initialize();
      console.log("Auth initialized. Rendering app.");
      setIsInitialized(true);
    }
    initialize();
  }, []); // Runs once on app load

  if (!isInitialized) {
    // Show a global loading screen while we get the API key
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'sans-serif' }}>
        <h1>Loading NyanDex...</h1>
      </div>
    );
  }

  // Once initialized, render the router, which renders AppShell
  return <AppRouter />;
}

export default App;