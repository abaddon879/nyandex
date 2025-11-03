import { Logger } from './logger.js';
import { appState, catElementMap } from './state.js';
import { populateRarityNav, populateCatGrid, populateCatList, showErrorToast } from './ui.js';
import { setupEventListeners } from './events.js';
import { initApi } from './api.js';
import { getCurrentForm, canCatEvolve, isQuickEditMode } from './helpers.js';

// --- MAIN APP ---

// Get the global userId from the script tag in redesign.php
const userId = window.userId;

// Initialize the API module with the userId
initApi(userId);

// Initial data load
Promise.all([
    fetch(`/user_api_proxy.php/users/${userId}/cats`),
    fetch(`/user_api_proxy.php/users/${userId}/items`)
])
.then(responses => Promise.all(responses.map(response => { if (!response.ok) throw new Error(`Response status: ${response.status}`); return response.json(); })))
.then(([catsData, itemsData]) => {
    appState.userCats = catsData;
    appState.userItems = itemsData;

    populateRarityNav();
    populateCatGrid(); // Render the initial grid
    setupEventListeners();
    
    // Click the "Normal" rarity link by default
    const normalLink = document.querySelector('.rarity-list a[data-rarity="Normal"]');
    if (normalLink) {
        normalLink.click();
    } else {
        document.querySelector('.rarity-list a')?.click();
    }
    
    Logger.info('Application initialized successfully.');
})
.catch(error => { Logger.error('Could not load initial application data.', error); showErrorToast('Could not load initial cat data.'); });

// ADD THIS NEW FUNCTION
export function setView(view) {
    if (appState.currentView === view) return; // Do nothing if already on this view

    appState.currentView = view;
    
    // Get all the elements we need to toggle
    const gridBtn = document.getElementById('grid-view-btn');
    const listBtn = document.getElementById('list-view-btn');
    const quickEditToggleContainer = document.getElementById('list-quick-edit-container');
    const selectAllContainer = document.getElementById('list-select-all-container');
    const bulkActionBar = document.getElementById('bulk-action-bar');
    const quickEditToggle = document.getElementById('list-quick-edit-toggle');

    if (view === 'grid') {
        gridBtn.classList.add('active');
        listBtn.classList.remove('active');
        
        // Hide all list-specific UI
        if (quickEditToggleContainer) quickEditToggleContainer.style.display = 'none';
        if (selectAllContainer) selectAllContainer.style.display = 'none';
        if (bulkActionBar) bulkActionBar.classList.add('hidden');
        document.body.classList.remove('quick-edit-list-active');

        populateCatGrid();
    } else { // view === 'list'
        listBtn.classList.add('active');
        gridBtn.classList.remove('active');

        // Show list-specific UI
        if (quickEditToggleContainer) quickEditToggleContainer.style.display = 'block';
        // Only show select-all if quick-edit is also checked
        if (selectAllContainer && quickEditToggle && quickEditToggle.checked) {
            selectAllContainer.style.display = 'block';
        }
        if (quickEditToggle && quickEditToggle.checked) {
            document.body.classList.add('quick-edit-list-active');
        }

        populateCatList();
    }
    
    // Run the filter to show the correct cats in the new view
    refreshView(); // We will rename this in the next step
}

/**
 * Updates the bulk action bar's visibility and count.
 */
export function updateBulkActionBar() {
    const bulkActionBar = document.getElementById('bulk-action-bar');
    const bulkSelectCount = document.getElementById('bulk-select-count');
    const selectAllToggle = document.getElementById('list-select-all-toggle');

    if (!bulkActionBar || !bulkSelectCount) return;

    const selectedCheckboxes = document.querySelectorAll('.list-item:not(.hidden) .list-item-select:checked');
    const count = selectedCheckboxes.length;
    const shouldShow = (appState.currentView === 'list' && document.getElementById('list-quick-edit-toggle')?.checked && count > 0);

    if (shouldShow) {
        bulkActionBar.classList.remove('hidden');
        bulkSelectCount.textContent = `${count} unit${count > 1 ? 's' : ''} selected`;
    } else {
        bulkActionBar.classList.add('hidden');
    }
    
    if (selectAllToggle) {
        const totalCheckboxes = document.querySelectorAll('.list-item:not(.hidden) .list-item-select').length;        
        selectAllToggle.checked = totalCheckboxes > 0 && count === totalCheckboxes;
    }
}

