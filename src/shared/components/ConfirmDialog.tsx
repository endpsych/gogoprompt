/**
 * Copyright (c) 2026 Ender De Freitas. All Rights Reserved.
 * Non-Commercial Use Only.
 */

import React, { useEffect, useRef } from 'react';
import { AlertTriangle, Trash2 } from 'lucide-react';

export interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info';
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  variant = 'danger',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const confirmButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isOpen) {
      // Focus the cancel button by default for safety
      confirmButtonRef.current?.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      
      if (e.key === 'Escape') {
        onCancel();
      } else if (e.key === 'Enter') {
        // Only confirm on Enter if explicitly focused on confirm button
        if (document.activeElement === confirmButtonRef.current) {
          onConfirm();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onConfirm, onCancel]);

  if (!isOpen) return null;

  const iconMap = {
    danger: <Trash2 size={24} />,
    warning: <AlertTriangle size={24} />,
    info: <AlertTriangle size={24} />,
  };

  return (
    <div className="confirm-dialog-overlay" onClick={onCancel}>
      <div 
        className={`confirm-dialog confirm-dialog-${variant}`} 
        onClick={(e) => e.stopPropagation()}
        role="alertdialog"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-message"
      >
        <div className={`confirm-dialog-icon confirm-dialog-icon-${variant}`}>
          {iconMap[variant]}
        </div>
        
        <h3 id="confirm-dialog-title" className="confirm-dialog-title">
          {title}
        </h3>
        
        <p id="confirm-dialog-message" className="confirm-dialog-message">
          {message}
        </p>
        
        <div className="confirm-dialog-actions">
          <button 
            className="confirm-dialog-btn confirm-dialog-btn-cancel"
            onClick={onCancel}
          >
            {cancelLabel}
          </button>
          <button 
            ref={confirmButtonRef}
            className={`confirm-dialog-btn confirm-dialog-btn-${variant}`}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// Hook for easier usage
interface UseConfirmOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info';
}

interface UseConfirmReturn {
  confirm: (options?: Partial<UseConfirmOptions>) => Promise<boolean>;
  ConfirmDialogComponent: React.FC;
}

export function useConfirm(defaultOptions: UseConfirmOptions): UseConfirmReturn {
  const [isOpen, setIsOpen] = React.useState(false);
  const [options, setOptions] = React.useState(defaultOptions);
  const resolveRef = useRef<(value: boolean) => void>();

  const confirm = React.useCallback((overrideOptions?: Partial<UseConfirmOptions>): Promise<boolean> => {
    setOptions({ ...defaultOptions, ...overrideOptions });
    setIsOpen(true);
    
    return new Promise((resolve) => {
      resolveRef.current = resolve;
    });
  }, [defaultOptions]);

  const handleConfirm = React.useCallback(() => {
    setIsOpen(false);
    resolveRef.current?.(true);
  }, []);

  const handleCancel = React.useCallback(() => {
    setIsOpen(false);
    resolveRef.current?.(false);
  }, []);

  const ConfirmDialogComponent: React.FC = React.useCallback(() => (
    <ConfirmDialog
      isOpen={isOpen}
      title={options.title}
      message={options.message}
      confirmLabel={options.confirmLabel}
      cancelLabel={options.cancelLabel}
      variant={options.variant}
      onConfirm={handleConfirm}
      onCancel={handleCancel}
    />
  ), [isOpen, options, handleConfirm, handleCancel]);

  return { confirm, ConfirmDialogComponent };
}
