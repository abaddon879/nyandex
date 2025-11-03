import { Logger } from './logger.js';
import { appState } from './state.js';
import { refreshView, updateBulkActionBar, setView } from './app.js'; 
import { isQuickEditMode } from './helpers.js';
import { populateCatGrid, populateCatList, showErrorToast, refreshCatElement } from './ui.js';
import { updateCatNumericProperty, updateCatForm, removeCat } from './api.js';

let lastClickedCheckbox = null;

// ADD THIS NEW FUNCTION
function clearAllSelections() {
    // We use the same :not(.hidden) selector to be efficient
    document.querySelectorAll('.list-item:not(.hidden) .list-item-select:checked').forEach(cb => {
        cb.checked = false;
    });
    updateBulkActionBar(); // This will hide the bar and uncheck "Select All"
    lastClickedCheckbox = null; // Reset shift-click state
}

export function setupEventListeners() {
    Logger.info('--- setupEventListeners CALLED ---');
    const selectAllContainer = document.getElementById('list-select-all-container');
    const selectAllToggle = document.getElementById('list-select-all-toggle');
    const bulkActionBar = document.getElementById('bulk-action-bar');
    const bulkAddBtn = document.getElementById('bulk-add-btn');
    const bulkDeselectBtn = document.getElementById('bulk-deselect-btn');
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
    const sortDirectionBtn = document.getElementById('sort-direction-btn');

    document.querySelector('.panel-nav').addEventListener('click', (e) => {
        e.preventDefault();
        const link = e.target.closest('a');
        if (link) {
            clearAllSelections();
            appState.currentRarity = link.dataset.rarity;
            document.querySelectorAll('.rarity-list a').forEach(a => a.classList.remove('active'));
            link.classList.add('active');
            refreshView();
        }
    });

    document.getElementById('search').addEventListener('input', () => {
        clearAllSelections(); // <-- ADD THIS
        refreshView();
    });
    document.getElementById('filter-options').addEventListener('change', () => {
        clearAllSelections(); // <-- ADD THIS
        refreshView();
    });
    document.getElementById('clear-filters-btn').addEventListener('click', () => {
        clearAllSelections();
        document.getElementById('search').value = '';
        document.querySelectorAll('#filter-options input[type="checkbox"]').forEach(checkbox => { checkbox.checked = false; });
        const allRadio = document.querySelector('#filter-options input[name="ownership"][value="all"]');
        if (allRadio) allRadio.checked = true;
        refreshView();
    });

    if (quickEditToggle) {
        quickEditToggle.addEventListener('change', () => {
            const isChecked = quickEditToggle.checked;
            document.body.classList.toggle('quick-edit-list-active', isChecked);
            if (selectAllContainer) {
                selectAllContainer.style.display = isChecked ? 'block' : 'none';
            }
            if (!isChecked) {
                if (bulkActionBar) bulkActionBar.classList.add('hidden');
                if (selectAllToggle) selectAllToggle.checked = false;
            }
            refreshView();
        });
    }

    if (rightPanel) {        
        // MODIFY this 'click' listener
        rightPanel.addEventListener('click', (e) => {
            if (appState.currentCat) {
                if (e.target.matches('#detail-remove-btn')) {
                    if (confirm("Are you sure you want to remove this cat?")) { removeCat(appState.currentCat.cat_id); }
                }
            }
        });}
    
    if (gridBtn) {
        gridBtn.addEventListener('click', () => setView('grid'));
    }

    if (listBtn) {
        listBtn.addEventListener('click', () => setView('list'));
    }

    if (sortSelect) {
        sortSelect.addEventListener('change', (e) => {
            appState.sortProperty = e.target.value;
            refreshView();
        });
    }

    if (sortDirectionBtn) {
        sortDirectionBtn.addEventListener('click', () => {
            appState.sortDirection = appState.sortDirection === 'asc' ? 'desc' : 'asc';
            sortDirectionBtn.textContent = appState.sortDirection.toUpperCase();
            refreshView();
        });
    }

    if (selectAllToggle) {
        selectAllToggle.addEventListener('change', () => {
            const isChecked = selectAllToggle.checked;
            // REPLACE THIS:
            // document.querySelectorAll('.list-item-select').forEach(cb => {

            // WITH THIS:
            // This selector finds all list items that are NOT hidden,
            // then finds the checkbox inside them.
            document.querySelectorAll('.list-item:not(.hidden) .list-item-select').forEach(cb => {
                cb.checked = isChecked;
            });
            updateBulkActionBar();
        });
    }

    catContainer.addEventListener('click', (e) => {
        let currentCheckbox;
        if (e.target.classList.contains('list-item-select-label')) {
            // Clicked on the label, find the input inside
            currentCheckbox = e.target.querySelector('.list-item-select');
        } else if (e.target.classList.contains('list-item-select')) {
            // Clicked on the checkbox input itself
            currentCheckbox = e.target;
        } else {
            // Clicked on something else, ignore
            return;
        }
        if (!currentCheckbox) return;

        if (e.shiftKey && lastClickedCheckbox && lastClickedCheckbox !== currentCheckbox) {
            const allCheckboxes = Array.from(document.querySelectorAll('.list-item:not(.hidden) .list-item-select'));
            const startIndex = allCheckboxes.indexOf(lastClickedCheckbox);
            const endIndex = allCheckboxes.indexOf(currentCheckbox);
            const start = Math.min(startIndex, endIndex);
            const end = Math.max(startIndex, endIndex);
            const currentState = currentCheckbox.checked; 

            for (let i = start; i <= end; i++) {
                allCheckboxes[i].checked = currentState;
            }
        }
        lastClickedCheckbox = currentCheckbox;
        updateBulkActionBar();
    });

    if (bulkAddBtn) {
        bulkAddBtn.addEventListener('click', () => {
            const selectedCheckboxes = document.querySelectorAll('.list-item:not(.hidden) .list-item-select:checked');
            const catIdsToAdd = Array.from(selectedCheckboxes).map(cb => cb.dataset.catId);
            
            const catsToAdd = catIdsToAdd
                .map(id => appState.userCats.find(c => c.cat_id == id))
                .filter(cat => cat && (!cat.user_info || cat.user_info.user_cat_level == null));

            if (catsToAdd.length === 0) {
                showErrorToast("All selected cats are already owned.");
                return;
            }
            
            let promises = catsToAdd.map(cat => {
                const firstFormId = cat.forms[0].form_id;
                // This is a direct call, so we need to get the global userId
                const userId = window.userId; // Get it from the global scope
                return fetch(`/user_api_proxy.php/users/${userId}/cats`, { 
                    method: 'POST', 
                    headers: { 'Content-Type': 'application/json' }, 
                    body: JSON.stringify({ cat_id: cat.cat_id, user_cat_level: 1, user_cat_plus_level: 0, user_cat_form_id: firstFormId }) 
                })
                .then(response => { if (!response.ok) throw new Error(`Failed to add ${cat.cat_name}`); return response.json(); })
                .then(addedCat => {
                    cat.user_info = { user_cat_level: 1, user_cat_form_id: firstFormId, user_cat_plus_level: 0 };
                    return cat;
                });
            });

            Promise.allSettled(promises)
                .then((results) => {
                    let successCount = 0;
                    let lastError = null;

                    results.forEach(result => {
                        if (result.status === 'fulfilled') {
                            successCount++;
                            // 'result.value' is the 'cat' object we returned above.
                            // If 'return cat;' was missing, 'result.value' is undefined.
                            const cat = result.value; 
                            
                            // Check if cat is valid before refreshing
                            if (cat) {
                                refreshCatElement(cat);
                            } else {
                                Logger.error("Bulk add fulfilled with an undefined cat value.", result);
                            }
                        } else {
                            // This one failed
                            Logger.error("Failed to add a cat.", result.reason.message);
                            lastError = result.reason.message;
                        }
                    });

                    Logger.info(`Bulk add complete. ${successCount} successful.`);
                    if (lastError) {
                        showErrorToast(`One or more cats failed to add. Last error: ${lastError}`);
                    }

                    refreshView();
                    updateBulkActionBar();
                });
        });
    }

    if (bulkDeselectBtn) {
        bulkDeselectBtn.addEventListener('click', () => {
            document.querySelectorAll('.list-item:not(.hidden) .list-item-select:checked').forEach(cb => {
                cb.checked = false;
            });
            updateBulkActionBar(); // This will hide the bar
            lastClickedCheckbox = null; // Reset shift-click state
        });
    }

    if (bulkSetLevelBtn) {
        bulkSetLevelBtn.addEventListener('click', () => {
            const level = parseInt(bulkLevelInput.value);
            const plusLevel = parseInt(bulkPlusLevelInput.value);
            const userId = window.userId; // Get it from the global scope

            if (isNaN(level) && isNaN(plusLevel)) {
                showErrorToast("Please enter a level or +level.");
                return;
            }

            const selectedCheckboxes = document.querySelectorAll('.list-item:not(.hidden) .list-item-select:checked');
            const catIdsToUpdate = Array.from(selectedCheckboxes).map(cb => cb.dataset.catId);
            
            const catsToUpdate = catIdsToUpdate
                .map(id => appState.userCats.find(c => c.cat_id == id))
                .filter(cat => cat && cat.user_info);

            if (catsToUpdate.length === 0) {
                showErrorToast("No owned cats selected.");
                return;
            }

            let promises = catsToUpdate.map(cat => {
                let payload = { ...cat.user_info };
                
                if (!isNaN(level)) {
                    let newLevel = level;
                    const max = cat.max_level;
                    if (newLevel > max) newLevel = max;
                    if (newLevel < 1) newLevel = 1;
                    payload.user_cat_level = newLevel;
                }

                if (!isNaN(plusLevel)) {
                    let newPlusLevel = plusLevel;
                    const max = cat.max_plus_level;
                    if (newPlusLevel > max) newPlusLevel = max;
                    if (newPlusLevel < 0) newPlusLevel = 0;
                    payload.user_cat_plus_level = newPlusLevel;
                }

                return fetch(`/user_api_proxy.php/users/${userId}/cats/${cat.cat_id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                })
                .then(response => {
                    if (!response.ok) {
                         return response.json().catch(() => null).then(errData => {
                             const errMsg = errData?.message || `Failed to update ${cat.cat_name}`;
                             throw new Error(errMsg);
                         });
                    }
                     return null;
                })
                .then(() => {
                    if (payload.user_cat_level !== undefined) {
                        cat.user_info.user_cat_level = payload.user_cat_level;
                    }
                    if (payload.user_cat_plus_level !== undefined) {
                        cat.user_info.user_cat_plus_level = payload.user_cat_plus_level;
                    }
                });
            });

            Promise.allSettled(promises)
                .then((results) => {
                    let successCount = 0;
                    let lastError = null;

                    results.forEach((result, index) => {
                        if (result.status === 'fulfilled') {
                            successCount++;
                            // We updated the cat in the promise, so just refresh it
                            refreshCatElement(catsToUpdate[index]);
                        } else {
                            // This one failed
                            const cat = catsToUpdate[index];
                            Logger.error(`Failed to update ${cat.cat_name}.`, result.reason.message);
                            lastError = result.reason.message;
                            // Also refresh to roll back to original state
                            refreshCatElement(cat); 
                        }
                    });
                    
                    Logger.info(`Bulk level update complete. ${successCount} successful.`);
                    if (lastError) {
                        showErrorToast(`One or more cats failed to update. Last error: ${lastError}`);
                    }

                    refreshView();
                    bulkLevelInput.value = '';
                    bulkPlusLevelInput.value = '';
                    clearAllSelections();
                });
        });
    }
}