import React, { useState, useEffect, useMemo } from 'react';
import { authStore } from '../stores/authStore';
import { userTrackerService } from '../api/userTrackerService';
import { itemService } from '../api/itemService'; // We need the static item list
import QuantityInput from '../components/inventory/QuantityInput.jsx';

function InventoryPage() {
  const [staticItems, setStaticItems] = useState([]);
  const [userInventory, setUserInventory] = useState(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userId, setUserId] = useState(authStore.getState().userId);

  useEffect(() => {
    // Subscribe to auth changes
    const unsubscribe = authStore.subscribe(state => setUserId(state.userId));
    return unsubscribe;
  }, []);

  useEffect(() => {
    // Fetch all data for the page
    async function fetchData() {
      if (!userId) return;
      setIsLoading(true);
      setError(null);
      try {
        // Fetch static item definitions AND user's inventory
        const [items, inventoryData] = await Promise.all([
          itemService.getItemDefinitions(),
          userTrackerService.getUserInventory(userId)
        ]);
        
        // Convert user inventory array to a Map for fast lookups
        const invMap = new Map();
        inventoryData.forEach(item => invMap.set(item.item_id, item.item_quantity));

        setStaticItems(items);
        setUserInventory(invMap);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [userId]);

  // --- Grouping Logic (Spec 8) ---
  const groupedItems = useMemo(() => {
    const groups = {
      EvolutionItems: [],
      Catseyes: [],
      Currencies: [],
      Tickets: [],
      BattleItems: [],
    };
    
    // We loop through the *static* list to show all items
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
        // ... add other cases as needed
        default:
          break;
      }
    }
    return groups;
  }, [staticItems]);

  // --- Render Logic ---
  if (isLoading) return <div>Loading Inventory...</div>;
  if (error) return <div style={{ color: 'red' }}>Error: {error}</div>;

  return (
    <div>
      <h1>Inventory</h1>
      <p>Items will auto-save when you change their quantity.</p>
      
      <input type="text" placeholder="Search inventory..." style={{ width: '100%', padding: '0.5rem' }} />

      <ItemGroup 
        title="Evolution Items" 
        items={groupedItems.EvolutionItems} 
        userInventory={userInventory}
        userId={userId} 
      />
      <ItemGroup 
        title="Currencies" 
        items={groupedItems.Currencies} 
        userInventory={userInventory}
        userId={userId} 
      />
      {/* (Add other groups here) */}
    </div>
  );
}

/**
 * A helper component to render a single panel
 */
function ItemGroup({ title, items, userInventory, userId }) {
  if (items.length === 0) return null;
  
  return (
    <div style={{ margin: '2rem 0', border: '1px solid #ccc', borderRadius: '6px' }}>
      <h3 style={{ padding: '1rem', borderBottom: '1px solid #ccc', margin: 0 }}>{title}</h3>
      {items.map(item => {
        // Get the user's quantity for this item, default to 0
        const userQty = userInventory.get(item.item_id) || 0;
        
        return (
          <div key={item.item_id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', borderBottom: '1px solid #eee' }}>
            <div>
              {/* <img src={item.image_url} ... />  We'll fix images later */}
              <span>{item.item_name}</span>
            </div>
            <QuantityInput 
              userId={userId} 
              itemId={item.item_id} 
              initialQuantity={userQty} 
            />
          </div>
        );
      })}
    </div>
  );
}

export default InventoryPage;