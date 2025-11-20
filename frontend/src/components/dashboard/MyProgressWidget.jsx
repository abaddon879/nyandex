import React from 'react';

function MyProgressWidget({ data }) {
  const catProgress = (data.cats_owned_total > 0) ? (data.cats_owned_count / data.cats_owned_total) * 100 : 0;
  const tfProgress = (data.true_forms_total > 0) ? (data.true_forms_count / data.true_forms_total) * 100 : 0;

  return (
    <div className="widget-card widget-my-progress">
      <div className="widget-header" style={{ borderBottom: 'none', paddingBottom: 0, marginBottom: '1rem' }}>
        <h3 className="widget-card-title">My Progress</h3>
        
        {/* Enhanced User Rank Badge */}
        <div style={{ 
          backgroundColor: 'var(--color-accent-primary)', 
          color: '#212529', 
          padding: '4px 12px', 
          borderRadius: '20px',
          fontSize: '0.9rem',
          fontWeight: '800',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}>
          <span>👑</span>
          <span>Rank: {data.user_rank?.toLocaleString() || 0}</span>
        </div>
      </div>
      
      <div style={{ display: 'grid', gap: '1.5rem' }}>
        {/* Progress Bar 1 */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.85rem', fontWeight: '600', color: '#495057' }}>
            <span>Cats Owned</span>
            <span>{data.cats_owned_count} / {data.cats_owned_total}</span>
          </div>
          <div className="progress-track" style={{ height: '12px', backgroundColor: '#e9ecef', borderRadius: '6px' }}>
            <div 
              className="progress-fill" 
              style={{ 
                width: `${catProgress}%`, 
                borderRadius: '6px',
                background: 'linear-gradient(90deg, #20c997, #0ca678)' 
              }}
            ></div>
          </div>
        </div>
        
        {/* Progress Bar 2 */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.85rem', fontWeight: '600', color: '#495057' }}>
            <span>True Forms</span>
            <span>{data.true_forms_count} / {data.true_forms_total}</span>
          </div>
          <div className="progress-track" style={{ height: '12px', backgroundColor: '#e9ecef', borderRadius: '6px' }}>
            <div 
              className="progress-fill" 
              style={{ 
                width: `${tfProgress}%`, 
                borderRadius: '6px',
                background: 'linear-gradient(90deg, #7048e8, #5f3dc4)' 
              }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
}
export default MyProgressWidget;