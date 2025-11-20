import React from 'react';
import { Link } from 'react-router-dom';

const RAW_BASE_URL = import.meta.env.VITE_IMAGE_BASE_URL || '';
const BASE_URL = RAW_BASE_URL.replace(/\/$/, '');

function ReadyToEvolveWidget({ data }) {
  // Show more items since we will use a responsive grid
  const displayItems = data.slice(0, 10);
  const totalCount = data.length;

  const getRarityClass = (rarityId) => {
    if (rarityId >= 4) return 'border-uber'; // Gold
    if (rarityId === 3) return 'border-super'; // Blue
    if (rarityId === 2) return 'border-rare'; // Red
    return 'border-normal';
  };

  return (
    <div className="widget-card widget-ready-to-evolve">
      <div className="widget-header">
        <div>
            <h3 className="widget-card-title">Ready to Evolve</h3>
            <span className="widget-subtitle">Requirements met</span>
        </div>
        {totalCount > 0 && (
            <span className="counter-badge success">{totalCount} Ready</span>
        )}
      </div>

      {totalCount === 0 ? (
        <div className="empty-state">
            <p>No cats ready to evolve.</p>
        </div>
      ) : (
        <div className="ready-grid-container custom-scrollbar">
          {displayItems.map(cat => (
            <Link 
              key={cat.cat_id} 
              to={`/detail/${cat.cat_id}`} 
              className={`ready-card ${getRarityClass(cat.rarity_id)}`}
            >
              <img 
                src={`${BASE_URL}/units/${cat.image_url}`} 
                alt={cat.next_form_name} 
                className="ready-icon"
                loading="lazy"
              />
              <div className="ready-name">{cat.next_form_name}</div>
            </Link>
          ))}
          {totalCount > 10 && (
             <Link to="/catalog?filter=ready" className="ready-card view-more">
                <span>+{totalCount - 10}</span>
                <span style={{fontSize:'0.7rem'}}>More</span>
             </Link>
          )}
        </div>
      )}
    </div>
  );
}
export default ReadyToEvolveWidget;