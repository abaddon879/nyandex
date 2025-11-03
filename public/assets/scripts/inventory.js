// assets/scripts/inventory.js

// Assume Logger & showErrorToast are available globally
const Logger = window.Logger || {
    info: (message, data = '') => { console.info(`[${new Date().toLocaleTimeString()}] [INFO] ${message}`, data); },
    error: (message, error = '') => { console.error(`[${new Date().toLocaleTimeString()}] [ERROR] ${message}`, error); }
};
const showErrorToast = window.showErrorToast || ((message) => { Logger.error(message); alert(message); });

// State object
const appState = {
    userItems: [],
    // Attempt to get cat data from global app state for usage info
    allCats: window.appState ? window.appState.userCats : [],
    selectedItemId: null
};

// userId is already defined globally by layout.php, DO NOT re-declare
// const userId = window.userId; // REMOVED

// --- DOM Element References ---
const inventoryLayout = document.querySelector('.inventory-layout');
const itemSectionsContainer = document.getElementById('item-sections'); // Correct ID used here
const detailPanel = document.querySelector('.inventory-detail-panel');
const detailContent = document.getElementById('detail-panel-content');
const detailPlaceholder = document.getElementById('detail-panel-placeholder');
const detailCloseBtn = detailContent.querySelector('.close-detail-panel');
const detailName = document.getElementById('detail-name');
const detailId = document.getElementById('detail-id');
const detailImage = document.getElementById('detail-image');
const detailDescription = document.getElementById('detail-description');
const detailQtyInput = document.getElementById('detail-qty-input');
const detailType = document.getElementById('detail-type');
const detailUsageList = document.getElementById('detail-usage-list');
const detailUsageNone = document.getElementById('detail-usage-none');
const searchInput = document.getElementById('search');

// --- INITIAL DATA LOAD ---
fetch(`/user_api_proxy.php/users/${userId}/items`) // Use global userId directly
    .then(response => {
        if (!response.ok) throw new Error(`Response status: ${response.status}`);
        return response.json();
     })
    .then(itemsData => {
        appState.userItems = itemsData;
        Logger.info('Inventory items loaded:', appState.userItems);
        renderInventoryItems(appState.userItems);
        setupEventListeners();
    })
    .catch(error => {
        Logger.error('Error loading inventory items:', error);
        showErrorToast('Could not load inventory data.');
        if(itemSectionsContainer) { // Check if container exists before setting innerHTML
             itemSectionsContainer.innerHTML = '<p style="text-align: center; color: #cc0000;">Failed to load inventory items.</p>';
        }
    });

