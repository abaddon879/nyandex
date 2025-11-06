import React from 'react';

function BaseButton({ children, variant = 'primary', onClick, disabled, className = '', ...props }) {
    
  // Combine the base class, the variant class, and any extra classes
  const classes = `btn btn-${variant} ${className}`;

  return (
    <button 
      className={classes}
      onClick={onClick} 
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}

export default BaseButton;