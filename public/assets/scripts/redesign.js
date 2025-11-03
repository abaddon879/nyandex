// =================================================================================
// LOGGER UTILITY & STATE
// =================================================================================
const Logger = {
    info: (message, data = '') => { console.info(`[${new Date().toLocaleTimeString()}] [INFO] ${message}`, data); },
    error: (message, error = '') => { console.error(`[${new Date().toLocaleTimeString()}] [ERROR] ${message}`, error); }
};
const appState = {
    userCats: [],
    userItems: [],
    currentCat: null,
    currentRarity: null,
    currentView: 'grid',
    sortProperty: 'default', // 'default', 'id', 'name', 'level'
    sortDirection: 'asc' // 'asc' or 'desc' (for future use)
};
const catElementMap = new Map();

// =================================================================================
// INITIALIZATION
// =================================================================================
Promise.all([
    fetch(`/user_api_proxy.php/users/${userId}/cats`),
    fetch(`/user_api_proxy.php/users/${userId}/items`)
])
.then(responses => Promise.all(responses.map(response => { if (!response.ok) throw new Error(`Response status: ${response.status}`); return response.json(); })))
.then(([catsData, itemsData]) => {
    appState.userCats = catsData;
    appState.userItems = itemsData;
    populateRarityNav();
    populateCatGrid();
    setupEventListeners();
    // --- MODIFIED: Select "Normal" rarity by default ---
    // Ensure "Normal" exists before clicking, fallback to first link if not (though it should always exist)
    const normalLink = document.querySelector('.rarity-list a[data-rarity="Normal"]');
    if (normalLink) {
        normalLink.click();
    } else {
        // Fallback: Click the very first link in the list if "Normal" isn't found
        document.querySelector('.rarity-list a')?.click();
    }
    // --- END MODIFICATION ---
    Logger.info('Application initialized successfully.');
})
.catch(error => { Logger.error('Could not load initial application data.', error); showErrorToast('Could not load initial cat data.'); });

// =================================================================================
// HELPER FUNCTIONS (GLOBAL)
// =================================================================================

function isQuickEditMode() {
    const toggle = document.getElementById('list-quick-edit-toggle');
    // Mode is active if toggle is checked AND we are in list view
    return toggle && toggle.checked && appState.currentView === 'list';
}

/**
 * Updates the bulk action bar's visibility and count.
 * This is now a global function.
 */
function updateBulkActionBar() {
    // Query for elements each time
    const bulkActionBar = document.getElementById('bulk-action-bar');
    const bulkSelectCount = document.getElementById('bulk-select-count');
    const selectAllToggle = document.getElementById('list-select-all-toggle');

    if (!bulkActionBar || !bulkSelectCount) {
        return; // Exit if elements aren't ready
    }

    const selectedCheckboxes = document.querySelectorAll('.list-item-select:checked');
    const count = selectedCheckboxes.length;

    // --- STRICTER HIDE/SHOW LOGIC ---
    // Should show ONLY IF: We are in List view AND Quick Edit is ON AND Count > 0
    const shouldShow = (appState.currentView === 'list' && isQuickEditMode() && count > 0);

    if (shouldShow) {
        bulkActionBar.classList.remove('hidden');
        bulkSelectCount.textContent = `${count} unit${count > 1 ? 's' : ''} selected`;
    } else {
        bulkActionBar.classList.add('hidden'); // Hide in all other cases
    }
    // --- END LOGIC ---

    if (selectAllToggle) {
        const totalCheckboxes = document.querySelectorAll('.list-item-select').length;
        selectAllToggle.checked = totalCheckboxes > 0 && count === totalCheckboxes;
    }
}

// =================================================================================
// RENDERING & CORE LOGIC
// =================================================================================

function populateRarityNav() {
    const nav = document.querySelector('.panel-nav');
    if (!nav) return;
    const rarities = [...new Set(appState.userCats.map(cat => cat.rarity.rarity_name))];
    const ul = document.createElement('ul');
    ul.className = 'rarity-list';

    // --- Loop through specific rarities FIRST ---
    rarities.forEach(rarity => {
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.href = '#';
        a.textContent = rarity;
        a.dataset.rarity = rarity;
        li.appendChild(a);
        ul.appendChild(li);
    });
    // --- END LOOP ---

    // --- NEW: Add "All Cats" Link LAST ---
    const allLi = document.createElement('li');
    const allA = document.createElement('a');
    allA.href = '#';
    allA.textContent = 'All Cats';
    allA.dataset.rarity = 'all'; // Keep the special value
    allLi.appendChild(allA);
    ul.appendChild(allLi);
    // --- END NEW ---

    nav.innerHTML = '';
    nav.appendChild(ul);
}

