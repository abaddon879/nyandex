import React from 'react';
import { Link } from 'react-router-dom';

const RAW_BASE_URL = import.meta.env.VITE_IMAGE_BASE_URL || '';
const BASE_URL = RAW_BASE_URL.replace(/\/$/, '');

function ReadyToEvolveWidget({ data }) {
  const displayItems = data.slice(0, 12);
  const totalCount = data.length;

  // Helper to get rarity class
  const getRarityClass = (rarityId) => {
    if (rarityId >= 2 && rarityId <= 5) return `rarity-border-${rarityId}`;
    return '';
  };

  return (
    <div className="widget-card widget-ready-to-evolve">
      <div className="widget-header">
        <div>
            <h3 className="widget-card-title">Ready to Evolve</h3>
            {/* [NEW] Helper Subtitle for Clarity */}
            <span className="widget-subtitle">Requirements met & Inventory ready</span>
        </div>
        {totalCount > 0 && (
          <span style={{ 
             background: 'var(--color-accent-success)', 
             color: 'white', 
             padding: '2px 8px', 
             borderRadius: '4px', 
             fontSize: '0.75rem', 
             fontWeight: '700' 
          }}>
            {totalCount}
          </span>
        )}
      </div>

      {totalCount === 0 ? (
        <div style={{ padding: '1.5rem', textAlign: 'center', color: '#adb5bd' }}>
            <p style={{fontSize: '0.9rem'}}>No cats ready.</p>
        </div>
      ) : (
        <>
          <div className="ready-evolve-grid">
            {displayItems.map(cat => (
              <Link 
                key={cat.cat_id} 
                to={`/detail/${cat.cat_id}`} 
                /* [NEW] Add Rarity Class here */
                className={`ready-evolve-card ${getRarityClass(cat.rarity_id)}`}
                title={`Evolve to ${cat.next_form_name}`}
              >
                <div style={{position: 'relative'}}>
                     <img 
                      src={`${BASE_URL}/units/${cat.image_url}`} 
                      alt={cat.next_form_name} 
                      className="ready-evolve-icon"
                      loading="lazy"
                    />
                </div>
                <div className="ready-evolve-name">{cat.next_form_name}</div>
              </Link>
            ))}
          </div>
          
          {totalCount > 12 && (
            <div style={{ marginTop: 'auto', paddingTop: '0.5rem', textAlign: 'right' }}>
              <Link 
                to="/catalog?filter=ready" 
                style={{ textDecoration: 'none', fontSize: '0.8rem', fontWeight: '600', color: 'var(--color-accent-info)' }}
              >
                View all {totalCount} ➔
              </Link>
            </div>
          )}
        </>
      )}
    </div>
  );
}
export default ReadyToEvolveWidget;