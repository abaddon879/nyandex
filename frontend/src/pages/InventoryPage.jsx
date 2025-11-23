import React, { useState, useEffect, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { authStore } from '../stores/authStore';
import { userTrackerService } from '../api/userTrackerService';
import { itemService } from '../api/itemService'; 
import QuantityInput from '../components/inventory/QuantityInput.jsx';
import './InventoryPage.css';

const RAW_BASE_URL = import.meta.env.VITE_IMAGE_BASE_URL || '';
const BASE_URL = RAW_BASE_URL.replace(/\/$/, '');

// 1. Correct Color Order
const COLOR_ORDER = [
  'purple', 'red', 'blue', 'green', 'yellow', 
  'epic', 'aku', 'relic',
  'gold'
];

// 2. Currency Sort Order
const CURRENCY_SORT_ORDER = [
  'XP', 'NP', 'Catfood', 'Leadership', 
  'Cat Ticket', 'Rare Ticket', 'Platinum Ticket', 'Legend Ticket'
];

function InventoryPage() {
  const { searchTerm } = useOutletContext(); 
  
  const [staticItems, setStaticItems] = useState([]);
  const [userInventory, setUserInventory] = useState([]); 
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState(authStore.getState().userId);

  useEffect(() => {
    const unsubscribe = authStore.subscribe(state => setUserId(state.userId));
    return unsubscribe;
  }, []);

  useEffect(() => {
    async function fetchData() {
      if (!userId) return;
      setIsLoading(true);
      try {
        const [items, inventoryData] = await Promise.all([
          itemService.getItemDefinitions(),
          userTrackerService.getUserInventory(userId)
        ]);
        setStaticItems(items);
        setUserInventory(inventoryData);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [userId]);

  const mergedItems = useMemo(() => {
    const invMap = new Map(userInventory.map(i => [i.item_id, i]));
    return staticItems.map(item => {
      const userData = invMap.get(item.item_id);
      return {
        ...item,
        owned: Number(userData?.item_quantity || 0),
        needed: Number(userData?.quantity_needed || 0),
      };
    });
  }, [staticItems, userInventory]);

  const sortByColor = (a, b) => {
    const nameA = a.item_name.toLowerCase();
    const nameB = b.item_name.toLowerCase();
    
    let indexA = COLOR_ORDER.findIndex(c => nameA.includes(c));
    let indexB = COLOR_ORDER.findIndex(c => nameB.includes(c));
    
    if (indexA === -1 && nameA.includes('relic')) indexA = COLOR_ORDER.indexOf('relic');
    if (indexB === -1 && nameB.includes('relic')) indexB = COLOR_ORDER.indexOf('relic');

    if (indexA === -1) indexA = 99;
    if (indexB === -1) indexB = 99;

    if (indexA === indexB) return a.item_id - b.item_id;
    return indexA - indexB;
  };

  const groups = useMemo(() => {
    const result = {
      currencies: [],
      seeds: [],
      fruit: [],
      stones: [],
      gems: [],
      build_normal: [],
      build_z: [],
      engineers: [],
      catseyes: [],
      other: []
    };

    const query = searchTerm || ''; 

    mergedItems.forEach(item => {
        const isCurrency = ['XP','NP','Currency','Catfood','Leadership','Ticket'].includes(item.item_type);
        const matchesSearch = item.item_name.toLowerCase().includes(query.toLowerCase());

        if (!isCurrency && !matchesSearch) return;

        if (item.item_name.includes('Engineer')) {
            result.engineers.push(item);
            return;
        }

        switch (item.item_type) {
            case 'XP': case 'NP': case 'Currency': case 'Catfood': case 'Leadership': case 'Ticket':
                result.currencies.push(item); break;
            case 'Catseed': result.seeds.push(item); break;
            case 'Catfruit': result.fruit.push(item); break;
            case 'Behemoth Stone': result.stones.push(item); break;
            case 'Behemoth Gem': result.gems.push(item); break;
            case 'Material': result.build_normal.push(item); break;
            case 'Material Z': result.build_z.push(item); break;
            case 'Catseye': result.catseyes.push(item); break;
            case 'Battle Item': case 'Catamin': default:
                result.other.push(item); break;
        }
    });

    result.seeds.sort(sortByColor);
    result.fruit.sort(sortByColor);
    result.stones.sort(sortByColor);
    result.gems.sort(sortByColor);
    result.catseyes.sort((a,b) => a.item_id - b.item_id);
    result.other.sort((a,b) => a.item_id - b.item_id);
    
    result.currencies.sort((a, b) => {
        const getSortIndex = (name) => {
            const baseName = name.replace('Tickets', 'Ticket');
            const idx = CURRENCY_SORT_ORDER.indexOf(baseName);
            return idx === -1 ? 99 : idx;
        };
        return getSortIndex(a.item_name) - getSortIndex(b.item_name);
    });
    
    return result;
  }, [mergedItems, searchTerm]);

  if (isLoading) return <div style={{padding:'2rem', textAlign:'center'}}>Loading Inventory...</div>;

  return (
    <div className="inventory-container">
      
      {/* 1. CURRENCIES & TICKETS */}
      {groups.currencies.length > 0 && (
        <section className="inventory-section">
            <div className="section-header">Currencies & Tickets</div>
            <div className="currency-row">
                {groups.currencies.map(item => (
                    <CurrencyCard key={item.item_id} item={item} userId={userId} />
                ))}
            </div>
        </section>
      )}

      {/* 2. EVOLUTION MATERIALS */}
      <section className="inventory-section">
          <div className="section-header">Evolution Materials</div>
          <div className="evolution-grid-layout">
             <MaterialListGroup title="Seeds" items={groups.seeds} userId={userId} />
             <MaterialListGroup title="Catfruit" items={groups.fruit} userId={userId} />
             <MaterialListGroup title="Behemoth Stones" items={groups.stones} userId={userId} />
             <MaterialListGroup title="Behemoth Gems" items={groups.gems} userId={userId} />
          </div>
      </section>

      {/* 3. CATSEYES */}
      {groups.catseyes.length > 0 && (
        <section className="inventory-section">
            <div className="section-header">Catseyes</div>
            <div className="three-column-grid">
                {groups.catseyes.map(item => (
                    <MaterialListRow 
                        key={item.item_id} 
                        item={item} 
                        userId={userId} 
                        asCard={true} 
                    />
                ))}
            </div>
        </section>
      )}

      {/* 4. BUILDING MATERIALS */}
      <section className="inventory-section">
          <div className="section-header">Building Materials</div>
          <div className="list-grid-layout">
             <SimpleListGroup title="Standard" items={groups.build_normal} userId={userId} />
             <SimpleListGroup title="Z-Materials" items={groups.build_z} userId={userId} />
          </div>
          
          {/* Engineers */}
          {groups.engineers.length > 0 && (
             <div style={{marginTop: '12px'}}>
                <SimpleListGroup title="Base Development" items={groups.engineers} userId={userId} />
             </div>
          )}
      </section>

      {/* 5. OTHER ITEMS */}
      {groups.other.length > 0 && (
        <section className="inventory-section">
            <div className="section-header">Other Items</div>
            <div className="three-column-grid">
                {groups.other.map(item => (
                    <SimpleListRow 
                        key={item.item_id} 
                        item={item} 
                        userId={userId} 
                        asCard={true} 
                    />
                ))}
            </div>
        </section>
      )}
    </div>
  );
}

/* --- COMPONENTS --- */

function MaterialListGroup({ title, items, userId }) {
    if (!items || items.length === 0) return null;
    return (
        <div className="list-panel">
            <div className="sub-section-header-row">{title}</div>
            {items.map(item => (
                <MaterialListRow key={item.item_id} item={item} userId={userId} />
            ))}
        </div>
    );
}

function MaterialListRow({ item, userId, asCard = false }) {
    const needed = item.needed;
    const owned = item.owned;
    const pct = needed > 0 ? Math.min(100, (owned / needed) * 100) : 0;
    
    let statusClass = 'fill-good';
    let textClass = 'text-good';
    if (needed > 0 && owned < needed) {
        statusClass = 'fill-bad';
        textClass = 'text-bad';
    } 

    const displayName = item.item_name
        .replace(/Behemoth\s+/i, '')
        .replace(/\s+Seeds?/i, '')
        .replace(/\s+Fruits?/i, '')
        .replace(/\s+Stones?/i, '')
        .replace(/\s+Gems?/i, '')
        .replace(/\s+Catseyes?/i, '');

    const rowClasses = [
        'list-row',
        'smart',
        owned === 0 ? 'is-zero' : '',
        asCard ? 'is-card' : ''
    ].join(' ');

    return (
        <div className={rowClasses}>
            <div className="list-col-info">
                <img src={`${BASE_URL}/items/${item.image_url}`} className="list-icon" alt="" loading="lazy"/>
                <span className="list-name" title={item.item_name}>
                    {displayName}
                </span>
            </div>
            <div className="list-col-status">
                {needed > 0 ? (
                    <>
                        <div className="status-label">
                            <span className={textClass}>
                                {owned}/{needed}
                            </span>
                        </div>
                        <div className="status-track">
                            <div className={`status-fill ${statusClass}`} style={{width: `${pct}%`}}></div>
                        </div>
                    </>
                ) : (
                    <div className="status-label" style={{color:'#cbd5e1', fontWeight:'normal'}}>
                        <span>—</span>
                    </div>
                )}
            </div>
            <div className="list-col-qty">
                <QuantityInput userId={userId} itemId={item.item_id} initialQuantity={owned} />
            </div>
        </div>
    );
}

function SimpleListGroup({ title, items, userId }) {
    if (!items || items.length === 0) return null;
    return (
        <div className="list-panel">
            <div className="sub-section-header-row">{title}</div>
            {items.map(item => (
                <div key={item.item_id} className={`list-row simple ${item.owned === 0 ? 'is-zero' : ''}`}>
                    <div className="list-col-info">
                        <img src={`${BASE_URL}/items/${item.image_url}`} className="list-icon" alt="" loading="lazy"/>
                        <span className="list-name">{item.item_name}</span>
                    </div>
                    <div className="list-col-qty">
                        <QuantityInput userId={userId} itemId={item.item_id} initialQuantity={item.owned} />
                    </div>
                </div>
            ))}
        </div>
    );
}

function SimpleListRow({ item, userId, asCard = false }) {
    const rowClasses = [
        'list-row',
        'simple',
        item.owned === 0 ? 'is-zero' : '',
        asCard ? 'is-card' : ''
    ].join(' ');

    return (
        <div className={rowClasses}>
            <div className="list-col-info">
                <img src={`${BASE_URL}/items/${item.image_url}`} className="list-icon" alt="" loading="lazy"/>
                <span className="list-name">{item.item_name}</span>
            </div>
            <div className="list-col-qty">
                <QuantityInput userId={userId} itemId={item.item_id} initialQuantity={item.owned} />
            </div>
        </div>
    );
}

// [UPDATED] Uniform Width for All Currencies
function CurrencyCard({ item, userId }) {
  // Check if this is Catfood
    const isCatfood = item.item_name === 'Catfood';
    
    // Calculate Draws (1500 per 11-draw)
    const draws = isCatfood ? Math.floor(item.owned / 1500) : 0;
    return (
        <div className="currency-card">
            <div className="currency-header">
                <img src={`${BASE_URL}/items/${item.image_url}`} style={{width:24, height:24}} alt="" />
          <span className="currency-name">{item.item_name}</span>
          {/* [NEW] Show Draw Count if Catfood and sufficient funds */}
                    {isCatfood && draws >= 1 && (
                        <span className="currency-draw-badge">
                            {draws}x 11-Draw{draws > 1 ? 's' : ''}
                        </span>
                    )}
            </div>
            {/* Fixed width container for uniformity */}
            <div style={{marginLeft: 'auto', width: '140px'}}>
                <QuantityInput 
                    userId={userId}
                    itemId={item.item_id}
                    initialQuantity={item.owned}
                    wide={true} // Always fill the 140px container
                />
            </div>
        </div>
    );
}

export default InventoryPage;