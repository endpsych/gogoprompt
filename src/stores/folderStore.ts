/**
 * Copyright (c) 2026 Ender De Freitas. All Rights Reserved.
 * Non-Commercial Use Only.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { PromptFolder } from '@/types';
import { createFileStorage } from '@/shared/utils/storage/fileStorage';
import { sanitizeString } from '@/shared/utils/sanitize';

interface FolderState {
  folders: PromptFolder[];
  
  // Actions
  addFolder: (name: string, color?: string) => PromptFolder;
  updateFolder: (id: string, updates: Partial<PromptFolder>) => void;
  deleteFolder: (id: string) => void;
  reorderFolder: (dragId: string, dropId: string) => void;
  setFolders: (folders: PromptFolder[]) => void;
  
  // Computed
  getFolder: (id: string) => PromptFolder | undefined;
  getSortedFolders: () => PromptFolder[];
}

const generateId = (): string => Math.random().toString(36).substring(2, 15);

export const useFolderStore = create<FolderState>()(
  persist(
    (set, get) => ({
      folders: [],

      addFolder: (name: string, color?: string) => {
        const maxOrder = get().folders.reduce(
          (max: number, f: PromptFolder) => Math.max(max, f.customOrder ?? 0), 
          0
        );
        const newFolder: PromptFolder = {
          id: generateId(),
          name: sanitizeString(name),
          color: color || '#6b7280',
          parentId: null,
          customOrder: maxOrder + 1,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        set((state: FolderState) => ({ folders: [...state.folders, newFolder] }));
        return newFolder;
      },

      updateFolder: (id: string, updates: Partial<PromptFolder>) => {
        const sanitizedUpdates = { ...updates };
        if (sanitizedUpdates.name !== undefined) {
          sanitizedUpdates.name = sanitizeString(sanitizedUpdates.name);
        }
        
        set((state: FolderState) => ({
          folders: state.folders.map((f: PromptFolder) =>
            f.id === id ? { ...f, ...sanitizedUpdates, updatedAt: Date.now() } : f
          ),
        }));
      },

      deleteFolder: (id: string) => {
        set((state: FolderState) => ({
          folders: state.folders.filter((f: PromptFolder) => f.id !== id),
        }));
      },

      reorderFolder: (dragId: string, dropId: string) => {
        set((state: FolderState) => {
          const sorted = [...state.folders].sort(
            (a: PromptFolder, b: PromptFolder) => (a.customOrder ?? 0) - (b.customOrder ?? 0)
          );
          const dragIndex = sorted.findIndex((f: PromptFolder) => f.id === dragId);
          const dropIndex = sorted.findIndex((f: PromptFolder) => f.id === dropId);
          
          if (dragIndex === -1 || dropIndex === -1 || dragIndex === dropIndex) {
            return state;
          }

          const reordered = [...sorted];
          const [draggedItem] = reordered.splice(dragIndex, 1);
          reordered.splice(dropIndex, 0, draggedItem);

          const updatedIds = new Map<string, number>();
          reordered.forEach((f: PromptFolder, index: number) => {
            updatedIds.set(f.id, index);
          });

          return {
            folders: state.folders.map((f: PromptFolder) => ({
              ...f,
              customOrder: updatedIds.get(f.id) ?? f.customOrder ?? 0,
            })),
          };
        });
      },

      setFolders: (folders: PromptFolder[]) => set({ folders }),

      getFolder: (id: string) => get().folders.find((f: PromptFolder) => f.id === id),

      getSortedFolders: () => {
        return [...get().folders].sort(
          (a: PromptFolder, b: PromptFolder) => (a.customOrder ?? 0) - (b.customOrder ?? 0)
        );
      },
    }),
    {
      name: 'folders',
      storage: createJSONStorage(() => createFileStorage('folders')),
    }
  )
);
