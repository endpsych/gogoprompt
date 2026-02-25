/**
 * Copyright (c) 2026 Ender De Freitas. All Rights Reserved.
 * Non-Commercial Use Only.
 */

/**
 * Data Migration System
 * 
 * Handles schema versioning and migrations for stored data.
 * Each store has its own version, and migrations run automatically
 * when the app loads data with an older schema version.
 * 
 * Usage:
 * 1. Increment CURRENT_SCHEMA_VERSION when changing data structures
 * 2. Add a migration function for the new version
 * 3. The system automatically migrates data on load
 */

import { Prompt, PromptComponent, GlossaryTerm, ComponentTypeConfig, PromptVersion, PromptFolder } from '@/types';

// Current schema versions for each store
export const SCHEMA_VERSIONS = {
  prompts: 3,      // v3: Added folderId field
  components: 2,
  glossary: 2,
  settings: 2,
  versions: 1,
  folders: 1,      // New store for folders
} as const;

export type StoreName = keyof typeof SCHEMA_VERSIONS;

// Metadata stored alongside each store's data
export interface StoreMeta {
  schemaVersion: number;
  lastMigrated?: string;
  migrationsApplied?: string[];
}

// Wrapper for stored data that includes version info
export interface VersionedStore<T> {
  data: T;
  meta: StoreMeta;
}

// Migration function type
type MigrationFn<T> = (data: any) => T;

// Migration registry
interface MigrationRegistry {
  [storeName: string]: {
    [version: number]: MigrationFn<any>;
  };
}

/**
 * Migration functions for each store and version
 * 
 * Key: target version number
 * Value: function that takes data from previous version and returns migrated data
 */
const migrations: MigrationRegistry = {
  prompts: {
    // v1 -> v2: Add useCount and customOrder fields
    2: (data: any[]): Prompt[] => {
      return data.map((prompt: any, index: number) => ({
        id: prompt.id || generateId(),
        title: prompt.title || '',
        content: prompt.content || '',
        tags: Array.isArray(prompt.tags) ? prompt.tags : [],
        createdAt: prompt.createdAt || Date.now(),
        updatedAt: prompt.updatedAt || prompt.createdAt || Date.now(),
        useCount: prompt.useCount ?? 0,
        customOrder: prompt.customOrder ?? index,
      }));
    },
    // v2 -> v3: Add folderId field
    3: (data: any[]): Prompt[] => {
      return data.map((prompt: any) => ({
        ...prompt,
        folderId: prompt.folderId ?? null,
      }));
    },
  },
  
  folders: {
    // v1: Initial folder schema
    1: (data: any[]): PromptFolder[] => {
      return data.map((folder: any, index: number) => ({
        id: folder.id || generateId(),
        name: folder.name || 'Untitled Folder',
        color: folder.color || '#6b7280',
        parentId: folder.parentId ?? null,
        customOrder: folder.customOrder ?? index,
        createdAt: folder.createdAt || Date.now(),
        updatedAt: folder.updatedAt || folder.createdAt || Date.now(),
      }));
    },
  },
  
  components: {
    // v1 -> v2: Ensure all required fields exist
    2: (data: any[]): PromptComponent[] => {
      return data.map((comp: any) => ({
        id: comp.id || generateId(),
        name: comp.name || 'Untitled Component',
        type: comp.type || 'other',
        content: comp.content || '',
        createdAt: comp.createdAt || Date.now(),
        updatedAt: comp.updatedAt || comp.createdAt || Date.now(),
      }));
    },
  },
  
  glossary: {
    // v1 -> v2: Add category field
    2: (data: any[]): GlossaryTerm[] => {
      return data.map((term: any) => ({
        id: term.id || generateId(),
        term: term.term || '',
        definition: term.definition || '',
        category: term.category || 'Other',
        createdAt: term.createdAt || Date.now(),
        updatedAt: term.updatedAt || term.createdAt || Date.now(),
      }));
    },
  },
  
  settings: {
    // v1 -> v2: Restructure settings format
    2: (data: any): any => {
      // Handle both old format (flat) and new format (nested)
      if (data.tagColors && typeof data.tagColors === 'object') {
        return {
          tagColors: data.tagColors,
          componentTypes: data.componentTypes || getDefaultComponentTypes(),
          highlightSettings: data.highlightSettings || getDefaultHighlightSettings(),
          shortcuts: data.shortcuts || {},
          preferences: data.preferences || getDefaultPreferences(),
        };
      }
      
      // Old format: might have settings at root level
      return {
        tagColors: data.tagColors || {},
        componentTypes: data.componentTypes || getDefaultComponentTypes(),
        highlightSettings: data.highlightSettings || getDefaultHighlightSettings(),
        shortcuts: data.shortcuts || {},
        preferences: data.preferences || getDefaultPreferences(),
      };
    },
  },
  
  versions: {
    // Initial version - no migration needed
    1: (data: any[]): PromptVersion[] => {
      return data.map((version: any) => ({
        id: version.id || generateId(),
        promptId: version.promptId || '',
        title: version.title || '',
        content: version.content || '',
        tags: Array.isArray(version.tags) ? version.tags : [],
        createdAt: version.createdAt || Date.now(),
        message: version.message,
      }));
    },
  },
};

/**
 * Run migrations on data from an older schema version
 */