function populateCatList() {
    const gridContainer = document.getElementById('cat-sections');
    if (!gridContainer) return;
    
    // Set the container class for list view
    gridContainer.className = 'list-view-container';
    
    // Clear previous content and the map
    gridContainer.innerHTML = '';
    catElementMap.clear();

    // --- RENDER ALL CATS ---
    appState.userCats.forEach(cat => {
        const userHasCat = cat.user_info && cat.user_info.user_cat_level != null;
        const currentForm = getCurrentForm(cat);

        const listItem = document.createElement('div');
        listItem.className = 'list-item hidden'; // Start as hidden
        if (userHasCat) {
            listItem.classList.add('owned');
        } else {
            listItem.classList.add('missing');
        }
        
        listItem.innerHTML = `
            <div class="select-column">
                <input type="checkbox" class="list-item-select" data-cat-id="${cat.cat_id}">
            </div>
            <div class="cat-name-column">
                <img src="/assets/images/units/${currentForm.image_url}" alt="${currentForm.form_name}">
                <span>${currentForm.form_name}</span>
            </div>
            <div class="level-column levels ${userHasCat ? '' : 'missing'}">
                <label>Lvl: <input class="level-input" type="number" min="1" max="${cat.max_level}" value="${cat.user_info?.user_cat_level ?? 0}"></label>
                <label>+: <input class="plus-level-input" type="number" min="0" max="${cat.max_plus_level}" value="${cat.user_info?.user_cat_plus_level ?? 0}"></label>
            </div>
            <div class="form-column">
                <div class="form-button-group">${createFormButtonsHTML(cat)}</div>
            </div>
            <div class="add-column">
                <button class="list-add-button" aria-label="Add ${currentForm.form_name}">+</button>
            </div>
        `;
        
        catElementMap.set(cat.cat_id, listItem);

        // --- Attach all event listeners ---
        
        listItem.addEventListener('click', (e) => {
            if (e.target.closest('input, .form-button-group, .list-add-button, .list-item-select')) {
                return; 
            }
            displayCatInDetailPanel(cat);
        });

        listItem.querySelector('.list-add-button')?.addEventListener('click', (e) => onAddCat(e, cat));

        listItem.querySelector('.level-input')?.addEventListener('change', (e) => updateCatNumericProperty(cat.cat_id, e.target, 'user_cat_level'));
        listItem.querySelector('.plus-level-input')?.addEventListener('change', (e) => updateCatNumericProperty(cat.cat_id, e.target, 'user_cat_plus_level'));
        
        const formButtonGroup = listItem.querySelector('.form-button-group');
        if (formButtonGroup) {
            formButtonGroup.addEventListener('click', (e) => {
                e.stopPropagation();
                if (e.target.matches('.form-button:not([disabled]):not(.active)')) {
                    updateCatForm(cat.cat_id, e.target);
                }
            });
            formButtonGroup.addEventListener('mouseover', (e) => {
                if (e.target.matches('[data-tooltip]')) {
                    showCustomTooltip(e.target, e.target.dataset.tooltip);
                }
            });
            formButtonGroup.addEventListener('mouseout', () => hideCustomTooltip());
        }

        gridContainer.appendChild(listItem);
    });

    // We no longer need this line: gridContainer.appendChild(listContainer);
}

function populateCatGrid() {
    const gridContainer = document.getElementById('cat-sections');
    if (!gridContainer) return;

    // Set the container class for grid view
    gridContainer.className = 'grid';

    // Clear previous content and the map
    gridContainer.innerHTML = '';
    catElementMap.clear();

    // --- RENDER ALL CATS ---
    appState.userCats.forEach(cat => {
        const gridItem = document.createElement('div');
        gridItem.className = 'grid-item hidden'; // Start as hidden
        if (cat.user_info && cat.user_info.user_cat_level != null) {
            gridItem.classList.add('owned');
        }
        
        gridItem.innerHTML = createCatCardHTML(cat);
        catElementMap.set(cat.cat_id, gridItem);

        // --- Attach all event listeners ---

        gridItem.querySelector('.card-action-button')?.addEventListener('click', (e) => onAddCat(e, cat));

        gridItem.addEventListener('click', (e) => {
            if (e.target.closest('.card-action-button, input, .form-button-group')) {
                return; 
            }
            displayCatInDetailPanel(cat);
        });

        gridItem.querySelector('.level-input')?.addEventListener('change', (e) => updateCatNumericProperty(cat.cat_id, e.target, 'user_cat_level'));
        gridItem.querySelector('.plus-level-input')?.addEventListener('change', (e) => updateCatNumericProperty(cat.cat_id, e.target, 'user_cat_plus_level'));
        
        const formButtonGroup = gridItem.querySelector('.form-button-group');
        if (formButtonGroup) {
            formButtonGroup.addEventListener('click', (e) => {
                e.stopPropagation();
                if (e.target.matches('.form-button:not([disabled]):not(.active)')) {
                    updateCatForm(cat.cat_id, e.target);
                }
            });
            formButtonGroup.addEventListener('mouseover', (e) => {
                if (e.target.matches('[data-tooltip]')) {
                    showCustomTooltip(e.target, e.target.dataset.tooltip);
                }
            });
            formButtonGroup.addEventListener('mouseout', () => hideCustomTooltip());
        }
        gridContainer.appendChild(gridItem);
    });
    // We no longer need this line: gridContainer.appendChild(grid);
}

