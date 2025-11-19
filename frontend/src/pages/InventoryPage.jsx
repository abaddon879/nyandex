import React, { useState, useEffect, useMemo } from 'react';
import { authStore } from '../stores/authStore';
import { userTrackerService } from '../api/userTrackerService';
import { itemService } from '../api/itemService'; 
import QuantityInput from '../components/inventory/QuantityInput.jsx';

// Robust URL handling: Ensures we point to the /items/ directory
const RAW_BASE_URL = import.meta.env.VITE_IMAGE_BASE_URL || '';
const ITEM_BASE_URL = RAW_BASE_URL.includes('/units') 
  ? RAW_BASE_URL.replace('/units', '/items') 
  : RAW_BASE_URL.replace(/\/$/, '') + '/items'; 

function InventoryPage() {
  const [staticItems, setStaticItems] = useState([]);
  const [userInventory, setUserInventory] = useState([]); 
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userId, setUserId] = useState(authStore.getState().userId);

  useEffect(() => {
    const unsubscribe = authStore.subscribe(state => setUserId(state.userId));
    return unsubscribe;
  }, []);

  useEffect(() => {
    async function fetchData() {
      if (!userId) return;
      setIsLoading(true);
      setError(null);
      try {
        // Fetch static items AND the new "Smart" inventory list
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

  // Helper map for fast lookups of the user's specific data (qty owned + qty needed)
  const inventoryMap = useMemo(() => {
    const map = new Map();
    userInventory.forEach(ui => map.set(ui.item_id, ui));
    return map;
  }, [userInventory]);

  const groupedItems = useMemo(() => {
    const groups = {
      EvolutionItems: [],
      Catseyes: [],
      Currencies: [],
      Tickets: [],
      BattleItems: [],
    };
    
    for (const item of staticItems) {
      switch (item.item_type) {
        case 'Catseed':
        case 'Catfruit':
        case 'Material':
        case 'Material Z':
          groups.EvolutionItems.push(item);
          break;
        case 'Catseye':
          groups.Catseyes.push(item);
          break;
        case 'XP':
        case 'NP':
        case 'Currency':
          groups.Currencies.push(item);
          break;
        case 'Ticket':
          groups.Tickets.push(item);
          break;
        case 'Battle Item':
          groups.BattleItems.push(item);
          break;
        default:
          break;
      }
    }
    return groups;
  }, [staticItems]);

  if (isLoading) return <div style={{padding:'2rem'}}>Loading Inventory...</div>;
  if (error) return <div style={{padding:'2rem', color:'red'}}>Error: {error}</div>;

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <h1>Inventory</h1>
      
      <input type="text" placeholder="Search inventory..." className="form-input" style={{ width: '100%', marginBottom: '1rem' }} />

      <ItemGroup 
        title="Evolution Materials" 
        items={groupedItems.EvolutionItems} 
        inventoryMap={inventoryMap}
        userId={userId} 
      />
      <ItemGroup 
        title="Catseyes" 
        items={groupedItems.Catseyes} 
        inventoryMap={inventoryMap}
        userId={userId} 
      />
       <ItemGroup 
        title="Currencies" 
        items={groupedItems.Currencies} 
        inventoryMap={inventoryMap}
        userId={userId} 
      />
      <ItemGroup 
        title="Tickets" 
        items={groupedItems.Tickets} 
        inventoryMap={inventoryMap}
        userId={userId} 
      />
    </div>
  );
}

function ItemGroup({ title, items, inventoryMap, userId }) {
  if (items.length === 0) return null;
  
  return (
    <div style={{ marginBottom: '2rem', background: '#fff', border: '1px solid var(--color-border)', borderRadius: '8px', overflow: 'hidden' }}>
      <h3 style={{ padding: '1rem', background: '#f8f9fa', borderBottom: '1px solid var(--color-border)', margin: 0, fontSize: '1.1rem' }}>{title}</h3>
      <div>
        {items.map(item => {
          const userData = inventoryMap.get(item.item_id) || {};
          const owned = userData.item_quantity || 0;
          const needed = parseInt(userData.quantity_needed) || 0;
          
          // Styling for the "Needed" badge
          const isDeficit = owned < needed;
          
          return (
            <div key={item.item_id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', borderBottom: '1px solid #eee' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f1f1f1', borderRadius: '4px' }}>
                   {item.image_url ? (
                       <img src={`${ITEM_BASE_URL}/${item.image_url}`} alt={item.item_name} style={{ maxWidth: '100%', maxHeight: '100%' }} />
                   ) : (
                       <span>?</span>
                   )}
                </div>
                <div>
                    <div style={{ fontWeight: '600' }}>{item.item_name}</div>
                    {needed > 0 && (
                        <div style={{ fontSize: '0.8rem', color: isDeficit ? 'var(--color-accent-destructive)' : 'var(--color-accent-success)' }}>
                            Needed: {needed} {isDeficit ? `(Missing ${needed - owned})` : '✓'}
                        </div>
                    )}
                </div>
              </div>
              <QuantityInput 
                userId={userId} 
                itemId={item.item_id} 
                initialQuantity={owned} 
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default InventoryPage;