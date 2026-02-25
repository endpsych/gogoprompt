/**
 * Copyright (c) 2026 Ender De Freitas. All Rights Reserved.
 * Non-Commercial Use Only.
 */

import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: number;
  className?: string;
}

export function LoadingSpinner({ size = 20, className = '' }: LoadingSpinnerProps) {
  return (
    <Loader2 
      size={size} 
      className={`loading-spinner ${className}`}
    />
  );
}

interface LoadingOverlayProps {
  message?: string;
  transparent?: boolean;
}

export function LoadingOverlay({ message = 'Loading...', transparent = false }: LoadingOverlayProps) {
  return (
    <div className={`loading-overlay ${transparent ? 'transparent' : ''}`}>
      <div className="loading-content">
        <LoadingSpinner size={32} />
        <span className="loading-message">{message}</span>
      </div>
    </div>
  );
}

interface LoadingButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  loadingText?: string;
  children: React.ReactNode;
}

export function LoadingButton({ 
  loading = false, 
  loadingText,
  children, 
  disabled,
  className = '',
  ...props 
}: LoadingButtonProps) {
  return (
    <button 
      {...props}
      disabled={disabled || loading}
      className={`${className} ${loading ? 'loading' : ''}`}
    >
      {loading ? (
        <>
          <LoadingSpinner size={14} />
          {loadingText || children}
        </>
      ) : (
        children
      )}
    </button>
  );
}

interface LoadingStateProps {
  loading: boolean;
  error?: string | null;
  children: React.ReactNode;
  loadingMessage?: string;
  onRetry?: () => void;
}

export function LoadingState({ 
  loading, 
  error, 
  children, 
  loadingMessage = 'Loading...',
  onRetry 
}: LoadingStateProps) {
  if (loading) {
    return (
      <div className="loading-state">
        <LoadingSpinner size={24} />
        <span>{loadingMessage}</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="loading-state error">
        <span className="error-message">{error}</span>
        {onRetry && (
          <button className="retry-btn" onClick={onRetry}>
            Try Again
          </button>
        )}
      </div>
    );
  }

  return <>{children}</>;
}
