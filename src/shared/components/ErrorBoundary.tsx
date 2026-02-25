/**
 * Copyright (c) 2026 Ender De Freitas. All Rights Reserved.
 * Non-Commercial Use Only.
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Copy, ChevronDown, ChevronUp } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  level?: 'app' | 'section' | 'component';
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  showDetails: boolean;
  copied: boolean;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
      copied: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ errorInfo });
    
    // Log error for debugging
    console.error('ErrorBoundary caught an error:', error);
    console.error('Component stack:', errorInfo.componentStack);
    
    // Call optional error handler
    this.props.onError?.(error, errorInfo);
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
    });
  };

  handleCopyError = async (): Promise<void> => {
    const { error, errorInfo } = this.state;
    const errorText = `Error: ${error?.message}\n\nStack: ${error?.stack}\n\nComponent Stack: ${errorInfo?.componentStack}`;
    
    try {
      await navigator.clipboard.writeText(errorText);
      this.setState({ copied: true });
      setTimeout(() => this.setState({ copied: false }), 2000);
    } catch (err) {
      console.error('Failed to copy error:', err);
    }
  };

  toggleDetails = (): void => {
    this.setState(prev => ({ showDetails: !prev.showDetails }));
  };

  render(): ReactNode {
    const { hasError, error, errorInfo, showDetails, copied } = this.state;
    const { children, fallback, level = 'component' } = this.props;

    if (hasError) {
      // Use custom fallback if provided
      if (fallback) {
        return fallback;
      }

      // App-level error (full page)
      if (level === 'app') {
        return (
          <div className="error-boundary error-boundary-app">
            <div className="error-boundary-content">
              <div className="error-boundary-icon">
                <AlertTriangle size={48} />
              </div>
              <h1 className="error-boundary-title">Something went wrong</h1>
              <p className="error-boundary-message">
                The application encountered an unexpected error. Your data is safe.
              </p>
              
              <div className="error-boundary-actions">
                <button className="error-boundary-btn primary" onClick={this.handleReset}>
                  <RefreshCw size={16} />
                  Try Again
                </button>
                <button className="error-boundary-btn secondary" onClick={() => window.location.reload()}>
                  Reload App
                </button>
              </div>

              <div className="error-boundary-details-toggle">
                <button className="error-boundary-toggle-btn" onClick={this.toggleDetails}>
                  {showDetails ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  {showDetails ? 'Hide' : 'Show'} Error Details
                </button>
              </div>

              {showDetails && (
                <div className="error-boundary-details">
                  <div className="error-boundary-details-header">
                    <span>Error Details</span>
                    <button 
                      className="error-boundary-copy-btn"
                      onClick={this.handleCopyError}
                      title="Copy error details"
                    >
                      <Copy size={14} />
                      {copied ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                  <div className="error-boundary-error-name">
                    {error?.name}: {error?.message}
                  </div>
                  {error?.stack && (
                    <pre className="error-boundary-stack">{error.stack}</pre>
                  )}
                  {errorInfo?.componentStack && (
                    <>
                      <div className="error-boundary-component-stack-label">Component Stack:</div>
                      <pre className="error-boundary-stack">{errorInfo.componentStack}</pre>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      }

      // Section-level error (partial page)
      if (level === 'section') {
        return (
          <div className="error-boundary error-boundary-section">
            <div className="error-boundary-icon">
              <AlertTriangle size={32} />
            </div>
            <h3 className="error-boundary-title">This section encountered an error</h3>
            <p className="error-boundary-message">
              {error?.message || 'An unexpected error occurred'}
            </p>
            <div className="error-boundary-actions">
              <button className="error-boundary-btn primary" onClick={this.handleReset}>
                <RefreshCw size={14} />
                Retry
              </button>
            </div>
          </div>
        );
      }

      // Component-level error (inline)
      return (
        <div className="error-boundary error-boundary-component">
          <AlertTriangle size={16} />
          <span>Error loading component</span>
          <button className="error-boundary-retry-inline" onClick={this.handleReset}>
            Retry
          </button>
        </div>
      );
    }

    return children;
  }
}

// HOC for wrapping components with error boundary
export function withErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  level: 'app' | 'section' | 'component' = 'component'
): React.FC<P> {
  const WithErrorBoundary: React.FC<P> = (props) => (
    <ErrorBoundary level={level}>
      <WrappedComponent {...props} />
    </ErrorBoundary>
  );
  
  WithErrorBoundary.displayName = `WithErrorBoundary(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`;
  
  return WithErrorBoundary;
}

// Specific error boundaries for different parts of the app
export function AppErrorBoundary({ children }: { children: ReactNode }): JSX.Element {
  return (
    <ErrorBoundary 
      level="app"
      onError={(error, errorInfo) => {
        // Could send to error reporting service here
        console.error('App-level error:', error, errorInfo);
      }}
    >
      {children}
    </ErrorBoundary>
  );
}

export function SidebarErrorBoundary({ children }: { children: ReactNode }): JSX.Element {
  return (
    <ErrorBoundary level="section">
      {children}
    </ErrorBoundary>
  );
}

export function EditorErrorBoundary({ children }: { children: ReactNode }): JSX.Element {
  return (
    <ErrorBoundary level="section">
      {children}
    </ErrorBoundary>
  );
}

export function ModalErrorBoundary({ children }: { children: ReactNode }): JSX.Element {
  return (
    <ErrorBoundary level="section">
      {children}
    </ErrorBoundary>
  );
}
