export const appState = {
    userCats: [],
    userItems: [],
    currentCat: null,
    currentRarity: null,
    currentView: 'grid',
    sortProperty: 'default', // 'default', 'id', 'name', 'level'
    sortDirection: 'asc' // 'asc' or 'desc' (for future use)
};

export const catElementMap = new Map();