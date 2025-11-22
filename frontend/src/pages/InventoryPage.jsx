import React, { useState, useEffect, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { authStore } from '../stores/authStore';
import { userTrackerService } from '../api/userTrackerService';
import { itemService } from '../api/itemService'; 
import QuantityInput from '../components/inventory/QuantityInput.jsx';
import './InventoryPage.css';

const RAW_BASE_URL = import.meta.env.VITE_IMAGE_BASE_URL || '';
const BASE_URL = RAW_BASE_URL.replace(/\/$/, '');

// [RESTORED] The correct color order including 'relic'
const COLOR_ORDER = [
  'purple', 'red', 'blue', 'green', 'yellow', 
  'epic', 'aku', 'relic',
  'gold'
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

  // --- Sorting Helper ---
  const sortByColor = (a, b) => {
    const nameA = a.item_name.toLowerCase();
    const nameB = b.item_name.toLowerCase();
    
    // Find index based on substring match
    let indexA = COLOR_ORDER.findIndex(c => nameA.includes(c));
    let indexB = COLOR_ORDER.findIndex(c => nameB.includes(c));
    
    // Logic to map "Relic" items to the "Elder" sort position if needed, 
    // but 'relic' is now in the list so this just handles fallbacks
    if (indexA === -1 && nameA.includes('relic')) indexA = COLOR_ORDER.indexOf('relic');
    if (indexB === -1 && nameB.includes('relic')) indexB = COLOR_ORDER.indexOf('relic');

    // Items not in the list go to the end
    if (indexA === -1) indexA = 99;
    if (indexB === -1) indexB = 99;

    // If colors match (or both unknown), sort by ID
    if (indexA === indexB) return a.item_id - b.item_id;
    
    return indexA - indexB;
  };

  // --- Grouping Logic ---
  const groups = useMemo(() => {
    const result = {
      currencies: [],
      seeds: [],
      fruit: [],
      stones: [],
      gems: [],
      build_normal: [],
      build_z: [],
      catseyes: [],
      tickets: [],
      other: []
    };

    const query = searchTerm || ''; 

    mergedItems.forEach(item => {
        const isCurrency = ['XP','NP','Currency','Catfood','Leadership'].includes(item.item_type);
        const matchesSearch = item.item_name.toLowerCase().includes(query.toLowerCase());

        if (!isCurrency && !matchesSearch) return;

        switch (item.item_type) {
            case 'XP': case 'NP': case 'Currency': case 'Catfood': case 'Leadership':
                result.currencies.push(item); break;
            case 'Catseed': result.seeds.push(item); break;
            case 'Catfruit': result.fruit.push(item); break;
            case 'Behemoth Stone': result.stones.push(item); break;
            case 'Behemoth Gem': result.gems.push(item); break;
            case 'Material': result.build_normal.push(item); break;
            case 'Material Z': result.build_z.push(item); break;
            case 'Catseye': result.catseyes.push(item); break;
            case 'Ticket': result.tickets.push(item); break;
            default: result.other.push(item);
        }
    });

    // Apply Custom Color Order
    result.seeds.sort(sortByColor);
    result.fruit.sort(sortByColor);
    result.stones.sort(sortByColor);
    result.gems.sort(sortByColor);
    
    // Standard sort for others
    result.catseyes.sort((a,b) => a.item_id - b.item_id);
    
    return result;
  }, [mergedItems, searchTerm]);

  if (isLoading) return <div style={{padding:'2rem', textAlign:'center'}}>Loading Inventory...</div>;

  return (
    <div className="inventory-container">
      
      {/* 1. CURRENCIES (Top Row) */}
      {groups.currencies.length > 0 && (
        <section className="inventory-section">
            <div className="section-header">Currencies</div>
            <div className="currency-row">
                {groups.currencies.map(item => (
                    <CurrencyCard key={item.item_id} item={item} userId={userId} />
                ))}
            </div>
        </section>
      )}

      {/* 2. EVOLUTION MATERIALS (4-Column) */}
      <section className="inventory-section">
          <div className="section-header">Evolution Materials</div>
          <div className="evolution-grid-layout">
             <MaterialListGroup title="Seeds" items={groups.seeds} userId={userId} />
             <MaterialListGroup title="Catfruit" items={groups.fruit} userId={userId} />
             <MaterialListGroup title="Behemoth Stones" items={groups.stones} userId={userId} />
             <MaterialListGroup title="Behemoth Gems" items={groups.gems} userId={userId} />
          </div>
      </section>

      {/* 3. CATSEYES (Moved Up) */}
      {groups.catseyes.length > 0 && (
        <section className="inventory-section">
            <div className="section-header">Catseyes</div>
            <div className="list-grid-layout">
                <MaterialListGroup title="Catseyes" items={groups.catseyes} userId={userId} />
            </div>
        </section>
      )}

      {/* 4. BUILDING MATERIALS (Moved Down) */}
      <section className="inventory-section">
          <div className="section-header">Building Materials</div>
          <div className="list-grid-layout">
             <SimpleListGroup title="Standard" items={groups.build_normal} userId={userId} />
             <SimpleListGroup title="Z-Materials" items={groups.build_z} userId={userId} />
          </div>
      </section>

      {/* 5. OTHER */}
      <div className="list-grid-layout">
          {groups.tickets.length > 0 && (
              <SimpleListGroup title="Tickets" items={groups.tickets} userId={userId} />
          )}
          {groups.other.length > 0 && (
              <SimpleListGroup title="Other Items" items={groups.other} userId={userId} />
          )}
      </div>
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

function MaterialListRow({ item, userId }) {
    const needed = item.needed;
    const owned = item.owned;
    const pct = needed > 0 ? Math.min(100, (owned / needed) * 100) : 0;
    
    let statusClass = 'fill-good';
    let textClass = 'text-good';
    if (needed > 0 && owned < needed) {
        statusClass = 'fill-bad';
        textClass = 'text-bad';
    } 

    // Aggressive Regex cleaning
    const displayName = item.item_name
        .replace(/Behemoth\s+/i, '')
        .replace(/\s+Seeds?/i, '')
        .replace(/\s+Fruits?/i, '')
        .replace(/\s+Stones?/i, '')
        .replace(/\s+Gems?/i, '')
        .replace(/\s+Catseyes?/i, '');

    return (
        <div className={`list-row smart ${owned === 0 ? 'is-zero' : ''}`}>
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

function CurrencyCard({ item, userId }) {
    return (
        <div className="currency-card">
            <div className="currency-header">
                <img src={`${BASE_URL}/items/${item.image_url}`} style={{width:24, height:24}} alt="" />
                <span className="currency-name">{item.item_name}</span>
            </div>
            <div style={{marginLeft: 'auto'}}>
                <QuantityInput 
                    userId={userId}
                    itemId={item.item_id}
                    initialQuantity={item.owned}
                    wide={false}
                />
            </div>
        </div>
    );
}

export default InventoryPage;