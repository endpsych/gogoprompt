/**
 * Copyright (c) 2026 Ender De Freitas. All Rights Reserved.
 * Non-Commercial Use Only.
 */

import { PromptComponent, ComponentType } from '@/types';

const COMPONENTS_KEY = 'prompter-components';

export function loadComponents(): PromptComponent[] {
  try {
    const saved = localStorage.getItem(COMPONENTS_KEY);
    if (!saved) return [];
    return JSON.parse(saved);
  } catch {
    return [];
  }
}

export function saveComponents(components: PromptComponent[]): void {
  localStorage.setItem(COMPONENTS_KEY, JSON.stringify(components));
}

export function createComponent(
  name: string,
  type: ComponentType,
  content: string
): PromptComponent {
  const now = Date.now();
  return {
    id: crypto.randomUUID(),
    name,
    type,
    content,
    createdAt: now,
    updatedAt: now,
  };
}

export function updateComponent(
  component: PromptComponent,
  updates: Partial<PromptComponent>
): PromptComponent {
  return {
    ...component,
    ...updates,
    updatedAt: Date.now(),
  };
}
