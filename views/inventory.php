<div class="inventory-layout">

    <div class="inventory-main-content">
        <header class="inventory-header">
            <h1>Inventory</h1>
            <input type="text" id="search" class="inventory-search" placeholder="Search for an item...">
        </header>

        <div id="item-sections">
            <p>Loading items...</p> </div>
    </div>

    <aside class="inventory-detail-panel">
        <div id="detail-panel-content" class="hidden">
            <button class="close-detail-panel" aria-label="Close details">&times;</button>
            <div class="detail-header">
                <h2 id="detail-name">Item Name</h2>
                <span id="detail-id">#000</span>
            </div>
            <img id="detail-image" src="" alt="Item Image" class="detail-item-image">
            <p id="detail-description">Item description goes here.</p>
            <div class="detail-quantity">
                <label for="detail-qty-input">Quantity:</label>
                <input type="number" id="detail-qty-input" min="0">
            </div>
            <p><strong>Type:</strong> <span id="detail-type">Item Type</span></p>

            <div id="detail-usage" class="detail-usage-section">
                <h3>Used For:</h3>
                <ul id="detail-usage-list"> 
                    </ul>
                <p id="detail-usage-none" class="hidden">Not currently required for any evolutions.</p>
            </div>
            </div>
        <div id="detail-panel-placeholder">
            <p>Select an item to view its details.</p>
        </div>
    </aside>

</div>