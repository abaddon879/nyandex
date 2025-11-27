// Centralized URL configuration
// In Vercel, you will set VITE_API_BASE_URL to your Tunnel URL.
// In Local Dev, you leave it empty, and it uses the Vite Proxy.
const BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

async function apiFetch(endpoint, method = 'GET', body = null) {
    const headers = {
        'Content-Type': 'application/json',
    };
    const token = localStorage.getItem('api_key');
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    // This constructs the full URL.
    // Example Prod: "https://your-tunnel.com/api/users/me"
    // Example Dev:  "/api/users/me"
    const response = await fetch(`${BASE_URL}/api${endpoint}`, {
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

export const authService = {
    // 1.1 Create Anonymous User
    createAnonymous: () => apiFetch('/users/anonymous', 'POST'),

    // 1.8 Get Current User Info
    getUserMe: () => apiFetch('/users/me'),

    // 1.3 Login Registered User
    login: (username_or_email, password) => 
        apiFetch('/users/login', 'POST', { username_or_email, password }),

    // 1.2 Convert Guest to Registered User
    convert: (username, email, password) => 
        apiFetch('/users/convert', 'POST', { username, email, password }),

    // 1.4 Logout Registered User
    logout: () => apiFetch('/users/logout', 'POST'),
};