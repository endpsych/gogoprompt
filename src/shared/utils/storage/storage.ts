/**
 * Copyright (c) 2026 Ender De Freitas. All Rights Reserved.
 * Non-Commercial Use Only.
 */

import { Prompt } from '@/types';

const PROMPTS_KEY = 'prompter-data';

export function loadPrompts(): Prompt[] {
  try {
    const saved = localStorage.getItem(PROMPTS_KEY);
    if (!saved) return [];
    
    // Migrate old prompts that don't have timestamps
    const prompts: Prompt[] = JSON.parse(saved);
    return prompts.map((p) => ({
      ...p,
      tags: p.tags || [],
      createdAt: p.createdAt || Date.now(),
      updatedAt: p.updatedAt || Date.now(),
    }));
  } catch {
    return [];
  }
}

export function savePrompts(prompts: Prompt[]): void {
  localStorage.setItem(PROMPTS_KEY, JSON.stringify(prompts));
}

export function createPrompt(title: string, content: string, tags: string[]): Prompt {
  const now = Date.now();
  return {
    id: crypto.randomUUID(),
    title,
    content,
    tags,
    createdAt: now,
    updatedAt: now,
  };
}

export function updatePrompt(prompt: Prompt, updates: Partial<Prompt>): Prompt {
  return {
    ...prompt,
    ...updates,
    updatedAt: Date.now(),
  };
}
