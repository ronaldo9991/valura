import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class AppErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (typeof window !== "undefined") {
      console.error("[AppErrorBoundary] uncaught error", error, info);
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (!this.state.hasError) return this.props.children;
    if (this.props.fallback) return this.props.fallback;

    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-6 text-center">
        <div className="max-w-lg space-y-3">
          <h1 className="font-serif text-3xl text-foreground">Something went wrong</h1>
          <p className="text-sm text-muted-foreground">
            {this.state.error?.message ?? "An unexpected error occurred."}
          </p>
          <div className="flex justify-center gap-3 pt-2">
            <button
              onClick={this.handleReset}
              className="rounded border border-foreground/20 bg-foreground/5 px-4 py-2 text-sm hover:bg-foreground/10"
            >
              Try again
            </button>
            <button
              onClick={() => window.location.reload()}
              className="rounded border border-foreground/20 bg-foreground/5 px-4 py-2 text-sm hover:bg-foreground/10"
            >
              Reload
            </button>
          </div>
        </div>
      </div>
    );
  }
}
