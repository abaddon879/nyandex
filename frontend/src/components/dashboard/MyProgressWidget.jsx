import React from 'react';

function MyProgressWidget({ data }) {
  const catProgress = (data.cats_owned_total > 0) ? (data.cats_owned_count / data.cats_owned_total) * 100 : 0;
  const tfProgress = (data.true_forms_total > 0) ? (data.true_forms_count / data.true_forms_total) * 100 : 0;

  return (
    <div className="widget-card widget-my-progress">
      <h3 className="widget-card-title">My Progress</h3>
      
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Cats Owned</span>
          <span className="text-secondary">{data.cats_owned_count} / {data.cats_owned_total}</span>
        </div>
        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${catProgress}%` }}></div>
        </div>
      </div>
      
      <div style={{ marginTop: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
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