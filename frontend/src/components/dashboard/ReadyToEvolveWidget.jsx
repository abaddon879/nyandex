import React from 'react';
import { Link } from 'react-router-dom';

const IMAGE_BASE_URL = import.meta.env.VITE_IMAGE_BASE_URL || '';

function ReadyToEvolveWidget({ data }) {
  // If we have more than 5 items, we only show the top 5
  const displayItems = data.slice(0, 5);
  const totalCount = data.length;

  return (
    <div className="widget-card widget-ready-to-evolve">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 className="widget-card-title" style={{ marginBottom: 0, borderBottom: 'none' }}>Ready to Evolve</h3>
        {totalCount > 0 && (
          <span className="text-success" style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>{totalCount} Ready!</span>
        )}
      </div>
      <hr style={{ margin: '0.5rem 0 1rem 0', border: '0', borderTop: '1px solid var(--color-border)' }} />

      {totalCount === 0 ? (
        <p className="text-secondary">You have no cats ready to evolve right now.</p>
      ) : (
        <>
          <div className="ready-evolve-grid">
            {displayItems.map(cat => (
              <Link key={cat.cat_id} to={`/detail/${cat.cat_id}`} className="ready-evolve-card">
                <img 
                  src={`${IMAGE_BASE_URL}${cat.image_url}`} 
                  alt={cat.next_form_name} 
                  className="ready-evolve-icon"
                  loading="lazy"
                />
                <div className="ready-evolve-name">{cat.next_form_name}</div>
              </Link>
            ))}
          </div>
          
          {/* Spec Requirement: "View All" Link */}
          <div style={{ marginTop: '1rem', textAlign: 'right' }}>
            <Link 
              to="/catalog?filter=ready" 
              style={{ textDecoration: 'none', fontSize: '0.9rem', fontWeight: '600', color: 'var(--color-accent-info)' }}
            >
              View all {totalCount} ➔
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
export default ReadyToEvolveWidget;