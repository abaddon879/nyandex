import React from 'react';

function HelpPage() {
  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <h1>Help & FAQ</h1>

      <section style={{ marginBottom: '2rem' }}>
        <h2>Core Features</h2>
        
        <div style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>What does "Ready to Evolve" mean?</h3>
          <p className="text-secondary">
            This alert appears on your Dashboard when a cat meets <strong>both</strong> the level requirement 
            AND you have all the necessary items (Seeds, Fruit, Stones) in your Inventory for its next evolution.
          </p>
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>How do I track specific units?</h3>
          <p className="text-secondary">
            On any <strong>Cat Detail Page</strong>, click the <span style={{border: '1px solid #ccc', padding: '2px 4px', borderRadius: '4px', fontSize: '0.8rem'}}>📌 Track</span> button. 
            This adds the cat to your <strong>Pinned Units</strong> widget on the Dashboard so you can easily monitor its missing requirements.
          </p>
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>How does the Inventory "Needed" count work?</h3>
          <p className="text-secondary">
             The system calculates the total number of items required for the <em>next evolution</em> of every cat you own. 
             It does not currently calculate items needed for <em>future</em> forms beyond the immediate next one.
          </p>
        </div>
      </section>

      <section>
        <h2>Data & Account</h2>
        <div style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>Where does the data come from?</h3>
          <p className="text-secondary">
            Game data is parsed directly from the game files (ver 14.7.0). 
            Stats shown are calculated based on your specific level input.
          </p>
        </div>
        
        <div style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>Will I lose my data?</h3>
          <p className="text-secondary">
            If you are using a <strong>Guest Account</strong>, your data is saved in your browser. 
            If you clear your cache or switch devices, it will be lost. 
            <br/>
            We highly recommend converting to a <strong>Registered Account</strong> on the Account page to sync your data safely.
          </p>
        </div>
      </section>
    </div>
  );
}

export default HelpPage;