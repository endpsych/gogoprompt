/**
 * Copyright (c) 2026 Ender De Freitas. All Rights Reserved.
 * Non-Commercial Use Only.
 */

import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface UnsavedChangesDialogProps {
  onSave: () => void;
  onDiscard: () => void;
  onCancel: () => void;
}

export function UnsavedChangesDialog({
  onSave,
  onDiscard,
  onCancel,
}: UnsavedChangesDialogProps) {
  return (
    <div className="unsaved-dialog-overlay" onClick={onCancel}>
      <div className="unsaved-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="unsaved-dialog-icon">
          <AlertTriangle size={32} />
        </div>
        <h3 className="unsaved-dialog-title">Unsaved Changes</h3>
        <p className="unsaved-dialog-message">
          You have unsaved changes. What would you like to do?
        </p>
        <div className="unsaved-dialog-actions">
          <button className="unsaved-dialog-btn discard" onClick={onDiscard}>
            Discard
          </button>
          <button className="unsaved-dialog-btn cancel" onClick={onCancel}>
            Cancel
          </button>
          <button className="unsaved-dialog-btn save" onClick={onSave}>
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
