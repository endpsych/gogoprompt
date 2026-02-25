/**
 * preload.js
 * Description: Preload script for Electron. Bridges the main process and the renderer.
 */

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Window controls
  minimizeWindow: () => ipcRenderer.send('minimize-window'),
  closeWindow: () => ipcRenderer.send('close-window'),
  hideWindow: () => ipcRenderer.send('hide-window'),
  minimizeAndPaste: (shouldEnter) => ipcRenderer.send('minimize-and-paste', shouldEnter),
  
  setAppMode: (mode) => ipcRenderer.send('set-app-mode', mode),
  openEditorWindow: (promptId) => ipcRenderer.send('open-editor-window', promptId),
  openStudioWindow: () => ipcRenderer.send('open-studio-window'),
  
  // ==========================================================================
  // Deployment Window Logic
  // ==========================================================================
  
  openDeploymentWindow: (promptId, initialValues, isOnboarding) => 
      ipcRenderer.send('open-deployment-window', { promptId, initialValues, isOnboarding }),
  
  closeDeploymentWindow: () => ipcRenderer.send('close-deployment-window'),
  confirmDeployment: (data) => ipcRenderer.send('deployment-confirmed', data),
  
  onDeploymentResult: (callback) => {
    const subscription = (_event, data) => callback(data);
    ipcRenderer.on('deployment-result', subscription);
    return () => ipcRenderer.removeListener('deployment-result', subscription);
  },

  deploymentReady: () => ipcRenderer.send('deployment-ready'),

  onLoadDeployment: (callback) => {
    const subscription = (_event, data) => callback(data);
    ipcRenderer.on('load-deployment', subscription);
    return () => ipcRenderer.removeListener('load-deployment', subscription);
  },

  onDeploymentComplete: (callback) => {
    const subscription = (_event, type) => callback(type);
    ipcRenderer.on('deployment-complete', subscription);
    return () => ipcRenderer.removeListener('deployment-complete', subscription);
  },
  
  getWindowMode: () => ipcRenderer.invoke('get-window-mode'),

  // ==========================================================================
  // Deployment Monitor Logic
  // ==========================================================================
  
  onMonitorUpdate: (callback) => {
    const subscription = (_event, data) => callback(data);
    ipcRenderer.on('monitor-update', subscription);
    return () => ipcRenderer.removeListener('monitor-update', subscription);
  },

  openDeploymentMonitor: () => ipcRenderer.send('open-deployment-monitor'),

  onActiveAppUpdate: (callback) => {
    const subscription = (_event, appName) => callback(appName);
    ipcRenderer.on('active-app-updated', subscription);
    return () => ipcRenderer.removeListener('active-app-updated', subscription);
  },

  verifyTextFocus: () => ipcRenderer.invoke('verify-text-focus'),

  setDeploymentMonitorState: (enabled) => ipcRenderer.send('set-deployment-monitor-state', enabled),

  onDeploymentMonitorStateChange: (callback) => {
    const subscription = (_event, enabled) => callback(enabled);
    ipcRenderer.on('deployment-monitor-state-changed', subscription);
    return () => ipcRenderer.removeListener('deployment-monitor-state-changed', subscription);
  },

  // ==========================================================================
  // Onboarding & Settings
  // ==========================================================================

  getAppSettings: () => ipcRenderer.invoke('get-app-settings'),
  completeOnboarding: () => ipcRenderer.invoke('complete-onboarding'),
  registerGlobalHotkey: (accelerator) => ipcRenderer.invoke('register-global-hotkey', accelerator),
  
  onHotkeyTrigger: (callback) => {
    const subscription = (_event, ...args) => callback(...args);
    ipcRenderer.on('trigger-deck-mode', subscription);
    return () => ipcRenderer.removeListener('trigger-deck-mode', subscription);
  },

  setReminderState: (enabled, hotkey) => ipcRenderer.send('set-reminder-state', enabled, hotkey),
  setClipboardMonitorState: (enabled) => ipcRenderer.send('set-clipboard-monitor-state', enabled),

  onClipboardUpdate: (callback) => {
    const subscription = (_event, text) => callback(text);
    ipcRenderer.on('clipboard-update', subscription);
    return () => ipcRenderer.removeListener('clipboard-update', subscription);
  },

  onClipboardMonitorStateChange: (callback) => {
    const subscription = (_event, enabled) => callback(enabled);
    ipcRenderer.on('clipboard-monitor-state-changed', subscription);
    return () => ipcRenderer.removeListener('clipboard-monitor-state-changed', subscription);
  },

  // ==========================================================================
  // State Synchronization
  // ==========================================================================
  
  notifyDataChange: () => ipcRenderer.send('prompt-updated-externally'),

  onDataUpdate: (callback) => {
    const subscription = (_event, ...args) => callback(...args);
    ipcRenderer.on('refresh-data', subscription);
    return () => ipcRenderer.removeListener('refresh-data', subscription);
  },

  // ==========================================================================
  // File Storage Operations
  // ==========================================================================

  storeRead: (storeName) => {
    if (typeof storeName !== 'string') throw new Error('storeName must be a string');
    return ipcRenderer.invoke('store-read', storeName);
  },
  
  storeWrite: (storeName, data) => {
    if (typeof storeName !== 'string') throw new Error('storeName must be a string');
    return ipcRenderer.invoke('store-write', storeName, data);
  },
  
  storeDelete: (storeName) => {
    if (typeof storeName !== 'string') throw new Error('storeName must be a string');
    return ipcRenderer.invoke('store-delete', storeName);
  },
  
  storeList: () => ipcRenderer.invoke('store-list'),
  storeInfo: () => ipcRenderer.invoke('store-info'),
  storeExportAll: () => ipcRenderer.invoke('store-export-all'),
  
  storeImportAll: (backup) => {
    if (!backup || typeof backup !== 'object') throw new Error('backup must be an object');
    return ipcRenderer.invoke('store-import-all', backup);
  },
  
  storeMigrateFromLocalStorage: (localStorageData) => {
    if (!localStorageData || typeof localStorageData !== 'object') throw new Error('localStorageData must be an object');
    return ipcRenderer.invoke('store-migrate-from-localstorage', localStorageData);
  },

  platform: process.platform,
  versions: {
    node: process.versions.node,
    chrome: process.versions.chrome,
    electron: process.versions.electron,
  },
});

contextBridge.exposeInMainWorld('isElectron', true);