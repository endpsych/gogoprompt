/**
 * Copyright (c) 2026 Ender De Freitas. All Rights Reserved.
 * Non-Commercial Use Only.
 */

import React, { useState } from 'react';
import { Plus, Search } from 'lucide-react';
import { GlossaryTerm, GLOSSARY_CATEGORIES } from '@/types';
import { useLanguage } from '@/shared/hooks';

interface GlossaryListProps {
  terms: GlossaryTerm[];
  categories: string[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  showToast?: (message: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
}

export function GlossaryList({
  terms,
  categories: _categories,
  selectedId,
  onSelect,
  onNew,
  showToast: _showToast,
}: GlossaryListProps) {
  const { t } = useLanguage();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);

  const filteredTerms = terms.filter((t) => {
    const matchesSearch =
      !search ||
      t.term.toLowerCase().includes(search.toLowerCase()) ||
      t.definition.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = !categoryFilter || t.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  // Sort alphabetically by term
  const sortedTerms = [...filteredTerms].sort((a, b) =>
    a.term.toLowerCase().localeCompare(b.term.toLowerCase())
  );

  return (
    <div className="glossary-list-container">
      <div className="glossary-list-header">
        <div className="glossary-header-row">
          <button onClick={onNew} className="new-btn">
            <Plus size={14} /> {t.glossary.newTerm}
          </button>
        </div>
        <div className="glossary-search">
          <Search size={12} className="glossary-search-icon" />
          <input
            className="glossary-search-input"
            placeholder={t.glossary.searchTerms}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Category filter */}
      <div className="glossary-category-filter">
        <button
          className={`glossary-category-btn ${categoryFilter === null ? 'active' : ''}`}
          onClick={() => setCategoryFilter(null)}
        >
          {t.glossary.all}
        </button>
        {GLOSSARY_CATEGORIES.map((cat) => (
          <button
            key={cat}
            className={`glossary-category-btn ${categoryFilter === cat ? 'active' : ''}`}
            onClick={() => setCategoryFilter(categoryFilter === cat ? null : cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Terms list */}
      <div className="glossary-list">
        {sortedTerms.map((term) => (
          <div
            key={term.id}
            onClick={() => onSelect(term.id)}
            className={`glossary-item ${selectedId === term.id ? 'active' : ''}`}
          >
            <span className="glossary-item-term">{term.term}</span>
            {term.category && (
              <span className="glossary-item-category">{term.category}</span>
            )}
          </div>
        ))}
        {sortedTerms.length === 0 && (
          <div className="glossary-list-empty">
            {search || categoryFilter
              ? t.glossary.noTerms
              : t.glossary.noTermsHint}
          </div>
        )}
      </div>
    </div>
  );
}
