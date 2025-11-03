// =================================================================================
// LOGGER UTILITY
// =================================================================================
const Logger = {
    info: (message, data = '') => {
        console.info(`[${new Date().toLocaleTimeString()}] [INFO] ${message}`, data);
    },
    error: (message, error = '') => {
        console.error(`[${new Date().toLocaleTimeString()}] [ERROR] ${message}`, error);
    }
};

// =================================================================================
// STATE & INITIALIZATION
// =================================================================================

const appState = {
    userCats: [],
    userItems: [],
    currentModalCat: null
};

const catElementMap = new Map();

Promise.all([
    fetch(`http://pat.localhost/api/users/${userId}/cats`, { method: 'GET', headers: { 'X-API-Key': apiKey } }),
    fetch(`http://pat.localhost/api/users/${userId}/items`, { method: 'GET', headers: { 'X-API-Key': apiKey } })
])
.then(responses => Promise.all(responses.map(response => {
    if (!response.ok) throw new Error(`Response status: ${response.status}`);
    return response.json();
})))
.then(([catsData, itemsData]) => {
    appState.userCats = catsData;
    appState.userItems = itemsData;
    populateSections(appState.userCats);
    addCollapseEventListeners();
    setupModal();
    Logger.info('Application initialized successfully.');
})
.catch(error => {
    Logger.error('Could not load initial application data.', error);
    showErrorToast('Could not load initial cat data.');
});


// =================================================================================
// CORE LOGIC & RENDERING
// =================================================================================

function isFormAchievable(cat, formIndex) {
    const form = cat.forms[formIndex];
    if (!cat.user_info || !form) return false;
    if (formIndex === 0) return true;

    const totalLevel = (parseInt(cat.user_info.user_cat_level) || 0) + (parseInt(cat.user_info.user_cat_plus_level) || 0);

    if (form.required_level === -1) {
        return totalLevel >= 20;
    }
    
    const levelRequirementMet = totalLevel >= form.required_level;
    const itemsRequirementMet = form.evolution_requirements.every(req => {
        const userItem = appState.userItems.find(item => item.item_id === req.item_id);
        return userItem && userItem.item_qty >= req.item_qty;
    });

    return levelRequirementMet && itemsRequirementMet;
}

function canCatEvolve(cat) {
    if (!cat.user_info) return false;
    const currentFormIndex = cat.forms.findIndex(f => f.form_id === cat.user_info.user_cat_form_id);
    return cat.forms.some((form, index) => index > currentFormIndex && isFormAchievable(cat, index));
}

function createCatCardHTML(cat) {
    const userHasCat = cat.user_info && cat.user_info.user_cat_level != null;
    const currentForm = getCurrentForm(cat);
    const formName = currentForm.form_name;
    const currentFormIndex = cat.forms.findIndex(f => f.form_id === currentForm.form_id);
    
    const canEvolve = canCatEvolve(cat);
    let formLabels = ['Normal', 'Evolved', 'True', 'Ultra'];

    const formButtonsHTML = cat.forms.map((form, index) => {
        const isAchievable = userHasCat ? isFormAchievable(cat, index) : false;
        const isActive = index === currentFormIndex;
        
        let tooltipAttr = '';
        if (form.required_level === -1) {
            tooltipAttr = `data-tooltip="Stage Unlock"`;
        } else if (!isAchievable && form.required_level > 0) {
            tooltipAttr = `data-tooltip="Requires Level ${form.required_level}"`;
        }

        return `<button 
                    class="form-button ${isActive ? 'active' : ''}" 
                    data-form-index="${index}" 
                    ${tooltipAttr}
                    ${!isAchievable ? 'disabled' : ''}>
                    ${formLabels[index]}
                </button>`;
    }).join('');

    return `
        <span class="stack-top left" style="display: ${canEvolve ? 'block' : 'none'};">Upgrade</span>
        <button class="plus-button ${userHasCat ? 'missing' : ''}" aria-label="Add ${formName}">+</button>
        <button class="info-button" aria-label="Details for ${formName}">i</button>
        <img src="/assets/images/units/${currentForm.image_url}" alt="${formName}" title="${formName}" class="${userHasCat ? '' : 'missing'}">
        <h4 class="${userHasCat ? '' : 'missing'}">${formName}</h4>
        <div class="levels ${userHasCat ? '' : 'missing'}">
            <label class="${userHasCat ? '' : 'missing'}">
                Level
                <input class="level-input" type="number" min="1" max="${cat.max_level}" value="${cat.user_info?.user_cat_level ?? 0}">
            </label>
            <br/>
            <label class="${userHasCat ? '' : 'missing'}">
                +Level
                <input class="plus-level-input" type="number" min="0" max="${cat.max_plus_level}" value="${cat.user_info?.user_cat_plus_level ?? 0}">
            </label>
            <br/>
            <label class="slider-label ${userHasCat ? '' : 'missing'}">Form:</label>
            <div class="form-button-group">
                ${formButtonsHTML}
            </div>
        </div>
    `;
}

