/**
 * Copyright (c) 2026 Ender De Freitas. All Rights Reserved.
 * Non-Commercial Use Only.
 */

/**
 * File-based storage adapter for Zustand
 * Forces direct disk reads to ensure the "Source of Truth" is always the file system.
 */

import { 
  isElectron, 
  storeRead as electronStoreRead,
  storeWrite as electronStoreWrite,
  storeDelete as electronStoreDelete,
  storeInfo as electronStoreInfo,
  storeExportAll as electronStoreExportAll,
  storeImportAll as electronStoreImportAll,
  storeMigrateFromLocalStorage as electronStoreMigrate,
} from './electron';
import {
  StoreName,
  SCHEMA_VERSIONS,
  unwrapAndMigrate,
  wrapWithVersion,
  validateData,
  createMigrationBackup,
} from './migrations';

// const cache: Record<string, any> = {}; 

// Pending writes (for debouncing)
const pendingWrites: Record<string, ReturnType<typeof setTimeout>> = {};

// Write debounce delay (ms)
const WRITE_DEBOUNCE = 50;

// Migration backups
const migrationBackups: any[] = [];

export function invalidateCache(storeName: string): void {
  // No-op: Cache has been removed to ensure disk is always the source of truth
}

export async function readStore<T>(storeName: string): Promise<T | null> {
  
  let rawData: any = null;

  if (isElectron()) {
    try {
      rawData = await electronStoreRead<any>(storeName);
    } catch (err) {
      console.warn(`Primary read failed for ${storeName}, attempting backup recovery...`, err);
      try {
        rawData = await electronStoreRead<any>(`${storeName}.bak`);
        if (rawData) {
            await electronStoreWrite(storeName, rawData);
        }
      } catch (backupErr) {
        return null;
      }
    }
  } else {
    try {
      const item = localStorage.getItem(`prompter-${storeName}`);
      if (item) rawData = JSON.parse(item);
    } catch (err) {
      console.error(`Failed to read localStorage ${storeName}:`, err);
    }
  }

  if (rawData === null) return null;

  // --- READ HANDLING FOR PROMPTS ---
  // Ensure we always return a clean Array to the adapter
  if (storeName === 'prompts') {
    let finalData = rawData;
    
    // DEEP UNWRAP: Handle all possible wrappers (Zustand state, Migration data, Legacy objects)
    if (finalData && typeof finalData === 'object' && !Array.isArray(finalData)) {
        // Check for Zustand persist wrapper { state: { prompts: [...] } }
        if (finalData.state && Array.isArray(finalData.state.prompts)) {
            finalData = finalData.state.prompts;
        } 
        // Check for Migration wrapper { data: [...] }
        else if (Array.isArray(finalData.data)) {
            finalData = finalData.data;
        } 
        // Check for Simple wrapper { prompts: [...] }
        else if (Array.isArray(finalData.prompts)) {
            finalData = finalData.prompts;
        }
    }

    if (Array.isArray(finalData)) {
        return finalData as T;
    } else {
        console.error('CRITICAL: Prompts data is not an array.', finalData);
        return [] as unknown as T; // Return empty array to safe-fail
    }
  }

  // Standard Migration handling for other stores
  if (storeName in SCHEMA_VERSIONS) {
    try {
      const backup = createMigrationBackup(storeName, rawData);
      migrationBackups.push(backup);
      
      const migratedData = unwrapAndMigrate<T>(storeName as StoreName, rawData);
      const validation = validateData(storeName as StoreName, migratedData);
      
      return migratedData;
    } catch (err) {
      return rawData as T;
    }
  }

  return rawData as T;
}

