import React from 'react';

function XpTrackerWidget({ data }) {
  const format = (num) => num.toLocaleString();
  const isDeficit = data.deficit_xp < 0;

  return (
    <div className="widget-card widget-xp-tracker">
      <div className="widget-header">
        <h3 className="widget-card-title">XP Tracker</h3>
      </div>
      
      <div>
        {/* Grouped Stats */}
        <div className="xp-stat-group">
          <span className="xp-label">Current</span>
          <span className="xp-val">{format(data.current_xp)}</span>
        </div>

        <div className="xp-stat-group">
          <span className="xp-label">Needed</span>
          <span className="xp-val">{format(data.needed_xp)}</span>
        </div>

        {/* Deficit Box */}
        <div className={`xp-deficit-box ${isDeficit ? 'deficit' : 'surplus'}`}>
           <div className="xp-deficit-label" style={{ color: isDeficit ? '#c92a2a' : '#0ca678' }}>
             {isDeficit ? 'Missing XP' : 'Surplus XP'}
           </div>
           <div className="xp-deficit-val" style={{ color: isDeficit ? '#e03131' : '#087f5b' }}>
             {isDeficit ? '-' : '+'}{format(Math.abs(data.deficit_xp))}
           </div>
        </div>
      </div>
    </div>
  );
}
export default XpTrackerWidget;