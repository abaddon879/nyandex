<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Battle Cats - Redesign</title>
    <link rel="stylesheet" href="../assets/css/redesign.css">
</head>
<body>

    <div class="app-layout">
        <aside class="left-panel">
            <header class="panel-header">
                <h1>The Battle Cats</h1>
                <div class="search-container">
                    <input type="text" id="search" placeholder="Search for a cat...">
                </div>
            </header>
            <div class="filter-controls">
                <div id="filter-options">
                    <div><label><input type="checkbox" value="upgrade"> Ready to Evolve</label></div>
                    
                    <hr style="margin: 10px 0; border-color: #eee;">
                    <div class="filter-radio-group">
                        <div><label><input type="radio" name="ownership" value="all" checked> All</label></div>
                        <div><label><input type="radio" name="ownership" value="owned"> Owned Only</label></div>
                        <div><label><input type="radio" name="ownership" value="missing"> Missing Only</label></div>
                    </div>
                    <hr style="margin: 10px 0; border-color: #eee;">
                    </div>
                <button id="clear-filters-btn">Clear All Filters</button>
            </div>
            
            <nav class="panel-nav"></nav>
        </aside>

        <main class="main-content">
            <header class="content-header">
                <h1>Cats</h1>
            </header>

            <div class="view-controls">
                <div id="list-select-all-container" style="display: none; margin-right: auto;">
                    <label>
                        <input type="checkbox" id="list-select-all-toggle">
                        <strong>Select All</strong>
                    </label>
                </div>
                <div class="sort-controls">
                    <label for="sort-select">Sort by:</label>
                    <select id="sort-select">
                        <option value="default">Default Order</option>
                        <option value="id">ID</option>
                        <option value="name">Name</option>
                        <option value="level">User Level</option>
                    </select>
                    <button id="sort-direction-btn" aria-label="Toggle sort direction">ASC</button>
                </div>
                <div id="list-quick-edit-container">
                    <label>
                        <input type="checkbox" id="list-quick-edit-toggle">
                        <strong>List Quick Edit</strong>
                    </label>
                </div>
                <div class="view-toggle">
                    <button id="grid-view-btn" class="view-btn active" aria-label="Grid View">
                        Grid
                    </button>
                    <button id="list-view-btn" class="view-btn" aria-label="List View">
                        List
                    </button>
                </div>
            </div>

            <div id="cat-sections"></div>

            <div id="bulk-action-bar" class="hidden">
                <div class="bulk-action-bar-content">
                    <span id="bulk-select-count">0 units selected</span>
                    
                    <div class="bulk-action-inputs">
                        <label>Level: <input type="number" id="bulk-level-input" min="1"></label>
                        <label>+Level: <input type="number" id="bulk-plus-level-input" min="0"></label>
                        <button id="bulk-set-level-btn">Set Levels</button>
                    </div>

                    <div class="bulk-action-buttons">
                        <button id="bulk-add-btn">Add Selected</button>
                    </div>
                </div>
            </div>

        </main>

        <aside class="right-panel">
            <div id="detail-panel-content" class="hidden">
                <div class="detail-header">
                    <h2 id="detail-name"></h2>
                    <span id="detail-id"></span>
                </div>
                <div class="levels">
                    <label>Level
                        <input id="detail-level-input" class="level-input" type="number" min="1">
                    </label>
                    <label>+Level
                        <input id="detail-plus-level-input" class="plus-level-input" type="number" min="0">
                    </label>
                </div>
                <div class="form-button-group" id="detail-form-buttons">
                    </div>
                <div id="detail-forms-container">
                    </div>
                <button id="detail-remove-btn" class="remove">Remove Cat</button>
            </div>
            <div id="detail-panel-placeholder">
                <p>Select a cat to view its details.</p>
            </div>
        </aside>
    </div>

    <script>
        window.userId = <?php echo json_encode($_SESSION['user_id'] ?? null); ?>;
    </script>
    <script src="../assets/scripts/app.js" type="module" defer></script>

</body>
</html>