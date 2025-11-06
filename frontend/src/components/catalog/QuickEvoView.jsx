import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { catService } from '../../api/catService';
import { userTrackerService } from '../../api/userTrackerService';
import { authStore } from '../../stores/authStore';
import BaseButton from '../base/BaseButton.jsx';
import './QuickEvoView.css'; // <-- Imports the CSS

const IMAGE_BASE_URL = import.meta.env.VITE_IMAGE_BASE_URL || '';

// Placeholder - we still need the real formulas
const StatCalculator = {
  getFinalStats: (stats, level, plus) => {
    if (!stats) return { health: 1, attack_power: 1, dps: 1 };
    const totalLevel = level + plus;
    const calculatedHealth = (stats.health * (1 + totalLevel * 0.1)); // Pure placeholder logic
    const calculatedAttack = (stats.attack_power * (1 + totalLevel * 0.1)); // Pure placeholder logic
    return {
        health: Math.floor(calculatedHealth),
        attack_power: Math.floor(calculatedAttack),
        dps: Math.round(calculatedAttack / (stats.attack_frequency_f / 30)) || 0
    };
  }
};

function QuickEvoView({ catId, userMap }) {
  const { userId } = authStore.getState();

  const [staticData, setStaticData] = useState(null);
  const [inventoryMap, setInventoryMap] = useState(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const userProgress = useMemo(() => userMap.get(catId) || null, [catId, userMap]);

  const [level, setLevel] = useState(userProgress?.level || 1);
  const [plusLevel, setPlusLevel] = useState(userProgress?.plus_level || 0);
  const [formId, setFormId] = useState(userProgress?.form_id || null);
  const [isPinned, setIsPinned] = useState(false);

  // --- Data Fetching ---
  const fetchData = useCallback(async () => {
    if (!catId || !userId) {
      setStaticData(null);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const [catDetails, inventory] = await Promise.all([
        catService.getCatDetails(catId),
        userTrackerService.getUserInventory(userId)
      ]);
      
      const invMap = new Map();
      inventory.forEach(item => invMap.set(item.item_id, item.item_quantity));
      
      setStaticData(catDetails);
      setInventoryMap(invMap);

      const currentProgress = userMap.get(catId) || {};
      setLevel(currentProgress.level || 1);
      setPlusLevel(currentProgress.plus_level || 0);
      
      const firstFormId = catDetails.forms[0]?.form_id;
      const savedFormIsValid = catDetails.forms.some(f => f.form_id === currentProgress.form_id);
      setFormId(savedFormIsValid ? currentProgress.form_id : firstFormId);
      
      try {
        const userCat = await userTrackerService.getSingleCatProgress(userId, catId);
        setIsPinned(userCat.is_pinned || false);
      } catch (userError) {
        setIsPinned(false);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [catId, userId, userMap]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);
  
  const handleSaveProgress = async () => { /* ... (implementation) ... */ };
  const handleTogglePin = async () => { /* ... (implementation) ... */ };
  
  const currentForm = useMemo(() => {
    if (!staticData) return null;
    return staticData.forms.find(f => f.form_id === formId);
  }, [staticData, formId]);

  const nextForm = useMemo(() => {
    if (!staticData) return null;
    const currentIndex = staticData.forms.findIndex(f => f.form_id === formId);
    return staticData.forms[currentIndex + 1] || null;
  }, [staticData, formId]);

  const calculatedStats = useMemo(() => {
    if (!currentForm) return null;
    return StatCalculator.getFinalStats(
      currentForm.stats, 
      level, 
      plusLevel, 
      staticData.boostable
    );
  }, [currentForm, level, plusLevel, staticData]);


  if (!catId) {
    return (
      <div className="quick-evo-view" style={{ textAlign: 'center' }}>
        <p className="text-secondary" style={{ paddingTop: '2rem' }}>[Icon] Select a cat to view its evolution and progress.</p>
      </div>
    );
  }

  if (isLoading) return <div className="quick-evo-view">Loading...</div>;
  if (error) return <div className="quick-evo-view" style={{ color: 'red' }}>Error: {error}</div>;
  if (!currentForm) return <div className="quick-evo-view">Error: Cat form data not found.</div>;

  return (
    <aside className="quick-evo-view">
      
      {/* 1. User Progress Card (Spec 7.6) */}
      <div className="quick-evo-card">
        <div className="quick-evo-header">
          <h3 className="quick-evo-title">{currentForm.form_name}</h3>
          <BaseButton onClick={handleTogglePin} variant="secondary">
            {isPinned ? '[📌]' : '[Track]'}
          </BaseButton>
        </div>
        <div className="quick-evo-body">
          <p className="text-secondary" style={{ marginTop: 0 }}>ID: #{staticData.cat_id}</p>

          <div className="input-group">
            <div className="input-group-item">
              <label>Level</label>
              <input 
                className="form-input" 
                type="number" 
                value={level} 
                onChange={(e) => setLevel(parseInt(e.target.value) || 1)} 
              />
            </div>
            <div className="input-group-item">
              <label>+Level</label>
              <input 
                className="form-input" 
                type="number" 
                value={plusLevel} 
                onChange={(e) => setPlusLevel(parseInt(e.target.value) || 0)} 
              />
            </div>
          </div>
          
          {/* This is the Evolution Tree (Spec 7.6) */}
          <div className="form-icon-group">
            {staticData.forms.map((form, index) => (
              <React.Fragment key={form.form_id}>
                {/* Add a connector (>) before every icon except the first one */}
                {index > 0 && <span className="form-icon-connector">{'>'}</span>}
                
                <div className="form-icon-item">
                  <button
                    onClick={() => setFormId(form.form_id)}
                    className={`form-icon-btn ${form.form_id === formId ? 'is-active' : ''}`}
                    title={form.form_name}
                  >
                    <img src={IMAGE_BASE_URL + form.image_url} alt={form.form_name} loading="lazy" />
                  </button>
                  {/* This line renders the "Normal", "Evolved", "True" text */}
                  <span className="form-icon-name">{form.generic_form_name}</span>
                </div>
              </React.Fragment>
            ))}
          </div>
          
          <BaseButton onClick={handleSaveProgress} variant="primary" style={{ width: '100%', marginTop: '1rem' }}>
            Save Progress
          </BaseButton>
        </div>
      </div>
      
      {/* 2. Evolution Requirements Card (Spec 7.6) */}
      {nextForm ? (
        <div className="quick-evo-card">
          <div className="quick-evo-header">
            <h3 className="quick-evo-title">Evolve to {nextForm.form_name}</h3>
          </div>
          <div className="quick-evo-body requirements-list">
            <p className="requirement-item">
              Requires Level: {nextForm.evolution.required_level}
            </p>
            <p className="requirement-item">
              Requires XP: {nextForm.evolution.required_xp.toLocaleString()}
            </p>
            
            {nextForm.evolution.requirements.map(req => {
              const userQty = inventoryMap.get(req.item_id) || 0;
              const isComplete = userQty >= req.item_qty;
              
              return (
                <div key={req.item_id} className={`requirement-item ${isComplete ? 'is-complete' : 'is-missing'}`}>
                  [Icon] {req.item_id}: {userQty} / {req.item_qty}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
         <div className="quick-evo-card">
          <div className="quick-evo-body requirements-list">
            <p className="text-secondary">This is the final form.</p>
          </div>
        </div>
      )}
      
      {/* 3. Calculated Stats Card (Spec 7.6) */}
      {calculatedStats && (
        <div className="quick-evo-card">
          <div className="quick-evo-header">
            <h3 className="quick-evo-title">Calculated Stats (Lvl {level}+{plusLevel})</h3>
          </div>
          <div className="quick-evo-body">
            <p>Health: {calculatedStats.health.toLocaleString()}</p>
            <p>Attack: {calculatedStats.attack_power.toLocaleString()}</p>
            <p>DPS: {calculatedStats.dps.toLocaleString()}</p>
          </div>
        </div>
      )}
      
    </aside>
  );
}

export default QuickEvoView;