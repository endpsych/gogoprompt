/**
 * Copyright (c) 2026 Ender De Freitas. All Rights Reserved.
 * Non-Commercial Use Only.
 */

import { create } from 'zustand';
import { Prompt, PromptSortOrder } from '@/types';
import { readStore, invalidateCache, writeStoreImmediate } from '@/shared/utils/storage/fileStorage'; 
import { sanitizeString } from '@/shared/utils/sanitize';

interface PromptState {
  prompts: Prompt[];
  isInitialized: boolean;
  
  // Actions
  init: () => Promise<void>; 
  addPrompt: (title: string, content: string, tags: string[], folderId?: string | null) => Prompt;
  updatePrompt: (id: string, updates: Partial<Prompt>) => void;
  deletePrompt: (id: string) => void;
  incrementUseCount: (id: string) => void;
  movePrompt: (id: string, direction: 'up' | 'down') => void;
  reorderPrompt: (dragId: string, dropId: string) => void;
  setPrompts: (prompts: Prompt[]) => void;
  moveToFolder: (promptId: string, folderId: string | null) => void;
  moveManyToFolder: (promptIds: string[], folderId: string | null) => void;
  
  // Storage Actions
  reloadPrompts: () => Promise<void>;
  saveToDisk: () => Promise<void>;

  // Tag operations
  deleteTag: (tag: string) => void;
  renameTag: (oldName: string, newName: string) => void;
  
  // Folder operations
  clearFolderFromPrompts: (folderId: string) => void;
  
  // Computed
  getPrompt: (id: string) => Prompt | undefined;
  getAllTags: () => string[];
  getTagCounts: () => Record<string, number>;
  getFilteredPrompts: (
    search: string,
    tagFilters: string[],
    filterMode: 'AND' | 'OR',
    sortOrder: PromptSortOrder,
    folderId?: string | null
  ) => Prompt[];
  getSortedPrompts: (sortOrder: PromptSortOrder) => Prompt[];
  getPromptsByFolder: (folderId: string | null) => Prompt[];
}

const generateId = () => crypto.randomUUID();

// Helpers for advanced sorting
const getWordCount = (p: Prompt) => p.content ? p.content.trim().split(/\s+/).length : 0;
const getVarCount = (p: Prompt) => (p.content.match(/\{\{[^}]+\}\}/g) || []).length;

const sortPrompts = (prompts: Prompt[], sortOrder: PromptSortOrder): Prompt[] => {
  const sorted = [...prompts];
  switch (sortOrder) {
    case 'alphabetical':
      return sorted.sort((a, b) => a.title.localeCompare(b.title));
    case 'alphabetical-desc':
      return sorted.sort((a, b) => b.title.localeCompare(a.title));
    case 'created-newest':
      return sorted.sort((a, b) => b.createdAt - a.createdAt);
    case 'created-oldest':
      return sorted.sort((a, b) => a.createdAt - b.createdAt);
    case 'last-used-newest': 
      return sorted.sort((a, b) => (b.lastUsed ?? 0) - (a.lastUsed ?? 0));
    case 'last-used-oldest': 
      return sorted.sort((a, b) => (a.lastUsed ?? 0) - (b.lastUsed ?? 0));
    case 'most-used':
      return sorted.sort((a, b) => (b.useCount ?? 0) - (a.useCount ?? 0));
    case 'least-used':
      return sorted.sort((a, b) => (a.useCount ?? 0) - (b.useCount ?? 0));
    case 'word-count-desc':
      return sorted.sort((a, b) => getWordCount(b) - getWordCount(a));
    case 'word-count-asc':
      return sorted.sort((a, b) => getWordCount(a) - getWordCount(b));
    case 'variable-count-desc':
      return sorted.sort((a, b) => getVarCount(b) - getVarCount(a));
    case 'variable-count-asc':
      return sorted.sort((a, b) => getVarCount(a) - getVarCount(b));
    case 'custom':
      return sorted.sort((a, b) => (a.customOrder ?? 0) - (b.customOrder ?? 0));
    default:
      return sorted;
  }
};

