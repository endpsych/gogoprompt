/**
 * Copyright (c) 2026 Ender De Freitas. All Rights Reserved.
 * Non-Commercial Use Only.
 */

import { useState, useCallback } from 'react';
import { ComponentTypeConfig, DEFAULT_COMPONENT_TYPES } from '@/types';

const COMPONENT_TYPES_STORAGE_KEY = 'prompter-component-types';

function loadComponentTypes(): ComponentTypeConfig[] {
  try {
    const saved = localStorage.getItem(COMPONENT_TYPES_STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (err) {
    console.error('Failed to load component types:', err);
  }
  return DEFAULT_COMPONENT_TYPES;
}

function saveComponentTypes(types: ComponentTypeConfig[]): void {
  try {
    localStorage.setItem(COMPONENT_TYPES_STORAGE_KEY, JSON.stringify(types));
  } catch (err) {
    console.error('Failed to save component types:', err);
  }
}

export function useComponentTypes() {
  const [componentTypes, setComponentTypes] = useState<ComponentTypeConfig[]>(loadComponentTypes);

  const addComponentType = useCallback((label: string, color: string) => {
    const id = label.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const newType: ComponentTypeConfig = { id, label, color };
    
    setComponentTypes((prev) => {
      // Check if id already exists
      if (prev.some((t) => t.id === id)) {
        return prev;
      }
      const updated = [...prev, newType];
      saveComponentTypes(updated);
      return updated;
    });
    
    return id;
  }, []);

  const updateComponentType = useCallback((id: string, updates: Partial<Omit<ComponentTypeConfig, 'id'>>) => {
    setComponentTypes((prev) => {
      const updated = prev.map((t) =>
        t.id === id ? { ...t, ...updates } : t
      );
      saveComponentTypes(updated);
      return updated;
    });
  }, []);

  const deleteComponentType = useCallback((id: string) => {
    // Don't allow deleting if it's the last type or if it's 'other'
    setComponentTypes((prev) => {
      if (prev.length <= 1 || id === 'other') {
        return prev;
      }
      const updated = prev.filter((t) => t.id !== id);
      saveComponentTypes(updated);
      return updated;
    });
  }, []);

  const getTypeColor = useCallback((typeId: string): string => {
    const type = componentTypes.find((t) => t.id === typeId);
    return type?.color || '#6b7280';
  }, [componentTypes]);

  const getTypeLabel = useCallback((typeId: string): string => {
    const type = componentTypes.find((t) => t.id === typeId);
    return type?.label || typeId;
  }, [componentTypes]);

  const resetToDefaults = useCallback(() => {
    saveComponentTypes(DEFAULT_COMPONENT_TYPES);
    setComponentTypes(DEFAULT_COMPONENT_TYPES);
  }, []);

  const setAllComponentTypes = useCallback((types: ComponentTypeConfig[]) => {
    saveComponentTypes(types);
    setComponentTypes(types);
  }, []);

  return {
    componentTypes,
    addComponentType,
    updateComponentType,
    deleteComponentType,
    getTypeColor,
    getTypeLabel,
    resetToDefaults,
    setAllComponentTypes,
  };
}
