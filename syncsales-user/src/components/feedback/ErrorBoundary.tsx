import { Component, type ReactNode } from "react";
import { AlertTriangle, RefreshCcw, Home } from "lucide-react";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("[ErrorBoundary]", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-center px-6">
          <div className="w-16 h-16 rounded-2xl bg-error/10 flex items-center justify-center mb-5">
            <AlertTriangle size={28} className="text-error" />
          </div>
          <h2 className="text-lg font-bold text-foreground mb-1">Something went wrong</h2>
          <p className="text-xs text-foreground-muted max-w-sm mb-2">
            An unexpected error occurred. You can try refreshing the page or going back to the dashboard.
          </p>
          {this.state.error && import.meta.env.DEV && (
            <details className="mb-4 max-w-md text-left">
              <summary className="text-[10px] text-foreground-muted cursor-pointer hover:text-foreground-muted">
                Error details (dev only)
              </summary>
              <pre className="mt-1 text-[10px] text-error bg-error/10 rounded-lg p-3 overflow-x-auto font-mono whitespace-pre-wrap">
                {this.state.error.message}
              </pre>
            </details>
          )}
          <div className="flex gap-3">
            <button
              onClick={this.handleReset}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-lg border border-border text-foreground hover:bg-surface-elevated transition-colors"
            >
              <RefreshCcw size={13} />
              Try Again
            </button>
            <a
              href="/"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary-hover transition-colors"
            >
              <Home size={13} />
              Dashboard
            </a>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