export async function writeStore<T>(storeName: string, data: T): Promise<boolean> {


  if (pendingWrites[storeName]) {
    clearTimeout(pendingWrites[storeName]);
  }

  // --- WRITE HANDLING FOR PROMPTS ---
  // Ensure we always write a clean Array to disk
  let dataToStore = data;
  if (storeName === 'prompts') {
      // Unwrap if Zustand passed us an object {prompts: [...]}
      if (!Array.isArray(data) && data && typeof data === 'object' && Array.isArray((data as any).prompts)) {
          dataToStore = (data as any).prompts as any;
      }
      
      if (!Array.isArray(dataToStore)) {
         console.error('BLOCKED WRITE: Data is not an array', dataToStore);
         return false;
      }
  } else if (storeName in SCHEMA_VERSIONS) {
      dataToStore = wrapWithVersion(storeName as StoreName, data);
  }

  return new Promise((resolve) => {
    pendingWrites[storeName] = setTimeout(async () => {
      delete pendingWrites[storeName];
      
      if (isElectron()) {
        try {
          const result = await electronStoreWrite(storeName, dataToStore);
          resolve(result);
        } catch (err) {
          resolve(false);
        }
      } else {
        try {
          localStorage.setItem(`prompter-${storeName}`, JSON.stringify(dataToStore));
          resolve(true);
        } catch (err) {
          resolve(false);
        }
      }
    }, WRITE_DEBOUNCE);
  });
}

export async function writeStoreImmediate<T>(storeName: string, data: T): Promise<boolean> {
  if (pendingWrites[storeName]) {
    clearTimeout(pendingWrites[storeName]);
    delete pendingWrites[storeName];
  }
  

  let dataToStore = data;
  if (storeName === 'prompts') {
      if (!Array.isArray(data) && data && typeof data === 'object' && Array.isArray((data as any).prompts)) {
          dataToStore = (data as any).prompts as any;
      }
      if (!Array.isArray(dataToStore)) {
          console.error(`BLOCKED IMMEDIATE WRITE: Attempted to save non-array to ${storeName}.json`);
          return false;
      }
  } else if (storeName in SCHEMA_VERSIONS) {
    dataToStore = wrapWithVersion(storeName as StoreName, data);
  }

  if (isElectron()) {
    try {
      return await electronStoreWrite(storeName, dataToStore);
    } catch (err) {
      return false;
    }
  }
  try {
    localStorage.setItem(`prompter-${storeName}`, JSON.stringify(dataToStore));
    return true;
  } catch (err) {
    return false;
  }
}

export async function deleteStore(storeName: string): Promise<boolean> {
  // REMOVED: cache delete
  if (isElectron()) {
    try { return await electronStoreDelete(storeName); } catch (err) { return false; }
  }
  try { localStorage.removeItem(`prompter-${storeName}`); return true; } catch (err) { return false; }
}

export async function getStorageInfo() { return electronStoreInfo(); }
export async function exportAllStores() { return electronStoreExportAll(); }
export async function importAllStores(b: any) { return electronStoreImportAll(b); }
export async function migrateFromLocalStorage() { return false; }

/**
 * Create a Zustand storage adapter using file storage
 */
export function createFileStorage(storeName: string) {
  return {
    getItem: async (name: string): Promise<string | null> => {
      const data = await readStore(storeName);
      if (data !== null) {

        if (storeName === 'prompts' && Array.isArray(data)) {
            return JSON.stringify({ state: { prompts: data }, version: 0 });
        }
        
        return JSON.stringify({ state: data, version: 0 });
      }
      return null;
    },
    
    setItem: async (_name: string, value: string): Promise<void> => {
      try {
        const parsed = JSON.parse(value);
        let dataToWrite = parsed.state;

        if (storeName === 'prompts' && dataToWrite && !Array.isArray(dataToWrite) && Array.isArray(dataToWrite.prompts)) {
            dataToWrite = dataToWrite.prompts;
        }

        await writeStore(storeName, dataToWrite);
      } catch (err) {
        console.error(`Failed to set item ${storeName}:`, err);
      }
    },
    
    removeItem: async (_name: string): Promise<void> => {
      await deleteStore(storeName);
    },
  };
}

export function getMigrationBackups(): any[] { return [...migrationBackups]; }
export function clearMigrationBackups(): void { migrationBackups.length = 0; }
export function getSchemaVersions(): Record<string, number> { return { ...SCHEMA_VERSIONS }; }

if (typeof window !== 'undefined') { migrateFromLocalStorage(); }