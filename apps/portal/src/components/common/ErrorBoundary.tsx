import { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error in child component:", error, errorInfo);
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            padding: "var(--spacing-8)",
            margin: "var(--spacing-4) auto",
            maxWidth: "700px",
            backgroundColor: "var(--surface-container-lowest)",
            borderRadius: "var(--radius-lg)",
            border: "1px solid var(--error-container)",
            boxShadow: "var(--shadow-md)",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: "36px", marginBottom: "12px" }}>⚠️</div>
          <h3
            style={{
              fontSize: "18px",
              fontWeight: 700,
              color: "var(--on-surface)",
              marginBottom: "8px",
            }}
          >
            {this.props.fallbackTitle || "Something went wrong in this section"}
          </h3>
          <p
            style={{
              fontSize: "14px",
              color: "var(--on-surface-variant)",
              marginBottom: "var(--spacing-4)",
            }}
          >
            The club admin panel caught an unexpected error. Your admin session is still active.
          </p>
          {this.state.error && (
            <pre
              style={{
                backgroundColor: "var(--surface-container-low)",
                padding: "10px 14px",
                borderRadius: "var(--radius-sm)",
                fontSize: "12px",
                color: "var(--error)",
                textAlign: "left",
                overflowX: "auto",
                marginBottom: "var(--spacing-4)",
              }}
            >
              {this.state.error.message || String(this.state.error)}
            </pre>
          )}
          <div style={{ display: "flex", justifyContent: "center", gap: "10px" }}>
            <button
              type="button"
              onClick={this.handleRetry}
              style={{
                backgroundColor: "var(--primary)",
                color: "#ffffff",
                padding: "8px 18px",
                borderRadius: "var(--radius-md)",
                fontWeight: 600,
                fontSize: "13px",
              }}
            >
              Try Reloading Section
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
