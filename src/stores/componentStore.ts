/**
 * Copyright (c) 2026 Ender De Freitas. All Rights Reserved.
 * Non-Commercial Use Only.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { PromptComponent, ComponentType, ComponentTypeConfig, DEFAULT_COMPONENT_TYPES } from '@/types';
import { createFileStorage } from '@/shared/utils/storage/fileStorage';
import { sanitizeString, sanitizeColor } from '@/shared/utils/sanitize';

interface ComponentState {
  components: PromptComponent[];
  componentTypes: ComponentTypeConfig[];
  
  // Component actions
  addComponent: (name: string, type: ComponentType, content: string) => PromptComponent;
  updateComponent: (id: string, updates: Partial<PromptComponent>) => void;
  deleteComponent: (id: string) => void;
  reorderComponent: (dragId: string, dropId: string) => void;
  setComponents: (components: PromptComponent[]) => void;
  getComponent: (id: string) => PromptComponent | undefined;
  
  // Component type actions
  addComponentType: (label: string, color: string) => void;
  updateComponentType: (id: string, updates: Partial<Omit<ComponentTypeConfig, 'id'>>) => void;
  deleteComponentType: (id: string) => void;
  resetComponentTypes: () => void;
  getTypeColor: (typeId: string) => string;
}

const generateId = () => Math.random().toString(36).substring(2, 15);

export const useComponentStore = create<ComponentState>()(
  persist(
    (set, get) => ({
      components: [],
      componentTypes: DEFAULT_COMPONENT_TYPES,

      addComponent: (name, type, content) => {
        const newComponent: PromptComponent = {
          id: generateId(),
          name: sanitizeString(name),
          type: sanitizeString(type),
          content: sanitizeString(content),
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        set((state) => ({ components: [newComponent, ...state.components] }));
        return newComponent;
      },

      updateComponent: (id, updates) => {
        const sanitizedUpdates = { ...updates };
        if (sanitizedUpdates.name !== undefined) {
          sanitizedUpdates.name = sanitizeString(sanitizedUpdates.name);
        }
        if (sanitizedUpdates.content !== undefined) {
          sanitizedUpdates.content = sanitizeString(sanitizedUpdates.content);
        }
        if (sanitizedUpdates.type !== undefined) {
          sanitizedUpdates.type = sanitizeString(sanitizedUpdates.type);
        }
        
        set((state) => ({
          components: state.components.map((c) =>
            c.id === id ? { ...c, ...sanitizedUpdates, updatedAt: Date.now() } : c
          ),
        }));
      },

      deleteComponent: (id) => {
        set((state) => ({ components: state.components.filter((c) => c.id !== id) }));
      },

      reorderComponent: (dragId, dropId) => {
        set((state) => {
          const components = [...state.components];
          const dragIndex = components.findIndex((c) => c.id === dragId);
          const dropIndex = components.findIndex((c) => c.id === dropId);

          if (dragIndex === -1 || dropIndex === -1) return state;

          const [draggedComponent] = components.splice(dragIndex, 1);
          components.splice(dropIndex, 0, draggedComponent);

          return { components };
        });
      },

      setComponents: (components) => set({ components }),

      getComponent: (id) => get().components.find((c) => c.id === id),

      addComponentType: (label, color) => {
        const sanitizedLabel = sanitizeString(label);
        const id = sanitizedLabel.toLowerCase().replace(/\s+/g, '-');
        set((state) => ({
          componentTypes: [...state.componentTypes, { 
            id, 
            label: sanitizedLabel, 
            color: sanitizeColor(color) 
          }],
        }));
      },

      updateComponentType: (id, updates) => {
        const sanitizedUpdates = { ...updates };
        if (sanitizedUpdates.label !== undefined) {
          sanitizedUpdates.label = sanitizeString(sanitizedUpdates.label);
        }
        if (sanitizedUpdates.color !== undefined) {
          sanitizedUpdates.color = sanitizeColor(sanitizedUpdates.color);
        }
        
        set((state) => ({
          componentTypes: state.componentTypes.map((t) =>
            t.id === id ? { ...t, ...sanitizedUpdates } : t
          ),
        }));
      },

      deleteComponentType: (id) => {
        // Don't allow deleting default types
        if (DEFAULT_COMPONENT_TYPES.some((t) => t.id === id)) return;
        set((state) => ({
          componentTypes: state.componentTypes.filter((t) => t.id !== id),
        }));
      },

      resetComponentTypes: () => {
        set({ componentTypes: DEFAULT_COMPONENT_TYPES });
      },

      getTypeColor: (typeId) => {
        const type = get().componentTypes.find((t) => t.id === typeId);
        return type?.color || '#6b7280';
      },
    }),
    {
      name: 'components',
      storage: createJSONStorage(() => createFileStorage('components')),
    }
  )
);
