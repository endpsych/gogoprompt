/**
 * Copyright (c) 2026 Ender De Freitas. All Rights Reserved.
 * Non-Commercial Use Only.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { GlossaryTerm, GLOSSARY_CATEGORIES } from '@/types';
import { createFileStorage } from '@/shared/utils/storage/fileStorage';
import { sanitizeString } from '@/shared/utils/sanitize';

interface GlossaryState {
  terms: GlossaryTerm[];
  
  // Actions
  addTerm: (term: string, definition: string, category?: string) => GlossaryTerm;
  updateTerm: (id: string, updates: Partial<GlossaryTerm>) => void;
  deleteTerm: (id: string) => void;
  importTerms: (newTerms: Array<{ term: string; definition: string; category?: string }>) => number;
  setTerms: (terms: GlossaryTerm[]) => void;
  
  // Computed
  getTerm: (id: string) => GlossaryTerm | undefined;
  getCategories: () => string[];
}

const generateId = () => Math.random().toString(36).substring(2, 15);

export const useGlossaryStore = create<GlossaryState>()(
  persist(
    (set, get) => ({
      terms: [],

      addTerm: (term, definition, category) => {
        const newTerm: GlossaryTerm = {
          id: generateId(),
          term: sanitizeString(term),
          definition: sanitizeString(definition),
          category: sanitizeString(category || 'Other'),
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        set((state) => ({ terms: [newTerm, ...state.terms] }));
        return newTerm;
      },

      updateTerm: (id, updates) => {
        const sanitizedUpdates = { ...updates };
        if (sanitizedUpdates.term !== undefined) {
          sanitizedUpdates.term = sanitizeString(sanitizedUpdates.term);
        }
        if (sanitizedUpdates.definition !== undefined) {
          sanitizedUpdates.definition = sanitizeString(sanitizedUpdates.definition);
        }
        if (sanitizedUpdates.category !== undefined) {
          sanitizedUpdates.category = sanitizeString(sanitizedUpdates.category);
        }
        
        set((state) => ({
          terms: state.terms.map((t) =>
            t.id === id ? { ...t, ...sanitizedUpdates, updatedAt: Date.now() } : t
          ),
        }));
      },

      deleteTerm: (id) => {
        set((state) => ({ terms: state.terms.filter((t) => t.id !== id) }));
      },

      importTerms: (newTerms) => {
        const { terms: existingTerms } = get();
        const existingTermNames = new Set(existingTerms.map((t) => t.term.toLowerCase()));
        
        const termsToAdd: GlossaryTerm[] = [];
        newTerms.forEach(({ term, definition, category }) => {
          const sanitizedTerm = sanitizeString(term);
          if (!existingTermNames.has(sanitizedTerm.toLowerCase())) {
            termsToAdd.push({
              id: generateId(),
              term: sanitizedTerm,
              definition: sanitizeString(definition),
              category: sanitizeString(category || 'Other'),
              createdAt: Date.now(),
              updatedAt: Date.now(),
            });
            existingTermNames.add(sanitizedTerm.toLowerCase());
          }
        });

        if (termsToAdd.length > 0) {
          set((state) => ({ terms: [...termsToAdd, ...state.terms] }));
        }

        return termsToAdd.length;
      },

      setTerms: (terms) => set({ terms }),

      getTerm: (id) => get().terms.find((t) => t.id === id),

      getCategories: () => {
        const customCategories = new Set<string>();
        get().terms.forEach((t) => {
          if (t.category && !GLOSSARY_CATEGORIES.includes(t.category as any)) {
            customCategories.add(t.category);
          }
        });
        return [...GLOSSARY_CATEGORIES, ...Array.from(customCategories).sort()];
      },
    }),
    {
      name: 'glossary',
      storage: createJSONStorage(() => createFileStorage('glossary')),
    }
  )
);
