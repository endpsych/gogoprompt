/**
 * src/shared/utils/storage/electron.ts
 * Description: Electron IPC utility wrappers for the renderer process.
 */

// Type definitions for the exposed Electron API
interface ElectronAPI {
  // Window controls
  minimizeWindow: () => void;
  closeWindow: () => void;
  hideWindow: () => void;
  minimizeAndPaste: (shouldEnter: boolean) => void;
  setAppMode: (mode: 'studio' | 'deck') => void;
  getWindowMode: () => Promise<'studio' | 'deck'>;
  
  // Method for opening the separate editor window
  openEditorWindow: (promptId: string) => void;

  // Method for opening Studio in a new window
  openStudioWindow: () => void;

  // Method for opening Deployment in a new window
  openDeploymentWindow: (promptId: string, initialValues?: Record<string, string>, isOnboarding?: boolean) => void;
  closeDeploymentWindow: () => void;
  
  // Interface to support Auto-Paste/Send flags
  confirmDeployment: (data: { 
    content: string; 
    variables: Record<string, string>;
    shouldAutoPaste?: boolean;
    shouldAutoEnter?: boolean;
  }) => void;
  
  onDeploymentResult: (callback: (data: any) => void) => () => void;
  onLoadDeployment: (callback: (data: any) => void) => () => void;
  onDeploymentComplete: (callback: (type: string) => void) => () => void;
  deploymentReady: () => void;

  // State Synchronization methods
  notifyDataChange: () => void;
  onDataUpdate: (callback: (storeName?: string) => void) => () => void; 

  // File storage
  storeRead: (storeName: string) => Promise<any>;
  storeWrite: (storeName: string, data: any) => Promise<boolean>;
  storeDelete: (storeName: string) => Promise<boolean>;
  storeList: () => Promise<string[]>;
  storeInfo: () => Promise<{
    path: string;
    totalSize: number;
    stores: Array<{ name: string; size: number; modified: Date }>;
  } | null>;
  storeExportAll: () => Promise<any>;
  storeImportAll: (backup: any) => Promise<boolean>;
  storeMigrateFromLocalStorage: (data: Record<string, string>) => Promise<boolean>;
  
  // Onboarding & Settings
  getAppSettings: () => Promise<any>;
  completeOnboarding: () => Promise<boolean>;
  registerGlobalHotkey: (accelerator: string) => Promise<{ success: boolean; message?: string }>;
  onHotkeyTrigger: (callback: () => void) => () => void;
  setReminderState: (enabled: boolean, hotkey: string) => void;
  setClipboardMonitorState: (enabled: boolean) => void;
  onClipboardUpdate: (callback: (text: string) => void) => () => void;
  onClipboardMonitorStateChange: (callback: (enabled: boolean) => void) => () => void;

  // Pipeline Monitor Logic
  onMonitorUpdate: (callback: (data: any) => void) => () => void;
  onActiveAppUpdate: (callback: (appName: string) => void) => () => void;
  setDeploymentMonitorState: (enabled: boolean) => void;
  onDeploymentMonitorStateChange: (callback: (enabled: boolean) => void) => () => void;

  // Platform info
  platform: string;
  versions: {
    node: string;
    chrome: string;
    electron: string;
  };
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
    isElectron?: boolean;
  }
}

export function isElectron(): boolean {
  return typeof window !== 'undefined' && window.isElectron === true;
}

function getAPI(): ElectronAPI | null {
  if (isElectron() && window.electronAPI) {
    return window.electronAPI;
  }
  return null;
}

// ============================================================================
// Window Controls
// ============================================================================

export function minimizeWindow(): void {
  const api = getAPI();
  if (api) api.minimizeWindow();
}

export function closeWindow(): void {
  const api = getAPI();
  if (api) api.closeWindow();
}

export function hideWindow(): void {
  const api = getAPI();
  if (api) api.hideWindow();
}

export function minimizeAndPaste(shouldEnter: boolean = false): void {
  const api = getAPI();
  if (api) api.minimizeAndPaste(shouldEnter);
}

export function setAppMode(mode: 'studio' | 'deck'): void {
  const api = getAPI();
  if (api) api.setAppMode(mode);
}

export async function getWindowMode(): Promise<'studio' | 'deck'> {
  const api = getAPI();
  if (api) {
    try {
      return await api.getWindowMode();
    } catch (err) {
      console.error('Failed to get window mode:', err);
      return 'studio';
    }
  }
  return 'studio';
}

export function openEditorWindow(promptId: string): void {
  const api = getAPI();
  if (api) {
    api.openEditorWindow(promptId);
  } else {
    console.warn('Cannot open editor window: Electron API not available');
  }
}

export function openStudioWindow(): void {
  const api = getAPI();
  if (api) {
    api.openStudioWindow();
  } else {
    console.warn('Cannot open studio window: Electron API not available');
  }
}

export function openDeploymentWindow(promptId: string, initialValues?: Record<string, string>, isOnboarding?: boolean): void {
  const api = getAPI();
  if (api) {
    api.openDeploymentWindow(promptId, initialValues, isOnboarding);
  } else {
    console.warn('Cannot open deployment window: Electron API not available');
  }
}

export function closeDeploymentWindow(): void {
  const api = getAPI();
  if (api) api.closeDeploymentWindow();
}

export function confirmDeployment(
  content: string, 
  variables: Record<string, string>, 
  shouldAutoPaste?: boolean, 
  shouldAutoEnter?: boolean
): void {
  const api = getAPI();
  if (api) {
    api.confirmDeployment({ content, variables, shouldAutoPaste, shouldAutoEnter });
  }
}

