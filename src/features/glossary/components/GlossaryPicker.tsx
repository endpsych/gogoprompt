/**
 * Copyright (c) 2026 Ender De Freitas. All Rights Reserved.
 * Non-Commercial Use Only.
 */

import React, { useState } from 'react';
import { X, Plus, Search } from 'lucide-react';
import { GlossaryTerm, GLOSSARY_CATEGORIES } from '@/types';

interface GlossaryPickerProps {
  terms: GlossaryTerm[];
  onInsert: (content: string) => void;
  onClose: () => void;
}

type InsertFormat = 'definition' | 'term-definition' | 'formatted';

export function GlossaryPicker({ terms, onInsert, onClose }: GlossaryPickerProps) {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [insertFormat, setInsertFormat] = useState<InsertFormat>('definition');

  const filteredTerms = terms
    .filter((t) => {
      const matchesSearch =
        !search ||
        t.term.toLowerCase().includes(search.toLowerCase()) ||
        t.definition.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = !categoryFilter || t.category === categoryFilter;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => a.term.toLowerCase().localeCompare(b.term.toLowerCase()));

  const previewTerm = previewId ? terms.find((t) => t.id === previewId) : null;

  const getInsertContent = (term: GlossaryTerm): string => {
    switch (insertFormat) {
      case 'definition':
        return term.definition;
      case 'term-definition':
        return `${term.term}: ${term.definition}`;
      case 'formatted':
        return `**${term.term}**: ${term.definition}`;
      default:
        return term.definition;
    }
  };

  const handleInsert = (term: GlossaryTerm) => {
    onInsert(getInsertContent(term));
    onClose();
  };

  const categories = Array.from(new Set(terms.map((t) => t.category).filter(Boolean)));

  return (
    <div className="glossary-picker-overlay" onClick={onClose}>
      <div className="glossary-picker" onClick={(e) => e.stopPropagation()}>
        <div className="glossary-picker-header">
          <span className="glossary-picker-title">Insert Glossary Term</span>
          <button className="glossary-picker-close" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        {/* Search and filters */}
        <div className="glossary-picker-filters">
          <div className="glossary-picker-search">
            <Search size={12} className="glossary-search-icon" />
            <input
              className="glossary-search-input"
              placeholder="Search terms..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
            />
          </div>
          {categories.length > 0 && (
            <div className="glossary-picker-categories">
              <button
                className={`glossary-category-btn ${categoryFilter === null ? 'active' : ''}`}
                onClick={() => setCategoryFilter(null)}
              >
                All
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
          )}
        </div>

        {/* Insert format selector */}
        <div className="glossary-format-selector">
          <span className="glossary-format-label">Insert as:</span>
          <button
            className={`glossary-format-btn ${insertFormat === 'definition' ? 'active' : ''}`}
            onClick={() => setInsertFormat('definition')}
          >
            Definition only
          </button>
          <button
            className={`glossary-format-btn ${insertFormat === 'term-definition' ? 'active' : ''}`}
            onClick={() => setInsertFormat('term-definition')}
          >
            Term: Definition
          </button>
          <button
            className={`glossary-format-btn ${insertFormat === 'formatted' ? 'active' : ''}`}
            onClick={() => setInsertFormat('formatted')}
          >
            **Term**: Definition
          </button>
        </div>

        <div className="glossary-picker-body">
          {/* Terms list */}
          <div className="glossary-picker-list">
            {filteredTerms.map((t) => (
              <div
                key={t.id}
                className={`glossary-picker-item ${previewId === t.id ? 'selected' : ''}`}
                onMouseEnter={() => setPreviewId(t.id)}
                onClick={() => handleInsert(t)}
              >
                <span className="glossary-picker-item-term">{t.term}</span>
                {t.category && (
                  <span className="glossary-picker-item-category">{t.category}</span>
                )}
                <Plus size={14} className="glossary-picker-item-add" />
              </div>
            ))}
            {filteredTerms.length === 0 && (
              <div className="glossary-picker-empty">
                {search || categoryFilter
                  ? 'No matching terms'
                  : 'No terms yet. Add some in the Glossary tab.'}
              </div>
            )}
          </div>

          {/* Preview */}
          <div className="glossary-picker-preview">
            {previewTerm ? (
              <>
                <div className="glossary-picker-preview-header">
                  <span className="glossary-picker-preview-term">{previewTerm.term}</span>
                  {previewTerm.category && (
                    <span className="glossary-category-badge">{previewTerm.category}</span>
                  )}
                </div>
                <div className="glossary-picker-preview-definition">
                  {previewTerm.definition}
                </div>
                <div className="glossary-picker-preview-insert">
                  <span className="glossary-preview-label">Will insert:</span>
                  <div className="glossary-preview-content">
                    {getInsertContent(previewTerm)}
                  </div>
                </div>
              </>
            ) : (
              <div className="glossary-picker-preview-empty">
                Hover over a term to preview
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