// --- RENDERING ---
function renderInventoryItems(items) {
    Logger.info("Starting renderInventoryItems...");

    if (!itemSectionsContainer) {
        Logger.error("Could not find #item-sections container!");
        return;
    }
    itemSectionsContainer.innerHTML = ''; // Clear loading/previous

    // Define categories based on user_info_en.html
    const categories = [
        { name: "Battle Items", ids: [0, 1, 2, 3, 4, 5] },
        { name: "Catamins", ids: [55, 56, 57] },
        { name: "Building Materials", ids: [85, 86, 87, 88, 89, 90, 91, 140, 187, 188, 189, 190, 191, 192, 193, 194, 92] },
        { name: "Catfruit Seeds", ids: [30, 31, 32, 33, 34, 43, 160, 41, 164] },
        { name: "Catfruit", ids: [35, 36, 37, 38, 39, 40, 161, 42, 44] },
        { name: "Behemoth Stones", ids: [167, 168, 169, 170, 171, 184, 179, 180, 181, 182, 183] },
        { name: "Catseyes", ids: [50, 51, 52, 53, 54, 58] },
    ];
    const categorizedIds = new Set(categories.flatMap(cat => cat.ids));
    Logger.info(`Processing ${categories.length} categories...`);

    categories.forEach((cat, catIndex) => {
        Logger.info(`Processing category ${catIndex}: ${cat.name}`);
        const itemsInCategory = cat.ids
            .map(id => items.find(item => item.item_id === id))
            .filter(item => item !== undefined);

        if (itemsInCategory.length > 0) {
            const categoryDiv = document.createElement('div');
            categoryDiv.className = 'item-section';
            const header = document.createElement('h2');
            header.className = 'category-header';
            header.textContent = cat.name;
            const grid = document.createElement('div');
            grid.className = 'item-grid';

            itemsInCategory.forEach((item, itemIndex) => {
                try {
                    Logger.info(`  - Rendering item ${itemIndex}: ID ${item.item_id} (${item.item_name})`);
                    const cardElement = createItemCardElement(item);
                    if (cardElement) {
                        grid.appendChild(cardElement);
                    } else {
                        Logger.error(`createItemCardElement returned null for item ID ${item.item_id}`);
                    }
                } catch (e) {
                    Logger.error(`Error rendering item ID ${item?.item_id}:`, e);
                }
            });

            categoryDiv.appendChild(header);
            categoryDiv.appendChild(grid);
            itemSectionsContainer.appendChild(categoryDiv);
        } else {
             Logger.info(`Skipping empty category: ${cat.name}`);
        }
    });

    // Handle uncategorized items
    const uncategorizedItems = items.filter(item => !categorizedIds.has(item.item_id));
    if (uncategorizedItems.length > 0) {
        Logger.info(`Rendering ${uncategorizedItems.length} uncategorized items...`);
         const categoryDiv = document.createElement('div');
         categoryDiv.className = 'item-section';
         const header = document.createElement('h2');
         header.className = 'category-header';
         header.textContent = "Other Items";
         const grid = document.createElement('div');
         grid.className = 'item-grid';
         uncategorizedItems.sort((a,b) => a.item_id - b.item_id).forEach((item, itemIndex) => {
             try {
                Logger.info(`  - Rendering uncategorized item ${itemIndex}: ID ${item.item_id} (${item.item_name})`);
                const cardElement = createItemCardElement(item);
                if (cardElement) grid.appendChild(cardElement);
             } catch(e) {
                Logger.error(`Error rendering uncategorized item ID ${item?.item_id}:`, e);
             }
         });
         categoryDiv.appendChild(header);
         categoryDiv.appendChild(grid);
         itemSectionsContainer.appendChild(categoryDiv);
    }

    if (itemSectionsContainer.innerHTML === '') {
        Logger.info("No items rendered, displaying 'No items found'.");
        itemSectionsContainer.innerHTML = '<p style="text-align: center; color: #888;">No items found in inventory.</p>';
    } else {
        Logger.info("Finished rendering items.");
    }
}

// --- Helper to create individual item card ---
function createItemCardElement(item) {
    const itemCard = document.createElement('div');
    itemCard.className = 'item-card';
    itemCard.dataset.itemId = item.item_id;
    itemCard.addEventListener('click', () => showItemDetails(item.item_id));

    const imageUrl = item.image_url || `gatyaitemD_${String(item.item_id).padStart(3, '0')}_f.png`;
    const src = `/assets/images/items/${imageUrl}`;
    const itemName = item.item_name || `Item ${item.item_id}`;
    const itemQty = item.item_qty ?? 0;
    const itemNeeded = item.item_qty_required ?? 0;

    itemCard.innerHTML = `
        <img src="${src}" alt="${itemName}" title="${itemName}">
        <h4>${itemName}</h4>
        <div class="item-quantity-controls">
            <label for="qty-${item.item_id}">Quantity:</label>
            <input type="number" id="qty-${item.item_id}" class="item-quantity-input" min="0" value="${itemQty}">
            <label for="needed-${item.item_id}">Needed:</label>
            <input type="number" id="needed-${item.item_id}" value="${itemNeeded}" disabled>
        </div>
    `;

    const qtyInput = itemCard.querySelector('.item-quantity-input');
    qtyInput.addEventListener('click', (e) => e.stopPropagation());
    qtyInput.addEventListener('change', (event) => {
        handleQuantityChange(item.item_id, event.target);
    });

    return itemCard;
}

