import React from 'react';
import { Link } from 'react-router-dom';

const RAW_BASE_URL = import.meta.env.VITE_IMAGE_BASE_URL || '';
const BASE_URL = RAW_BASE_URL.replace(/\/$/, '');

function ReadyToEvolveWidget({ data }) {
  // Show more items since we will use a responsive grid
  const displayItems = data.slice(0, 10);
  const totalCount = data.length;

  const getRarityClass = (rarityId) => {
    if (rarityId === 5) return 'border-legend'; 
    if (rarityId === 4) return 'border-uber';   
    if (rarityId === 3) return 'border-super';  
    if (rarityId === 2) return 'border-rare';   
    if (rarityId === 1) return 'border-special';  
    return 'border-normal';                     
  };

  return (
    <div className="widget-card widget-ready-to-evolve">
      <div className="widget-header">
        <div>
            <h3 className="widget-card-title">Ready to Evolve ({totalCount})</h3>
            <span className="widget-subtitle">Requirements met</span>
        </div>
        
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
              title={`Evolve to ${cat.next_form_name}`}
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
      <div className="rarity-legend">
            <div className="legend-item"><span className="dot normal"></span>Normal</div>
            <div className="legend-item"><span className="dot special"></span>Special</div>
            <div className="legend-item"><span className="dot rare"></span>Rare</div>
            <div className="legend-item"><span className="dot super"></span>Super</div>
            <div className="legend-item"><span className="dot uber"></span>Uber</div>
            <div className="legend-item"><span className="dot legend"></span>Legend</div>
        </div>
    </div>
  );
}
export default ReadyToEvolveWidget;