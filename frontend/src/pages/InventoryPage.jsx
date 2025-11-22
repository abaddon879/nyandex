import React, { useState, useEffect, useMemo } from 'react';
import { authStore } from '../stores/authStore';
import { userTrackerService } from '../api/userTrackerService';
import { itemService } from '../api/itemService'; 
import QuantityInput from '../components/inventory/QuantityInput.jsx';
import './InventoryPage.css';

const RAW_BASE_URL = import.meta.env.VITE_IMAGE_BASE_URL || '';
const BASE_URL = RAW_BASE_URL.replace(/\/$/, '');

function InventoryPage() {
  const [staticItems, setStaticItems] = useState([]);
  const [userInventory, setUserInventory] = useState([]); 
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
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
        setError(err.message);
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
        owned: userData?.item_quantity || 0,
        needed: parseInt(userData?.quantity_needed || 0),
      };
    });
  }, [staticItems, userInventory]);

  const groups = useMemo(() => {
    const result = {
      evolution: { title: 'Evolution Materials', items: [], type: 'smart', className: 'panel-evolution' },
      building: { title: 'Building Materials', items: [], type: 'smart', className: 'panel-building' },
      catseyes: { title: 'Catseyes', items: [], type: 'smart', className: 'panel-catseyes' },
      currencies: { title: 'Currencies', items: [], type: 'simple', className: 'panel-currencies' },
      tickets: { title: 'Tickets', items: [], type: 'simple', className: 'panel-tickets' },
      battle: { title: 'Battle Items', items: [], type: 'simple', className: 'panel-battle' },
      other: { title: 'Other', items: [], type: 'simple', className: 'panel-other' }
    };

    const filtered = mergedItems.filter(i => 
      i.item_name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    filtered.forEach(item => {
        switch (item.item_type) {
            case 'Catseed': case 'Catfruit': case 'Behemoth Stone': case 'Behemoth Gem':
                result.evolution.items.push(item); break;
            case 'Material': case 'Material Z':
                result.building.items.push(item); break;
            case 'Catseye':
                result.catseyes.items.push(item); break;
            case 'XP': case 'NP': case 'Currency':
                result.currencies.items.push(item); break;
            case 'Ticket':
                result.tickets.items.push(item); break;
            case 'Battle Item': case 'Catamin':
                result.battle.items.push(item); break;
            default:
                result.other.items.push(item);
        }
    });

    Object.values(result).forEach(g => g.items.sort((a, b) => a.item_id - b.item_id));

    return result;
  }, [mergedItems, searchQuery]);

  if (isLoading) return <div style={{padding:'2rem', textAlign:'center'}}>Loading Inventory...</div>;
  if (error) return <div style={{padding:'2rem', color:'red'}}>Error: {error}</div>;

  return (
    <div className="inventory-container">
      <div className="inventory-header-row">
        <h1 className="inventory-title">Inventory</h1>
      </div>
      
      <input 
        type="text" 
        placeholder="Search items..." 
        className="inventory-search"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />

      {/* Grid Container */}
      <div className="inventory-grid">
          {Object.entries(groups).map(([key, group]) => (
            <ItemGroup 
                key={key} 
                title={group.title} 
                items={group.items} 
                isSmart={group.type === 'smart'} 
                className={group.className} // Pass the grid class
                userId={userId} 
            />
          ))}
      </div>
    </div>
  );
}

function ItemGroup({ title, items, isSmart, className, userId }) {
  if (items.length === 0) return null;
  
  return (
    <div className={`inventory-card ${className}`}>
      <div className="inventory-card-header">
        <h3 className="inventory-card-title">{title}</h3>
        <span className="inventory-count">{items.length} Items</span>
      </div>
      <div className="inventory-list custom-scrollbar">
        {items.map(item => {
           const needed = item.needed;
           const owned = item.owned;
           const pct = needed > 0 ? Math.min(100, (owned / needed) * 100) : 0;
           
           let statusClass = 'fill-good';
           let textClass = 'text-good';
           
           if (needed > 0 && owned < needed) {
               statusClass = 'fill-bad';
               textClass = 'text-bad';
           } 

           return (
            <div key={item.item_id} className={`inventory-row ${isSmart ? 'smart' : 'simple'}`}>
              {/* Info */}
              <div className="col-item">
                <div className="item-icon-box">
                    {item.image_url ? (
                        <img src={`${BASE_URL}/items/${item.image_url}`} alt={item.item_name} className="item-icon" />
                    ) : (<span>?</span>)}
                </div>
                <span className="item-name">{item.item_name}</span>
              </div>

              {/* Status (Smart Only) */}
              {isSmart && (
                  <div className="col-status">
                    {needed > 0 ? (
                        <>
                            <div className="status-label">
                                <span className={textClass}>
                                    {owned < needed ? `Missing ${needed - owned}` : 'Ready'}
                                </span>
                                <span style={{color:'#64748b'}}>
                                    {owned} / {needed}
                                </span>
                            </div>
                            <div className="status-track">
                                <div className={`status-fill ${statusClass}`} style={{width: `${pct}%`}}></div>
                            </div>
                        </>
                    ) : (
                        <div className="status-label" style={{color:'#94a3b8', fontWeight:'normal'}}>
                            <span>No immediate use</span>
                        </div>
                    )}
                  </div>
              )}

              {/* Input */}
              <div className="col-qty">
                 <QuantityInput 
                    userId={userId}
                    itemId={item.item_id}
                    initialQuantity={item.owned}
                 />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default InventoryPage;