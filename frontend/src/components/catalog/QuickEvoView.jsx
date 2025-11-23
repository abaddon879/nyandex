import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { catService } from '../../api/catService';
import { userTrackerService } from '../../api/userTrackerService';
import { authStore } from '../../stores/authStore';
import BaseButton from '../base/BaseButton.jsx';
import './QuickEvoView.css';

const RAW_BASE_URL = import.meta.env.VITE_IMAGE_BASE_URL || '';
const BASE_URL = RAW_BASE_URL.replace(/\/$/, '');

const StatCalculator = {
  getFinalStats: (stats, level, plus) => {
    if (!stats) return { health: 1, attack_power: 1, dps: 1 };
    const totalLevel = level + plus;
    const calculatedHealth = (stats.health * (1 + (totalLevel - 1) * 0.2)); 
    const calculatedAttack = (stats.attack_power * (1 + (totalLevel - 1) * 0.2)); 
    return {
        health: Math.floor(calculatedHealth),
        attack_power: Math.floor(calculatedAttack),
        dps: Math.round(calculatedAttack / (stats.attack_frequency_f / 30)) || 0
    };
  }
};

function QuickEvoView({ catId, userMap, onDataChange }) {
  const { userId } = authStore.getState();

  const [staticData, setStaticData] = useState(null);
  const [inventoryMap, setInventoryMap] = useState(new Map());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const [level, setLevel] = useState(1);
  const [plusLevel, setPlusLevel] = useState(0);
  const [formId, setFormId] = useState(null);
  const [isPinned, setIsPinned] = useState(false);

  const fetchData = useCallback(async () => {
    if (catId === null || catId === undefined || !userId) {
      setStaticData(null);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      console.log(`[QuickEvoView] Fetching Cat ${catId}...`);
      const [catDetails, inventory, userCatProgress] = await Promise.all([
        catService.getCatDetails(catId),
        userTrackerService.getUserInventory(userId),
        userTrackerService.getSingleCatProgress(userId, catId).catch(() => null)
      ]);
      
      const invMap = new Map();
      inventory.forEach(item => invMap.set(item.item_id, item.item_quantity));
      
      setStaticData(catDetails);
      setInventoryMap(invMap);

      const defaultFormId = (catDetails.forms && catDetails.forms.length > 0) 
        ? catDetails.forms[0].form_id 
        : 1;

      if (userCatProgress && !userCatProgress.error) {
        setLevel(userCatProgress.level || 1);
        setPlusLevel(userCatProgress.plus_level || 0);
        setFormId(userCatProgress.form_id || defaultFormId);
        const pinnedVal = userCatProgress.is_pinned;
        setIsPinned(pinnedVal === true || Number(pinnedVal) === 1);
      } else {
        setLevel(1);
        setPlusLevel(0);
        setFormId(defaultFormId);
        setIsPinned(false);
      }

    } catch (err) {
      console.error(err);
      setError("Failed to load cat data.");
    } finally {
      setIsLoading(false);
    }
  }, [catId, userId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleFormClick = (form) => {
    setFormId(form.form_id);
    if (form.evolution && form.evolution.required_level) {
      const minLvl = form.evolution.required_level;
      if ((level + plusLevel) < minLvl) {
        setLevel(minLvl - plusLevel > 0 ? minLvl - plusLevel : 1);
      }
    }
  };

  const handleSaveProgress = async () => {
    if (!userId || (catId === null && catId !== 0)) return;
    setIsSaving(true);
    try {
      await userTrackerService.saveCatProgress(userId, catId, {
        level,
        plus_level: plusLevel,
        form_id: formId
      });
      if (onDataChange) onDataChange(); 
    } catch (err) {
      alert(`Save failed: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleTogglePin = async () => {
    if (!userId || (catId === null && catId !== 0)) return;
    try {
      if (isPinned) {
        await userTrackerService.unpinCat(userId, catId);
        setIsPinned(false);
      } else {
        await userTrackerService.pinCat(userId, catId);
        setIsPinned(true);
      }
      setIsPinned(!isPinned);
    } catch (err) {
      alert(`Failed to update pin: ${err.message}`);
    }
  };
  
  const currentForm = useMemo(() => {
    if (!staticData) return null;
    
    if (!staticData.forms || staticData.forms.length === 0) {
        return {
            form_id: 1,
            form_name: "Basic Form (No Data)",
            generic_form_name: "Normal",
            image_url: "", 
            stats: null
        };
    }

    const found = staticData.forms.find(f => f.form_id == formId);
    return found || staticData.forms[0];
  }, [staticData, formId]);

  const nextForm = useMemo(() => {
    if (!staticData || !staticData.forms || !currentForm) return null;
    const currentIndex = staticData.forms.findIndex(f => f.form_id === currentForm.form_id);
    if (currentIndex === -1) return null;
    return staticData.forms[currentIndex + 1] || null;
  }, [staticData, currentForm]);


  if (catId === null || catId === undefined) {
    return (
      <div className="quick-evo-view" style={{ textAlign: 'center', paddingTop: '4rem' }}>
        <div style={{ fontSize: '2rem', marginBottom: '1rem', color: 'var(--color-border)' }}>🐈</div>
        <p className="text-secondary">Select a cat to view its evolution and progress.</p>
      </div>
    );
  }

  if (isLoading) return <div className="quick-evo-view">Loading...</div>;
  if (error) return <div className="quick-evo-view" style={{ color: 'red' }}>{error}</div>;
  if (!staticData || !currentForm) return <div className="quick-evo-view">Data missing.</div>;

  const displayId = (staticData.cat_order_id !== undefined && staticData.cat_order_id !== null) 
    ? staticData.cat_order_id 
    : staticData.cat_id;

  const maxLevel = staticData.max_level || 50;
  const maxPlus = staticData.max_plus_level || 0;

  return (
    <aside className="quick-evo-view">
      <div className="quick-evo-card">
        <div className="quick-evo-header">
          <div>
             <h3 className="quick-evo-title">{currentForm.form_name}</h3>
             <span className="text-secondary" style={{ fontSize: '0.8rem' }}>
                ID: #{displayId}
             </span>
          </div>
          <BaseButton onClick={handleTogglePin} variant={isPinned ? "primary" : "secondary"} title="Track on Dashboard" style={{ padding: '4px 8px' }}>
            {isPinned ? '📌 Pinned' : '📌 Track'}
          </BaseButton>
        </div>
        
        <div className="quick-evo-body">
          <div className="input-group">
            <div className="input-group-item">
              <label>Level</label>
              <input 
                className="form-input" type="number" min="1" max={maxLevel} value={level} 
                onChange={(e) => {
                    const val = parseInt(e.target.value) || 1;
                    setLevel(Math.min(maxLevel, Math.max(1, val)));
                }} 
              />
            </div>
            <div className="input-group-item">
              <label>+Level</label>
              <input 
                className="form-input" type="number" min="0" max={maxPlus} value={plusLevel} 
                onChange={(e) => {
                    const val = parseInt(e.target.value) || 0;
                    setPlusLevel(Math.min(maxPlus, Math.max(0, val)));
                }} 
              />
            </div>
          </div>
          
          {staticData.forms && staticData.forms.length > 0 ? (
            <div className="form-icon-group">
                {staticData.forms.map((form, index) => (
                <React.Fragment key={form.form_id}>
                    {index > 0 && <span className="form-icon-connector">›</span>}
                    <div className="form-icon-item">
                    <button onClick={() => handleFormClick(form)} className={`form-icon-btn ${form.form_id == formId ? 'is-active' : ''}`} title={form.form_name}>
                        <img src={`${BASE_URL}/units/${form.image_url}`} alt={form.form_name} loading="lazy" />
                    </button>
                    <span className="form-icon-name">{form.generic_form_name}</span>
                    </div>
                </React.Fragment>
                ))}
            </div>
          ) : (
            <div className="text-secondary" style={{ padding: '1rem', textAlign: 'center', fontSize: '0.85rem' }}>
                [No evolution data available]
            </div>
          )}
          
          <BaseButton onClick={handleSaveProgress} variant="primary" disabled={isSaving} style={{ width: '100%', marginTop: '1rem' }}>
            {isSaving ? 'Saving...' : 'Save Changes'}
          </BaseButton>
        </div>
      </div>

      {nextForm && (
        <div className="quick-evo-card">
            <div className="quick-evo-header">
                <h3 className="quick-evo-title" style={{fontSize: '1rem'}}>Next: {nextForm.form_name}</h3>
            </div>
            <div className="quick-evo-body requirements-list">
                <div className={`requirement-item ${(level+plusLevel) >= nextForm.evolution.required_level ? 'is-complete' : 'is-missing'}`}>
                    <span style={{ width: '24px', textAlign: 'center' }}>Lvl</span> 
                    <span>Level {nextForm.evolution.required_level}</span>
                    {(level+plusLevel) >= nextForm.evolution.required_level && ' ✓'}
                </div>
                {nextForm.evolution.requirements.map(req => {
                  const userQty = inventoryMap.get(req.item_id) || 0;
                  const isComplete = userQty >= req.item_qty;
                  const percent = Math.min(100, (userQty / req.item_qty) * 100);
                  return (
                    <div key={req.item_id} style={{ marginTop: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                        {/* [UPDATED] Show image and name */}
                        <div style={{display:'flex', alignItems:'center', gap:'4px'}}>
                            <img src={`${BASE_URL}/items/${req.image_url}`} alt={req.item_name} style={{width:'16px', height:'16px', objectFit:'contain'}} />
                            <span>{req.item_name}</span>
                        </div>
                        <span className={isComplete ? 'text-success' : 'text-secondary'}>
                            {userQty} / {req.item_qty}
                        </span>
                      </div>
                      <div className="progress-track" style={{ height: '6px', marginTop: '2px' }}>
                          <div className="progress-fill" style={{ width: `${percent}%`, backgroundColor: isComplete ? 'var(--color-accent-success)' : 'var(--color-accent-info)' }}></div>
                      </div>
                    </div>
                  );
                })}
            </div>
        </div>
      )}

      <div style={{ textAlign: 'center', marginTop: '1rem' }}>
        <Link to={`/detail/${catId}`} className="btn btn-secondary" style={{ width: '100%', display: 'block' }}>
            View Full Details ➔
        </Link>
      </div>
    </aside>
  );
}

export default QuickEvoView;