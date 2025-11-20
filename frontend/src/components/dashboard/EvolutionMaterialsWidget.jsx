import React from 'react';

const RAW_BASE_URL = import.meta.env.VITE_IMAGE_BASE_URL || '';
const BASE_URL = RAW_BASE_URL.replace(/\/$/, '');

function EvolutionMaterialsWidget({ data }) {
  
  // Helper to categorize items more accurately than just 'item_type'
  const categorize = (item) => {
    const name = item.item_name.toLowerCase();
    const type = item.item_type;

    if (type === 'Catseed' || name.includes('seed')) return 'Seeds';
    if (name.includes('gem') || name.includes('stone')) return 'Behemoth Stones';
    if (type === 'Catfruit') return 'Fruits';
    if (type.includes ('Material')) return 'Base Materials';
    
    return 'Other';
  };

  // Group the data
  const groups = {
    'Seeds': [],
    'Fruits': [],
    'Behemoth Stones': [],
    'Base Materials': [],
    'Base Materials Z': []
  };

  data.forEach(item => {
    const groupName = categorize(item);
    if (groups[groupName]) {
      groups[groupName].push(item);
    }
  });

  const getBgClass = (qty) => {
    if (qty === 0) return 'bg-empty';
    if (qty < 5) return 'bg-low';
    return '';
  };

  return (
    <div className="widget-card widget-evolution-materials">
      <div className="widget-header">
        <div>
            <h3 className="widget-card-title">Materials</h3>
            <span className="widget-subtitle">Inventory Stock</span>
        </div>
      </div>
      
      {/* Added 'custom-scrollbar' and specific height limits in CSS */}
      <div className="materials-scroll-container custom-scrollbar">
        {Object.entries(groups).map(([groupName, items]) => (
          items.length > 0 && (
            <div key={groupName} style={{ marginBottom: '1.5rem' }}>
              <div className="material-group-header">
                <span>{groupName}</span>
                <span style={{fontWeight:'400', fontSize:'0.9em', opacity: 0.7}}>{items.length}</span>
              </div>
              <div className="material-grid">
                {items.map((item, index) => (
                  <div 
                    key={index} 
                    className={`material-cell ${getBgClass(item.item_quantity)}`} 
                    title={item.item_name}
                  >
                    <img 
                      src={`${BASE_URL}/items/${item.image_url}`} 
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