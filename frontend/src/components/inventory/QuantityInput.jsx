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

  return (
    <div className={`quantity-input-wrapper ${wide ? 'wide' : ''} ${isSaving ? 'saving' : ''}`}>
      <button 
        onClick={() => handleDelta(-1)} 
        disabled={isSaving}
        className="quantity-btn minus"
      >-</button>
      
      <input
        type="number"
        value={quantity}
        onChange={(e) => setQuantity(Math.max(0, parseInt(e.target.value) || 0))}
        disabled={isSaving}
        className="quantity-field"
      />
      
      <button 
        onClick={() => handleDelta(1)} 
        disabled={isSaving}
        className="quantity-btn plus"
      >+</button>
    </div>
  );
}

export default QuantityInput;