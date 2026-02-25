/**
 * Copyright (c) 2026 Ender De Freitas. All Rights Reserved.
 * Non-Commercial Use Only.
 */

import React, { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';

interface VariableFillerProps {
  componentName: string;
  content: string;
  onConfirm: (filledContent: string) => void;
  onCancel: () => void;
}

// Extract variable names from content (e.g., {{language}} -> "language")
export function extractVariables(content: string): string[] {
  const regex = /\{\{([^}]+)\}\}/g;
  const variables: string[] = [];
  let match;

  while ((match = regex.exec(content)) !== null) {
    const varName = match[1].trim();
    if (!variables.includes(varName)) {
      variables.push(varName);
    }
  }

  return variables;
}

// Check if content has any variables
export function hasVariables(content: string): boolean {
  return /\{\{([^}]+)\}\}/.test(content);
}

// Replace variables in content with values
export function fillVariables(content: string, values: Record<string, string>): string {
  return content.replace(/\{\{([^}]+)\}\}/g, (match, varName) => {
    const trimmedName = varName.trim();
    return values[trimmedName] !== undefined ? values[trimmedName] : match;
  });
}

export function VariableFiller({
  componentName,
  content,
  onConfirm,
  onCancel,
}: VariableFillerProps) {
  const variables = extractVariables(content);
  const [values, setValues] = useState<Record<string, string>>({});
  const [preview, setPreview] = useState(content);

  // Initialize empty values for all variables
  useEffect(() => {
    const initialValues: Record<string, string> = {};
    variables.forEach((v) => {
      initialValues[v] = '';
    });
    setValues(initialValues);
  }, [content]);

  // Update preview when values change
  useEffect(() => {
    setPreview(fillVariables(content, values));
  }, [content, values]);

  const handleValueChange = (varName: string, value: string) => {
    setValues((prev) => ({ ...prev, [varName]: value }));
  };

  const handleConfirm = () => {
    onConfirm(fillVariables(content, values));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      handleConfirm();
    } else if (e.key === 'Escape') {
      onCancel();
    }
  };

  const allFilled = variables.every((v) => values[v]?.trim());

  return (
    <div className="variable-filler-overlay" onClick={onCancel}>
      <div
        className="variable-filler"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        <div className="variable-filler-header">
          <span className="variable-filler-title">Fill Variables: {componentName}</span>
          <button className="variable-filler-close" onClick={onCancel}>
            <X size={16} />
          </button>
        </div>

        <div className="variable-filler-body">
          {/* Variable inputs */}
          <div className="variable-filler-inputs">
            <div className="variable-filler-section-title">Variables</div>
            {variables.map((varName) => (
              <div key={varName} className="variable-input-group">
                <label className="variable-label">{varName}</label>
                <input
                  className="variable-input"
                  value={values[varName] || ''}
                  onChange={(e) => handleValueChange(varName, e.target.value)}
                  placeholder={`Enter ${varName}...`}
                  autoFocus={variables.indexOf(varName) === 0}
                />
              </div>
            ))}
          </div>

          {/* Preview */}
          <div className="variable-filler-preview">
            <div className="variable-filler-section-title">Preview</div>
            <div className="variable-preview-content">{preview}</div>
          </div>
        </div>

        <div className="variable-filler-footer">
          <span className="variable-filler-hint">Ctrl+Enter to confirm</span>
          <div className="variable-filler-actions">
            <button className="variable-filler-btn cancel" onClick={onCancel}>
              Cancel
            </button>
            <button
              className="variable-filler-btn confirm"
              onClick={handleConfirm}
              disabled={!allFilled}
            >
              <Check size={14} />
              Insert
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
