const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    dbQuery: (query, params) => ipcRenderer.invoke('db-query', query, params),
    authLogin: (email, password) => ipcRenderer.invoke('auth-login', email, password),
    hashPassword: (password) => ipcRenderer.invoke('hash-password', password),
});
