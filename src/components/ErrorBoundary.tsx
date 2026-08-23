import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallbackTitle?: string;
  fallbackDescription?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary] Uncaught Application Error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      const title = this.props.fallbackTitle || 'Something Went Wrong';
      const description =
        this.props.fallbackDescription ||
        'An Unexpected Error Occurred While Rendering This Section.';
      const errorMessage = this.state.error?.message || 'Unknown Application Error';

      return (
        <div className="flex min-h-[360px] w-full flex-col items-center justify-center p-4">
          <div className="card w-full max-w-lg border-red-500/30 bg-red-500/10 p-5 text-center">
            <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-red-500/20 text-red-400">
              <AlertTriangle size={20} />
            </div>
            <h2 className="mb-1 text-title font-semibold text-red-400">{title}</h2>
            <p className="mb-3 text-xs text-brand-text-muted">{description}</p>
            <div className="mb-4 rounded-md border border-red-500/20 bg-brand-bg/80 p-2.5 text-left">
              <p className="font-mono text-xs text-red-300 break-words">{errorMessage}</p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                onClick={this.handleReset}
                className="btn-secondary btn-sm"
              >
                Try Again
              </button>
              <button
                type="button"
                onClick={this.handleReload}
                className="btn-primary btn-sm"
              >
                <RefreshCw size={12} />
                Reload Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
