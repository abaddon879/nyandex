import React from 'react';
import BaseButton from '../base/BaseButton';

// Rarity definitions matching the DB/Spec
const RARITIES = [
  { id: 0, label: 'Normal' },
  { id: 1, label: 'Special' },
  { id: 2, label: 'Rare' },
  { id: 3, label: 'Super Rare' },
  { id: 4, label: 'Uber Rare' },
  { id: 5, label: 'Legend Rare' },
];

function CatalogFilterPanel({ filters, setFilters, onClose }) {
  
  // --- Handlers ---

  const handleOwnershipChange = (val) => {
    setFilters(prev => ({ ...prev, ownership: val }));
  };

  const handleRarityToggle = (rarityId) => {
    setFilters(prev => {
      const current = prev.rarity || [];
      if (current.includes(rarityId)) {
        return { ...prev, rarity: current.filter(id => id !== rarityId) };
      } else {
        return { ...prev, rarity: [...current, rarityId] };
      }
    });
  };

  const handleStatusChange = (key) => {
    setFilters(prev => ({
      ...prev,
      status: {
        ...prev.status,
        [key]: !prev.status[key]
      }
    }));
  };

  const handleClear = () => {
    setFilters({
      search: '',
      rarity: [],
      ownership: 'all',
      // [UPDATED] Reset both status flags
      status: { readyToEvolve: false, hasEvolution: false }
    });
  };

  // --- Styles ---
  const panelStyle = {
    padding: '1rem',
    borderBottom: '1px solid var(--color-border)',
    backgroundColor: '#f9f9f9',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '2rem',
    position: 'relative'
  };

  const sectionTitleStyle = {
    fontSize: '0.9rem',
    fontWeight: '700',
    marginBottom: '0.5rem',
    color: 'var(--color-text-secondary)',
    textTransform: 'uppercase'
  };

  return (
    <div style={panelStyle}>
      {/* 1. Ownership Filters */}
      <div>
        <div style={sectionTitleStyle}>Ownership</div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          {['all', 'owned', 'missing'].map(option => (
            <label key={option} style={{ cursor: 'pointer', textTransform: 'capitalize' }}>
              <input 
                type="radio" 
                name="ownership" 
                value={option}
                checked={filters.ownership === option}
                onChange={() => handleOwnershipChange(option)}
                style={{ marginRight: '6px' }}
              />
              {option}
            </label>
          ))}
        </div>
      </div>

      {/* 2. Status Filters */}
      <div>
        <div style={sectionTitleStyle}>Status</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <input 
                type="checkbox" 
                checked={filters.status.readyToEvolve} 
                onChange={() => handleStatusChange('readyToEvolve')}
              />
              Ready to Evolve
              <span title="Shows cats that meet level AND item requirements for next evolution" style={{ cursor: 'help', color: 'var(--color-accent-info)' }}>
                [?]
              </span>
            </label>

            {/* [NEW] Has Next Evolution Filter */}
            <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <input 
                type="checkbox" 
                checked={filters.status.hasEvolution} 
                onChange={() => handleStatusChange('hasEvolution')}
              />
              Has Next Evolution
              <span title="Shows owned cats that have not yet reached their final form" style={{ cursor: 'help', color: 'var(--color-accent-info)' }}>
                [?]
              </span>
            </label>
        </div>
      </div>

      {/* 3. Rarity Filters */}
      <div>
        <div style={sectionTitleStyle}>Rarity</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          {RARITIES.map(r => (
            <label key={r.id} style={{ fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <input 
                type="checkbox"
                checked={filters.rarity.includes(r.id)}
                onChange={() => handleRarityToggle(r.id)}
              />
              {r.label}
            </label>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '1rem' }}>
        <BaseButton variant="secondary" onClick={handleClear} className="btn-sm">
          Clear All
        </BaseButton>
        <BaseButton variant="secondary" onClick={onClose} className="btn-sm">
          Close
        </BaseButton>
      </div>
    </div>
  );
}

export default CatalogFilterPanel;