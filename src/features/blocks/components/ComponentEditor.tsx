/**
 * Copyright (c) 2026 Ender De Freitas. All Rights Reserved.
 * Non-Commercial Use Only.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Save, Edit3, Trash2, Copy, Variable } from 'lucide-react';
import {
  PromptComponent,
  ComponentType,
  ComponentTypeConfig,
} from '@/types';
import { extractVariables } from '@/features/variables/components/VariableFiller';
import { useLanguage } from '@/shared/hooks';

interface ComponentEditorProps {
  component: PromptComponent | null;
  isNew: boolean;
  componentTypes: ComponentTypeConfig[];
  onSave: (name: string, type: ComponentType, content: string) => void;
  onDelete: () => void;
  showToast?: (message: string) => void;
  onDirtyChange?: (isDirty: boolean) => void;
}

export function ComponentEditor({
  component,
  isNew,
  componentTypes,
  onSave,
  onDelete,
  showToast,
  onDirtyChange,
}: ComponentEditorProps) {
  const { t } = useLanguage();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState<ComponentType>('persona');
  const [content, setContent] = useState('');
  
  // Track original values to detect changes
  const [originalName, setOriginalName] = useState('');
  const [originalType, setOriginalType] = useState<ComponentType>('persona');
  const [originalContent, setOriginalContent] = useState('');

  // Check if there are unsaved changes
  const isDirty = isEditing && (
    name !== originalName ||
    type !== originalType ||
    content !== originalContent
  );

  // Get color for current type
  const getTypeColor = (typeId: string) => {
    const typeConfig = componentTypes.find((t) => t.id === typeId);
    return typeConfig?.color || '#6b7280';
  };

  // Get label for current type
  const getTypeLabel = (typeId: string) => {
    const typeConfig = componentTypes.find((t) => t.id === typeId);
    return typeConfig?.label || typeId;
  };

  // Notify parent of dirty state changes
  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  // Reset form when component changes
  useEffect(() => {
    if (component) {
      setName(component.name);
      setType(component.type);
      setContent(component.content);
      setOriginalName(component.name);
      setOriginalType(component.type);
      setOriginalContent(component.content);
      setIsEditing(isNew);
    }
  }, [component, isNew]);

  // Start in edit mode for new components
  useEffect(() => {
    if (isNew) {
      setName('');
      setType('persona');
      setContent('');
      setOriginalName('');
      setOriginalType('persona');
      setOriginalContent('');
      setIsEditing(true);
    }
  }, [isNew]);

  // Listen for save shortcut
  useEffect(() => {
    const handleSaveShortcut = () => {
      if (isEditing && name.trim()) {
        handleSave();
      }
    };
    
    window.addEventListener('shortcut-save', handleSaveShortcut);
    return () => window.removeEventListener('shortcut-save', handleSaveShortcut);
  }, [isEditing, name, type, content]);

  const handleSave = useCallback(() => {
    if (!name.trim()) return;
    onSave(name, type, content);
    setOriginalName(name);
    setOriginalType(type);
    setOriginalContent(content);
    setIsEditing(false);
  }, [name, type, content, onSave]);

  // Expose save function for external calls
  useEffect(() => {
    const handleExternalSave = () => {
      if (isDirty && name.trim()) {
        handleSave();
      }
    };
    
    window.addEventListener('force-save-component', handleExternalSave);
    return () => window.removeEventListener('force-save-component', handleExternalSave);
  }, [isDirty, name, handleSave]);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    showToast?.(t.prompts.copiedToClipboard);
  };

  const variables = extractVariables(content);
  const hasVars = variables.length > 0;

  if (!component && !isNew) {
    return <div className="empty-state">{t.components.selectComponent}</div>;
  }

  return (
    <>
      <div className="editor-header">
        {isEditing ? (
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="title-input"
            placeholder={t.components.componentNamePlaceholder}
            autoFocus={isNew}
          />
        ) : (
          <div className="component-header-title">
            <span
              className="component-type-badge"
              style={{ backgroundColor: getTypeColor(component?.type || 'other') }}
            >
              {getTypeLabel(component?.type || 'other')}
            </span>
            <span className="prompt-title">{component?.name}</span>
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

      {/* Type selector (only when editing) */}
      {isEditing && (
        <div className="component-type-selector">
          {componentTypes.map((t) => (
            <button
              key={t.id}
              className={`component-type-option ${type === t.id ? 'active' : ''}`}
              style={{ '--type-color': t.color } as React.CSSProperties}
              onClick={() => setType(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}

      {/* Variables info */}
      {hasVars && (
        <div className="component-variables-info">
          <Variable size={14} />
          <span>Variables: </span>
          {variables.map((v, i) => (
            <span key={v} className="component-variable-tag">
              {`{{${v}}}`}
              {i < variables.length - 1 ? ', ' : ''}
            </span>
          ))}
        </div>
      )}

      {isEditing && (
        <div className="component-variables-hint">
          <Variable size={12} />
          <span>{t.components.variableTip}</span>
        </div>
      )}

      <div className="editor-body">
        {isEditing ? (
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="content-textarea"
            placeholder={t.components.componentContentPlaceholder}
          />
        ) : (
          <div className="content-view">
            <div className="content-text">{component?.content}</div>
            <button onClick={handleCopy} className="copy-btn">
              <Copy size={14} /> {t.prompts.copyToClipboard}
            </button>
          </div>
        )}
      </div>
    </>
  );
}