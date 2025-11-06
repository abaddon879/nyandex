import { authService } from '../api/authService';

// This is a simple, framework-agnostic reactive store.
// In Vue, you'd use ref() or reactive(). In React, you'd use useState() or a Context.
const state = {
    apiKey: localStorage.getItem('api_key') || null,
    userId: localStorage.getItem('user_id') ? parseInt(localStorage.getItem('user_id')) : null,
    isAnonymous: true,
    username: null,
    isAuthenticated: false,
};

// Simple event listener system so components can "subscribe" to changes
const listeners = new Set();
const notify = () => listeners.forEach(listener => listener(state));

export const authStore = {
    // Call this to get the current state
    getState: () => state,

    // Call this in your components to re-render on state change
    subscribe: (listener) => {
        listeners.add(listener);
        return () => listeners.delete(listener); // Unsubscribe function
    },

    // --- Internal Helper Method ---
    _setSession(apiKey, userId, isAnonymous, username = null) {
        state.apiKey = apiKey;
        state.userId = userId;
        state.isAnonymous = isAnonymous;
        state.username = username;
        state.isAuthenticated = !!apiKey;

        // Persist to local storage
        if (apiKey) {
            localStorage.setItem('api_key', apiKey);
            localStorage.setItem('user_id', userId.toString());
        } else {
            localStorage.removeItem('api_key');
            localStorage.removeItem('user_id');
        }
        notify(); // Notify all subscribed components of the change
    },

    // --- Public Action Methods ---

    /**
     * The core application startup process.
     * Called by main.js when the app first loads.
     */
    async initialize() {
        if (state.apiKey) {
            // 1. Key found in storage. Let's verify it.
            try {
                const user = await authService.getUserMe(); // Calls GET /users/me
                this._setSession(state.apiKey, user.user_id, user.anonymous, user.username);
                console.log(`Session restored: ${user.anonymous ? 'Guest' : 'Registered'} as ${user.username || 'User ' + user.user_id}`);
                return;
            } catch (error) {
                // Key was invalid (e.g., 401 Unauthorized).
                this._setSession(null, null, true); 
                console.warn("Invalid API key detected. Creating new guest session.");
            }
        }

        // 2. No key found, or key was invalid. Create a new guest.
        try {
            const response = await authService.createAnonymous(); // Calls POST /users/anonymous
            this._setSession(response.api_key, response.user_id, true);
            console.log("New Anonymous Guest session created.");
        } catch (error) {
            console.error("Fatal: Failed to start session.", error);
        }
    },

    /**
     * Logs in a registered user.
     */
    async login(usernameOrEmail, password) {
        try {
            const hadGuestKey = !!state.apiKey;
            
            // 1. Call login endpoint
            const response = await authService.login(usernameOrEmail, password); // POST /users/login

            // 2. Handle Data Merge Conflict (Spec 4.D)
            // A real app would show a modal here if (hadGuestKey && response.user_id !== state.userId)
            // For now, we assume the user always wants to load their registered account.
            
            // 3. Set the new session data
            this._setSession(response.api_key, response.user_id, false);

            // 4. Fetch full user details to update username/verified status
            const user = await authService.getUserMe();
            this._setSession(response.api_key, user.user_id, user.anonymous, user.username);

            return { success: true, user };

        } catch (error) {
            return { success: false, error: error.message };
        }
    },
    
    /**
     * Logs out a user and creates a new guest session.
     */
    async logout() {
        try {
            await authService.logout(); // Calls POST /users/logout
        } catch (error) {
            // Log the error, but proceed with local logout anyway
            console.error("Failed to invalidate key on server:", error);
        }
        
        // Clear local data and immediately initialize a new guest session
        this._setSession(null, null, true);
        await this.initialize();
    },
    
    /**
     * Converts the current guest user to a registered user.
     */
    async convert(username, email, password) {
        if (!state.isAnonymous) {
            return { success: false, error: "Only guest accounts can be converted." };
        }
        
        try {
            // Calls POST /users/convert using the current guest API key
            await authService.convert(username, email, password);
            
            // Update the local state to reflect the change
            state.isAnonymous = false;
            state.username = username;
            notify();
            
            return { success: true };
            
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
};