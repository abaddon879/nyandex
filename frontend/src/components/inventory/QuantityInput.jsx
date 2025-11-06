import React, { useState, useEffect, useCallback } from 'react';
import { userTrackerService } from '../../api/userTrackerService';
import { authStore } from '../../stores/authStore';

// Custom hook to "debounce" the input
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

/**
 * Implements Spec 4.2 / 8.5: An auto-saving input field.
 */
function QuantityInput({ userId, itemId, initialQuantity }) {
  const [quantity, setQuantity] = useState(initialQuantity);
  const [isSaving, setIsSaving] = useState(false);
  // Debounce the quantity for 750ms
  const debouncedQuantity = useDebounce(quantity, 750);

  // This effect runs only when the *debounced* quantity changes
  useEffect(() => {
    // Don't save on the initial render
    if (debouncedQuantity === initialQuantity) return;

    async function saveQuantity() {
      setIsSaving(true);
      try {
        await userTrackerService.updateItemQuantity(userId, itemId, debouncedQuantity);
        // We'd show a success toast here
      } catch (err) {
        console.error("Failed to save item:", err);
      } finally {
        setIsSaving(false);
      }
    }
    
    saveQuantity();
  }, [debouncedQuantity, userId, itemId, initialQuantity]);

  const handleIncrement = (amount) => {
    setQuantity(prev => Math.max(0, parseInt(prev, 10) + amount));
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      <button onClick={() => handleIncrement(-1)} disabled={isSaving}>-</button>
      <input
        type="number"
        value={quantity}
        onChange={(e) => setQuantity(e.target.value)}
        disabled={isSaving}
        style={{ width: '80px', textAlign: 'center' }}
      />
      <button onClick={() => handleIncrement(1)} disabled={isSaving}>+</button>
      {isSaving && <span style={{ fontSize: '0.8rem' }}>Saving...</span>}
    </div>
  );
}

export default QuantityInput;