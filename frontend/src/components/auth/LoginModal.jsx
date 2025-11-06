import React, { useState } from 'react';
import { authStore } from '../../stores/authStore';
import BaseButton from '../base/BaseButton.jsx';

// 'isOpen' and 'onClose' are props managed by the parent (the Header)
function LoginModal({ isOpen, onClose }) {
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    
    const result = await authStore.login(usernameOrEmail, password);
    
    if (result.success) {
      onClose(); // Close the modal on successful login
    } else {
      setError(result.error);
    }
  };

  if (!isOpen) {
    return null; // Don't render anything if the modal is closed
  }

  // Basic modal styling
  const modalStyle = {
    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
    backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex',
    alignItems: 'center', justifyContent: 'center', zIndex: 1000
  };
  const contentStyle = {
    background: 'white', padding: '2rem', borderRadius: '6px', width: '300px'
  };

  return (
    <div style={modalStyle} onClick={onClose}>
      <div style={contentStyle} onClick={(e) => e.stopPropagation()}>
        <h3>Login</h3>
        <form onSubmit={handleSubmit}>
          {error && <p style={{ color: 'red' }}>{error}</p>}
          <div style={{ marginBottom: '1rem' }}>
            <label>Username or Email</label>
            <input 
              type="text" 
              value={usernameOrEmail}
              onChange={(e) => setUsernameOrEmail(e.target.value)}
              style={{ width: '95%', padding: '0.5rem' }}
            />
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label>Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ width: '95%', padding: '0.5rem' }}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <BaseButton type="button" variant="secondary" onClick={onClose}>Cancel</BaseButton>
            <BaseButton type="submit" variant="primary">Login</BaseButton>
          </div>
        </form>
      </div>
    </div>
  );
}

export default LoginModal;