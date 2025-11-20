import React from 'react';
import { Link } from 'react-router-dom';

const RAW_BASE_URL = import.meta.env.VITE_IMAGE_BASE_URL || '';
const BASE_URL = RAW_BASE_URL.replace(/\/$/, '');

function PinnedUnitsWidget({ data }) {
  
  const renderRequirement = (req, idx) => {
    // 1. Handle XP (Gold Badge)
    if (req.type === 'xp' || req.item_name === 'XP') {
      return (
        <div key={idx} className="req-badge badge-xp" title="XP Needed">
          <span>XP</span>
          <strong>{req.deficit.toLocaleString()}</strong>
        </div>
      );
    }

    // 2. Handle Level (Blue Badge)
    if (req.type === 'level' || req.item_name === 'Level') {
      return (
        <div key={idx} className="req-badge badge-level" title="Levels Needed">
          <span>Lv.</span>
          <strong>{req.deficit.toLocaleString()}</strong>
        </div>
      );
    }

    // 3. Handle Items (Standard Badge with Icon)
    return (
      <div key={idx} className="req-badge badge-item" title={`${req.deficit} more ${req.item_name}`}>
        {req.image_url ? (
          <img src={`${BASE_URL}/items/${req.image_url}`} alt={req.item_name} className="req-icon" />
        ) : (
          <span>{req.item_name.substring(0, 4)}</span>
        )}
        <strong>{req.deficit.toLocaleString()}</strong>
      </div>
    );
  };

  return (
    <div className="widget-card widget-pinned-units">
      <div className="widget-header">
        <div>
            <h3 className="widget-card-title">Pinned Units ({data.length})</h3>
            <span className="widget-subtitle">Tracking goals</span>
        </div>
      </div>
      
      {data.length === 0 ? (
        <div className="empty-state">
          <span style={{fontSize:'2rem'}}>📌</span>
          <p>Pin units from the Catalog to track them.</p>
          <Link to="/catalog" className="btn btn-secondary btn-sm">Go to Catalog</Link>
        </div>
      ) : (
        <div className="pinned-list-vertical custom-scrollbar">
          {data.map(unit => (
            <div key={unit.cat_id} className="pinned-row">
              
              {/* Left: Icon & Name */}
              <div className="pinned-info">
                <Link to={`/detail/${unit.cat_id}`} className="pinned-icon-wrapper">
                  <img 
                    src={`${BASE_URL}/units/${unit.unit_image}`} 
                    alt={unit.form_name} 
                    loading="lazy"
                  />
                </Link>
                <div style={{display:'flex', flexDirection:'column'}}>
                   <Link to={`/detail/${unit.cat_id}`} className="pinned-name">
                      {unit.form_name}
                   </Link>
                   {unit.missing_requirements.length === 0 && (
                     <span className="status-ready">Ready to Evolve!</span>
                   )}
                </div>
              </div>

              {/* Right: Requirements Grid */}
              <div className="pinned-reqs">
                {unit.missing_requirements.map((req, idx) => renderRequirement(req, idx))}
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default PinnedUnitsWidget;