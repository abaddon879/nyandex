import { Logger } from './logger.js';
import { appState } from './state.js';
import { refreshView } from './app.js'; // This will be our main file
import { displayCatInDetailPanel, showErrorToast, refreshCatElement } from './ui.js';

let currentUserId; // We'll set this from the main file

export function initApi(userId) {
    currentUserId = userId;
}

export function onAddCat(e, cat) {
    e.preventDefault();
    e.stopPropagation();
    const firstFormId = cat.forms[0].form_id;
    fetch(`/user_api_proxy.php/users/${currentUserId}/cats`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ cat_id: cat.cat_id, user_cat_level: 1, user_cat_plus_level: 0, user_cat_form_id: firstFormId }) })
    .then(response => { if (!response.ok) throw new Error('Failed to add cat'); return response.json(); })
    .then(addedCat => {
        Logger.info('Cat added successfully.', addedCat);
        cat.user_info = { user_cat_level: 1, user_cat_form_id: firstFormId, user_cat_plus_level: 0 };
        refreshCatElement(cat); // 1. Refresh the card's HTML
        refreshView();            // 2. Re-apply filters (in case user is on "Missing Only")
        displayCatInDetailPanel(cat);
    })
    .catch(error => { Logger.error('Failed to add cat.', error); showErrorToast(error.message); });
}

export function updateCatNumericProperty(catId, element, propertyName) {
    const cat = appState.userCats.find(c => c.cat_id == catId);
    if (!cat?.user_info) return;

    const oldValue = cat.user_info[propertyName];
    let newValue = parseInt(element.value) || 0;
    const max = parseInt(element.max);

    if (newValue > max) { newValue = max; element.value = newValue; }
    
    if (propertyName === 'user_cat_level' && newValue < 1) {
        newValue = 1; element.value = newValue;
    }
    if (propertyName === 'user_cat_plus_level' && newValue < 0) {
        newValue = 0; element.value = newValue;
    }
    
    cat.user_info[propertyName] = newValue;

    const onError = () => {
        Logger.error(`Rollback: ${propertyName} for cat ${catId} from ${newValue} to ${oldValue}`);
        cat.user_info[propertyName] = oldValue;
        refreshCatElement(cat);
        refreshView(); 
        if (appState.currentCat && appState.currentCat.cat_id === catId) {
            displayCatInDetailPanel(cat);
        }
    };

    upsertCat(cat, element, () => {
        refreshCatElement(cat);
        refreshView();
        if (appState.currentCat && appState.currentCat.cat_id === catId) {
            displayCatInDetailPanel(cat);
        }
    }, onError);
}

export function updateCatForm(catId, buttonElement) {
    const cat = appState.userCats.find(c => c.cat_id == catId);
    if (!cat?.user_info) return;

    const oldFormId = cat.user_info.user_cat_form_id;
    const newFormIndex = parseInt(buttonElement.dataset.formIndex);
    const newFormId = cat.forms[newFormIndex].form_id;
    cat.user_info.user_cat_form_id = newFormId;
    
    const onSuccess = () => {
        refreshCatElement(cat);
        refreshView();
        if (appState.currentCat && appState.currentCat.cat_id === catId) {
            displayCatInDetailPanel(cat);
        }
    };

    const onError = () => {
        Logger.error(`Rollback: form for cat ${catId} from ${newFormId} to ${oldFormId}`);
        cat.user_info.user_cat_form_id = oldFormId;
        refreshCatElement(cat);
        refreshView();
        if (appState.currentCat && appState.currentCat.cat_id === catId) {
            displayCatInDetailPanel(cat);
        }
    };

    upsertCat(cat, buttonElement, onSuccess, onError);
}

export function removeCat(catId) {
    fetch(`/user_api_proxy.php/users/${currentUserId}/cats/${catId}`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' } })
    .then(response => { if (!response.ok) throw new Error('Failed to remove cat'); })
    .then(() => {
        Logger.info(`Cat with ID ${catId} removed successfully.`);
        const cat = appState.userCats.find(c => c.cat_id === catId);
        if (cat) {
            cat.user_info = null;
            refreshCatElement(cat);
        }
        refreshView();
        displayCatInDetailPanel(null);
    })
    .catch(error => { Logger.error(`Failed to remove cat with ID ${catId}.`, error); showErrorToast(error.message); });
}

export function upsertCat(catData, element = null, onSuccess = null, onError = null) {
    if (element) element.classList.add('saving');
    Logger.info(`Saving changes for cat ID: ${catData.cat_id}`, catData.user_info);

    fetch(`/user_api_proxy.php/users/${currentUserId}/cats/${catData.cat_id}`, { 
        method: 'PATCH', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify(catData.user_info) 
    })
    .then(response => { 
        if (!response.ok) {
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
        if (onError) onError(); 
    })
    .finally(() => { 
        if (element) element.classList.remove('saving'); 
    });
}