function runFilter() {
    Logger.info('--- runFilter CALLED ---');
    const search = document.getElementById('search').value.toLowerCase();
    const selectedCheckboxes = Array.from(document.querySelectorAll('#filter-options input[type="checkbox"]:checked')).map(cb => cb.value);
    const ownershipFilter = document.querySelector('#filter-options input[name="ownership"]:checked')?.value || 'all'; 

    // 1. FILTERING: Loop through all cats and decide which to show/hide
    const filteredCatIds = new Set(); // Use a Set for fast lookups
    
    for (const cat of appState.userCats) {
        // --- Run all filter checks ---
        
        // Rarity filter
        if (appState.currentRarity && appState.currentRarity !== 'all' && cat.rarity.rarity_name !== appState.currentRarity) {
            continue; // Skip, doesn't match rarity
        }

        // Search filter
        const matchesSearch = search ? cat.forms.some(form => form.form_name.toLowerCase().includes(search)) : true;
        if (!matchesSearch) continue; // Skip

        // Upgrade filter
        const matchesUpgrade = selectedCheckboxes.includes('upgrade') ? canCatEvolve(cat) : true;
        if (!matchesUpgrade) continue; // Skip

        // Ownership filter
        const userHasCat = cat.user_info && cat.user_info.user_cat_level != null;
        if (ownershipFilter === 'owned' && !userHasCat) continue; // Skip
        if (ownershipFilter === 'missing' && userHasCat) continue; // Skip

        // --- If all checks pass, add it to the set ---
        filteredCatIds.add(cat.cat_id);
    }

    // 2. SORTING: Get the sorted order of *all* cats (not just filtered)
    const sortProp = appState.sortProperty;
    const sortDir = appState.sortDirection;

    const sortedCats = [...appState.userCats].sort((a, b) => {
        let valA, valB;
        switch (sortProp) {
            case 'id': valA = a.cat_id; valB = b.cat_id; break;
            case 'name': valA = getCurrentForm(a).form_name.toLowerCase(); valB = getCurrentForm(b).form_name.toLowerCase(); break;
            case 'level': valA = (a.user_info?.user_cat_level || 0) + (a.user_info?.user_cat_plus_level || 0); valB = (b.user_info?.user_cat_level || 0) + (b.user_info?.user_cat_plus_level || 0); break;
            case 'default': default: valA = a.cat_order_id; valB = b.cat_order_id; break;
        }
        let comparison = 0;
        if (valA < valB) comparison = -1;
        if (valA > valB) comparison = 1;
        return sortDir === 'desc' ? (comparison * -1) : comparison;
    });

    // 3. APPLYING VIEW: Show/hide and re-order elements
    const container = document.getElementById('cat-sections');
    
    // Loop through the *sorted* list of cats
    for (const cat of sortedCats) {
        const element = catElementMap.get(cat.cat_id);
        if (!element) continue; // Should not happen

        // Check if this cat should be visible
        if (filteredCatIds.has(cat.cat_id)) {
            element.classList.remove('hidden');
            // Re-order the element in the DOM
            container.appendChild(element); 
        } else {
            element.classList.add('hidden');
        }
    }

    // 4. Update UI
    updateBulkActionBar();
}

function displayCatInDetailPanel(cat) {
    appState.currentCat = cat;
    const content = document.getElementById('detail-panel-content');
    const placeholder = document.getElementById('detail-panel-placeholder');

    document.querySelectorAll('.grid-item.selected, .list-item.selected').forEach(el => el.classList.remove('selected'));
    if (cat) {
        const element = catElementMap.get(cat.cat_id);
        if (element) element.classList.add('selected');
    }
    
    if (!cat) {
        content.classList.add('hidden');
        placeholder.classList.remove('hidden');
        return;
    }
    
    content.classList.remove('hidden');
    placeholder.classList.add('hidden');
    Logger.info(`Displaying details for: ${cat.cat_name}`, cat);

    batchUpdateElements([
        { id: 'detail-name', text: cat.cat_name },
        { id: 'detail-id', text: `#${String(cat.cat_id).padStart(3, '0')}` },
    ]);

    const levelInput = document.getElementById('detail-level-input');
    const plusLevelInput = document.getElementById('detail-plus-level-input');
    const formButtonsContainer = document.getElementById('detail-form-buttons');
    const formsContainer = document.getElementById('detail-forms-container');
    const userHasCat = cat.user_info && cat.user_info.user_cat_level != null;

    if (userHasCat) {
        levelInput.value = cat.user_info.user_cat_level;
        levelInput.max = cat.max_level;
        levelInput.disabled = false;
        plusLevelInput.value = cat.user_info.user_cat_plus_level;
        plusLevelInput.max = cat.max_plus_level;
        plusLevelInput.disabled = false;
    } else {
        levelInput.value = 0; levelInput.disabled = true;
        plusLevelInput.value = 0; plusLevelInput.disabled = true;
    }
    formButtonsContainer.innerHTML = createFormButtonsHTML(cat);

    formsContainer.innerHTML = '';
    cat.forms.forEach((form, index) => {
        const formDiv = document.createElement('div');
        let formStatusClass = 'locked'; // Default to locked
        const currentFormIndex = userHasCat ? cat.forms.findIndex(f => f.form_id === cat.user_info.user_cat_form_id) : -1;
        const isAchievable = userHasCat && isFormAchievable(cat, index);

        // If the form index is less than OR equal to the current index, mark as achieved
        if (userHasCat && index <= currentFormIndex) {
            formStatusClass = 'achieved';
        } else if (isAchievable) {
            formStatusClass = 'available'; // Can evolve to this, but not selected
        }
        // If neither of the above, it stays 'locked'

        formDiv.className = `detail-panel-form ${formStatusClass}`;
        
        let requirementsHTML = '<div class="evolution-requirements">';
        
        const totalLevel = userHasCat ? (parseInt(cat.user_info.user_cat_level) || 0) + (parseInt(cat.user_info.user_cat_plus_level) || 0) : 0;

        if (form.required_level > 0) {
            // Standard level requirement
            const levelMet = userHasCat && totalLevel >= form.required_level;
            requirementsHTML += `<div><span class="req-label">Level:</span> <span class="req-value ${levelMet ? '' : 'not-met'}">${form.required_level}</span></div>`;
        } else if (form.required_level === -1) {
            // Special case: Stage Unlock (implies Level 20)
            const levelMet = userHasCat && totalLevel >= 20;
            requirementsHTML += `<div><span class="req-label">Level:</span> <span class="req-value ${levelMet ? '' : 'not-met'}">20</span> <span class="req-label">(Stage Unlock)</span></div>`;
        }

        if (form.required_xp > 0) {
            requirementsHTML += `<div><span class="req-label">XP:</span> <span class="req-value">${form.required_xp.toLocaleString()}</span></div>`;
        }

        if (form.evolution_requirements.length > 0) {
            const itemsHTML = form.evolution_requirements.map(req => {
                const userItem = appState.userItems.find(item => item.item_id === req.item_id);
                const hasEnough = userHasCat && userItem && userItem.item_qty >= req.item_qty;
                return `<div title="${req.item_name}">
                          <img src="/assets/images/items/gatyaitemD_${req.item_id}_f.png" class="${hasEnough ? 'greenglow' : 'redglow'}">
                          <span>x${req.item_qty}</span>
                        </div>`;
            }).join('');
            requirementsHTML += `<div class="evolution-requirements-list">${itemsHTML}</div>`;
        }

        requirementsHTML += '</div>';

        formDiv.innerHTML = `
            <h3>${form.form_name}</h3>
            <img class="detail-form-image" src="/assets/images/units/${form.image_url}" alt="${form.form_name}">
            ${(form.required_level || form.required_xp > 0 || form.evolution_requirements.length > 0) ? requirementsHTML : ''}
        `;
        formsContainer.appendChild(formDiv);
    });
}

