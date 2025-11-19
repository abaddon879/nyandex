import React, { useState } from 'react';
import { userTrackerService } from '../../api/userTrackerService';
import BaseButton from '../base/BaseButton';

/**
 * Implements Spec 7.7: The sticky footer for Bulk Edit Mode.
 */
function BulkActionFooter({ userId, selectedBulkIds, onComplete }) {
  const [isUpdating, setIsUpdating] = useState(false);
  
  const [levelInput, setLevelInput] = useState('1');
  const [plusLevelInput, setPlusLevelInput] = useState('0');
  const [formInput, setFormInput] = useState('1'); // Default to Normal form

  const handleBulkUpdate = async (actionPayload) => {
    if (selectedBulkIds.length === 0) {
      alert("Please select some cats first.");
      return;
    }
    
    setIsUpdating(true);
    try {
      await userTrackerService.bulkUpdateCats(userId, [actionPayload]);
      onComplete(); 
    } catch (err) {
      console.error("Bulk update failed:", err);
      alert(`Bulk update failed: ${err.message}`);
    } finally {
      setIsUpdating(false);
    }
  };

  // --- 1. Ownership Actions ---

  const handleMarkAsOwned = () => {
    if (!confirm(`Mark ${selectedBulkIds.length} cats as OWNED?`)) return;
    handleBulkUpdate({
      action: "set_owned",
      cat_ids: selectedBulkIds
    });
  };

  // [UPDATED] Mark as Missing (Spec 7.7)
  // Now uses the efficient backend logic we added to UserCatRepository
  const handleMarkAsMissing = () => {
    if (!confirm(`Mark ${selectedBulkIds.length} cats as MISSING? This will delete your progress for them.`)) return;
    
    handleBulkUpdate({
      action: "set_missing",
      cat_ids: selectedBulkIds
    });
  };

  // --- 2. Level Actions ---

  const handleApplyLevels = () => {
    handleBulkUpdate({
      action: "set_level",
      cat_ids: selectedBulkIds,
      level: parseInt(levelInput, 10) || 1,
      plus_level: parseInt(plusLevelInput, 10) || 0
    });
  };
  
  // --- 3. Form Actions ---
  const handleApplyForm = () => {
    handleBulkUpdate({
      action: "set_form",
      cat_ids: selectedBulkIds,
      form_id: parseInt(formInput, 10)
    });
  };

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
      flexWrap: 'wrap',
      boxShadow: '0 -2px 10px rgba(0,0,0,0.05)'
    }}>
      
      <div style={{ fontWeight: 'bold', minWidth: '120px' }}>
        {selectedBulkIds.length} cat(s)
      </div>

      {/* Ownership */}
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <BaseButton variant="primary" onClick={handleMarkAsOwned} disabled={isUpdating}>
          Mark Owned
        </BaseButton>
        
        {/* [FIXED] Connected onClick to handleMarkAsMissing */}
        <BaseButton variant="destructive" onClick={handleMarkAsMissing} disabled={isUpdating}>
          Mark Missing
        </BaseButton>
      </div>

      <div style={{ width: '1px', height: '30px', background: '#eee' }}></div>

      {/* Levels */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
             <div style={{ fontSize: '0.7rem', color: '#666' }}>Lvl</div>
             <input 
              type="number" 
              value={levelInput} 
              onChange={(e) => setLevelInput(e.target.value)} 
              style={{ width: '45px', padding: '4px' }}
              disabled={isUpdating}
            />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
             <div style={{ fontSize: '0.7rem', color: '#666' }}>+</div>
             <input 
              type="number" 
              value={plusLevelInput} 
              onChange={(e) => setPlusLevelInput(e.target.value)} 
              style={{ width: '45px', padding: '4px' }}
              disabled={isUpdating}
            />
        </div>
        <BaseButton variant="secondary" onClick={handleApplyLevels} disabled={isUpdating}>
          Set
        </BaseButton>
      </div>

      <div style={{ width: '1px', height: '30px', background: '#eee' }}></div>

      {/* Forms */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
         <select 
             className="form-select"
             value={formInput} 
             onChange={(e) => setFormInput(e.target.value)}
             disabled={isUpdating}
             style={{ padding: '6px' }}
         >
             <option value="1">Normal</option>
             <option value="2">Evolved</option>
             <option value="3">True</option>
             <option value="4">Ultra</option>
         </select>
         <BaseButton variant="secondary" onClick={handleApplyForm} disabled={isUpdating}>
          Set Form
        </BaseButton>
      </div>

      {isUpdating && <div style={{ marginLeft: 'auto', color: 'var(--color-accent-primary)' }}>Updating...</div>}

    </footer>
  );
}

export default BulkActionFooter;