import React from 'react';
import { Link } from 'react-router-dom';

const IMAGE_BASE_URL = import.meta.env.VITE_IMAGE_BASE_URL || '';

function PinnedUnitsWidget({ data }) {
  return (
    <div className="widget-card widget-pinned-units">
      <h3 className="widget-card-title">Pinned Units</h3>
      
      {data.length === 0 ? (
        <div className="empty-state">
          <p className="text-secondary">No cats pinned.</p>
          <Link to="/catalog" className="btn btn-secondary btn-sm">Go to Catalog</Link>
        </div>
      ) : (
        <div className="pinned-units-list">
          {data.map(unit => (
            <div key={unit.cat_id} className="pinned-unit-row">
              {/* Cat Icon */}
              <Link to={`/detail/${unit.cat_id}`} className="pinned-unit-icon-wrapper">
                <img 
                  src={`${IMAGE_BASE_URL}${unit.unit_image}`} 
                  alt={unit.form_name} 
                  className="pinned-unit-icon"
                  loading="lazy"
                />
              </Link>

              {/* Requirements List */}
              <div className="pinned-unit-details">
                <div className="pinned-unit-name">
                  <Link to={`/detail/${unit.cat_id}`}>{unit.form_name}</Link>
                </div>
                <div className="missing-reqs-grid">
                  {unit.missing_requirements.map((req, idx) => (
                    <div key={idx} className="missing-req-badge" title={`Need ${req.deficit} more ${req.item_name}`}>
                       {/* Show image if available (items), otherwise text (XP/Levels) */}
                       {req.image_url ? (
                         <img src={`${IMAGE_BASE_URL}${req.image_url}`} alt={req.item_name} className="req-icon-sm"/>
                       ) : (
                         <span className="req-text-fallback">{req.item_name.substring(0,2)}</span>
                       )}
                       <span className="req-deficit">-{req.deficit.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default PinnedUnitsWidget;