/**
 * Copyright (c) 2026 Ender De Freitas. All Rights Reserved.
 * Non-Commercial Use Only.
 */

import { GlossaryTerm } from '@/types';

const GLOSSARY_KEY = 'prompter-glossary';

export function loadGlossary(): GlossaryTerm[] {
  try {
    const saved = localStorage.getItem(GLOSSARY_KEY);
    if (!saved) return [];
    return JSON.parse(saved);
  } catch {
    return [];
  }
}

export function saveGlossary(terms: GlossaryTerm[]): void {
  localStorage.setItem(GLOSSARY_KEY, JSON.stringify(terms));
}

export function createGlossaryTerm(
  term: string,
  definition: string,
  category?: string
): GlossaryTerm {
  const now = Date.now();
  return {
    id: crypto.randomUUID(),
    term,
    definition,
    category,
    createdAt: now,
    updatedAt: now,
  };
}

export function updateGlossaryTerm(
  glossaryTerm: GlossaryTerm,
  updates: Partial<GlossaryTerm>
): GlossaryTerm {
  return {
    ...glossaryTerm,
    ...updates,
    updatedAt: Date.now(),
  };
}
