import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { authStore } from '../stores/authStore';
import BaseButton from '../components/base/BaseButton.jsx';
import LoginModal from '../components/auth/LoginModal.jsx'; // <-- Import the modal

function AccountDropdown() {
  // --- Local State ---
  const [isOpen, setIsOpen] = useState(false); // Dropdown visibility
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false); // Modal visibility
  
  // --- Global Auth State ---
  const [authState, setAuthState] = useState(authStore.getState());
  useEffect(() => {
    // Subscribe to the authStore
    const unsubscribe = authStore.subscribe(setAuthState);
    return unsubscribe; // Cleanup subscription on unmount
  }, []);

  const { isAuthenticated, isAnonymous, username } = authState;

  const handleLogout = async () => {
    await authStore.logout();
    setIsOpen(false);
  };

  const openLogin = (e) => {
    e.preventDefault();
    setIsOpen(false); // Close dropdown
    setIsLoginModalOpen(true); // Open modal
  };
  
  const linkStyle = { 
    textDecoration: 'none', 
    display: 'block', 
    padding: '8px 16px', 
    color: 'black',
    cursor: 'pointer'
  };

  let dropdownContent;
  if (isAuthenticated && !isAnonymous) {
    // --- Registered User View (Spec 3.4) ---
    dropdownContent = (
      <>
        <div style={{ padding: '8px 16px', color: '#6C757D' }}>
          Logged in as <strong>{username}</strong>
        </div>
        <Link to="/account" onClick={() => setIsOpen(false)} style={linkStyle}>My Account</Link>
        <a onClick={handleLogout} style={linkStyle}>Logout</a>
      </>
    );
  } else {
    // --- Anonymous/Guest User View (Spec 3.4) ---
    dropdownContent = (
      <>
        <Link to="/account" onClick={() => setIsOpen(false)} style={linkStyle}>Create Account</Link>
        <a onClick={openLogin} style={linkStyle}>Login</a>
      </>
    );
  }

  // Basic dropdown styling
  const dropdownStyle = {
    position: 'absolute', background: 'white', border: '1px solid #eee', 
    borderRadius: '6px', top: '50px', right: '10px', width: '200px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)', zIndex: 50
  };

  return (
    <>
      {/* 1. The Account Icon Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem' }}
      >
        [👤 Account]
      </button>

      {/* 2. The Dropdown Menu (conditional) */}
      {isOpen && (
        <div style={dropdownStyle}>
          {dropdownContent}
        </div>
      )}
      
      {/* 3. The Login Modal (rendered hidden) */}
      <LoginModal 
        isOpen={isLoginModalOpen} 
        onClose={() => setIsLoginModalOpen(false)} 
      />
    </>
  );
}

export default AccountDropdown;