import React, { useState } from 'react';
import { userTrackerService } from '../../api/userTrackerService';
import BaseButton from '../base/BaseButton';

/**
 * Implements Spec 7.7: The sticky footer for Bulk Edit Mode.
 */
function BulkActionFooter({ userId, selectedBulkIds, onComplete }) {
  // Local state to manage loading/disabling buttons during an update
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Local state for the level/plus level inputs
  const [levelInput, setLevelInput] = useState('1');
  const [plusLevelInput, setPlusLevelInput] = useState('0');

  // --- Action Handlers ---

  /**
   * A generic function to call the bulk update API with a specific action.
   */
  const handleBulkUpdate = async (actionPayload) => {
    if (selectedBulkIds.length === 0) {
      alert("Please select some cats first.");
      return;
    }
    
    setIsUpdating(true);
    try {
      // Call the API with the constructed action
      await userTrackerService.bulkUpdateCats(userId, [actionPayload]);
      
      // On success, call the onComplete prop to refresh parent data
      onComplete(); 
    } catch (err) {
      console.error("Bulk update failed:", err);
      alert(`Bulk update failed: ${err.message}`);
    } finally {
      setIsUpdating(false);
    }
  };

  // --- Specific Button Click Handlers ---

  const handleMarkAsOwned = () => {
    handleBulkUpdate({
      action: "set_owned",
      cat_ids: selectedBulkIds
    });
  };

  const handleApplyLevels = () => {
    handleBulkUpdate({
      action: "set_level",
      cat_ids: selectedBulkIds,
      level: parseInt(levelInput, 10) || 1,
      plus_level: parseInt(plusLevelInput, 10) || 0
    });
  };
  
  // (You would add similar handlers for "set_form" or "mark_as_missing")

  return (
    <footer style={{
      padding: '1rem',
      borderTop: '1px solid #eee',
      background: '#fff',
      position: 'sticky',
      bottom: 0,
      display: 'flex',
      alignItems: 'center',
      gap: '1rem',
      flexWrap: 'wrap'
    }}>
      
      {/* 1. Selection Info */}
      <div style={{ fontWeight: 'bold' }}>
        {selectedBulkIds.length} cat(s) selected
      </div>

      {/* 2. Selection Controls (Placeholder) */}
      <div>
        <BaseButton variant="secondary" disabled={isUpdating}>Select All</BaseButton>
        <BaseButton variant="secondary" disabled={isUpdating}>Deselect All</BaseButton>
      </div>
      
      {/* 3. Ownership Actions (Spec 7.7) */}
      <div>
        <BaseButton variant="primary" onClick={handleMarkAsOwned} disabled={isUpdating}>
          Mark as Owned
        </BaseButton>
        {/* <BaseButton variant="secondary" ...>Mark as Missing</BaseButton> */}
      </div>

      {/* 4. Level Actions (Spec 7.7) */}
      <div style={{ borderLeft: '1px solid #eee', paddingLeft: '1rem' }}>
        <label>Set Level:</label>
        <input 
          type="number" 
          value={levelInput} 
          onChange={(e) => setLevelInput(e.target.value)} 
          style={{ width: '60px', marginRight: '0.5rem' }}
          disabled={isUpdating}
        />
        <label>+Level:</label>
        <input 
          type="number" 
          value={plusLevelInput} 
          onChange={(e) => setPlusLevelInput(e.target.value)} 
          style={{ width: '60px', marginRight: '0.5rem' }}
          disabled={isUpdating}
        />
        <BaseButton variant="secondary" onClick={handleApplyLevels} disabled={isUpdating}>
          Apply Levels
        </BaseButton>
      </div>

      {/* 5. Loading Indicator */}
      {isUpdating && <div style={{ marginLeft: 'auto' }}>Updating...</div>}

    </footer>
  );
}

export default BulkActionFooter;