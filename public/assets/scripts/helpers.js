import { appState } from './state.js';

// --- Global Helper ---
export function isQuickEditMode() {
    const toggle = document.getElementById('list-quick-edit-toggle');
    return toggle && toggle.checked && appState.currentView === 'list';
}

export function getCurrentForm(cat) {
    const userCatFormId = cat.user_info?.user_cat_form_id || cat.forms[0].form_id;
    return cat.forms.find(form => form.form_id == userCatFormId) || cat.forms[0];
}

export function isFormAchievable(cat, formIndex) {
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

export function canCatEvolve(cat) {
    if (!cat.user_info) return false;
    const currentFormIndex = cat.forms.findIndex(f => f.form_id === cat.user_info.user_cat_form_id);
    if (currentFormIndex === -1) return false;
    return cat.forms.some((form, index) => index > currentFormIndex && isFormAchievable(cat, index));
}