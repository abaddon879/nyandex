import React from 'react';

function MyProgressWidget({ data }) {
  const catProgress = (data.cats_owned_total > 0) ? (data.cats_owned_count / data.cats_owned_total) * 100 : 0;
  const tfProgress = (data.true_forms_total > 0) ? (data.true_forms_count / data.true_forms_total) * 100 : 0;

  return (
    <div className="widget-card widget-my-progress">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
        <h3 className="widget-card-title" style={{ margin: 0, borderBottom: 'none' }}>My Progress</h3>
        {/* User Rank Display */}
        <div style={{ 
          backgroundColor: 'var(--color-accent-primary)', 
          color: 'var(--color-text-primary)', 
          padding: '4px 12px', 
          borderRadius: '16px',
          fontSize: '0.9rem',
          fontWeight: 'bold',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          User Rank: {data.user_rank?.toLocaleString() || 0}
        </div>
      </div>
      
      <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
          <span>Cats Owned</span>
          <span className="text-secondary">{data.cats_owned_count} / {data.cats_owned_total}</span>
        </div>
        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${catProgress}%` }}></div>
        </div>
      </div>
      
      <div style={{ marginTop: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
          <span>True Forms</span>
          <span className="text-secondary">{data.true_forms_count} / {data.true_forms_total}</span>
        </div>
        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${tfProgress}%` }}></div>
        </div>
      </div>
    </div>
  );
}
export default MyProgressWidget;