import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import BaseButton from '../base/BaseButton.jsx';

function UpgradeCTABanner() {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <div style={{
      backgroundColor: '#fff3cd', 
      border: '1px solid #ffeeba', 
      color: '#856404',
      padding: '1rem', 
      borderRadius: '6px', 
      marginBottom: '1.5rem',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: '1rem'
    }}>
      <div>
        <strong>Secure your account!</strong> Your data is only saved on this device. {' '}
        <Link to="/account" style={{ color: '#856404', textDecoration: 'underline', fontWeight: 'bold' }}>
          Create an Account
        </Link>
        {' '} to back up your progress and sync across all devices.
      </div>
      
      <BaseButton 
        variant="secondary" 
        onClick={() => setIsVisible(false)}
        style={{ minWidth: '40px', padding: '0.25rem 0.5rem' }}
        aria-label="Close Banner"
      >
        ✕
      </BaseButton>
    </div>
  );
}

export default UpgradeCTABanner;