import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useBlocker } from 'react-router-dom';
import { catService } from '../api/catService';
import { userTrackerService } from '../api/userTrackerService';
import { authStore } from '../stores/authStore';
import { StatCalculator } from '../utils/StatCalculator';
import BaseButton from '../components/base/BaseButton';
import './CatDetailPage.css';

const RAW_BASE_URL = import.meta.env.VITE_IMAGE_BASE_URL || '';
const BASE_URL = RAW_BASE_URL.replace(/\/$/, '');

// Component to hold the Material Icon.
const MaterialIcon = ({ name, style = {} }) => (
    <span 
        className="material-symbols-outlined" 
        style={{ fontSize: '1.1rem', marginRight: '4px', lineHeight: 1, verticalAlign: 'middle', ...style }}
    >
        {name}
    </span>
);

function CatDetailPage() {
  const { id } = useParams();
  const catId = parseInt(id);
  const { userId } = authStore.getState();

  const [staticData, setStaticData] = useState(null);
  const [inventoryMap, setInventoryMap] = useState(new Map());
  
  const [level, setLevel] = useState(1);
  const [plusLevel, setPlusLevel] = useState(0);
  const [formId, setFormId] = useState(1);
  const [notes, setNotes] = useState('');
  const [isPinned, setIsPinned] = useState(false);
  const [isOwned, setIsOwned] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);

  const [originalState, setOriginalState] = useState(null);

  const fetchData = useCallback(async () => {
    if (!userId || isNaN(catId)) return;
    setIsLoading(true);
    setError(null);
    try {
      const [catDetails, inventory, userProgress] = await Promise.all([
        catService.getCatDetails(catId),
        userTrackerService.getUserInventory(userId),
        userTrackerService.getSingleCatProgress(userId, catId)
      ]);

      const invMap = new Map();
      inventory.forEach(item => invMap.set(item.item_id, item.item_quantity));
      setInventoryMap(invMap);

      setStaticData(catDetails);

      const defaultFormId = catDetails.forms[0]?.form_id || 1;
      
      let nextLevel = 1;
      let nextPlus = 0;
      let nextForm = defaultFormId;
      let nextNotes = '';
      let nextOwned = false;

      if (userProgress && userProgress.is_owned) {
        nextLevel = userProgress.level;
        nextPlus = userProgress.plus_level;
        nextForm = userProgress.form_id || defaultFormId;
        nextNotes = userProgress.notes || '';
        nextOwned = true;
      } 
      
      setLevel(nextLevel);
      setPlusLevel(nextPlus);
      setFormId(nextForm);
      setNotes(nextNotes);
      setIsOwned(nextOwned);
      setIsPinned(!!userProgress.is_pinned);

      setOriginalState({
        level: nextLevel,
        plusLevel: nextPlus,
        formId: nextForm,
        notes: nextNotes
      });

    } catch (err) {
      console.error("Detail Fetch Error:", err);
      setError("Failed to load cat details.");
    } finally {
      setIsLoading(false);
    }
  }, [catId, userId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const isDirty = useMemo(() => {
    if (!originalState) return false;
    return (
      level !== originalState.level ||
      plusLevel !== originalState.plusLevel ||
      formId !== originalState.formId ||
      notes !== originalState.notes
    );
  }, [level, plusLevel, formId, notes, originalState]);

  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      isDirty && currentLocation.pathname !== nextLocation.pathname
  );

  useEffect(() => {
    if (blocker.state === "blocked") {
      const confirmLeave = window.confirm("You have unsaved changes. Are you sure you want to leave?");
      if (confirmLeave) {
        blocker.proceed();
      } else {
        blocker.reset();
      }
    }
  }, [blocker]);

  const handleSave = async () => {
    if (!userId) return;
    setIsSaving(true);
    try {
      await userTrackerService.saveCatProgress(userId, catId, {
        level,
        plus_level: plusLevel,
        form_id: formId,
        notes
      });
      
      setIsOwned(true);
      
      setOriginalState({
        level,
        plusLevel,
        formId,
        notes
      });

      alert("Saved successfully!");
    } catch (err) {
      alert(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleTogglePin = async () => {
    try {
      if (isPinned) {
        await userTrackerService.unpinCat(userId, catId);
      } else {
        await userTrackerService.pinCat(userId, catId);
      }
      setIsPinned(!isPinned);
    } catch (err) {
      console.error(err);
    }
  };

  const currentForm = useMemo(() => {
    if (!staticData) return null;
    return staticData.forms.find(f => f.form_id == formId) || staticData.forms[0];
  }, [staticData, formId]);

  const stats = useMemo(() => {
    if (!currentForm?.stats) return null;
    return StatCalculator.getFinalStats(currentForm.stats, level, plusLevel);
  }, [currentForm, level, plusLevel]);


  if (isLoading) return <div className="page-loading" style={{padding:'2rem'}}>Loading Cat Details...</div>;
  if (error) return <div className="page-error" style={{padding:'2rem', color:'red'}}>{error}</div>;
  if (!staticData) return <div className="page-error" style={{padding:'2rem'}}>Cat not found.</div>;

  const maxLevel = staticData.max_level || 50;
  const maxPlus = staticData.max_plus_level || 0;

  return (
    <div className="cat-detail-page">
      
      <div className="detail-content">
        
        <section className="detail-hero">
          <div className="hero-image-container">
            {currentForm.image_url ? (
                <img src={`${BASE_URL}/units/${currentForm.image_url}`} alt={currentForm.form_name} />
            ) : (
                <div className="no-image-placeholder">?</div>
            )}
          </div>
          <div className="hero-info">
            <h1 className="cat-name">{currentForm.form_name}</h1>
            <div className="cat-meta">
                <span className="badge rarity-badge">Rarity: {staticData.rarity_id}</span>
                <span className="badge id-badge">#{staticData.cat_order_id ?? staticData.cat_id}</span>
            </div>
            <p className="cat-description">
              {currentForm.description}
            </p>
          </div>
        </section>

        {stats && (
        <section className="detail-section">
          <h2>Combat Stats (Lvl {level} + {plusLevel})</h2>
          <div className="stats-grid">
            <div className="stat-box"><label>HP</label><div className="stat-value">{stats.health.toLocaleString()}</div></div>
            <div className="stat-box"><label>Attack</label><div className="stat-value">{stats.attack_power.toLocaleString()}</div></div>
            <div className="stat-box"><label>DPS</label><div className="stat-value">{stats.dps.toLocaleString()}</div></div>
            <div className="stat-box"><label>Range</label><div className="stat-value">{currentForm.stats.attack_range}</div></div>
            <div className="stat-box"><label>Speed</label><div className="stat-value">{currentForm.stats.move_speed}</div></div>
            <div className="stat-box"><label>Cost</label><div className="stat-value">{currentForm.stats.cost}</div></div>
            <div className="stat-box"><label>Knockbacks</label><div className="stat-value">{currentForm.stats.knockbacks}</div></div>
            <div className="stat-box"><label>Attack Freq</label><div className="stat-value">{(currentForm.stats.attack_frequency_f / 30).toFixed(2)}s</div></div>
          </div>
        </section>
        )}

        <section className="detail-section">
            <h2>Evolution</h2>
            <div className="evolution-list">
                {staticData.forms.map((form) => {
                    const hasReqs = form.evolution && (form.evolution.required_level !== null || form.evolution.requirements.length > 0);
                    
                    // [NEW] Determine Badge Type (Stage vs Level)
                    const isStageUnlock = form.evolution?.required_level === -1;
                    
                    return (
                        <div key={form.form_id} className={`evolution-row ${form.form_id == formId ? 'active-form' : ''}`}>
                            <div 
                                className="evolution-icon-wrapper" 
                                onClick={() => setFormId(form.form_id)}
                            >
                                <img src={`${BASE_URL}/units/${form.image_url}`} alt={form.form_name} />
                                <span className="evo-label">{form.generic_form_name}</span>
                            </div>

                            {hasReqs && (
                                <div className="evolution-requirements">
                                    <div className="req-arrow">➔</div>
                                    <div className="req-details">
                                        
                                        {/* [UPDATED] Stage Unlock Logic */}
                                        {isStageUnlock ? (
                                            <div className="req-badge stage" title="Obtained by clearing a specific stage">
                                                Stage Unlock
                                            </div>
                                        ) : (
                                            form.evolution.required_level && (
                                                <div className={`req-badge ${level + plusLevel >= form.evolution.required_level ? 'met' : 'unmet'}`}>
                                                    Lvl {form.evolution.required_level}
                                                </div>
                                            )
                                        )}

                                        {/* Requirements */}
                                        {form.evolution.requirements.map(req => {
                                            const owned = inventoryMap.get(req.item_id) || 0;
                                            const displayOwned = Math.min(owned, req.item_qty); // [UPDATED]

                                            return (
                                                <div key={req.item_id} className={`req-badge ${owned >= req.item_qty ? 'met' : 'unmet'}`} title={req.item_name}>
                                                    <img src={`${BASE_URL}/items/${req.image_url}`} alt={req.item_name} className="req-icon" />
                                                    <span>{displayOwned}/{req.item_qty}</span>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </section>

        <section className="detail-section">
            <h2>My Notes</h2>
            <textarea 
                className="notes-area"
                placeholder="Add strategy notes..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
            />
        </section>

      </div>

      <aside className="detail-sidebar">
        {/* ... Sidebar content unchanged ... */}
        <div className="sidebar-card">
            <div className="sidebar-header">
                <h3>User Progress</h3>
            <button onClick={handleTogglePin} className="pin-btn">
              <MaterialIcon name="push_pin" style={{ color: isPinned ? 'var(--color-accent-primary)' : 'var(--color-text-secondary)' }} />
                </button>
            </div>
            
            <div className="control-group">
                <label>Current Level <small className="text-secondary">(Max: {maxLevel})</small></label>
                <div className="level-inputs">
                    <input 
                        type="number" className="form-input" value={level} min="1" max={maxLevel}
                        onChange={(e) => {
                           const val = parseInt(e.target.value) || 1;
                           setLevel(Math.min(maxLevel, Math.max(1, val)));
                        }}
                    />
                    <span className="plus-sign">+</span>
                    <input 
                        type="number" className="form-input" value={plusLevel} min="0" max={maxPlus}
                        onChange={(e) => {
                           const val = parseInt(e.target.value) || 0;
                           setPlusLevel(Math.min(maxPlus, Math.max(0, val)));
                        }}
                    />
                </div>
            </div>

            <div className="control-group">
                <label>Current Form</label>
                <div className="form-selector">
                    {staticData.forms.map(f => (
                        <button 
                            key={f.form_id}
                            className={`form-btn ${f.form_id == formId ? 'selected' : ''}`}
                            onClick={() => setFormId(f.form_id)}
                        >
                            {f.generic_form_name.substring(0,1)}
                        </button>
                    ))}
                </div>
            </div>

            <BaseButton variant="primary" className="save-btn" onClick={handleSave} disabled={isSaving}>
                <MaterialIcon name="save"/>
                {isSaving ? 'Saving...' : (isOwned ? 'Save Changes' : 'Add to Collection')}
            </BaseButton>
            
            <div className="last-updated">
               {isOwned ? "Owned" : "Not in collection"}
               {isDirty && <div style={{color:'var(--color-accent-destructive)', fontWeight:'bold', marginTop:'0.5rem'}}>● Unsaved Changes</div>}
            </div>
        </div>
      </aside>
    </div>
  );
}

export default CatDetailPage;