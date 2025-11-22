import React, { useState, useEffect } from 'react';
import { userTrackerService } from '../../api/userTrackerService';

function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

function QuantityInput({ userId, itemId, initialQuantity, wide = false }) {
  const [quantity, setQuantity] = useState(initialQuantity);
  const [isSaving, setIsSaving] = useState(false);
  const debouncedQuantity = useDebounce(quantity, 750);

  useEffect(() => {
    if (debouncedQuantity === initialQuantity) return;

    async function save() {
      setIsSaving(true);
      try {
        await userTrackerService.updateItemQuantity(userId, itemId, debouncedQuantity);
      } catch (err) {
        console.error("Save failed", err);
      } finally {
        setIsSaving(false);
      }
    }
    save();
  }, [debouncedQuantity, userId, itemId, initialQuantity]);

  const handleDelta = (delta) => {
    setQuantity(prev => Math.max(0, parseInt(prev, 10) + delta));
  };

  const btnStyle = {
    border: 'none', 
    background: '#f8fafc', 
    width: '24px', // Reduced from 30px
    height: '100%', 
    cursor: 'pointer', 
    fontWeight:'bold', 
    color:'#64748b',
    display:'flex', 
    alignItems:'center', 
    justifyContent:'center', 
    fontSize:'0.9rem',
    transition: 'background 0.1s',
    padding: 0
  };

  return (
    <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        border: '1px solid #e2e8f0', 
        borderRadius: '6px',
        overflow: 'hidden',
        backgroundColor: '#fff',
        height: '30px', // Slightly shorter height
        width: wide ? '100%' : '90px', // Reduced from 110px
        maxWidth: '100%',
        boxSizing: 'border-box'
    }}>
      <button 
        onClick={() => handleDelta(-1)} 
        disabled={isSaving}
        style={{...btnStyle, borderRight: '1px solid #e2e8f0'}}
      >-</button>
      
      <input
        type="number"
        value={quantity}
        onChange={(e) => setQuantity(Math.max(0, parseInt(e.target.value) || 0))}
        disabled={isSaving}
        style={{ 
            flex: 1, 
            textAlign: 'center', 
            border: 'none', 
            outline: 'none', 
            fontWeight: '600', 
            color: '#334155', 
            fontSize: '0.85rem',
            mozAppearance: 'textfield',
            background: isSaving ? '#fffbeb' : 'transparent',
            minWidth: 0,
            padding: 0
        }}
      />
      
      <button 
        onClick={() => handleDelta(1)} 
        disabled={isSaving}
        style={{...btnStyle, borderLeft: '1px solid #e2e8f0'}}
      >+</button>
    </div>
  );
}

export default QuantityInput;