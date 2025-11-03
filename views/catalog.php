<div class="catalog-layout">

    <div class="catalog-main-content">
        <header class="catalog-header">
            <h1>Catalog</h1> 

            <div class="catalog-controls">
                
                <div class="search-container">
                    <input type="text" id="search" placeholder="Search for a cat...">
                </div>

                <div class="filter-controls">
                    <label for="rarity-select">Rarity:</label>
                    <select id="rarity-select">
                        </select>
                </div>

                <div class="filter-controls">
                    <button id="toggle-filters-btn" class="btn btn-secondary btn-sm">Filters ▼</button>
                </div>

                <div class="sort-controls">
                    <label for="sort-select">Sort by:</label>
                    <select id="sort-select">
                        <option value="default">Default Order</option>
                        <option value="id">ID</option>
                        <option value="name">Name</option>
                        <option value="level">User Level</option>
                    </select>
                    <button id="sort-direction-btn" class="btn btn-secondary btn-sm">ASC</button>
                </div>

                <div id="list-quick-edit-container"> 
                    <label>
                        <input type="checkbox" id="list-quick-edit-toggle">
                        <strong>Quick Edit</strong>
                    </label>
                </div>
                
                <div class="view-toggle">
                    <button id="grid-view-btn" class="view-btn btn btn-secondary btn-sm active" aria-label="Grid View">Grid</button>
                    <button id="list-view-btn" class="view-btn btn btn-secondary btn-sm" aria-label="List View">List</button>
                </div>
            </div>
        </header>

        <div id="advanced-filters" class="hidden">
             <div class="filter-group">
                 <h4>Status</h4>
                 <label><input type="checkbox" value="upgrade"> Ready to Evolve</label>
             </div>
             <div class="filter-group">
                 <h4>Ownership</h4>
                 <label><input type="radio" name="ownership" value="all" checked> All</label>
                 <label><input type="radio" name="ownership" value="owned"> Owned Only</label>
                 <label><input type="radio" name="ownership" value="missing"> Missing Only</label>
             </div>
            <div class="filter-actions">
                 <button id="clear-filters-btn" class="btn btn-secondary btn-sm">Clear All Filters</button>
            </div>
        </div>

        <div id="cat-sections">
            <p>Loading cats...</p> </div>

        <div id="bulk-action-bar" class="hidden">
            <div class="bulk-action-bar-content">
                <span id="bulk-select-count">0 units selected</span>
                <div class="bulk-action-inputs">
                    <label>Level: <input type="number" id="bulk-level-input" min="1"></label>
                    <label>+Level: <input type="number" id="bulk-plus-level-input" min="0"></label>
                    <button id="bulk-set-level-btn" class="btn btn-secondary btn-sm">Set Levels</button> 
                </div>
                <div class="bulk-action-buttons">
                    <button id="bulk-deselect-btn" class="btn btn-secondary btn-sm">Deselect All</button>
                    <button id="bulk-set-max-btn" class="btn btn-secondary btn-sm">Set to Max</button>
                    <button id="bulk-add-btn" class="btn btn-primary btn-sm">Add Selected</button> 
                </div>
            </div>
        </div>

    </div>

    <aside class="catalog-detail-panel">

        <div class="panel-card" id="panel-summary-card">
            <div id="panel-summary">
                <h3>Collection Summary</h3>
                <div id="summary-stats">
                    <p>Owned: <span id="summary-owned-count">--</span>/<span id="summary-total-count">--</span></p>
                    <p>Ready to Evolve: <span id="summary-evolve-count">--</span></p>
                    <p>Missing: <span id="summary-missing-count">--</span></p>
                </div>
                <h4>Key Items</h4>
                <div id="summary-items">
                    <p>Loading items...</p>
                </div>
            </div>
        </div> 

        <div class="panel-card hidden" id="detail-panel-card"> 
            <div id="detail-panel-content">
                <div class="detail-header">
                    <h2 id="detail-name">Cat Name</h2>
                    <span id="detail-id">#000</span>
                </div>
                <div class="levels">
                    <div class="detail-level-display">
                        <strong>Level:</strong> <span id="detail-level-text">--</span>
                        <strong>+Level:</strong> <span id="detail-plus-level-text">--</span>
                    </div>
                </div>
                <div id="detail-forms-container">
                    </div>
                <button id="detail-remove-btn" class="btn btn-danger btn-block btn-sm">Remove Cat</button>
            </div>
        </div>

    </aside>

</div>