import { Logger } from './logger.js';
import { appState, catElementMap } from './state.js';
import { onAddCat, updateCatNumericProperty, updateCatForm } from './api.js';
import { isQuickEditMode, getCurrentForm, isFormAchievable, canCatEvolve } from './helpers.js';



// --- NEW getTooltipMessage ---
// This function needs to be in ui.js because it calls isQuickEditMode
// and needs appState, but it was deleted. Add this back.
function getTooltipMessage(cat, formIndex) {
    const form = cat.forms[formIndex];
    if (!form || !cat.user_info) return '';

    if (form.required_level === -1) {
        const totalLevel = (parseInt(cat.user_info.user_cat_level) || 0) + (parseInt(cat.user_info.user_cat_plus_level) || 0);
        if (totalLevel < 20) {
            return "Requires Level 20 (Stage Unlock)";
        } else {
            return "Stage Unlock";
        }
    }

    const totalLevel = (parseInt(cat.user_info.user_cat_level) || 0) + (parseInt(cat.user_info.user_cat_plus_level) || 0);
    if (totalLevel < form.required_level) {
        return `Requires Level ${form.required_level}`;
    }
    
    if (isQuickEditMode()) { // This will now use the imported helper
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

// --- HTML Creation Helpers ---

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

function createCatListHTML(cat) {
    const userHasCat = cat.user_info && cat.user_info.user_cat_level != null;
    const currentForm = getCurrentForm(cat);

    return `
        <div class="select-column">
            <label class="list-item-select-label">
                <input type="checkbox" class="list-item-select" data-cat-id="${cat.cat_id}">
            </label>
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
}

function addListenersToCatElement(element, cat) {
    // --- Common Listeners (from both grid and list) ---
    element.querySelector('.level-input')?.addEventListener('change', (e) => updateCatNumericProperty(cat.cat_id, e.target, 'user_cat_level'));
    element.querySelector('.plus-level-input')?.addEventListener('change', (e) => updateCatNumericProperty(cat.cat_id, e.target, 'user_cat_plus_level'));
    
    const formButtonGroup = element.querySelector('.form-button-group');
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

    // --- View-Specific Listeners ---
    if (appState.currentView === 'grid') {
        // Listeners for Grid View
        element.querySelector('.card-action-button')?.addEventListener('click', (e) => onAddCat(e, cat));
        element.addEventListener('click', (e) => {
            if (e.target.closest('.card-action-button, input, .form-button-group')) {
                return; 
            }
            displayCatInDetailPanel(cat);
        });
    } else { 
        // Listeners for List View
        element.querySelector('.list-add-button')?.addEventListener('click', (e) => onAddCat(e, cat));
        element.addEventListener('click', (e) => {
            if (e.target.closest('input, .form-button-group, .list-add-button, .list-item-select-label')) {
                return; 
            }
            displayCatInDetailPanel(cat);
        });
    }
}

// --- Tooltip & Toast Helpers ---

export function showErrorToast(message) {
    const toast = document.createElement('div');
    toast.className = 'error-toast';
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => { toast.remove(); }, 3000);
}

export function showCustomTooltip(element, text) {
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

export function hideCustomTooltip() {
    const tooltip = document.querySelector('.custom-tooltip');
    if (tooltip) tooltip.remove();
}

// --- DOM Manipulation Helpers ---

function batchUpdateElements(updates) {
    updates.forEach(update => {
        const element = document.getElementById(update.id);
        if (element) {
            if (update.text !== undefined) element.textContent = update.text || '';
            if (update.src !== undefined) element.src = update.src || '';
        }
    });
}

// --- Core UI Renderers ---

export function populateRarityNav() {
    const nav = document.querySelector('.panel-nav');
    if (!nav) return;
    const rarities = [...new Set(appState.userCats.map(cat => cat.rarity.rarity_name))];
    const ul = document.createElement('ul');
    ul.className = 'rarity-list';

    rarities.forEach(rarity => {
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.href = '#';
        a.textContent = rarity;
        a.dataset.rarity = rarity;
        li.appendChild(a);
        ul.appendChild(li);
    });

    const allLi = document.createElement('li');
    const allA = document.createElement('a');
    allA.href = '#';
    allA.textContent = 'All Cats';
    allA.dataset.rarity = 'all';
    allLi.appendChild(allA);
    ul.appendChild(allLi);

    nav.innerHTML = '';
    nav.appendChild(ul);
}

export function populateCatList() {
    const gridContainer = document.getElementById('cat-sections');
    if (!gridContainer) return;
    
    gridContainer.className = 'list-view-container';
    gridContainer.innerHTML = '';
    catElementMap.clear();

    appState.userCats.forEach(cat => {
        const userHasCat = cat.user_info && cat.user_info.user_cat_level != null;
        const currentForm = getCurrentForm(cat);

        const listItem = document.createElement('div');
        listItem.className = 'list-item hidden';
        if (userHasCat) {
            listItem.classList.add('owned');
        } else {
            listItem.classList.add('missing');
        }
        
        listItem.innerHTML = createCatListHTML(cat); // <-- REPLACE old HTML block
        addListenersToCatElement(listItem, cat);     // <-- REPLACE all old listeners

        catElementMap.set(cat.cat_id, listItem);

        gridContainer.appendChild(listItem);
    });
}

export function populateCatGrid() {
    const gridContainer = document.getElementById('cat-sections');
    if (!gridContainer) return;

    gridContainer.className = 'grid';
    gridContainer.innerHTML = '';
    catElementMap.clear();

    appState.userCats.forEach(cat => {
        const gridItem = document.createElement('div');
        gridItem.className = 'grid-item hidden';
        if (cat.user_info && cat.user_info.user_cat_level != null) {
            gridItem.classList.add('owned');
        }
        
        gridItem.innerHTML = createCatCardHTML(cat);
        catElementMap.set(cat.cat_id, gridItem);

        addListenersToCatElement(gridItem, cat);

        gridContainer.appendChild(gridItem);
    });
}

export function displayCatInDetailPanel(cat) {
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

    const levelText = document.getElementById('detail-level-text');
    const plusLevelText = document.getElementById('detail-plus-level-text');

    const formsContainer = document.getElementById('detail-forms-container');
    const userHasCat = cat.user_info && cat.user_info.user_cat_level != null;

    if (userHasCat) {
        levelText.textContent = cat.user_info.user_cat_level;
        plusLevelText.textContent = cat.user_info.user_cat_plus_level;
    } else {

        levelText.textContent = 'N/A';
        plusLevelText.textContent = 'N/A';
    }

    formsContainer.innerHTML = '';
    cat.forms.forEach((form, index) => {
        const formDiv = document.createElement('div');
        let formStatusClass = 'locked';
        const currentFormIndex = userHasCat ? cat.forms.findIndex(f => f.form_id === cat.user_info.user_cat_form_id) : -1;
        const isAchievable = userHasCat && isFormAchievable(cat, index);

        if (userHasCat && index <= currentFormIndex) {
            formStatusClass = 'achieved';
        } else if (isAchievable) {
            formStatusClass = 'available';
        }
        
        formDiv.className = `detail-panel-form ${formStatusClass}`;
        
        let requirementsHTML = '<div class="evolution-requirements">';
        
        const totalLevel = userHasCat ? (parseInt(cat.user_info.user_cat_level) || 0) + (parseInt(cat.user_info.user_cat_plus_level) || 0) : 0;

        if (form.required_level > 0) {
            const levelMet = userHasCat && totalLevel >= form.required_level;
            requirementsHTML += `<div><span class="req-label">Level:</span> <span class="req-value ${levelMet ? '' : 'not-met'}">${form.required_level}</span></div>`;
        } else if (form.required_level === -1) {
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

export function refreshCatElement(cat) {
    const element = catElementMap.get(cat.cat_id);
    if (!element) return;

    let isChecked = false;
    if (appState.currentView === 'list') {
        const checkbox = element.querySelector('.list-item-select');
        if (checkbox) {
            isChecked = checkbox.checked;
        }
    }

    const userHasCat = cat.user_info && cat.user_info.user_cat_level != null;

    // Update 'owned'/'missing' class state
    element.classList.toggle('owned', userHasCat);
    element.classList.toggle('missing', !userHasCat);

    // Regenerate the element's inner HTML based on the current view
    if (appState.currentView === 'grid') {
        element.innerHTML = createCatCardHTML(cat);
    } else {
        element.innerHTML = createCatListHTML(cat);
    }

    if (appState.currentView === 'list' && isChecked) {
        const newCheckbox = element.querySelector('.list-item-select');
        if (newCheckbox) {
            newCheckbox.checked = true;
        }
    }

    // Re-attach all event listeners
    addListenersToCatElement(element, cat);
}