/**
 * Copyright (c) 2026 Ender De Freitas. All Rights Reserved.
 * Non-Commercial Use Only.
 */

import React, { useState } from 'react';
import { X, RotateCcw, Highlighter, ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { HighlightSettings as HighlightSettingsType, HighlightStyle } from '@/shared/utils/highlighting';
import { ComponentTypeConfig } from '@/types';

interface HighlightSettingsProps {
  settings: HighlightSettingsType;
  componentTypes: ComponentTypeConfig[];
  onUpdateComponentStyle: (style: Partial<HighlightStyle>) => void;
  onUpdateVariableStyle: (style: Partial<HighlightStyle>) => void;
  onUpdateVariableColor: (color: string) => void;
  onToggleEnabled: () => void;
  onReset: () => void;
  onAddComponentType: (label: string, color: string) => void;
  onUpdateComponentType: (id: string, updates: Partial<Omit<ComponentTypeConfig, 'id'>>) => void;
  onDeleteComponentType: (id: string) => void;
  onResetComponentTypes: () => void;
  onClose: () => void;
  onBack?: () => void;
}

const PRESET_COLORS = [
  '#ef4444', // red
  '#f59e0b', // amber
  '#10b981', // green
  '#3b82f6', // blue
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#6b7280', // gray
  '#ffffff', // white
];

function StyleEditor({
  label,
  style,
  onChange,
  previewColor,
}: {
  label: string;
  style: HighlightStyle;
  onChange: (style: Partial<HighlightStyle>) => void;
  previewColor: string;
}) {
  return (
    <div className="highlight-style-editor">
      <div className="highlight-style-header">
        <span className="highlight-style-label">{label}</span>
        <div className="highlight-style-preview">
          <span
            style={{
              fontWeight: style.bold ? 'bold' : 'normal',
              fontStyle: style.italic ? 'italic' : 'normal',
              textDecoration: style.underline ? 'underline' : 'none',
              textTransform: style.uppercase ? 'uppercase' : 'none',
              color: previewColor,
            }}
          >
            Preview
          </span>
        </div>
      </div>

      <div className="highlight-style-options">
        <label className="highlight-option">
          <input
            type="checkbox"
            checked={style.bold}
            onChange={(e) => onChange({ bold: e.target.checked })}
          />
          <span className="highlight-option-label" style={{ fontWeight: 'bold' }}>
            Bold
          </span>
        </label>

        <label className="highlight-option">
          <input
            type="checkbox"
            checked={style.italic}
            onChange={(e) => onChange({ italic: e.target.checked })}
          />
          <span className="highlight-option-label" style={{ fontStyle: 'italic' }}>
            Italic
          </span>
        </label>

        <label className="highlight-option">
          <input
            type="checkbox"
            checked={style.underline}
            onChange={(e) => onChange({ underline: e.target.checked })}
          />
          <span className="highlight-option-label" style={{ textDecoration: 'underline' }}>
            Underline
          </span>
        </label>

        <label className="highlight-option">
          <input
            type="checkbox"
            checked={style.uppercase}
            onChange={(e) => onChange({ uppercase: e.target.checked })}
          />
          <span className="highlight-option-label" style={{ textTransform: 'uppercase', fontSize: '11px' }}>
            Caps
          </span>
        </label>
      </div>
    </div>
  );
}

function ColorPicker({
  label,
  color,
  onChange,
}: {
  label: string;
  color: string;
  onChange: (color: string) => void;
}) {
  return (
    <div className="highlight-color-picker">
      <span className="highlight-color-label">{label}</span>
      <div className="highlight-color-options">
        {PRESET_COLORS.map((c) => (
          <button
            key={c}
            className={`highlight-color-btn ${color === c ? 'active' : ''}`}
            style={{ backgroundColor: c }}
            onClick={() => onChange(c)}
            title={c}
          />
        ))}
        <input
          type="color"
          value={color}
          onChange={(e) => onChange(e.target.value)}
          className="highlight-color-custom"
          title="Custom color"
        />
      </div>
    </div>
  );
}

export function HighlightSettingsPanel({
  settings,
  componentTypes,
  onUpdateComponentStyle,
  onUpdateVariableStyle,
  onUpdateVariableColor,
  onToggleEnabled,
  onReset,
  onAddComponentType,
  onUpdateComponentType,
  onDeleteComponentType,
  onResetComponentTypes,
  onClose,
  onBack,
}: HighlightSettingsProps) {
  const [newTypeName, setNewTypeName] = useState('');
  const [newTypeColor, setNewTypeColor] = useState('#6b7280');

  const handleAddType = () => {
    if (newTypeName.trim()) {
      onAddComponentType(newTypeName.trim(), newTypeColor);
      setNewTypeName('');
      setNewTypeColor('#6b7280');
    }
  };

  return (
    <div className="highlight-settings-overlay" onClick={onClose}>
      <div className="highlight-settings-panel" onClick={(e) => e.stopPropagation()}>
        <div className="highlight-settings-header">
          {onBack && (
            <button className="settings-back-btn" onClick={onBack}>
              <ArrowLeft size={18} />
            </button>
          )}
          <div className="highlight-settings-title">
            <Highlighter size={18} />
            <span>Syntax Highlighting</span>
          </div>
          <div className="highlight-settings-header-actions">
            <button className="highlight-reset-btn" onClick={() => { onReset(); onResetComponentTypes(); }}>
              <RotateCcw size={14} />
              Reset
            </button>
            <button className="highlight-settings-close" onClick={onClose}>
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="highlight-settings-content">
          {/* Enable toggle */}
          <div className="highlight-enable-toggle">
            <label className="highlight-toggle-label">
              <span>Enable syntax highlighting</span>
              <div
                className={`highlight-toggle ${settings.enabled ? 'active' : ''}`}
                onClick={onToggleEnabled}
              >
                <div className="highlight-toggle-knob" />
              </div>
            </label>
            <p className="highlight-toggle-description">
              Highlight component names and variables in prompts
            </p>
          </div>

          {settings.enabled && (
            <>
              {/* Component Types Section */}
              <div className="highlight-section">
                <div className="highlight-section-title">Component Types</div>
                <p className="highlight-section-description">
                  Colors are based on component type. Edit colors or add new types.
                </p>
                
                <div className="component-types-list">
                  {componentTypes.map((type) => (
                    <div key={type.id} className="component-type-row">
                      <input
                        type="color"
                        value={type.color}
                        onChange={(e) => onUpdateComponentType(type.id, { color: e.target.value })}
                        className="component-type-color"
                      />
                      <input
                        type="text"
                        value={type.label}
                        onChange={(e) => onUpdateComponentType(type.id, { label: e.target.value })}
                        className="component-type-label-input"
                      />
                      {type.id !== 'other' && componentTypes.length > 1 && (
                        <button
                          className="component-type-delete"
                          onClick={() => onDeleteComponentType(type.id)}
                          title="Delete type"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {/* Add new type */}
                <div className="component-type-add">
                  <input
                    type="color"
                    value={newTypeColor}
                    onChange={(e) => setNewTypeColor(e.target.value)}
                    className="component-type-color"
                  />
                  <input
                    type="text"
                    value={newTypeName}
                    onChange={(e) => setNewTypeName(e.target.value)}
                    placeholder="New type name..."
                    className="component-type-label-input"
                    onKeyDown={(e) => e.key === 'Enter' && handleAddType()}
                  />
                  <button
                    className="component-type-add-btn"
                    onClick={handleAddType}
                    disabled={!newTypeName.trim()}
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>

              {/* Component style */}
              <StyleEditor
                label="Component Text Style"
                style={settings.componentStyle}
                onChange={onUpdateComponentStyle}
                previewColor={componentTypes[0]?.color || '#3b82f6'}
              />

              {/* Variable style */}
              <div className="highlight-style-editor">
                <StyleEditor
                  label="Variables {{...}}"
                  style={settings.variableStyle}
                  onChange={onUpdateVariableStyle}
                  previewColor={settings.variableColor}
                />
                <ColorPicker
                  label="Variable Color:"
                  color={settings.variableColor}
                  onChange={onUpdateVariableColor}
                />
              </div>
            </>
          )}
        </div>

        <div className="highlight-settings-footer">
          <span className="highlight-settings-hint">
            Components are matched as whole words (case-insensitive)
          </span>
        </div>
      </div>
    </div>
  );
}
