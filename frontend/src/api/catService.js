// We can re-use the same apiFetch helper logic, but for clarity
// we'll keep it simple. You can refactor this later.

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

export const catService = {
    // 3.1 Fetch Base Cat List Data
    getCatList: () => apiFetch('/cats'), 

    // 3.3 & 5.1 Fetch Detailed Static Cat Data
    getCatDetails: (catId) => apiFetch(`/cats/${catId}/details`),
};