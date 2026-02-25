/**
 * Copyright (c) 2026 Ender De Freitas. All Rights Reserved.
 * Non-Commercial Use Only.
 */

import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { Prompt, PromptComponent, GlossaryTerm, PromptFolder, ComponentTypeConfig } from '@/types';

// Custom render function that includes providers if needed
const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { ...options });

export * from '@testing-library/react';
export { customRender as render };

// Factory functions for creating test data
export const createTestPrompt = (overrides: Partial<Prompt> = {}): Prompt => ({
  id: `prompt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  title: 'Test Prompt',
  content: 'Test content for the prompt',
  tags: [],
  createdAt: Date.now(),
  updatedAt: Date.now(),
  useCount: 0,
  ...overrides,
});

export const createTestComponent = (overrides: Partial<PromptComponent> = {}): PromptComponent => ({
  id: `component-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  name: 'Test Component',
  type: 'persona',
  content: 'Test component content',
  createdAt: Date.now(),
  updatedAt: Date.now(),
  ...overrides,
});

export const createTestGlossaryTerm = (overrides: Partial<GlossaryTerm> = {}): GlossaryTerm => ({
  id: `term-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  term: 'Test Term',
  definition: 'Test definition for the term',
  createdAt: Date.now(),
  updatedAt: Date.now(),
  ...overrides,
});

export const createTestFolder = (overrides: Partial<PromptFolder> = {}): PromptFolder => ({
  id: `folder-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  name: 'Test Folder',
  color: '#3b82f6',
  order: 0,
  createdAt: Date.now(),
  ...overrides,
});

export const createTestComponentType = (overrides: Partial<ComponentTypeConfig> = {}): ComponentTypeConfig => ({
  id: `type-${Date.now()}`,
  label: 'Test Type',
  color: '#6366f1',
  ...overrides,
});

// Helper to create multiple items
export const createTestPrompts = (count: number, baseOverrides: Partial<Prompt> = {}): Prompt[] =>
  Array.from({ length: count }, (_, i) =>
    createTestPrompt({
      title: `Test Prompt ${i + 1}`,
      ...baseOverrides,
    })
  );

export const createTestComponents = (count: number, baseOverrides: Partial<PromptComponent> = {}): PromptComponent[] =>
  Array.from({ length: count }, (_, i) =>
    createTestComponent({
      name: `Test Component ${i + 1}`,
      ...baseOverrides,
    })
  );

// Helper to wait for async operations
export const waitFor = async (condition: () => boolean, timeout = 5000): Promise<void> => {
  const startTime = Date.now();
  while (!condition()) {
    if (Date.now() - startTime > timeout) {
      throw new Error('Timeout waiting for condition');
    }
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
};

// Helper to simulate typing with delay
export const typeWithDelay = async (
  element: HTMLElement,
  text: string,
  delay = 50
): Promise<void> => {
  for (const char of text) {
    element.focus();
    const event = new InputEvent('input', {
      bubbles: true,
      cancelable: true,
      data: char,
    });
    element.dispatchEvent(event);
    await new Promise((resolve) => setTimeout(resolve, delay));
  }
};
