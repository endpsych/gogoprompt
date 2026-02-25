/**
 * Copyright (c) 2026 Ender De Freitas. All Rights Reserved.
 * Non-Commercial Use Only.
 */

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { Check, X, AlertTriangle, Info } from 'lucide-react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastData {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    return { showToast: () => {} };
  }
  return context;
}

interface ToastProviderProps {
  children: React.ReactNode;
}

// Internal component for consistent styling
const ToastItem = ({ message, type, onClose }: { message: string, type: ToastType, onClose?: () => void }) => {
    // Styling Logic
    let backgroundColor = '#052e16'; // Green-950
    let borderColor = '#059669';     // Green-600
    let iconColor = '#10b981';       // Green-500
    let textColor = '#f0fdf4';       // Green-50
    let Icon = Check;

    if (type === 'warning') {
        backgroundColor = '#422006'; // Yellow/Brown-950
        borderColor = '#eab308';     // Yellow-500
        iconColor = '#eab308';       // Yellow-500
        textColor = '#fefce8';       // Yellow-50
        Icon = AlertTriangle;
    } else if (type === 'error') {
        backgroundColor = '#450a0a'; // Red-950
        borderColor = '#ef4444';     // Red-500
        iconColor = '#ef4444';       // Red-500
        textColor = '#fef2f2';       // Red-50
        Icon = X;
    } else if (type === 'info') {
        backgroundColor = '#172554'; // Blue-950
        borderColor = '#3b82f6';     // Blue-500
        iconColor = '#3b82f6';       // Blue-500
        textColor = '#eff6ff';       // Blue-50
        Icon = Info;
    }

    return (
        <div 
            onClick={onClose}
            style={{
                backgroundColor: backgroundColor,
                color: textColor,
                padding: '12px 16px',
                borderRadius: '8px',
                border: `1px solid ${borderColor}`,
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                minWidth: '300px',
                maxWidth: '400px',
                cursor: 'pointer',
                marginBottom: '8px',
                pointerEvents: 'auto',
                fontSize: '14px',
                fontWeight: 500,
            }}
        >
            <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0
            }}>
                <Icon size={18} color={iconColor} />
            </div>
            <span style={{ lineHeight: '1.4' }}>{message}</span>
        </div>
    );
};

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'success') => {
    const id = crypto.randomUUID();
    const toast: ToastData = { id, message, type };

    setToasts((prev) => [...prev, toast]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div style={{
          position: 'fixed', bottom: '20px', left: '50%', transform: 'translateX(-50%)',
          zIndex: 10000, display: 'flex', flexDirection: 'column', alignItems: 'center',
          pointerEvents: 'none'
      }}>
        {toasts.map((toast) => (
            <ToastItem 
                key={toast.id} 
                message={toast.message} 
                type={toast.type} 
                onClose={() => removeToast(toast.id)} 
            />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

// --- Standalone Toast Component (For App.tsx usage via Zustand) ---
interface ToastProps {
  message: string;
  type?: ToastType;
  variant?: ToastType; // Alias for type to match App.tsx usage
  onClose?: () => void;
}

export function Toast({ message, type, variant, onClose }: ToastProps) {
  // Use variant if type isn't provided (adapter for App.tsx)
  const finalType = variant || type || 'success';

  useEffect(() => {
      const timer = setTimeout(() => {
          if (onClose) onClose();
      }, 3000);
      return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div style={{
        position: 'fixed', bottom: '20px', left: '50%', transform: 'translateX(-50%)',
        zIndex: 10000, pointerEvents: 'auto'
    }}>
        <ToastItem message={message} type={finalType} onClose={onClose} />
    </div>
  );
}