function populateSections(data) {
    const sections = document.getElementById('cat-sections');
    const rarities = Array.from(new Set(data.map(cat => cat.rarity.rarity_name)));
    sections.innerHTML = '';

    rarities.forEach(rarity => {
        const section = document.createElement('section');
        section.id = rarity.toLowerCase().replace(/\s+/g, '-');
        const header = document.createElement('h2');
        header.textContent = `${rarity.charAt(0).toUpperCase() + rarity.slice(1)} Cats`;
        header.classList.add('collapsed');
        const grid = document.createElement('div');
        grid.className = 'grid';

        data.filter(cat => cat.rarity.rarity_name === rarity).forEach(cat => {
            const gridItem = document.createElement('div');
            gridItem.className = 'grid-item';
            gridItem.dataset.catId = cat.cat_id;
            gridItem.innerHTML = createCatCardHTML(cat);
            
            catElementMap.set(cat.cat_id, gridItem);

            gridItem.querySelector('.plus-button').addEventListener('click', (e) => onAddCat(e, cat));
            gridItem.querySelector('.info-button').addEventListener('click', () => openOrCloseModal(cat));
            
            // --- REFACTOR: Use the new consolidated function ---
            gridItem.querySelector('.level-input').addEventListener('change', (e) => updateCatNumericProperty(cat.cat_id, e.target, 'user_cat_level'));
            gridItem.querySelector('.plus-level-input').addEventListener('change', (e) => updateCatNumericProperty(cat.cat_id, e.target, 'user_cat_plus_level'));
            
            const formButtonGroup = gridItem.querySelector('.form-button-group');
            formButtonGroup.addEventListener('click', (e) => {
                if (e.target.matches('.form-button:not([disabled]):not(.active)')) {
                    updateCatForm(cat.cat_id, e.target);
                }
            });
            
            formButtonGroup.addEventListener('mouseover', (e) => {
                if (e.target.matches('[data-tooltip]')) {
                    showCustomTooltip(e.target, e.target.dataset.tooltip);
                }
            });
            formButtonGroup.addEventListener('mouseout', () => {
                hideCustomTooltip();
            });

            grid.appendChild(gridItem);
        });
        section.appendChild(header);
        section.appendChild(grid);
        sections.appendChild(section);
    });
}

// =================================================================================
// EVENT HANDLERS & UI UPDATES
// =================================================================================

