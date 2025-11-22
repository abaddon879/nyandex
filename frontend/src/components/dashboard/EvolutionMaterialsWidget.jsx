import React from 'react';

const RAW_BASE_URL = import.meta.env.VITE_IMAGE_BASE_URL || '';
const BASE_URL = RAW_BASE_URL.replace(/\/$/, '');

// Visual Color Order for vertical alignment
const COLOR_ORDER = [
  'purple', 'red', 'blue', 'green', 'yellow', 
  'epic', 'aku', 'relic',
  'gold'                               
];

function EvolutionMaterialsWidget({ data }) {
  
  // --- 1. CLEAN Categorization ---
  const categorize = (item) => {
    switch (item.item_type) {
        case 'Catseed':
        case 'Catfruit':
            return 'catfruit';
        case 'Behemoth Stone':
        case 'Behemoth Gem':
            return 'behemoth';
        case 'Material':
        case 'Material Z':
            return 'building';
        default:
            return 'other';
    }
  };

  // --- 2. Sorting Logic ---
  const sortByColor = (a, b) => {
    const nameA = a.item_name.toLowerCase();
    const nameB = b.item_name.toLowerCase();
    
    let indexA = COLOR_ORDER.findIndex(c => nameA.includes(c));
    let indexB = COLOR_ORDER.findIndex(c => nameB.includes(c));
    
    if (indexA === -1 && nameA === 'catfruit') indexA = COLOR_ORDER.indexOf('rainbow');
    if (indexB === -1 && nameB === 'catfruit') indexB = COLOR_ORDER.indexOf('rainbow');

    if (indexA === -1) indexA = 99;
    if (indexB === -1) indexB = 99;

    if (indexA === indexB) return parseInt(a.item_id) - parseInt(b.item_id);

    return indexA - indexB;
  };

  const sortById = (a, b) => parseInt(a.item_id) - parseInt(b.item_id);

  // --- 3. Data Distribution ---
  const organization = {
    catfruit: { title: 'Catfruit', items: [] },
    behemoth: { title: 'Behemoth Stones', items: [] },
    building: { title: 'Building Materials', items: [] },
    other: { title: 'Other Materials', items: [] }
  };

  data.forEach(item => {
    if (['XP', 'NP', 'Currency', 'Ticket', 'Catamin', 'Battle Item'].includes(item.item_type)) return;
    const groupKey = categorize(item);
    if (organization[groupKey]) {
      organization[groupKey].items.push(item);
    }
  });

  organization.catfruit.items.sort(sortByColor);
  organization.behemoth.items.sort(sortByColor);
  organization.building.items.sort(sortById); 
  organization.other.items.sort(sortById);

  // --- 4. Helpers ---
  const getBgClass = (qty) => {
    if (qty === 0) return 'bg-empty';
    // [FIX] Removed the 'bg-low' check. All items > 0 get standard styling.
    return '';
  };

  const renderItem = (item) => (
    <div 
      key={item.item_id} 
      className={`material-cell ${getBgClass(item.item_quantity)}`} 
      title={item.item_name}
    >
      <img 
        src={`${BASE_URL}/items/${item.image_url}`} 
        alt={item.item_name} 
        className="material-icon"
        loading="lazy"
      />
      <span className="material-qty">{item.item_quantity}</span>
    </div>
  );

  // --- 5. Row Splitting Logic ---
  const renderSplitRows = (key, items) => {
    let row1 = [], row2 = [];

    if (key === 'catfruit') {
        row1 = items.filter(i => i.item_type === 'Catseed');
        row2 = items.filter(i => i.item_type === 'Catfruit');
    } 
    else if (key === 'behemoth') {
        row1 = items.filter(i => i.item_type === 'Behemoth Stone');
        row2 = items.filter(i => i.item_type === 'Behemoth Gem');
    } 
    else if (key === 'building') {
        row1 = items.filter(i => i.item_type === 'Material');
        row2 = items.filter(i => i.item_type === 'Material Z');
    } 
    else {
        return <div className="material-grid">{items.map(renderItem)}</div>;
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {row1.length > 0 && <div className="material-grid">{row1.map(renderItem)}</div>}
            {row2.length > 0 && <div className="material-grid">{row2.map(renderItem)}</div>}
        </div>
    );
  };

  // --- 6. Final Render ---
  const visibleGroups = Object.entries(organization).filter(([_, group]) => group.items.length > 0);

  return (
    <div className="widget-card widget-evolution-materials">
      <div className="widget-header">
        <div>
            <h3 className="widget-card-title">Materials</h3>
            <span className="widget-subtitle">Inventory Stock</span>
        </div>
        {/* [FIX] Removed the Legend as it is no longer needed */}
      </div>
      
      <div className="materials-scroll-container custom-scrollbar">
        {visibleGroups.map(([key, group], index) => {
          const isLast = index === visibleGroups.length - 1;

          return (
            <div key={key} style={{ marginBottom: isLast ? 0 : '12px' }}>
              <div className="material-group-header">
                <span>{group.title}</span>
                <span style={{fontWeight:'400', fontSize:'0.9em', opacity: 0.7}}>{group.items.length}</span>
              </div>
              {renderSplitRows(key, group.items)}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default EvolutionMaterialsWidget;