export const Logger = {
    info: (message, data = '') => { console.info(`[${new Date().toLocaleTimeString()}] [INFO] ${message}`, data); },
    error: (message, error = '') => { console.error(`[${new Date().toLocaleTimeString()}] [ERROR] ${message}`, error); }
};