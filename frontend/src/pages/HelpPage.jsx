import React, { useState, useEffect } from 'react';

// Helper to fetch version directly
async function fetchLatestVersion() {
  const token = localStorage.getItem('api_key');
  const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
  
  try {
    // [FIXED] Point to the public endpoint, not the admin one
    const response = await fetch('/api/versions/latest', { headers });
    if (response.ok) {
        return await response.json();
    }
  } catch (e) {
    console.error("Failed to fetch version", e);
  }
  return null;
}

function HelpPage() {
  const [versionData, setVersionData] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchLatestVersion().then(data => setVersionData(data));
  }, []);

  // [FIXED] Helper to safely get the ID. 
  // The DB column is 'version_id', but we handle both just in case.
  const displayVersion = versionData ? (versionData.version_id || versionData.version) : null;

  const faqData = [
    {
      category: "Getting Started",
      items: [
        {
          q: "How do I add my collection for the first time?",
          a: "Go to the Catalog page, click 'Bulk Edit', filter by 'Missing', select all your cats using 'Select All', and click 'Mark Owned'. This is the fastest way to populate your tracker."
        },
        {
          q: "How do I update my item inventory?",
          a: "Go to the Inventory page. You can use the + and - buttons for small adjustments, or click directly on the number to type in a new quantity."
        }
      ]
    },
    {
      category: "Core Features",
      items: [
        {
          q: "What does 'Ready to Evolve' mean?",
          a: "This alert appears on your Dashboard when a cat meets BOTH the level requirement AND you have all the necessary items (Seeds, Fruit, Stones) in your Inventory for its next evolution."
        },
        {
          q: "How do I track specific units?",
          a: "On any Cat Detail Page, click the 📌 Track button. This adds the cat to your Pinned Units widget on the Dashboard so you can easily monitor its missing requirements."
        },
        {
            q: "How does the Inventory 'Needed' count work?",
            a: "The system calculates the total number of items required for the next evolution of every cat you own. It does not currently calculate items needed for future forms beyond the immediate next one."
        }
      ]
    },
    {
      category: "Pro Tips",
      items: [
        {
          q: "Can I select multiple cats at once?",
          a: "Yes! In the Catalog's 'Bulk Edit' mode, you can hold the SHIFT key and click two cats to instantly select every cat in between them. This is great for marking entire sets of cats as owned."
        },
        {
          q: "How do I preview stats without changing my level?",
          a: "On a Cat Detail page, you can change the level or form to see how the stats (HP, Damage, DPS) change in real-time. These changes are a 'preview' and won't be saved to your account until you click the 'Save Changes' button."
        }
      ]
    },
    {
      category: "Data & Account",
      items: [
        {
          q: "Where does the data come from?",
          // [FIXED] Use the corrected displayVersion variable
          a: `Game data is parsed directly from the game files${displayVersion ? ` (ver ${displayVersion})` : ''}. Stats shown are calculated based on your specific level input.`
        },
        {
          q: "Will I lose my data?",
          a: "If you are using a Guest Account, your data is saved in your browser. If you clear your cache or switch devices, it will be lost. We highly recommend converting to a Registered Account to sync your data safely."
        },
        {
          q: "How do I reset my data / start over?",
          a: "Go to the Account page. If you are a Guest, there is a 'Reset Data' option which wipes your browser storage and assigns you a fresh anonymous ID."
        }
      ]
    },
    {
      category: "Support",
      items: [
        {
          q: "I found a bug or missing data. What should I do?",
          a: "Please verify that you are on the latest version of the game data (shown at the bottom of this page). If the issue persists, you can report it on our project repository."
        }
      ]
    }
  ];

  // Filter logic
  const filteredFAQs = faqData.map(group => {
    const filteredItems = group.items.filter(item => 
      item.q.toLowerCase().includes(searchQuery.toLowerCase()) || 
      item.a.toLowerCase().includes(searchQuery.toLowerCase())
    );
    return { ...group, items: filteredItems };
  }).filter(group => group.items.length > 0);

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <h1>Help & FAQ</h1>
      
      {/* Search Bar */}
      <div style={{ marginBottom: '2rem' }}>
        <input 
            type="text" 
            placeholder="Search help topics..." 
            className="form-input" 
            style={{ width: '100%', padding: '12px', fontSize: '1.1rem' }}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {filteredFAQs.length === 0 ? (
          <div className="text-secondary" style={{textAlign:'center', marginTop:'2rem', fontSize: '1.1rem'}}>
              No topics found matching "{searchQuery}".
          </div>
      ) : (
          filteredFAQs.map((group, gIdx) => (
            <section key={gIdx} style={{ marginBottom: '2rem' }}>
              <h2 style={{ borderBottom: '2px solid var(--color-border)', paddingBottom: '0.5rem' }}>{group.category}</h2>
              {group.items.map((item, iIdx) => (
                <div key={iIdx} style={{ marginBottom: '1.5rem' }}>
                  <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', color: 'var(--color-text-primary)' }}>{item.q}</h3>
                  <p className="text-secondary" style={{ lineHeight: '1.5' }}>{item.a}</p>
                </div>
              ))}
            </section>
          ))
      )}
      
      {/* Dynamic Version Footer */}
      <div style={{ marginTop: '4rem', borderTop: '1px solid #eee', paddingTop: '1rem', fontSize: '0.8rem', color: '#999', textAlign: 'center' }}>
          NyanDex Data Version: {displayVersion ? `${displayVersion} (Released: ${versionData.release_date})` : 'Loading Version...'}
      </div>
    </div>
  );
}

export default HelpPage;