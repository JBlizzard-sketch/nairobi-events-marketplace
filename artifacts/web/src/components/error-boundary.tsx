import { Component, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleHome = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = "/";
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="min-h-screen w-full flex items-center justify-center bg-muted/20 px-4 font-sans">
          <div className="text-center max-w-md">
            <div className="mb-8 flex justify-center">
              <div className="bg-destructive/10 p-5 rounded-full">
                <AlertTriangle className="h-12 w-12 text-destructive" />
              </div>
            </div>
            <h1 className="text-2xl font-bold tracking-tight mb-3">Something went wrong</h1>
            <p className="text-muted-foreground mb-2 leading-relaxed">
              An unexpected error occurred. Your data is safe — this is a display issue only.
            </p>
            {this.state.error && (
              <p className="text-xs text-muted-foreground/70 font-mono bg-muted rounded-lg px-3 py-2 mb-8 text-left overflow-auto max-h-24">
                {this.state.error.message}
              </p>
            )}
            <div className="flex flex-col sm:flex-row gap-3 justify-center mb-8">
              <Button onClick={this.handleReload} className="gap-2 font-semibold">
                <RefreshCw className="h-4 w-4" />
                Reload Page
              </Button>
              <Button variant="outline" onClick={this.handleHome} className="gap-2">
                <Home className="h-4 w-4" />
                Go to Home
              </Button>
            </div>
            <div className="pt-6 border-t border-border">
              <div className="flex items-center justify-center gap-2">
                <div className="w-6 h-6 bg-primary rounded-md flex items-center justify-center text-primary-foreground font-black text-xs">N</div>
                <span className="text-sm font-medium text-muted-foreground">Nairobi Events Marketplace</span>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
