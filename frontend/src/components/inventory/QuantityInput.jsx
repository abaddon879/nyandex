import React, { useState, useEffect } from 'react';
import { userTrackerService } from '../../api/userTrackerService';

// Hook for debouncing (prevents API spam)
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

function QuantityInput({ userId, itemId, initialQuantity }) {
  const [quantity, setQuantity] = useState(initialQuantity);
  const [isSaving, setIsSaving] = useState(false);
  const debouncedQuantity = useDebounce(quantity, 750);

  useEffect(() => {
    if (debouncedQuantity === initialQuantity) return; // Skip initial load

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

  return (
    <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        border: '1px solid #cbd5e1', 
        borderRadius: '6px',
        overflow: 'hidden',
        backgroundColor: '#fff',
        height: '36px'
    }}>
      <button 
        onClick={() => handleDelta(-1)} 
        disabled={isSaving}
        style={{
            border: 'none', background: '#f8fafc', width: '36px', height: '100%', 
            cursor: 'pointer', borderRight: '1px solid #cbd5e1', fontWeight:'bold', color:'#475569',
            display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.1rem'
        }}
      >-</button>
      
      <input
        type="number"
        value={quantity}
        onChange={(e) => setQuantity(Math.max(0, parseInt(e.target.value) || 0))}
        disabled={isSaving}
        style={{ 
            width: '60px', textAlign: 'center', border: 'none', outline: 'none', 
            fontWeight: '600', color: '#334155', fontSize: '1rem',
            mozAppearance: 'textfield' 
        }}
      />
      
      <button 
        onClick={() => handleDelta(1)} 
        disabled={isSaving}
        style={{
            border: 'none', background: '#f8fafc', width: '36px', height: '100%', 
            cursor: 'pointer', borderLeft: '1px solid #cbd5e1', fontWeight:'bold', color:'#475569',
            display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.1rem'
        }}
      >+</button>
    </div>
  );
}

export default QuantityInput;