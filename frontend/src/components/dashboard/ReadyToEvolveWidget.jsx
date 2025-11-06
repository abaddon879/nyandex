import React from 'react';
import { Link } from 'react-router-dom';

function ReadyToEvolveWidget({ data }) {
  return (
    <div className="widget-card widget-ready-to-evolve">
      {/* [THE FIX] Added the widget-card-title */}
      <h3 className="widget-card-title">Ready to Evolve</h3>
      
      {data.length === 0 ? (
        <p className="text-secondary">You have 0 cats ready to evolve.</p>
      ) : (
        <div>
          <p>You have {data.length} cats ready to evolve!</p>
          <ul style={{ listStyle: 'none', paddingLeft: 0, margin: 0 }}>
            {data.map(cat => (
              <li key={cat.cat_id} style={{ padding: '4px 0' }}>
                <Link to={`/detail/${cat.cat_id}`}>
                  [Icon] {cat.next_form_name} (from Cat ID: {cat.cat_id})
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
export default ReadyToEvolveWidget;