function onAddCat(e, cat) {
    e.stopPropagation();
    const firstFormId = cat.forms[0].form_id;
    fetch(`http://pat.localhost/api/users/${userId}/cats`, {
        method: 'POST',
        headers: { 'X-API-Key': apiKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({ cat_id: cat.cat_id, user_cat_level: 1, user_cat_plus_level: 0, user_cat_form_id: firstFormId })
    })
    .then(response => { if (!response.ok) throw new Error('Failed to add cat'); return response.json(); })
    .then(addedCat => {
        Logger.info('Cat added successfully.', addedCat);
        cat.user_info = { user_cat_level: 1, user_cat_form_id: firstFormId, user_cat_plus_level: 0 };
        const gridItem = e.target.closest('.grid-item');
        
        gridItem.querySelector('.level-input').value = 1;
        e.target.classList.add('missing');
        gridItem.querySelectorAll('.missing').forEach(el => {
            if (el !== e.target) el.classList.remove('missing');
        });

        const formButtons = gridItem.querySelectorAll('.form-button');
        formButtons.forEach((btn, index) => {
            btn.disabled = !isFormAchievable(cat, index);
            if (index === 0) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    })
    .catch(error => {
        Logger.error('Failed to add cat.', error);
        showErrorToast(error.message);
    });
}

function updateCardUI(catId) {
    const gridItem = catElementMap.get(catId);
    const cat = appState.userCats.find(c => c.cat_id == catId);
    if (!gridItem || !cat) return;

    const formButtons = gridItem.querySelectorAll('.form-button');
    formButtons.forEach((btn, index) => {
        const buttonForm = cat.forms[index];
        btn.disabled = !isFormAchievable(cat, index);

        if (buttonForm.required_level === -1) {
            btn.dataset.tooltip = `Stage Unlock`;
        } else if (btn.disabled && buttonForm.required_level > 0) {
            btn.dataset.tooltip = `Requires Level ${buttonForm.required_level}`;
        } else {
            delete btn.dataset.tooltip;
        }
    });

    const upgradeBanner = gridItem.querySelector('.stack-top');
    if(upgradeBanner) upgradeBanner.style.display = canCatEvolve(cat) ? 'block' : 'none';
}

/**
 * --- NEW REFACTOR: Consolidated function for level and +level updates ---
 * Handles the change event for any numeric cat property input.
 * @param {number} catId The ID of the cat being updated.
 * @param {HTMLElement} element The input element that changed.
 * @param {string} propertyName The name of the user_info property to update.
 */
function updateCatNumericProperty(catId, element, propertyName) {
    const cat = appState.userCats.find(c => c.cat_id == catId);
    if (!cat?.user_info) return;

    let value = parseInt(element.value) || 0;
    const max = parseInt(element.max);

    if (value > max) {
        value = max;
        element.value = value;
    }

    cat.user_info[propertyName] = value;
    upsertCat(cat, element, () => updateCardUI(catId));
}

function updateCatForm(catId, buttonElement) {
    const cat = appState.userCats.find(c => c.cat_id == catId);
    if (!cat?.user_info) return;
    
    const newFormIndex = parseInt(buttonElement.dataset.formIndex);
    const newFormId = cat.forms[newFormIndex].form_id;
    cat.user_info.user_cat_form_id = newFormId;
    
    const onSuccess = () => {
        const gridItem = catElementMap.get(catId);
        if (gridItem) {
            const newForm = cat.forms[newFormIndex];
            if (newForm) {
                const img = gridItem.querySelector('img');
                const title = gridItem.querySelector('h4');
                img.src = `/assets/images/units/${newForm.image_url}`;
                img.alt = newForm.form_name;
                img.title = newForm.form_name;
                title.textContent = newForm.form_name;
            }

            gridItem.querySelectorAll('.form-button').forEach(btn => btn.classList.remove('active'));
            buttonElement.classList.add('active');

            const upgradeBanner = gridItem.querySelector('.stack-top');
            if(upgradeBanner) upgradeBanner.style.display = canCatEvolve(cat) ? 'block' : 'none';
        }
    };
    upsertCat(cat, buttonElement, onSuccess);
}

function removeCat(catId) {
    fetch(`http://pat.localhost/api/users/${userId}/cats/${catId}`, {
        method: 'DELETE',
        headers: { 'X-API-Key': apiKey, 'Content-Type': 'application/json' }
    })
    .then(response => { if (!response.ok) throw new Error('Failed to remove cat'); })
    .then(() => {
        Logger.info(`Cat with ID ${catId} removed successfully.`);
        const cat = appState.userCats.find(c => c.cat_id === catId);
        const gridItem = catElementMap.get(catId);
        
        if (gridItem && cat) {
            const firstForm = cat.forms[0];
            gridItem.querySelector('img').src = `/assets/images/units/${firstForm.image_url}`;
            gridItem.querySelector('img').alt = firstForm.form_name;
            gridItem.querySelector('img').title = firstForm.form_name;
            gridItem.querySelector('h4').textContent = firstForm.form_name;
            gridItem.querySelector('img').classList.add('missing');
            gridItem.querySelector('h4').classList.add('missing');
            gridItem.querySelector('.levels').classList.add('missing');
            gridItem.querySelector('.level-input').value = 0;
            gridItem.querySelector('.plus-level-input').value = 0;
            gridItem.querySelector('.plus-button').classList.remove('missing');
            gridItem.querySelector('.stack-top').style.display = 'none';
            gridItem.querySelectorAll('.form-button').forEach(btn => {
                btn.disabled = true;
                btn.classList.remove('active');
            });
        }
        
        if (cat) cat.user_info = null;
        closeModal();
    })
    .catch(error => {
        Logger.error(`Failed to remove cat with ID ${catId}.`, error);
        showErrorToast(error.message);
    });
}


// =================================================================================
// MODAL & GENERIC EVENT LISTENERS
// =================================================================================

/**
 * --- NEW REFACTOR: Helper to streamline DOM updates in the modal ---
 * @param {Array<Object>} updates An array of objects describing the updates.
 * Each object can have: id, text, src, alt.
 */
function batchUpdateElements(updates) {
    updates.forEach(update => {
        const element = document.getElementById(update.id);
        if (element) {
            if (update.text !== undefined) element.textContent = update.text || '';
            if (update.src !== undefined) element.src = update.src || '';
            if (update.alt !== undefined) element.alt = update.alt || '';
        }
    });
}

function openOrCloseModal(cat) {
    const modal = document.getElementById('unit-modal');
    if (appState.currentModalCat === cat) {
        modal.style.display = 'none';
        appState.currentModalCat = null;
    } else {
        Logger.info(`Opening modal for cat: ${cat.cat_name}`, cat);
        const userCatFormId = cat.user_info?.user_cat_form_id || 1;
        
        // --- REFACTOR: Build an array of updates and call the helper ---
        const updates = [
            { id: 'modal-id', text: `# ${String(cat.cat_id).padStart(3, '0')}` },
            { id: 'modal-name', text: cat.cat_name },
            { id: 'modal-image', src: `/assets/images/units/${cat.forms[0]?.image_url}` },
            { id: 'modal-max-level', text: `Max Level: ${cat.max_level}` },
            { id: 'modal-max-plus-level', text: `Max +Level: ${cat.max_plus_level}` },
            { id: 'modal-evolved-form-name', text: cat.forms[1]?.form_name },
            { id: 'modal-evolved-form-image', src: cat.forms[1]?.image_url ? `/assets/images/units/${cat.forms[1].image_url}` : '' },
            { id: 'modal-evolved-form-required-level', text: cat.forms[1]?.required_level ? `Level ${cat.forms[1].required_level}` : '' },
            { id: 'modal-true-form-name', text: cat.forms[2]?.form_name },
            { id: 'modal-true-form-image', src: cat.forms[2]?.image_url ? `/assets/images/units/${cat.forms[2].image_url}` : '' },
            { id: 'modal-true-form-required-level', text: cat.forms[2] ? (cat.forms[2].required_level === -1 ? 'Stage Unlock' : `Level ${cat.forms[2].required_level}`) : '' },
            { id: 'modal-true-form-required-xp', text: cat.forms[2]?.required_xp ? `XP ${cat.forms[2].required_xp.toLocaleString()}` : '' },
            { id: 'modal-ultra-form-name', text: cat.forms[3]?.form_name },
            { id: 'modal-ultra-form-image', src: cat.forms[3]?.image_url ? `/assets/images/units/${cat.forms[3].image_url}` : '' },
            { id: 'modal-ultra-form-required-level', text: cat.forms[3]?.required_level ? `Level ${cat.forms[3].required_level}` : '' },
            { id: 'modal-ultra-form-required-xp', text: cat.forms[3]?.required_xp ? `XP ${cat.forms[3].required_xp.toLocaleString()}` : '' },
        ];
        batchUpdateElements(updates);

        const isTrueFormAchieved = userCatFormId >= (cat.forms[2]?.form_id || Infinity);
        const isUltraFormAchieved = userCatFormId >= (cat.forms[3]?.form_id || Infinity);
        updateEvolutionRequirements(cat.forms[2]?.evolution_requirements || [], 'modal-true-form-evolution-requirements', isTrueFormAchieved);
        updateEvolutionRequirements(cat.forms[3]?.evolution_requirements || [], 'modal-ultra-form-evolution-requirements', isUltraFormAchieved);

        modal.style.display = 'block';
        appState.currentModalCat = cat;
    }
}

function closeModal() {
    const modal = document.getElementById('unit-modal');
    modal.style.display = 'none';
    appState.currentModalCat = null;
}

function setupModal() {
    const modal = document.getElementById('unit-modal');
    const span = document.getElementsByClassName('close')[0];
    
    span.onclick = closeModal;
    window.onclick = (event) => {
        if (event.target === modal) closeModal();
    };

    modal.addEventListener('click', function(event) {
        if (event.target.matches('.remove')) {
            if (appState.currentModalCat) {
                if (confirm("Are you sure you want to remove this cat?")) {
                    const catId = appState.currentModalCat.cat_id;
                    removeCat(catId);
                }
            }
        }
    });
}

function addCollapseEventListeners() {
    document.querySelectorAll('section h2').forEach(header => {
        header.addEventListener('click', () => {
            header.classList.toggle('collapsed');
            const grid = header.nextElementSibling;
            grid.style.display = header.classList.contains('collapsed') ? 'none' : 'grid';
        });
    });
}

document.addEventListener('DOMContentLoaded', function() {
    Logger.info("DOM fully loaded. Attaching page-level event listeners...");
    
    const searchInput = document.getElementById('search');
    if (searchInput) {
        searchInput.addEventListener('input', filterCats);
    }

    const filterIcon = document.querySelector('.filter-icon');
    if (filterIcon) {
        filterIcon.addEventListener('click', () => {
            const filterOptions = document.getElementById('filter-options');
            filterOptions.style.display = filterOptions.style.display === 'none' || filterOptions.style.display === '' ? 'block' : 'none';
        });
    }
    
    const clearButton = document.getElementById('clear-filters-btn');
    if (clearButton) {
        clearButton.addEventListener('click', () => {
            searchInput.value = '';
            document.querySelectorAll('#filter-options input[type="checkbox"]').forEach(checkbox => {
                checkbox.checked = false;
            });
            filterCats();
        });
    }
});


// =================================================================================
// UTILITY & HELPER FUNCTIONS
// =================================================================================

function upsertCat(catData, element = null, onSuccess = null) {
    if (element) element.classList.add('saving');
    Logger.info(`Saving changes for cat ID: ${catData.cat_id}`, catData.user_info);
    fetch(`http://pat.localhost/api/users/${userId}/cats/${catData.cat_id}`, {
        method: 'PATCH',
        headers: { 'X-API-Key': apiKey, 'Content-Type': 'application/json' },
        body: JSON.stringify(catData.user_info)
    })
    .then(response => { if (!response.ok) throw new Error('Failed to save changes'); return response.json(); })
    .then(data => {
        Logger.info('Save successful.', data.cat);
        if (onSuccess) onSuccess(data.cat);
    })
    .catch(error => {
        Logger.error(`Failed to save changes for cat ID: ${catData.cat_id}`, error);
        showErrorToast(error.message);
    })
    .finally(() => {
        if (element) element.classList.remove('saving');
    });
}

function filterCats() {
    const search = document.getElementById('search').value.toLowerCase();
    const selectedFilters = Array.from(document.querySelectorAll('#filter-options input[type="checkbox"]:checked')).map(cb => cb.value);
    const sections = document.querySelectorAll('#cat-sections section');

    appState.userCats.forEach(cat => {
        const element = catElementMap.get(cat.cat_id);
        if (!element) return;

        const matchesSearch = cat.forms.some(form => form.form_name.toLowerCase().includes(search));
        let matchesFilter = true;

        if (selectedFilters.includes("upgrade")) {
            matchesFilter = matchesFilter && canCatEvolve(cat);
        }
        if (selectedFilters.includes("missing")) {
            matchesFilter = matchesFilter && !(cat.user_info && cat.user_info.user_cat_level != null);
        }

        if (matchesSearch && matchesFilter) {
            element.classList.remove('hidden');
        } else {
            element.classList.add('hidden');
        }
    });

    sections.forEach(section => {
        const grid = section.querySelector('.grid');
        const hasVisibleItems = !!grid.querySelector('.grid-item:not(.hidden)');
        section.style.display = hasVisibleItems ? '' : 'none';
    });
}

function updateEvolutionRequirements(evolutionRequirements, prefix, isFormAchieved) {
    for (let i = 0; i < 5; i++) {
        const item = evolutionRequirements[i];
        const imgElement = document.getElementById(`${prefix}-${i + 1}-img`);
        const qtyElement = document.getElementById(`${prefix}-${i + 1}-qty`);

        const updates = [
            { id: `${prefix}-${i + 1}-img`, src: item ? `/assets/images/items/gatyaitemD_${item.item_id}_f.png` : '', alt: item ? item.item_name : '' },
            { id: `${prefix}-${i + 1}-qty`, text: item ? `x${item.item_qty}` : '' }
        ];
        batchUpdateElements(updates);

        if (imgElement) {
            imgElement.classList.remove('greenglow', 'redglow');
            if (item && !isFormAchieved) {
                const userItem = appState.userItems.find(userItem => userItem.item_id === item.item_id);
                const hasEnough = userItem && userItem.item_qty >= item.item_qty;
                imgElement.classList.add(hasEnough ? 'greenglow' : 'redglow');
            }
        }
    }
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
    setTimeout(() => {
        toast.remove();
    }, 3000);
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

    setTimeout(() => {
      tooltip.classList.add('visible');
    }, 10);
}

function hideCustomTooltip() {
    const tooltip = document.querySelector('.custom-tooltip');
    if (tooltip) {
        tooltip.remove();
    }
}