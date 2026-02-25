/**
 * Copyright (c) 2026 Ender De Freitas. All Rights Reserved.
 * Non-Commercial Use Only.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { GlossaryTerm } from '@/types';
import {
  loadGlossary,
  saveGlossary,
  createGlossaryTerm,
  updateGlossaryTerm,
} from '../utils/glossary';

export function useGlossary() {
  const [terms, setTerms] = useState<GlossaryTerm[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load glossary on mount
  useEffect(() => {
    setTerms(loadGlossary());
    setIsLoaded(true);
  }, []);

  // Save glossary when it changes
  useEffect(() => {
    if (isLoaded) {
      saveGlossary(terms);
    }
  }, [terms, isLoaded]);

  // Get all unique categories
  const categories = useMemo(() => {
    const cats = terms
      .map((t) => t.category)
      .filter((c): c is string => !!c);
    return Array.from(new Set(cats)).sort();
  }, [terms]);

  // Add a new term
  const addTerm = useCallback(
    (term: string, definition: string, category?: string) => {
      const newTerm = createGlossaryTerm(term, definition, category);
      setTerms((prev) => [newTerm, ...prev]);
      return newTerm;
    },
    []
  );

  // Import multiple terms at once
  const importTerms = useCallback(
    (newTerms: Array<{ term: string; definition: string; category?: string }>) => {
      const createdTerms = newTerms.map((t) =>
        createGlossaryTerm(t.term, t.definition, t.category)
      );
      setTerms((prev) => [...createdTerms, ...prev]);
      return createdTerms;
    },
    []
  );

  // Update an existing term
  const editTerm = useCallback(
    (id: string, updates: Partial<GlossaryTerm>) => {
      setTerms((prev) =>
        prev.map((t) => (t.id === id ? updateGlossaryTerm(t, updates) : t))
      );
    },
    []
  );

  // Delete a term
  const deleteTerm = useCallback((id: string) => {
    setTerms((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Get a term by ID
  const getTerm = useCallback(
    (id: string) => terms.find((t) => t.id === id),
    [terms]
  );

  // Search terms by term name or definition
  const searchTerms = useCallback(
    (query: string, category?: string) => {
      const lowerQuery = query.toLowerCase();
      return terms.filter((t) => {
        const matchesQuery =
          !query ||
          t.term.toLowerCase().includes(lowerQuery) ||
          t.definition.toLowerCase().includes(lowerQuery);
        const matchesCategory = !category || t.category === category;
        return matchesQuery && matchesCategory;
      });
    },
    [terms]
  );

  return {
    terms,
    categories,
    isLoaded,
    addTerm,
    importTerms,
    editTerm,
    deleteTerm,
    getTerm,
    searchTerms,
    setTerms, // For import
  };
}
