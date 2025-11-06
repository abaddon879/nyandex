import React from 'react';

function XpTrackerWidget({ data }) {
  const deficitClass = data.deficit_xp >= 0 ? 'text-success' : 'text-destructive';
  const format = (num) => num.toLocaleString();

  return (
    <div className="widget-card widget-xp-tracker">
      <h3 className="widget-card-title">XP Tracker</h3>
      
      <div style={{ marginBottom: '0.5rem' }}>
        <span className="text-secondary">Current:</span>
        <strong style={{ display: 'block', fontSize: '1.2rem' }}>{format(data.current_xp)}</strong>
      </div>
      
      <div style={{ marginBottom: '0.5rem' }}>
        <span className="text-secondary">Needed:</span>
        <strong style={{ display: 'block', fontSize: '1.2rem' }}>{format(data.needed_xp)}</strong>
      </div>
      
      <div>
        <span className="text-secondary">Deficit:</span>
        <strong style={{ display: 'block', fontSize: '1.2rem' }} className={deficitClass}>
          {format(data.deficit_xp)}
        </strong>
      </div>
    </div>
  );
}
export default XpTrackerWidget;