export function migrateData<T>(
  storeName: StoreName,
  data: any,
  fromVersion: number
): T {
  const targetVersion = SCHEMA_VERSIONS[storeName];
  const storeMigrations = migrations[storeName] || {};
  
  let migratedData = data;
  let currentVersion = fromVersion;
  
  // Apply migrations sequentially
  while (currentVersion < targetVersion) {
    const nextVersion = currentVersion + 1;
    const migrationFn = storeMigrations[nextVersion];
    
    if (migrationFn) {
      console.log(`Migrating ${storeName} from v${currentVersion} to v${nextVersion}`);
      try {
        migratedData = migrationFn(migratedData);
      } catch (err) {
        console.error(`Migration failed for ${storeName} v${nextVersion}:`, err);
        // Continue with current data rather than crashing
      }
    } else {
      console.warn(`No migration found for ${storeName} v${nextVersion}`);
    }
    
    currentVersion = nextVersion;
  }
  
  return migratedData as T;
}

/**
 * Check if data needs migration
 */
export function needsMigration(storeName: StoreName, currentVersion: number): boolean {
  return currentVersion < SCHEMA_VERSIONS[storeName];
}

/**
 * Get the current schema version for a store
 */
export function getCurrentVersion(storeName: StoreName): number {
  return SCHEMA_VERSIONS[storeName];
}

/**
 * Wrap data with version metadata for storage
 */
export function wrapWithVersion<T>(storeName: StoreName, data: T): VersionedStore<T> {
  return {
    data,
    meta: {
      schemaVersion: SCHEMA_VERSIONS[storeName],
      lastMigrated: new Date().toISOString(),
    },
  };
}

/**
 * Unwrap versioned data, migrating if necessary
 */
export function unwrapAndMigrate<T>(
  storeName: StoreName,
  stored: any
): T {
  // Handle unversioned data (legacy format)
  if (!stored || stored.meta === undefined) {
    // Assume it's raw data from version 1
    const rawData = stored?.data ?? stored;
    if (!rawData) {
      return getDefaultData(storeName) as T;
    }
    return migrateData<T>(storeName, rawData, 1);
  }
  
  const { data, meta } = stored as VersionedStore<any>;
  const storedVersion = meta.schemaVersion || 1;
  
  if (needsMigration(storeName, storedVersion)) {
    return migrateData<T>(storeName, data, storedVersion);
  }
  
  return data as T;
}

/**
 * Validate data structure matches expected schema
 */
export function validateData(storeName: StoreName, data: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  switch (storeName) {
    case 'prompts':
      if (!Array.isArray(data)) {
        errors.push('Prompts data must be an array');
      } else {
        data.forEach((item: any, index: number) => {
          if (!item.id) errors.push(`Prompt ${index}: missing id`);
          if (typeof item.title !== 'string') errors.push(`Prompt ${index}: title must be string`);
          if (typeof item.content !== 'string') errors.push(`Prompt ${index}: content must be string`);
          if (!Array.isArray(item.tags)) errors.push(`Prompt ${index}: tags must be array`);
        });
      }
      break;
      
    case 'components':
      if (!Array.isArray(data)) {
        errors.push('Components data must be an array');
      } else {
        data.forEach((item: any, index: number) => {
          if (!item.id) errors.push(`Component ${index}: missing id`);
          if (typeof item.name !== 'string') errors.push(`Component ${index}: name must be string`);
          if (typeof item.type !== 'string') errors.push(`Component ${index}: type must be string`);
          if (typeof item.content !== 'string') errors.push(`Component ${index}: content must be string`);
        });
      }
      break;
      
    case 'glossary':
      if (!Array.isArray(data)) {
        errors.push('Glossary data must be an array');
      } else {
        data.forEach((item: any, index: number) => {
          if (!item.id) errors.push(`Term ${index}: missing id`);
          if (typeof item.term !== 'string') errors.push(`Term ${index}: term must be string`);
          if (typeof item.definition !== 'string') errors.push(`Term ${index}: definition must be string`);
        });
      }
      break;
      
    case 'settings':
      if (typeof data !== 'object' || data === null) {
        errors.push('Settings must be an object');
      }
      break;
      
    case 'versions':
      if (!Array.isArray(data)) {
        errors.push('Versions data must be an array');
      }
      break;
  }
  
  return { valid: errors.length === 0, errors };
}

/**
 * Create a backup before migration
 */
export function createMigrationBackup(storeName: string, data: any): any {
  return {
    storeName,
    backupDate: new Date().toISOString(),
    data: JSON.parse(JSON.stringify(data)), // Deep clone
  };
}

// Helper functions

function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

function getDefaultData(storeName: StoreName): any {
  switch (storeName) {
    case 'prompts':
      return [];
    case 'components':
      return [];
    case 'glossary':
      return [];
    case 'folders':
      return [];
    case 'settings':
      return {
        tagColors: {},
        componentTypes: getDefaultComponentTypes(),
        highlightSettings: getDefaultHighlightSettings(),
        shortcuts: {},
        preferences: getDefaultPreferences(),
      };
    case 'versions':
      return [];
    default:
      return null;
  }
}

function getDefaultComponentTypes(): ComponentTypeConfig[] {
  return [
    { id: 'persona', label: 'Persona', color: '#3b82f6' },
    { id: 'format', label: 'Format', color: '#10b981' },
    { id: 'constraint', label: 'Constraint', color: '#f59e0b' },
    { id: 'context', label: 'Context', color: '#8b5cf6' },
    { id: 'other', label: 'Other', color: '#6b7280' },
  ];
}

function getDefaultHighlightSettings() {
  return {
    enabled: true,
    showVariables: true,
    showComponents: true,
    showGlossary: true,
  };
}

function getDefaultPreferences() {
  return {
    autoMinimizeAfterCopy: false,
    miniModeCardMaxHeight: 200,
    promptSortOrder: 'created-newest',
  };
}

/**
 * Export migration utilities for testing
 */
export const migrationUtils = {
  generateId,
  getDefaultData,
  getDefaultComponentTypes,
  getDefaultHighlightSettings,
  getDefaultPreferences,
};
