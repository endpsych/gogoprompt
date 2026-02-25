/**
 * Copyright (c) 2026 Ender De Freitas. All Rights Reserved.
 * Non-Commercial Use Only.
 */

import { useState, useEffect, useCallback } from 'react';
import { PromptComponent, ComponentType } from '@/types';
import {
  loadComponents,
  saveComponents,
  createComponent,
  updateComponent,
} from '../utils/components';

export function useComponents() {
  const [components, setComponents] = useState<PromptComponent[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load components on mount
  useEffect(() => {
    setComponents(loadComponents());
    setIsLoaded(true);
  }, []);

  // Save components when they change
  useEffect(() => {
    if (isLoaded) {
      saveComponents(components);
    }
  }, [components, isLoaded]);

  // Add a new component
  const addComponent = useCallback(
    (name: string, type: ComponentType, content: string) => {
      const newComponent = createComponent(name, type, content);
      setComponents((prev) => [newComponent, ...prev]);
      return newComponent;
    },
    []
  );

  // Update an existing component
  const editComponent = useCallback(
    (id: string, updates: Partial<PromptComponent>) => {
      setComponents((prev) =>
        prev.map((c) => (c.id === id ? updateComponent(c, updates) : c))
      );
    },
    []
  );

  // Delete a component
  const deleteComponent = useCallback((id: string) => {
    setComponents((prev) => prev.filter((c) => c.id !== id));
  }, []);

  // Get a component by ID
  const getComponent = useCallback(
    (id: string) => components.find((c) => c.id === id),
    [components]
  );

  // Filter components by type
  const filterByType = useCallback(
    (type: ComponentType | null) => {
      if (!type) return components;
      return components.filter((c) => c.type === type);
    },
    [components]
  );

  return {
    components,
    isLoaded,
    addComponent,
    editComponent,
    deleteComponent,
    getComponent,
    filterByType,
    setComponents, // For import
  };
}
