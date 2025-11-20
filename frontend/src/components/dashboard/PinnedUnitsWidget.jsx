import React from 'react';
import { Link } from 'react-router-dom';

const RAW_BASE_URL = import.meta.env.VITE_IMAGE_BASE_URL || '';
const BASE_URL = RAW_BASE_URL.replace(/\/$/, '');

function PinnedUnitsWidget({ data }) {
  
  const renderBadge = (req, idx) => {
    const isImage = !!req.image_url;
    let label = req.item_name;
    if (req.type === 'level') label = 'Lv.';
    if (req.type === 'xp') label = 'XP';

    return (
        <div 
            key={idx} 
            className={`missing-req-badge type-${req.type || 'item'}`} 
            title={`Need ${req.deficit.toLocaleString()} more ${req.item_name}`}
        >
           {isImage ? (
             <img src={`${BASE_URL}/items/${req.image_url}`} alt={req.item_name} />
           ) : (
             <span className="req-text-label">{label}</span>
           )}
           <span className="req-deficit">-{req.deficit.toLocaleString()}</span>
        </div>
    );
  };

  return (
    <div className="widget-card widget-pinned-units">
      <div className="widget-header">
        <div>
            <h3 className="widget-card-title">Pinned Units ({data.length})</h3>
            {/* [NEW] Helper Subtitle */}
            <span className="widget-subtitle">Tracking missing resources</span>
        </div>
      </div>
      
      {data.length === 0 ? (
        <div className="empty-state" style={{ textAlign: 'center', padding: '2rem', color: '#adb5bd' }}>
          <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>📌</div>
          <p style={{ fontSize: '0.9rem', marginBottom: '1rem' }}>Pin cats to track their missing items here.</p>
          <Link to="/catalog" className="btn btn-secondary btn-sm">Go to Catalog</Link>
        </div>
      ) : (
        <div className="pinned-list-wrapper custom-scrollbar">
          {data.map(unit => {
            const statsReqs = unit.missing_requirements.filter(r => r.type === 'xp' || r.type === 'level');
            const itemReqs = unit.missing_requirements.filter(r => r.type === 'item');

            return (
              <div key={unit.cat_id} className="pinned-unit-card">
                <Link to={`/detail/${unit.cat_id}`} className="pinned-unit-icon-wrapper">
                  <img 
                    src={`${BASE_URL}/units/${unit.unit_image}`} 
                    alt={unit.form_name} 
                    className="pinned-unit-icon"
                    loading="lazy"
                  />
                </Link>

                <div className="pinned-unit-details">
                  <Link to={`/detail/${unit.cat_id}`} className="pinned-unit-name" title={unit.form_name}>
                      {unit.form_name}
                  </Link>
                  
                  <div className="missing-reqs-container">
                    {statsReqs.length > 0 && (
                        <div className="req-row">
                            {statsReqs.map((req, idx) => renderBadge(req, `s-${idx}`))}
                        </div>
                    )}
                    {itemReqs.length > 0 && (
                        <div className="req-row">
                            {itemReqs.map((req, idx) => renderBadge(req, `i-${idx}`))}
                        </div>
                    )}
                    {unit.missing_requirements.length === 0 && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-accent-success)', fontWeight: '600' }}>
                            ✓ Ready to Evolve
                        </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default PinnedUnitsWidget;