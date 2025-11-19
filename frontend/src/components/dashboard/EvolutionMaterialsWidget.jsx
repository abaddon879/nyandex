import React from 'react';

const IMAGE_BASE_URL = import.meta.env.VITE_IMAGE_BASE_URL || '';

function EvolutionMaterialsWidget({ data }) {
  // Helper to categorize items based on the API 'item_type'
  const groups = {
    'Seeds': data.filter(i => i.item_type === 'Catseed'),
    'Fruits': data.filter(i => i.item_type === 'Catfruit'),
    'Stones': data.filter(i => i.item_type === 'Material'),   // Behemoth Stones
    'Gems': data.filter(i => i.item_type === 'Material Z'),   // Enigma Gems
  };

  const getBgClass = (qty) => {
    if (qty === 0) return 'bg-empty';
    if (qty < 5) return 'bg-low';
    return 'bg-good';
  };

  return (
    <div className="widget-card widget-evolution-materials">
      <h3 className="widget-card-title">Materials</h3>
      
      <div className="materials-container" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {Object.entries(groups).map(([groupName, items]) => (
          items.length > 0 && (
            <div key={groupName} className="material-group">
              <h4 style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: '#6c757d', margin: '0 0 4px 0' }}>
                {groupName}
              </h4>
              <div className="material-grid">
                {items.map((item, index) => (
                  <div key={index} className={`material-cell ${getBgClass(item.item_quantity)}`} title={item.item_name}>
                    <img 
                      src={`${IMAGE_BASE_URL}${item.image_url}`} 
                      alt={item.item_name} 
                      className="material-icon"
                      loading="lazy"
                    />
                    <span className="material-qty">{item.item_quantity}</span>
                  </div>
                ))}
              </div>
            </div>
          )
        ))}
      </div>
    </div>
  );
}
export default EvolutionMaterialsWidget;