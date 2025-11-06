import React from 'react';

function PinnedUnitsWidget({ data }) {
  return (
    <div className="widget-card widget-pinned-units">
      {/* [THE FIX] Added the widget-card-title */}
      <h3 className="widget-card-title">Pinned Units</h3>
      
      {data.length === 0 ? (
        <p className="text-secondary">You have 0 cats pinned.</p>
      ) : (
        <p>You have {data.length} cats pinned.</p>
        // We will add the detailed list logic here later
      )}
    </div>
  );
}
export default PinnedUnitsWidget;