import React from 'react';

function EvolutionMaterialsWidget({ data }) {
  return (
    <div className="widget-card widget-evolution-materials">
      {/* [THE FIX] Added the widget-card-title */}
      <h3 className="widget-card-title">Evolution Materials</h3>
      
      <p className="text-secondary">{data.length} material types owned.</p>
      {/* Icon grid would go here */}
    </div>
  );
}
export default EvolutionMaterialsWidget;