export const usePromptStore = create<PromptState>((set, get) => ({
  prompts: [],
  isInitialized: false,

  init: async () => {
    await get().reloadPrompts();
  },

  reloadPrompts: async () => {
    try {
      invalidateCache('prompts');
      const data = await readStore<Prompt[]>('prompts');
      
      if (Array.isArray(data)) {
        set({ prompts: data, isInitialized: true });
        console.log('Prompts reloaded from disk:', data.length);
      } else if (data === null) {
        set({ isInitialized: true }); 
      }
    } catch (error) {
      console.error('Failed to reload prompts:', error);
    }
  },

  saveToDisk: async () => {
    const state = get();
    if (!state.isInitialized) {
        console.error('BLOCKED SAVE: Attempted to save prompts before store was initialized.');
        return;
    }
    await writeStoreImmediate('prompts', state.prompts);
  },

  addPrompt: (title, content, tags, folderId = null) => {
    const maxOrder = get().prompts.reduce((max, p) => Math.max(max, p.customOrder ?? 0), 0);
    const newPrompt: Prompt = {
      id: generateId(),
      title: sanitizeString(title),
      content: sanitizeString(content),
      tags: tags.map(t => sanitizeString(t)),
      folderId: folderId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      useCount: 0,
      lastUsed: 0, 
      customOrder: maxOrder + 1,
    };
    set((state) => ({ prompts: [newPrompt, ...state.prompts] }));
    get().saveToDisk();
    return newPrompt;
  },

  updatePrompt: (id, updates) => {
    const sanitizedUpdates = { ...updates };
    if (sanitizedUpdates.title !== undefined) sanitizedUpdates.title = sanitizeString(sanitizedUpdates.title);
    if (sanitizedUpdates.content !== undefined) sanitizedUpdates.content = sanitizeString(sanitizedUpdates.content);
    if (sanitizedUpdates.tags !== undefined) sanitizedUpdates.tags = sanitizedUpdates.tags.map(t => sanitizeString(t));
    
    set((state) => ({
      prompts: state.prompts.map((p) =>
        p.id === id ? { ...p, ...sanitizedUpdates, updatedAt: Date.now() } : p
      ),
    }));
    get().saveToDisk();
  },

  deletePrompt: (id) => {
    set((state) => ({ prompts: state.prompts.filter((p) => p.id !== id) }));
    get().saveToDisk();
  },

  incrementUseCount: (id) => {
    const now = Date.now();
    set((state) => ({
      prompts: state.prompts.map((p) =>
        p.id === id 
        ? { 
            ...p, 
            useCount: (p.useCount ?? 0) + 1, 
            lastUsed: now,
            // Prepend new timestamp to usageHistory for detailed tracking
          } 
        : p
      ),
    }));
    get().saveToDisk();
  },

  movePrompt: (id, direction) => {
    set((state) => {
      const sorted = [...state.prompts].sort((a, b) => (a.customOrder ?? 0) - (b.customOrder ?? 0));
      const currentIndex = sorted.findIndex((p) => p.id === id);
      
      if (currentIndex === -1) return state;
      if (direction === 'up' && currentIndex === 0) return state;
      if (direction === 'down' && currentIndex === sorted.length - 1) return state;

      const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
      const currentOrder = sorted[currentIndex].customOrder ?? currentIndex;
      const targetOrder = sorted[targetIndex].customOrder ?? targetIndex;

      return {
        prompts: state.prompts.map((p) => {
          if (p.id === sorted[currentIndex].id) return { ...p, customOrder: targetOrder };
          if (p.id === sorted[targetIndex].id) return { ...p, customOrder: currentOrder };
          return p;
        }),
      };
    });
    get().saveToDisk();
  },

  reorderPrompt: (dragId, dropId) => {
    set((state) => {
      const sorted = [...state.prompts].sort((a, b) => (a.customOrder ?? 0) - (b.customOrder ?? 0));
      const dragIndex = sorted.findIndex((p) => p.id === dragId);
      const dropIndex = sorted.findIndex((p) => p.id === dropId);
      
      if (dragIndex === -1 || dropIndex === -1 || dragIndex === dropIndex) return state;

      const reordered = [...sorted];
      const [draggedItem] = reordered.splice(dragIndex, 1);
      reordered.splice(dropIndex, 0, draggedItem);

      const updatedIds = new Map<string, number>();
      reordered.forEach((p, index) => {
        updatedIds.set(p.id, index);
      });

      return {
        prompts: state.prompts.map((p) => ({
          ...p,
          customOrder: updatedIds.get(p.id) ?? p.customOrder ?? 0,
        })),
      };
    });
    get().saveToDisk();
  },

  setPrompts: (prompts) => {
    set({ prompts });
    get().saveToDisk();
  },

  moveToFolder: (promptId, folderId) => {
    set((state) => ({
      prompts: state.prompts.map((p) =>
        p.id === promptId ? { ...p, folderId, updatedAt: Date.now() } : p
      ),
    }));
    get().saveToDisk();
  },

  moveManyToFolder: (promptIds, folderId) => {
    set((state) => ({
      prompts: state.prompts.map((p) =>
        promptIds.includes(p.id) ? { ...p, folderId, updatedAt: Date.now() } : p
      ),
    }));
    get().saveToDisk();
  },

  deleteTag: (tag) => {
    set((state) => ({
      prompts: state.prompts.map((p) => ({
        ...p,
        tags: p.tags.filter((t) => t !== tag),
      })),
    }));
    get().saveToDisk();
  },

  renameTag: (oldName, newName) => {
    set((state) => ({
      prompts: state.prompts.map((p) => ({
        ...p,
        tags: p.tags.map((t) => (t === oldName ? newName : t)),
      })),
    }));
    get().saveToDisk();
  },

  clearFolderFromPrompts: (folderId) => {
    set((state) => ({
      prompts: state.prompts.map((p) =>
        p.folderId === folderId ? { ...p, folderId: null, updatedAt: Date.now() } : p
      ),
    }));
    get().saveToDisk();
  },

  getPrompt: (id) => get().prompts.find((p) => p.id === id),

  getAllTags: () => {
    const tags = new Set<string>();
    get().prompts.forEach((p) => p.tags.forEach((t) => tags.add(t)));
    return Array.from(tags).sort();
  },

  getTagCounts: () => {
    const counts: Record<string, number> = {};
    get().prompts.forEach((p) => {
      p.tags.forEach((tag) => {
        counts[tag] = (counts[tag] || 0) + 1;
      });
    });
    return counts;
  },

  getFilteredPrompts: (search, tagFilters, filterMode, sortOrder, folderId) => {
    const { prompts } = get();
    const searchLower = search.toLowerCase().trim();
    
    const filtered = prompts.filter((p) => {
      if (folderId !== undefined) {
        if (folderId === null) {
          if (p.folderId !== null && p.folderId !== undefined) return false;
        } else {
          if (p.folderId !== folderId) return false;
        }
      }
      let matchesSearch = true;
      if (searchLower) {
        const textMatch = 
          p.title.toLowerCase().includes(searchLower) ||
          p.content.toLowerCase().includes(searchLower) ||
          p.tags.some(tag => tag.toLowerCase().includes(searchLower));
        const numberMatch = p.customOrder != null && String(p.customOrder).includes(searchLower);
        matchesSearch = textMatch || numberMatch;
      }
      if (!matchesSearch) return false;
      if (tagFilters.length > 0) {
        const matchesTags =
          filterMode === 'AND'
            ? tagFilters.every((tag) => p.tags.includes(tag))
            : tagFilters.some((tag) => p.tags.includes(tag));
        if (!matchesTags) return false;
      }
      return true;
    });
    return sortPrompts(filtered, sortOrder);
  },
  getSortedPrompts: (sortOrder) => sortPrompts(get().prompts, sortOrder),
  getPromptsByFolder: (folderId) => {
    const { prompts } = get();
    if (folderId === null) return prompts.filter((p) => !p.folderId);
    return prompts.filter((p) => p.folderId === folderId);
  },
}));