export function onDeploymentResult(callback: (data: any) => void): () => void {
  const api = getAPI();
  if (api) return api.onDeploymentResult(callback);
  return () => {};
}

export function onDeploymentComplete(callback: (type: string) => void): () => void {
  const api = getAPI();
  if (api) return api.onDeploymentComplete(callback);
  return () => {};
}

// ============================================================================
// State Synchronization
// ============================================================================

export function notifyDataChange(): void {
  const api = getAPI();
  if (api) api.notifyDataChange();
}

export function onDataUpdate(callback: (storeName?: string) => void): () => void {
  const api = getAPI();
  if (api) return api.onDataUpdate(callback);
  return () => {};
}

// ============================================================================
// File Storage Operations
// ============================================================================

export async function storeRead<T>(storeName: string): Promise<T | null> {
  const api = getAPI();
  if (api) {
    try {
      return await api.storeRead(storeName);
    } catch (err) {
      console.error(`Failed to read store ${storeName}:`, err);
      return null;
    }
  }
  return null;
}

export async function storeWrite<T>(storeName: string, data: T): Promise<boolean> {
  const api = getAPI();
  if (api) {
    try {
      return await api.storeWrite(storeName, data);
    } catch (err) {
      console.error(`Failed to write store ${storeName}:`, err);
      return false;
    }
  }
  return false;
}

export async function storeDelete(storeName: string): Promise<boolean> {
  const api = getAPI();
  if (api) {
    try {
      return await api.storeDelete(storeName);
    } catch (err) {
      console.error(`Failed to delete store ${storeName}:`, err);
      return false;
    }
  }
  return false;
}

export async function storeList(): Promise<string[]> {
  const api = getAPI();
  if (api) {
    try {
      return await api.storeList();
    } catch (err) {
      console.error('Failed to list stores:', err);
      return [];
    }
  }
  return [];
}

export async function storeInfo(): Promise<{
  path: string;
  totalSize: number;
  stores: Array<{ name: string; size: number; modified: Date }>;
} | null> {
  const api = getAPI();
  if (api) {
    try {
      return await api.storeInfo();
    } catch (err) {
      console.error('Failed to get store info:', err);
      return null;
    }
  }
  return null;
}

export async function storeExportAll(): Promise<any | null> {
  const api = getAPI();
  if (api) {
    try {
      return await api.storeExportAll();
    } catch (err) {
      console.error('Failed to export stores:', err);
      return null;
    }
  }
  return null;
}

export async function storeImportAll(backup: any): Promise<boolean> {
  const api = getAPI();
  if (api) {
    try {
      return await api.storeImportAll(backup);
    } catch (err) {
      console.error('Failed to import stores:', err);
      return false;
    }
  }
  return false;
}

export async function storeMigrateFromLocalStorage(
  data: Record<string, string>
): Promise<boolean> {
  const api = getAPI();
  if (api) {
    try {
      return await api.storeMigrateFromLocalStorage(data);
    } catch (err) {
      console.error('Failed to migrate from localStorage:', err);
      return false;
    }
  }
  return false;
}

// ============================================================================
// Onboarding & Settings
// ============================================================================

export async function getAppSettings(): Promise<any> {
  const api = getAPI();
  return api ? api.getAppSettings() : null;
}

export async function completeOnboarding(): Promise<boolean> {
  const api = getAPI();
  return api ? api.completeOnboarding() : false;
}

export async function registerGlobalHotkey(acc: string): Promise<{ success: boolean; message?: string }> {
  const api = getAPI();
  return api ? api.registerGlobalHotkey(acc) : { success: false, message: 'API not available' };
}

export function onHotkeyTrigger(callback: () => void): () => void {
  const api = getAPI();
  if (api) return api.onHotkeyTrigger(callback);
  return () => {};
}

export function setReminderState(enabled: boolean, hotkey: string): void {
  const api = getAPI();
  if (api) api.setReminderState(enabled, hotkey);
}

export function setClipboardMonitorState(enabled: boolean): void {
  const api = getAPI();
  if (api) api.setClipboardMonitorState(enabled);
}

export function onClipboardUpdate(callback: (text: string) => void): () => void {
  const api = getAPI();
  if (api) return api.onClipboardUpdate(callback);
  return () => {};
}

export function onClipboardMonitorStateChange(callback: (enabled: boolean) => void): () => void {
  const api = getAPI();
  if (api) return api.onClipboardMonitorStateChange(callback);
  return () => {};
}

// ============================================================================
// Pipeline Monitor
// ============================================================================

export function onMonitorUpdate(callback: (data: any) => void): () => void {
  const api = getAPI();
  if (api) return api.onMonitorUpdate(callback);
  return () => {};
}

export function onActiveAppUpdate(callback: (appName: string) => void): () => void {
  const api = getAPI();
  if (api) return api.onActiveAppUpdate(callback);
  return () => {};
}

export function setDeploymentMonitorState(enabled: boolean): void {
  const api = getAPI();
  if (api) api.setDeploymentMonitorState(enabled);
}

export function onDeploymentMonitorStateChange(callback: (enabled: boolean) => void): () => void {
  const api = getAPI();
  if (api) return api.onDeploymentMonitorStateChange(callback);
  return () => {};
}

// ============================================================================
// Platform Info
// ============================================================================

export function getPlatform(): string {
  const api = getAPI();
  return api ? api.platform : 'browser';
}

export function getVersions(): { node: string; chrome: string; electron: string } | null {
  const api = getAPI();
  return api ? api.versions : null;
}