import React from 'react';

const RAW_BASE_URL = import.meta.env.VITE_IMAGE_BASE_URL || '';
const BASE_URL = RAW_BASE_URL.replace(/\/$/, '');

function CatseyesWidget({ data }) {
  return (
    <div className="widget-card widget-catseyes">
      <h3 className="widget-card-title">Catseyes</h3>
      
      <div className="material-grid">
        {data.map((item, index) => (
          <div key={index} className="material-cell" title={item.item_name}>
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
  );
}
export default CatseyesWidget;