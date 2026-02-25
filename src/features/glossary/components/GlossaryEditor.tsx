/**
 * Copyright (c) 2026 Ender De Freitas. All Rights Reserved.
 * Non-Commercial Use Only.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Save, Edit3, Trash2, Copy } from 'lucide-react';
import { GlossaryTerm, GLOSSARY_CATEGORIES } from '@/types';
import { useLanguage } from '@/shared/hooks';

interface GlossaryEditorProps {
  term: GlossaryTerm | null;
  isNew: boolean;
  onSave: (term: string, definition: string, category?: string) => void;
  onDelete: () => void;
  showToast?: (message: string) => void;
  onDirtyChange?: (isDirty: boolean) => void;
}

export function GlossaryEditor({
  term,
  isNew,
  onSave,
  onDelete,
  showToast,
  onDirtyChange,
}: GlossaryEditorProps) {
  const { t } = useLanguage();
  const [isEditing, setIsEditing] = useState(false);
  const [termName, setTermName] = useState('');
  const [definition, setDefinition] = useState('');
  const [category, setCategory] = useState<string>('');
  
  // Track original values to detect changes
  const [originalTermName, setOriginalTermName] = useState('');
  const [originalDefinition, setOriginalDefinition] = useState('');
  const [originalCategory, setOriginalCategory] = useState('');

  // Check if there are unsaved changes
  const isDirty = isEditing && (
    termName !== originalTermName ||
    definition !== originalDefinition ||
    category !== originalCategory
  );

  // Notify parent of dirty state changes
  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  // Reset form when term changes
  useEffect(() => {
    if (term) {
      setTermName(term.term);
      setDefinition(term.definition);
      setCategory(term.category || '');
      setOriginalTermName(term.term);
      setOriginalDefinition(term.definition);
      setOriginalCategory(term.category || '');
      setIsEditing(isNew);
    }
  }, [term, isNew]);

  // Start in edit mode for new terms
  useEffect(() => {
    if (isNew) {
      setTermName('');
      setDefinition('');
      setCategory('');
      setOriginalTermName('');
      setOriginalDefinition('');
      setOriginalCategory('');
      setIsEditing(true);
    }
  }, [isNew]);

  // Listen for save shortcut
  useEffect(() => {
    const handleSaveShortcut = () => {
      if (isEditing && termName.trim() && definition.trim()) {
        handleSave();
      }
    };
    
    window.addEventListener('shortcut-save', handleSaveShortcut);
    return () => window.removeEventListener('shortcut-save', handleSaveShortcut);
  }, [isEditing, termName, definition, category]);

  const handleSave = useCallback(() => {
    if (!termName.trim() || !definition.trim()) return;
    onSave(termName, definition, category || undefined);
    setOriginalTermName(termName);
    setOriginalDefinition(definition);
    setOriginalCategory(category);
    setIsEditing(false);
  }, [termName, definition, category, onSave]);

  // Expose save function for external calls
  useEffect(() => {
    const handleExternalSave = () => {
      if (isDirty && termName.trim() && definition.trim()) {
        handleSave();
      }
    };
    
    window.addEventListener('force-save-glossary', handleExternalSave);
    return () => window.removeEventListener('force-save-glossary', handleExternalSave);
  }, [isDirty, termName, definition, handleSave]);

  const handleCopy = () => {
    navigator.clipboard.writeText(`${termName}: ${definition}`);
    showToast?.(t.prompts.copiedToClipboard);
  };

  const handleCopyDefinition = () => {
    navigator.clipboard.writeText(definition);
    showToast?.(t.prompts.copiedToClipboard);
  };

  if (!term && !isNew) {
    return <div className="empty-state">{t.glossary.selectTerm}</div>;
  }

  return (
    <>
      <div className="editor-header">
        {isEditing ? (
          <input
            value={termName}
            onChange={(e) => setTermName(e.target.value)}
            className="title-input glossary-term-input"
            placeholder={t.glossary.termPlaceholder}
            autoFocus={isNew}
          />
        ) : (
          <div className="glossary-header-title">
            <span className="prompt-title">{term?.term}</span>
            {term?.category && (
              <span className="glossary-category-badge">{term.category}</span>
            )}
          </div>
        )}
        <div className="header-actions">
          {isEditing ? (
            <button onClick={handleSave} className="action-btn save" title={t.common.save}>
              <Save size={16} />
            </button>
          ) : (
            <>
              <button onClick={() => setIsEditing(true)} className="action-btn" title={t.common.edit}>
                <Edit3 size={16} />
              </button>
              <button onClick={onDelete} className="action-btn delete" title={t.common.delete}>
                <Trash2 size={16} />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Category selector (only when editing) */}
      {isEditing && (
        <div className="glossary-category-selector">
          <span className="glossary-category-label">{t.glossary.category}:</span>
          <select
            className="glossary-category-select"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="">{t.common.none}</option>
            {GLOSSARY_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="editor-body">
        {isEditing ? (
          <textarea
            value={definition}
            onChange={(e) => setDefinition(e.target.value)}
            className="content-textarea"
            placeholder={t.glossary.definitionPlaceholder}
          />
        ) : (
          <div className="content-view">
            <div className="content-text glossary-definition">{term?.definition}</div>
            <div className="glossary-copy-buttons">
              <button onClick={handleCopyDefinition} className="copy-btn">
                <Copy size={14} /> {t.common.copy} {t.glossary.definition}
              </button>
              <button onClick={handleCopy} className="copy-btn secondary">
                <Copy size={14} /> {t.common.copy} {t.glossary.term} + {t.glossary.definition}
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}