/**
 * 1. GETS THE DATA: Filters and sorts the cat list based on appState.
 * @returns {Array} A filtered and sorted array of cat objects.
 */
function getFilteredAndSortedCats() {
    Logger.info('--- getFilteredAndSortedCats CALLED ---');
    const search = document.getElementById('search').value.toLowerCase();
    const selectedCheckboxes = Array.from(document.querySelectorAll('#filter-options input[type="checkbox"]:checked')).map(cb => cb.value);
    const ownershipFilter = document.querySelector('#filter-options input[name="ownership"]:checked')?.value || 'all'; 

    const filteredCatIds = new Set();
    
    // First pass: build the set of filtered cat IDs
    for (const cat of appState.userCats) {
        if (appState.currentRarity && appState.currentRarity !== 'all' && cat.rarity.rarity_name !== appState.currentRarity) {
            continue;
        }
        const matchesSearch = search ? cat.forms.some(form => form.form_name.toLowerCase().includes(search)) : true;
        if (!matchesSearch) continue;

        const canEvolve = canCatEvolve(cat); 
        const matchesUpgrade = selectedCheckboxes.includes('upgrade') ? canEvolve : true;
        if (!matchesUpgrade) continue;

        const userHasCat = cat.user_info && cat.user_info.user_cat_level != null;
        if (ownershipFilter === 'owned' && !userHasCat) continue;
        if (ownershipFilter === 'missing' && userHasCat) continue;

        filteredCatIds.add(cat.cat_id);
    }

    const sortProp = appState.sortProperty;
    const sortDir = appState.sortDirection;

    // Second pass: Filter and Sort
    const sortedCats = [...appState.userCats]
        .filter(cat => filteredCatIds.has(cat.cat_id)) // Filter first
        .sort((a, b) => { // Then sort
            let valA, valB;
            switch (sortProp) {
                case 'id': valA = a.cat_id; valB = b.cat_id; break;
                case 'name': 
                    valA = getCurrentForm(a).form_name.toLowerCase(); 
                    valB = getCurrentForm(b).form_name.toLowerCase(); 
                    break;
                case 'level': valA = (a.user_info?.user_cat_level || 0) + (a.user_info?.user_cat_plus_level || 0); valB = (b.user_info?.user_cat_level || 0) + (b.user_info?.user_cat_plus_level || 0); break;
                case 'default': default: valA = a.cat_order_id; valB = b.cat_order_id; break;
            }
            let comparison = 0;
            if (valA < valB) comparison = -1;
            if (valA > valB) comparison = 1;
            return sortDir === 'desc' ? (comparison * -1) : comparison;
        });

    return sortedCats;
}

/**
 * 2. RENDERS THE VIEW: Takes a sorted array and manipulates the DOM.
 * @param {Array} catsToShow - The sorted array of cats to display.
 */
function renderCats(catsToShow) {
    const container = document.getElementById('cat-sections');
    if (!container) return;
    
    // Hide all elements
    for (const element of catElementMap.values()) {
        element.classList.add('hidden');
    }
    
    // Append and show elements in the correct sorted order
    for (const cat of catsToShow) {
        const element = catElementMap.get(cat.cat_id);
        if (element) {
            element.classList.remove('hidden');
            container.appendChild(element); 
        }
    }
}

/**
 * 3. PUBLIC CONTROLLER: This is what event listeners will call.
 */
export function refreshView() {
    const cats = getFilteredAndSortedCats();
    renderCats(cats);
    updateBulkActionBar();
}