// =================================================================================
// EVENT HANDLERS & UI UPDATES
// =================================================================================

function isFormAchievable(cat, formIndex) {
    const form = cat.forms[formIndex];
    if (!cat.user_info || !form) return false;
    if (formIndex === 0) return true;
    const totalLevel = (parseInt(cat.user_info.user_cat_level) || 0) + (parseInt(cat.user_info.user_cat_plus_level) || 0);
    if (form.required_level === -1) return totalLevel >= 20;
    
    const levelRequirementMet = totalLevel >= form.required_level;

    if (isQuickEditMode()) {
        return levelRequirementMet; // Bypasses item check
    }

    const itemsRequirementMet = form.evolution_requirements.every(req => {
        const userItem = appState.userItems.find(item => item.item_id === req.item_id);
        return userItem && userItem.item_qty >= req.item_qty;
    });
    return levelRequirementMet && itemsRequirementMet;
}

function canCatEvolve(cat) {
    if (!cat.user_info) return false;
    const currentFormIndex = cat.forms.findIndex(f => f.form_id === cat.user_info.user_cat_form_id);
    if (currentFormIndex === -1) return false;
    return cat.forms.some((form, index) => index > currentFormIndex && isFormAchievable(cat, index));
}

function createFormButtonsHTML(cat) {
    const userHasCat = cat.user_info && cat.user_info.user_cat_level != null;
    let currentFormIndex = -1;
    if (userHasCat) {
        currentFormIndex = cat.forms.findIndex(f => f.form_id === cat.user_info.user_cat_form_id);
        if (currentFormIndex === -1) currentFormIndex = 0;
    }
    let formLabels = ['Normal', 'Evolved', 'True', 'Ultra'];
    return cat.forms.map((form, index) => {
        const isAchievable = userHasCat && isFormAchievable(cat, index);
        const isActive = index === currentFormIndex;
        let tooltipText = getTooltipMessage(cat, index);
        let tooltipAttr = tooltipText ? `data-tooltip="${tooltipText}"` : '';
        
        // --- MODIFIED LOGIC HERE ---
        // A button should be enabled if it's (Active OR Achievable) AND the user has the cat.
        const isEnabled = (isActive || isAchievable) && userHasCat;

        return `<button class="form-button ${isActive && userHasCat ? 'active' : ''}" data-form-index="${index}" ${tooltipAttr} ${isEnabled ? '' : 'disabled'}>${formLabels[index]}</button>`;
    }).join('');
}

function createCatCardHTML(cat) {
    const userHasCat = cat.user_info && cat.user_info.user_cat_level != null;
    const currentForm = getCurrentForm(cat);
    const formName = currentForm.form_name;
    const canEvolve = userHasCat && canCatEvolve(cat);

    const actionButtonHTML = !userHasCat
        ? `<button class="card-action-button" aria-label="Add ${formName}">+</button>`
        : '';
        
    return `${actionButtonHTML}
            <span class="stack-top left" style="display: ${canEvolve ? 'block' : 'none'};">Upgrade</span>
            <img src="/assets/images/units/${currentForm.image_url}" alt="${formName}" title="${formName}" class="${userHasCat ? '' : 'missing'}">
            <h4 class="${userHasCat ? '' : 'missing'}">${formName}</h4>
            <div class="levels ${userHasCat ? '' : 'missing'}">
                <div class="card-levels-grid">
                    <label>Level</label>
                    <input class="level-input" type="number" min="1" max="${cat.max_level}" value="${cat.user_info?.user_cat_level ?? 0}">
                    <label>+Level</label>
                    <input class="plus-level-input" type="number" min="0" max="${cat.max_plus_level}" value="${cat.user_info?.user_cat_plus_level ?? 0}">
                </div>
                <div class="card-forms">
                    <div class="form-button-group">${createFormButtonsHTML(cat)}</div>
                </div>
            </div>`;
}

