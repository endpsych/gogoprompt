/**
 * Copyright (c) 2026 Ender De Freitas. All Rights Reserved.
 * Non-Commercial Use Only.
 */

import React, { useState } from 'react';
import { X, Plus, Variable } from 'lucide-react';
import {
  PromptComponent,
  ComponentType,
  COMPONENT_TYPE_COLORS,
  COMPONENT_TYPE_LABELS,
} from '@/types';
import { VariableFiller, hasVariables } from '@/features/variables/components/VariableFiller';

interface ComponentPickerProps {
  components: PromptComponent[];
  onInsert: (content: string) => void;
  onClose: () => void;
}

export function ComponentPicker({ components, onInsert, onClose }: ComponentPickerProps) {
  const [typeFilter, setTypeFilter] = useState<ComponentType | null>(null);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [fillingComponent, setFillingComponent] = useState<PromptComponent | null>(null);

  const types: ComponentType[] = ['persona', 'format', 'constraint', 'context', 'other'];

  const filteredComponents = typeFilter
    ? components.filter((c) => c.type === typeFilter)
    : components;

  const previewComponent = previewId
    ? components.find((c) => c.id === previewId)
    : null;

  const handleSelectComponent = (component: PromptComponent) => {
    if (hasVariables(component.content)) {
      // Show variable filler modal
      setFillingComponent(component);
    } else {
      // Insert directly
      onInsert(component.content);
      onClose();
    }
  };

  const handleVariableFillConfirm = (filledContent: string) => {
    onInsert(filledContent);
    setFillingComponent(null);
    onClose();
  };

  const handleVariableFillCancel = () => {
    setFillingComponent(null);
  };

  // If filling variables, show that modal instead
  if (fillingComponent) {
    return (
      <VariableFiller
        componentName={fillingComponent.name}
        content={fillingComponent.content}
        onConfirm={handleVariableFillConfirm}
        onCancel={handleVariableFillCancel}
      />
    );
  }

  return (
    <div className="component-picker-overlay" onClick={onClose}>
      <div className="component-picker" onClick={(e) => e.stopPropagation()}>
        <div className="component-picker-header">
          <span className="component-picker-title">Insert Component</span>
          <button className="component-picker-close" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        {/* Type filter */}
        <div className="component-picker-filter">
          <button
            className={`component-type-btn ${typeFilter === null ? 'active' : ''}`}
            onClick={() => setTypeFilter(null)}
          >
            All
          </button>
          {types.map((type) => (
            <button
              key={type}
              className={`component-type-btn ${typeFilter === type ? 'active' : ''}`}
              style={{ '--type-color': COMPONENT_TYPE_COLORS[type] } as React.CSSProperties}
              onClick={() => setTypeFilter(typeFilter === type ? null : type)}
            >
              {COMPONENT_TYPE_LABELS[type]}
            </button>
          ))}
        </div>

        <div className="component-picker-body">
          {/* Component list */}
          <div className="component-picker-list">
            {filteredComponents.map((c) => {
              const hasVars = hasVariables(c.content);
              return (
                <div
                  key={c.id}
                  className={`component-picker-item ${previewId === c.id ? 'selected' : ''}`}
                  onMouseEnter={() => setPreviewId(c.id)}
                  onClick={() => handleSelectComponent(c)}
                >
                  <span
                    className="component-type-dot"
                    style={{ backgroundColor: COMPONENT_TYPE_COLORS[c.type] }}
                  />
                  <span className="component-picker-item-name">{c.name}</span>
                  {hasVars && (
                    <span className="component-has-variables" title="Has variables">
                      <Variable size={12} />
                    </span>
                  )}
                  <Plus size={14} className="component-picker-item-add" />
                </div>
              );
            })}
            {filteredComponents.length === 0 && (
              <div className="component-picker-empty">
                {typeFilter
                  ? `No ${COMPONENT_TYPE_LABELS[typeFilter]} components`
                  : 'No components yet. Create some in the Components tab.'}
              </div>
            )}
          </div>

          {/* Preview */}
          <div className="component-picker-preview">
            {previewComponent ? (
              <>
                <div className="component-picker-preview-header">
                  <span
                    className="component-type-badge"
                    style={{ backgroundColor: COMPONENT_TYPE_COLORS[previewComponent.type] }}
                  >
                    {COMPONENT_TYPE_LABELS[previewComponent.type]}
                  </span>
                  <span className="component-picker-preview-name">
                    {previewComponent.name}
                  </span>
                </div>
                {hasVariables(previewComponent.content) && (
                  <div className="component-preview-variables-hint">
                    <Variable size={12} />
                    <span>Contains variables — you'll fill them in when inserting</span>
                  </div>
                )}
                <div className="component-picker-preview-content">
                  {previewComponent.content}
                </div>
              </>
            ) : (
              <div className="component-picker-preview-empty">
                Hover over a component to preview
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
