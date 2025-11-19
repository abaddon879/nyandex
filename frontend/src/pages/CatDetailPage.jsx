import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { catService } from '../api/catService';
import { userTrackerService } from '../api/userTrackerService';
import { authStore } from '../stores/authStore';
import { StatCalculator } from '../utils/StatCalculator';
import BaseButton from '../components/base/BaseButton';
import './CatDetailPage.css';

const IMAGE_BASE_URL = import.meta.env.VITE_IMAGE_BASE_URL || '';

function CatDetailPage() {
  const { id } = useParams(); // Get cat ID from URL
  const catId = parseInt(id);
  const { userId } = authStore.getState();

  // --- State ---
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

  // --- Data Fetching ---
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

      // 1. Setup Inventory Map
      const invMap = new Map();
      inventory.forEach(item => invMap.set(item.item_id, item.item_quantity));
      setInventoryMap(invMap);

      // 2. Setup Static Data
      setStaticData(catDetails);

      // 3. Setup User State
      const defaultFormId = catDetails.forms[0]?.form_id || 1;
      
      if (userProgress && userProgress.is_owned) {
        setLevel(userProgress.level);
        setPlusLevel(userProgress.plus_level);
        setFormId(userProgress.form_id || defaultFormId);
        setNotes(userProgress.notes || '');
        setIsOwned(true);
      } else {
        // Default defaults
        setLevel(1);
        setPlusLevel(0);
        setFormId(defaultFormId);
        setIsOwned(false);
      }
      
      // Pin status can exist even if not owned
      setIsPinned(!!userProgress.is_pinned);

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


  // --- Handlers ---

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
      // Optional: Show Toast
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

  // --- Computed Data ---

  const currentForm = useMemo(() => {
    if (!staticData) return null;
    // Loose equality for safety
    return staticData.forms.find(f => f.form_id == formId) || staticData.forms[0];
  }, [staticData, formId]);

  const stats = useMemo(() => {
    if (!currentForm?.stats) return null;
    return StatCalculator.getFinalStats(currentForm.stats, level, plusLevel);
  }, [currentForm, level, plusLevel]);


  // --- Render ---

  if (isLoading) return <div className="page-loading">Loading Cat Details...</div>;
  if (error) return <div className="page-error">{error}</div>;
  if (!staticData) return <div className="page-error">Cat not found.</div>;

  return (
    <div className="cat-detail-page">
      
      {/* Left Column: Hero & Stats */}
      <div className="detail-content">
        
        {/* Hero Header */}
        <section className="detail-hero">
          <div className="hero-image-container">
            {currentForm.image_url ? (
                <img src={IMAGE_BASE_URL + currentForm.image_url} alt={currentForm.form_name} />
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

        {/* Stats Table */}
        {stats && (
        <section className="detail-section">
          <h2>Combat Stats (Lvl {level} + {plusLevel})</h2>
          <div className="stats-grid">
            <div className="stat-box">
                <label>HP</label>
                <div className="stat-value">{stats.health.toLocaleString()}</div>
            </div>
            <div className="stat-box">
                <label>Attack</label>
                <div className="stat-value">{stats.attack_power.toLocaleString()}</div>
            </div>
            <div className="stat-box">
                <label>DPS</label>
                <div className="stat-value">{stats.dps.toLocaleString()}</div>
            </div>
            <div className="stat-box">
                <label>Range</label>
                <div className="stat-value">{currentForm.stats.attack_range}</div>
            </div>
            <div className="stat-box">
                <label>Speed</label>
                <div className="stat-value">{currentForm.stats.move_speed}</div>
            </div>
            <div className="stat-box">
                <label>Cost</label>
                <div className="stat-value">{currentForm.stats.cost}</div>
            </div>
            <div className="stat-box">
                <label>Knockbacks</label>
                <div className="stat-value">{currentForm.stats.knockbacks}</div>
            </div>
            <div className="stat-box">
                <label>Attack Freq</label>
                <div className="stat-value">{(currentForm.stats.attack_frequency_f / 30).toFixed(2)}s</div>
            </div>
          </div>
        </section>
        )}

        {/* Evolution Tree / Requirements */}
        <section className="detail-section">
            <h2>Evolution</h2>
            <div className="evolution-list">
                {staticData.forms.map((form, idx) => {
                    const prevForm = staticData.forms[idx-1]; // To check transition
                    // Does this form have requirements? (Only needed for forms > 1)
                    const hasReqs = form.evolution && (form.evolution.required_level || form.evolution.requirements.length > 0);

                    return (
                        <div key={form.form_id} className={`evolution-row ${form.form_id == formId ? 'active-form' : ''}`}>
                            <div 
                                className="evolution-icon-wrapper" 
                                onClick={() => setFormId(form.form_id)}
                            >
                                <img src={IMAGE_BASE_URL + form.image_url} alt={form.form_name} />
                                <span className="evo-label">{form.generic_form_name}</span>
                            </div>

                            {hasReqs && (
                                <div className="evolution-requirements">
                                    <div className="req-arrow">➔</div>
                                    <div className="req-details">
                                        {form.evolution.required_level && (
                                            <div className={`req-badge ${level + plusLevel >= form.evolution.required_level ? 'met' : 'unmet'}`}>
                                                Lvl {form.evolution.required_level}
                                            </div>
                                        )}
                                        {form.evolution.requirements.map(req => {
                                            const owned = inventoryMap.get(req.item_id) || 0;
                                            return (
                                                <div key={req.item_id} className={`req-badge ${owned >= req.item_qty ? 'met' : 'unmet'}`}>
                                                    Item {req.item_id}: {owned}/{req.item_qty}
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
                placeholder="Add strategy notes, talent plans, etc..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
            />
        </section>

      </div>

      {/* Right Column: Sticky Controls */}
      <aside className="detail-sidebar">
        <div className="sidebar-card">
            <div className="sidebar-header">
                <h3>User Progress</h3>
                <button onClick={handleTogglePin} className="pin-btn">
                    {isPinned ? '📌 Pinned' : '📌 Track'}
                </button>
            </div>
            
            <div className="control-group">
                <label>Current Level</label>
                <div className="level-inputs">
                    <input 
                        type="number" 
                        className="form-input"
                        value={level} 
                        min="1" max="120"
                        onChange={(e) => setLevel(Math.max(1, parseInt(e.target.value)||0))}
                    />
                    <span className="plus-sign">+</span>
                    <input 
                        type="number" 
                        className="form-input"
                        value={plusLevel} 
                        min="0" max="90"
                        onChange={(e) => setPlusLevel(Math.max(0, parseInt(e.target.value)||0))}
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

            <BaseButton 
                variant="primary" 
                className="save-btn"
                onClick={handleSave}
                disabled={isSaving}
            >
                {isSaving ? 'Saving...' : (isOwned ? 'Save Changes' : 'Add to Collection')}
            </BaseButton>
            
            <div className="last-updated">
               {isOwned ? "Owned" : "Not in collection"}
            </div>
        </div>
      </aside>
    </div>
  );
}

export default CatDetailPage;