function onAddCat(e, cat) {
    e.stopPropagation();
    const firstFormId = cat.forms[0].form_id;
    fetch(`/user_api_proxy.php/users/${userId}/cats`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ cat_id: cat.cat_id, user_cat_level: 1, user_cat_plus_level: 0, user_cat_form_id: firstFormId }) })
    .then(response => { if (!response.ok) throw new Error('Failed to add cat'); return response.json(); })
    .then(addedCat => {
        Logger.info('Cat added successfully.', addedCat);
        cat.user_info = { user_cat_level: 1, user_cat_form_id: firstFormId, user_cat_plus_level: 0 };
        runFilter();
        displayCatInDetailPanel(cat);
    })
    .catch(error => { Logger.error('Failed to add cat.', error); showErrorToast(error.message); });
}

function updateCatNumericProperty(catId, element, propertyName) {
    const cat = appState.userCats.find(c => c.cat_id == catId);
    if (!cat?.user_info) return;

    // --- NEW: Store the old value ---
    const oldValue = cat.user_info[propertyName];
    
    let newValue = parseInt(element.value) || 0;
    const max = parseInt(element.max);

    if (!isQuickEditMode()) { 
        if (newValue > max) { newValue = max; element.value = newValue; }
    }
    
    // --- MODIFIED: Update the local state ---
    cat.user_info[propertyName] = newValue;

    // --- NEW: Define a rollback function for the error case ---
    const onError = () => {
        Logger.error(`Rollback: ${propertyName} for cat ${catId} from ${newValue} to ${oldValue}`);
        // Restore the old value in our local state
        cat.user_info[propertyName] = oldValue;
        // Re-run the filter to update the UI
        runFilter(); 
        // If this cat was in the detail panel, refresh it to show the old value
        if (appState.currentCat && appState.currentCat.cat_id === catId) {
            displayCatInDetailPanel(cat);
        }
    };

    // --- MODIFIED: Pass the onError callback to upsertCat ---
    upsertCat(cat, element, () => {
        // OnSuccess: just re-render
        runFilter();
        if (appState.currentCat && appState.currentCat.cat_id === catId) {
            displayCatInDetailPanel(cat);
        }
    }, onError); // <-- Pass the new error handler
}

function updateCatForm(catId, buttonElement) {
    const cat = appState.userCats.find(c => c.cat_id == catId);
    if (!cat?.user_info) return;

    // --- NEW: Store the old value ---
    const oldFormId = cat.user_info.user_cat_form_id;

    const newFormIndex = parseInt(buttonElement.dataset.formIndex);
    const newFormId = cat.forms[newFormIndex].form_id;

    // --- MODIFIED: Update local state ---
    cat.user_info.user_cat_form_id = newFormId;
    
    const onSuccess = () => {
        runFilter();
        if (appState.currentCat && appState.currentCat.cat_id === catId) {
            displayCatInDetailPanel(cat);
        }
    };

    // --- NEW: Define a rollback function ---
    const onError = () => {
        Logger.error(`Rollback: form for cat ${catId} from ${newFormId} to ${oldFormId}`);
        // Restore the old value
        cat.user_info.user_cat_form_id = oldFormId;
        // Re-render
        runFilter();
        if (appState.currentCat && appState.currentCat.cat_id === catId) {
            displayCatInDetailPanel(cat);
        }
    };

    // --- MODIFIED: Pass the onError callback ---
    upsertCat(cat, buttonElement, onSuccess, onError);
}