// --- DETAIL PANEL LOGIC ---
function showItemDetails(itemId) {
    Logger.info(`showItemDetails called for itemId: ${itemId}`);
    const item = appState.userItems.find(i => i.item_id === itemId);
    if (!item) {
        Logger.error(`Item not found in state for ID: ${itemId}`); // Add error log
        return;
    }

    appState.selectedItemId = itemId;
    Logger.info(`Showing details for item ID: ${itemId}`);

    document.querySelectorAll('.item-card.selected').forEach(el => el.classList.remove('selected'));
    const cardElement = itemSectionsContainer.querySelector(`.item-card[data-item-id="${itemId}"]`);
    if (cardElement) cardElement.classList.add('selected');

    detailName.textContent = item.item_name || `Item ${itemId}`;
    detailId.textContent = `#${String(item.item_id).padStart(3, '0')}`;
    detailImage.src = `/assets/images/items/${item.image_url || `gatyaitemD_${String(item.item_id).padStart(3, '0')}_f.png`}`;
    detailImage.alt = item.item_name;
    detailDescription.textContent = item.item_description || 'No description available.';
    detailQtyInput.value = item.item_qty ?? 0;
    detailType.textContent = item.item_type || 'Unknown';

    populateUsageInfo(item);

    detailContent.classList.remove('hidden');
    detailPlaceholder.classList.add('hidden');
    inventoryLayout.classList.add('detail-active');
}

function hideItemDetails() {
    if (appState.selectedItemId === null) return; // Already hidden
    Logger.info("Hiding detail panel.");
    appState.selectedItemId = null;
    document.querySelectorAll('.item-card.selected').forEach(el => el.classList.remove('selected'));
    inventoryLayout.classList.remove('detail-active');
    setTimeout(() => {
        if (!appState.selectedItemId) {
             detailContent.classList.add('hidden');
             detailPlaceholder.classList.remove('hidden');
        }
    }, 300);
}

function populateUsageInfo(item) {
    detailUsageList.innerHTML = '';
    let usageFound = false;

    if (appState.allCats && appState.allCats.length > 0) {
        appState.allCats.forEach(cat => {
            cat.forms.forEach(form => {
                form.evolution_requirements.forEach(req => {
                    if (req.item_id === item.item_id) {
                        usageFound = true;
                        const li = document.createElement('li');
                        const baseFormImage = cat.forms[0]?.image_url || 'default_cat.png';
                        li.innerHTML = `
                            <img src="/assets/images/units/${baseFormImage}" alt="${cat.cat_name}" title="${cat.cat_name}">
                            <span>${cat.cat_name} (Form: ${form.form_name})</span>
                            <span class="usage-qty">x ${req.item_qty}</span>
                        `;
                        detailUsageList.appendChild(li);
                    }
                });
            });
        });
    } else {
        Logger.info("Cat data not available for usage check.");
    }
    detailUsageNone.classList.toggle('hidden', usageFound);
    Logger.info(`Usage info populated for item ${item.item_id}. Found: ${usageFound}`);
}

// --- EVENT LISTENERS ---
function setupEventListeners() {
    Logger.info("Setting up event listeners for inventory...");
    if(searchInput) searchInput.addEventListener('input', filterItems);
    if(detailCloseBtn) detailCloseBtn.addEventListener('click', hideItemDetails);
    if(detailQtyInput) detailQtyInput.addEventListener('change', (event) => {
        if (appState.selectedItemId !== null) {
            handleQuantityChange(appState.selectedItemId, event.target);
            const cardInput = itemSectionsContainer.querySelector(`#qty-${appState.selectedItemId}`);
            if (cardInput) cardInput.value = event.target.value;
        }
    });
    Logger.info("Event listeners set up.");
}

