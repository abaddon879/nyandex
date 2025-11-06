async function apiFetch(endpoint, method = 'GET', body = null) {
    const headers = {
        'Content-Type': 'application/json',
    };
    const token = localStorage.getItem('api_key');
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`/api${endpoint}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
    });
    
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! Status: ${response.status}`);
    }
    return response.status === 204 ? null : response.json();
}

export const userTrackerService = {
    // 2.1 Get Dashboard Data
    getDashboardData: (userId) => apiFetch(`/users/${userId}/dashboard`),

    // 3.2 Fetch User's Cat Collection
    getUserCats: (userId) => apiFetch(`/users/${userId}/cats`),

    // 3.4 & 4.1 Fetch User's Full Inventory
    getUserInventory: (userId) => apiFetch(`/users/${userId}/inventory`),

    // 5.3 Save User Data for a Single Cat
    saveCatProgress: (userId, catId, data) => 
        apiFetch(`/users/${userId}/cats/${catId}`, 'PUT', data),

    // 3.5 Bulk Update User Cats
    bulkUpdateCats: (userId, actions) => 
        apiFetch(`/users/${userId}/cats/bulk-update`, 'POST', { actions }),

    // 5.2 Get single cat progress
    getSingleCatProgress: (userId, catId) => 
        apiFetch(`/users/${userId}/cats/${catId}`),

    // 4.2 Update Item Quantity
    updateItemQuantity: (userId, itemId, item_quantity) => 
        apiFetch(`/users/${userId}/items/${itemId}`, 'PUT', { item_quantity }),

    // 5.4 Pin a Cat
    pinCat: (userId, catId) => 
        apiFetch(`/users/${userId}/pinned-cats/${catId}`, 'POST'),

    // 5.5 Unpin a Cat
    unpinCat: (userId, catId) => 
        apiFetch(`/users/${userId}/pinned-cats/${catId}`, 'DELETE'),
};