function removeCat(catId) {
    fetch(`/user_api_proxy.php/users/${userId}/cats/${catId}`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' } })
    .then(response => { if (!response.ok) throw new Error('Failed to remove cat'); })
    .then(() => {
        Logger.info(`Cat with ID ${catId} removed successfully.`);
        const cat = appState.userCats.find(c => c.cat_id === catId);
        if (cat) cat.user_info = null;
        runFilter();
        displayCatInDetailPanel(null);
    })
    .catch(error => { Logger.error(`Failed to remove cat with ID ${catId}.`, error); showErrorToast(error.message); });
}

// =================================================================================
// EVENT LISTENERS & UTILITIES
// =================================================================================

function setupEventListeners() {
    Logger.info('--- setupEventListeners CALLED ---'); // <-- DEBUG LOG
    // --- Variable Declarations ---
    let lastClickedCheckbox = null; // For shift-click
    const selectAllContainer = document.getElementById('list-select-all-container');
    const selectAllToggle = document.getElementById('list-select-all-toggle');
    const bulkActionBar = document.getElementById('bulk-action-bar');
    const bulkAddBtn = document.getElementById('bulk-add-btn');
    const bulkLevelInput = document.getElementById('bulk-level-input');
    const bulkPlusLevelInput = document.getElementById('bulk-plus-level-input');
    const bulkSetLevelBtn = document.getElementById('bulk-set-level-btn');
    const catContainer = document.getElementById('cat-sections');
    const quickEditToggleContainer = document.getElementById('list-quick-edit-container');
    const quickEditToggle = document.getElementById('list-quick-edit-toggle');
    const gridBtn = document.getElementById('grid-view-btn');
    const listBtn = document.getElementById('list-view-btn');
    const rightPanel = document.querySelector('.right-panel');
    const sortSelect = document.getElementById('sort-select');
    const sortDirectionBtn = document.getElementById('sort-direction-btn'); // <-- ADD THIS

    // --- Left Panel Listeners ---
    document.querySelector('.panel-nav').addEventListener('click', (e) => {
        e.preventDefault();
        const link = e.target.closest('a');
        if (link) {
            appState.currentRarity = link.dataset.rarity;
            document.querySelectorAll('.rarity-list a').forEach(a => a.classList.remove('active'));
            link.classList.add('active');
            runFilter();
        }
    });

    document.getElementById('search').addEventListener('input', runFilter);
    document.getElementById('filter-options').addEventListener('change', runFilter);
    // --- Update Clear Filters Button Listener ---
    document.getElementById('clear-filters-btn').addEventListener('click', () => {
        document.getElementById('search').value = '';
        // Uncheck all checkboxes
        document.querySelectorAll('#filter-options input[type="checkbox"]').forEach(checkbox => { checkbox.checked = false; });
        // --- NEW: Reset radio buttons to 'all' ---
        const allRadio = document.querySelector('#filter-options input[name="ownership"][value="all"]');
        if (allRadio) allRadio.checked = true;
        // --- END NEW ---
        runFilter();
    });

    // --- Quick Edit Toggle Listener ---
    if (quickEditToggle) {
        quickEditToggle.addEventListener('change', () => {
            Logger.info('Quick Edit Toggle CHANGED'); // <-- DEBUG LOG
            const isChecked = quickEditToggle.checked;
            document.body.classList.toggle('quick-edit-list-active', isChecked);
            
            // Show/hide select-all container
            if (selectAllContainer) {
                selectAllContainer.style.display = isChecked ? 'block' : 'none';
            }
            // If turning off, hide the bar and uncheck all
            if (!isChecked) {
                if (bulkActionBar) bulkActionBar.classList.add('hidden');
                if (selectAllToggle) selectAllToggle.checked = false;
            }
            runFilter(); // Re-render the list
        });
    }

    // --- Right Panel Listeners ---
    if (rightPanel) {
        rightPanel.addEventListener('change', (e) => {
            if (appState.currentCat) {
                if (e.target.matches('#detail-level-input')) {
                    updateCatNumericProperty(appState.currentCat.cat_id, e.target, 'user_cat_level');
                }
                if (e.target.matches('#detail-plus-level-input')) {
                    updateCatNumericProperty(appState.currentCat.cat_id, e.target, 'user_cat_plus_level');
                }
            }
        });
        rightPanel.addEventListener('click', (e) => {
            if (appState.currentCat) {
                if (e.target.matches('#detail-remove-btn')) {
                    if (confirm("Are you sure you want to remove this cat?")) { removeCat(appState.currentCat.cat_id); }
                }
                if (e.target.matches('#detail-form-buttons .form-button:not([disabled]):not(.active)')) {
                    updateCatForm(appState.currentCat.cat_id, e.target);
                }
            }
        });
    }
    
    // --- View Toggle Listeners ---
    gridBtn.addEventListener('click', () => {
        Logger.info('Grid View Button CLICKED'); // <-- DEBUG LOG
        if (appState.currentView === 'grid') return;
        appState.currentView = 'grid';
        gridBtn.classList.add('active');
        listBtn.classList.remove('active');
        catContainer.classList.remove('view-list');
        catContainer.classList.add('view-grid');
        
        // Hide list-only controls
        if (quickEditToggleContainer) quickEditToggleContainer.style.display = 'none';
        if (selectAllContainer) selectAllContainer.style.display = 'none';
        if (bulkActionBar) bulkActionBar.classList.add('hidden');
        if (selectAllToggle) selectAllToggle.checked = false;
        
        document.body.classList.remove('quick-edit-list-active');
        populateCatGrid(); // Rebuild the grid from scratch
        runFilter();       // Apply current filters
    });

    listBtn.addEventListener('click', () => {
        Logger.info('List View Button CLICKED'); // <-- DEBUG LOG
        if (appState.currentView === 'list') return;
        appState.currentView = 'list';
        listBtn.classList.add('active');
        gridBtn.classList.remove('active');
        catContainer.classList.remove('view-grid');
        catContainer.classList.add('view-list');
        
        // Show list-only controls
        if (quickEditToggleContainer) quickEditToggleContainer.style.display = 'block';
        // Only show select-all if quick edit is already on
        if (selectAllContainer && quickEditToggle && quickEditToggle.checked) {
            selectAllContainer.style.display = 'block';
        }
        if (quickEditToggle && quickEditToggle.checked) {
            document.body.classList.add('quick-edit-list-active');
        }

        populateCatList(); // Rebuild the list from scratch
        runFilter();       // Apply current filters
    });

    // --- Sort Listener (Select Dropdown) ---
    if (sortSelect) {
        sortSelect.addEventListener('change', (e) => {
            appState.sortProperty = e.target.value;
            Logger.info(`Sort property changed to: ${appState.sortProperty}`);
            runFilter();
        });
    }

    // --- NEW: Sort Direction Listener (Button) ---
    if (sortDirectionBtn) {
        sortDirectionBtn.addEventListener('click', () => {
            // Toggle the direction
            appState.sortDirection = appState.sortDirection === 'asc' ? 'desc' : 'asc';
            // Update button text
            sortDirectionBtn.textContent = appState.sortDirection.toUpperCase();
            Logger.info(`Sort direction changed to: ${appState.sortDirection}`);
            runFilter(); // Re-run filter and sort
        });
    }

    // --- BULK ACTION LISTENERS ---

    // Listener for "Select All"
    if (selectAllToggle) {
        selectAllToggle.addEventListener('change', () => {
            Logger.info('Select All CHANGED'); // <-- DEBUG LOG
            const isChecked = selectAllToggle.checked;
            document.querySelectorAll('.list-item-select').forEach(cb => {
                cb.checked = isChecked;
            });
            updateBulkActionBar(); // This now calls the global function
        });
    }

    // MODIFIED: Listener for individual checkboxes (using CLICK for better shift-key)
    catContainer.addEventListener('click', (e) => {
        if (!e.target.classList.contains('list-item-select')) return;
        
        Logger.info('catContainer Checkbox CLICKED'); // <-- DEBUG LOG
        const currentCheckbox = e.target;

        // --- SHIFT-CLICK LOGIC ---
        if (e.shiftKey && lastClickedCheckbox && lastClickedCheckbox !== currentCheckbox) {
            Logger.info('Shift-click detected.'); // <-- DEBUG LOG
            const allCheckboxes = Array.from(document.querySelectorAll('.list-item-select'));
            const startIndex = allCheckboxes.indexOf(lastClickedCheckbox);
            const endIndex = allCheckboxes.indexOf(currentCheckbox);

            const start = Math.min(startIndex, endIndex);
            const end = Math.max(startIndex, endIndex);
            
            // Note: The click event has already toggled the currentCheckbox
            const currentState = currentCheckbox.checked; 

            for (let i = start; i <= end; i++) {
                allCheckboxes[i].checked = currentState;
            }
        }
        // --- END SHIFT-CLICK LOGIC ---

        lastClickedCheckbox = currentCheckbox;
        updateBulkActionBar(); // This now calls the global function
    });

    // Listener for the "Bulk Add" button
    if (bulkAddBtn) {
        bulkAddBtn.addEventListener('click', () => {
            Logger.info('Bulk Add Button CLICKED'); // <-- DEBUG LOG
            const selectedCheckboxes = document.querySelectorAll('.list-item-select:checked');
            const catIdsToAdd = Array.from(selectedCheckboxes).map(cb => cb.dataset.catId);
            
            const catsToAdd = catIdsToAdd
                .map(id => appState.userCats.find(c => c.cat_id == id))
                .filter(cat => cat && (!cat.user_info || cat.user_info.user_cat_level == null));

            if (catsToAdd.length === 0) {
                showErrorToast("All selected cats are already owned.");
                return;
            }

            Logger.info(`Bulk adding ${catsToAdd.length} cats...`);
            
            let promises = catsToAdd.map(cat => {
                const firstFormId = cat.forms[0].form_id;
                return fetch(`/user_api_proxy.php/users/${userId}/cats`, { 
                    method: 'POST', 
                    headers: { 'Content-Type': 'application/json' }, 
                    body: JSON.stringify({ cat_id: cat.cat_id, user_cat_level: 1, user_cat_plus_level: 0, user_cat_form_id: firstFormId }) 
                })
                .then(response => { if (!response.ok) throw new Error(`Failed to add ${cat.cat_name}`); return response.json(); })
                .then(addedCat => {
                    cat.user_info = { user_cat_level: 1, user_cat_form_id: firstFormId, user_cat_plus_level: 0 };
                });
            });

            Promise.all(promises)
                .then(() => {
                    Logger.info("Bulk add successful.");
                    runFilter();
                    updateBulkActionBar();
                })
                .catch(error => {
                    Logger.error("Bulk add failed for one or more cats.", error);
                    showErrorToast(error.message);
                    runFilter();
                    updateBulkActionBar();
                });
        });
    }

    // NEW: Listener for "Set Levels" button
    if (bulkSetLevelBtn) {
        bulkSetLevelBtn.addEventListener('click', () => {
            Logger.info('Bulk Set Level Button CLICKED'); // <-- DEBUG LOG
            const level = parseInt(bulkLevelInput.value);
            const plusLevel = parseInt(bulkPlusLevelInput.value);

            if (isNaN(level) && isNaN(plusLevel)) {
                showErrorToast("Please enter a level or +level.");
                return;
            }

            const selectedCheckboxes = document.querySelectorAll('.list-item-select:checked');
            const catIdsToUpdate = Array.from(selectedCheckboxes).map(cb => cb.dataset.catId);
            
            // We only want to update cats that are "owned"
            const catsToUpdate = catIdsToUpdate
                .map(id => appState.userCats.find(c => c.cat_id == id))
                .filter(cat => cat && cat.user_info);

            if (catsToUpdate.length === 0) {
                showErrorToast("No owned cats selected.");
                return;
            }

            Logger.info(`Bulk updating levels for ${catsToUpdate.length} cats...`);

            let promises = catsToUpdate.map(cat => {
                let payload = { ...cat.user_info }; // Clone user_info
                
                if (!isNaN(level)) {
                    let newLevel = level;
                    // Apply max level cap *unless* quick edit is on
                    if (!isQuickEditMode()) {
                        const max = cat.max_level;
                        if (newLevel > max) newLevel = max;
                    }
                    payload.user_cat_level = newLevel;
                }

                if (!isNaN(plusLevel)) {
                    let newPlusLevel = plusLevel;
                    // Apply max plus level cap *unless* quick edit is on
                    if (!isQuickEditMode()) {
                        const max = cat.max_plus_level;
                        if (newPlusLevel > max) newPlusLevel = max;
                    }
                    payload.user_cat_plus_level = newPlusLevel;
                }

                // --- SIMPLIFIED ---
                // Send the full payload
                return fetch(`/user_api_proxy.php/users/${userId}/cats/${cat.cat_id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                })
                .then(response => {
                    if (!response.ok) {
                         // Try to get error message from API response if possible
                         return response.json().catch(() => null).then(errData => {
                             const errMsg = errData?.message || `Failed to update ${cat.cat_name}`;
                             throw new Error(errMsg);
                         });
                    }
                     // No need to parse JSON if just checking for success
                     return null; // Indicate success
                })
                .then(() => {
                    // --- CORRECTED ---
                    // If the fetch succeeded, directly update local state
                    // with the 'payload' values we *sent* to the API.
                    if (payload.user_cat_level !== undefined) {
                        cat.user_info.user_cat_level = payload.user_cat_level;
                    }
                    if (payload.user_cat_plus_level !== undefined) {
                        cat.user_info.user_cat_plus_level = payload.user_cat_plus_level;
                    }
                });
                // --- END SIMPLIFICATION ---
            });

            Promise.all(promises)
                .then(() => {
                    Logger.info("Bulk level update successful.");
                    runFilter(); // Refresh the entire view
                    // Clear inputs
                    bulkLevelInput.value = '';
                    bulkPlusLevelInput.value = '';
                })
                .catch(error => {
                    Logger.error("Bulk level update failed for one or more cats.", error);
                    showErrorToast(error.message);
                    runFilter(); // Refresh anyway
                });
        });
    }
}

function upsertCat(catData, element = null, onSuccess = null, onError = null) { // <-- ADDED onError
    if (element) element.classList.add('saving');
    Logger.info(`Saving changes for cat ID: ${catData.cat_id}`, catData.user_info);

    fetch(`/user_api_proxy.php/users/${userId}/cats/${catData.cat_id}`, { 
        method: 'PATCH', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify(catData.user_info) 
    })
    .then(response => { 
        if (!response.ok) {
            // Try to get a JSON error message from the API
            return response.json().catch(() => null).then(errData => {
                const errMsg = errData?.message || 'Failed to save changes';
                throw new Error(errMsg);
            });
        }
        return response.json(); 
    })
    .then(data => { 
        Logger.info('Save successful.', data.cat); 
        if (element) {
            element.classList.add('save-success');
            setTimeout(() => element.classList.remove('save-success'), 1000);
        }
        if (onSuccess) onSuccess(data.cat); 
    })
    .catch(error => { 
        Logger.error(`Failed to save changes for cat ID: ${catData.cat_id}`, error); 
        showErrorToast(error.message); 
        if (element) {
            element.classList.add('save-error');
            setTimeout(() => element.classList.remove('save-error'), 1000);
        }
        // --- NEW: Call the rollback function if it exists ---
        if (onError) onError(); 
    })
    .finally(() => { 
        if (element) element.classList.remove('saving'); 
    });
}

function batchUpdateElements(updates) {
    updates.forEach(update => {
        const element = document.getElementById(update.id);
        if (element) {
            if (update.text !== undefined) element.textContent = update.text || '';
            if (update.src !== undefined) element.src = update.src || '';
        }
    });
}

function getCurrentForm(cat) {
    const userCatFormId = cat.user_info?.user_cat_form_id || cat.forms[0].form_id;
    return cat.forms.find(form => form.form_id == userCatFormId) || cat.forms[0];
}

function showErrorToast(message) {
    const toast = document.createElement('div');
    toast.className = 'error-toast';
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => { toast.remove(); }, 3000);
}

function showCustomTooltip(element, text) {
    hideCustomTooltip();
    const tooltip = document.createElement('div');
    tooltip.className = 'custom-tooltip';
    tooltip.textContent = text;
    document.body.appendChild(tooltip);
    const rect = element.getBoundingClientRect();
    tooltip.style.left = `${rect.left + rect.width / 2}px`;
    tooltip.style.top = `${rect.top}px`;
    setTimeout(() => { tooltip.classList.add('visible'); }, 10);
}

function hideCustomTooltip() {
    const tooltip = document.querySelector('.custom-tooltip');
    if (tooltip) tooltip.remove();
}

function getTooltipMessage(cat, formIndex) {
    const form = cat.forms[formIndex];
    if (!form || !cat.user_info) return '';

    if (form.required_level === -1) {
        const totalLevel = (parseInt(cat.user_info.user_cat_level) || 0) + (parseInt(cat.user_info.user_cat_plus_level) || 0);
        if (totalLevel < 20) {
            return "Requires Level 20 (Stage Unlock)"; // Add level req text
        } else {
            return "Stage Unlock"; // Level met
        }
    }

    const totalLevel = (parseInt(cat.user_info.user_cat_level) || 0) + (parseInt(cat.user_info.user_cat_plus_level) || 0);
    if (totalLevel < form.required_level) {
        return `Requires Level ${form.required_level}`;
    }
    
    if (isQuickEditMode()) {
        return '';
    }

    const hasAllItems = form.evolution_requirements.every(req => {
        const userItem = appState.userItems.find(item => item.item_id === req.item_id);
        return userItem && userItem.item_qty >= req.item_qty;
    });
    if (!hasAllItems) {
        return "Requires Items";
    }
    
    return '';
}