// --- FILTERING ---
function filterItems() {
     const searchTerm = searchInput.value.toLowerCase();
     Logger.info(`Filtering items by: "${searchTerm}"`);

     document.querySelectorAll('.item-card').forEach(card => {
         const itemId = parseInt(card.dataset.itemId);
         const itemData = appState.userItems.find(i => i.item_id === itemId);
         const matchesSearch = itemData && itemData.item_name.toLowerCase().includes(searchTerm);
         card.style.display = matchesSearch ? '' : 'none';
     });

     document.querySelectorAll('.item-section').forEach(section => {
         const visibleItems = section.querySelectorAll('.item-card:not([style*="display: none"])');
         section.style.display = visibleItems.length > 0 ? '' : 'none';
     });
     Logger.info("Filtering applied.");
}

// --- API INTERACTIONS ---
function handleQuantityChange(itemId, inputElement) {
    const newValue = parseInt(inputElement.value);
    // ... (Keep validation logic) ...
    if (isNaN(newValue) || newValue < 0) { /* ... reset input, show error ... */ return; }

    const item = appState.userItems.find(i => i.item_id === itemId);
    // ... (Keep item not found check) ...
    if (!item) { /* ... log error, reset input ... */ return; }

    const oldValue = item.item_qty ?? 0;

    // --- Optimistic Update ---
    item.item_qty = newValue;
    Logger.info(`Optimistically updated item ${itemId} quantity to ${newValue}`);

    // Determine API action
    let method, url, body = null;
    if (oldValue > 0 && newValue === 0) { method = 'DELETE'; url = `/user_api_proxy.php/users/${userId}/items/${itemId}`; }
    else if (oldValue === 0 && newValue > 0) { method = 'POST'; url = `/user_api_proxy.php/users/${userId}/items`; body = JSON.stringify({ item_id: itemId, item_qty: newValue }); }
    else if (oldValue > 0 && newValue > 0 && oldValue !== newValue) { method = 'PATCH'; url = `/user_api_proxy.php/users/${userId}/items/${itemId}`; body = JSON.stringify({ item_qty: newValue }); }
    else { Logger.info(`No API call needed for item ${itemId}.`); return; }

    // --- API Call ---
    inputElement.classList.add('saving');
    Logger.info(`Calling API: ${method} ${url}`);

    fetch(url, { method: method, headers: { 'Content-Type': 'application/json' }, body: body })
    .then(response => {
        Logger.info(`API Response status for ${method} item ${itemId}: ${response.status}`);
        if (!response.ok) {
            return response.json().catch(() => ({ message: `HTTP error ${response.status}` })).then(errData => {
                const errMsg = errData?.message || `Failed to ${method} item ${itemId}`;
                throw new Error(errMsg);
            });
        }
        return response.status === 204 ? null : response.json();
    })
    .then(data => {
        Logger.info(`Successfully ${method} item ${itemId}. Response:`, data);
        inputElement.classList.add('save-success');
        setTimeout(() => inputElement.classList.remove('save-success'), 1000);
        // Optional: Update state with response if necessary (e.g., if API returns corrected data)
        // item.item_qty = data?.item?.item_qty ?? newValue; // Example if API returns updated item
        // inputElement.value = item.item_qty; // Ensure input matches final state
    })
    .catch(error => {
        Logger.error(`Failed to ${method} item ${itemId}. Rolling back.`, error);
        showErrorToast(error.message || `Failed to update item ${itemId}`);
        // --- Rollback ---
        item.item_qty = oldValue;
        inputElement.value = oldValue;
        inputElement.classList.add('save-error');
        setTimeout(() => inputElement.classList.remove('save-error'), 1000);
    })
    .finally(() => {
        inputElement.classList.remove('saving');
        Logger.info(`Finished API call for item ${itemId}.`);
    });
}