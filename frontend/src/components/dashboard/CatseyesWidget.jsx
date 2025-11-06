import React from 'react';

function CatseyesWidget({ data }) {
  return (
    <div className="widget-card widget-catseyes">
      {/* [THE FIX] Added the widget-card-title */}
      <h3 className="widget-card-title">Catseyes</h3>
      
      <p className="text-secondary">{data.length} catseye types owned.</p>
    </div>
  );
}
export default CatseyesWidget;