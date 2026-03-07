import { Component } from "react";
import type { ReactNode, ErrorInfo } from "react";

interface Props {
  children: ReactNode;
  /** Optional custom fallback UI. If omitted, the default "Something went wrong" UI is shown. */
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * AppErrorBoundary — catches unhandled runtime errors in the React tree
 * and shows a friendly fallback instead of a white blank page.
 *
 * Usage:
 *   <AppErrorBoundary>
 *     <App />
 *   </AppErrorBoundary>
 */
export class AppErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Log to console so it shows up in devtools / server logs
    console.error("[AppErrorBoundary] Uncaught error:", error, info.componentStack);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const msg = this.state.error?.message ?? "Unknown error";

      return (
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background: "linear-gradient(180deg, #062A45 0%, #030E1A 100%)",
            color: "#B8E4F7",
            fontFamily: "Nunito, DM Sans, system-ui, sans-serif",
            padding: "2rem",
            textAlign: "center",
          }}
        >
          {/* Pineapple + title */}
          <span
            style={{ fontSize: "4rem", marginBottom: "1rem" }}
            role="img"
            aria-label="pineapple"
          >
            🍍
          </span>
          <h1
            style={{
              fontFamily: '"Baloo 2", cursive',
              fontSize: "clamp(1.75rem, 5vw, 2.5rem)",
              fontWeight: 900,
              color: "#F4C542",
              marginBottom: "0.5rem",
              textShadow: "0 0 40px rgba(244,197,66,0.4)",
            }}
          >
            Something went wrong
          </h1>
          <p
            style={{
              fontSize: "1rem",
              color: "rgba(184,228,247,0.6)",
              maxWidth: 420,
              lineHeight: 1.6,
              marginBottom: "0.5rem",
            }}
          >
            A runtime error crashed the app. The team is already on it.
          </p>

          {/* Error detail — collapsible via details/summary */}
          {msg && (
            <details
              style={{
                marginBottom: "1.5rem",
                background: "rgba(6,42,69,0.7)",
                border: "1px solid rgba(74,174,217,0.2)",
                borderRadius: "0.75rem",
                padding: "0.75rem 1rem",
                maxWidth: 520,
                width: "100%",
                textAlign: "left",
                cursor: "pointer",
              }}
            >
              <summary
                style={{
                  color: "#4AAED9",
                  fontWeight: 600,
                  fontSize: "0.85rem",
                  userSelect: "none",
                  listStyle: "none",
                }}
              >
                ▸ Error details
              </summary>
              <pre
                style={{
                  marginTop: "0.5rem",
                  fontSize: "0.78rem",
                  color: "rgba(184,228,247,0.7)",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                }}
              >
                {msg}
              </pre>
            </details>
          )}

          {/* Action buttons */}
          <div
            style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", justifyContent: "center" }}
          >
            <button
              onClick={this.handleReload}
              style={{
                background: "linear-gradient(135deg, #F4C542 0%, #EAB308 100%)",
                color: "#062A45",
                border: "none",
                borderRadius: "0.75rem",
                padding: "0.75rem 1.75rem",
                fontFamily: '"Baloo 2", cursive',
                fontWeight: 900,
                fontSize: "1rem",
                cursor: "pointer",
                boxShadow: "0 0 20px rgba(244,197,66,0.4)",
              }}
            >
              🔄 Reload Page
            </button>
            <button
              onClick={this.handleReset}
              style={{
                background: "rgba(74,174,217,0.12)",
                color: "#4AAED9",
                border: "1px solid rgba(74,174,217,0.3)",
                borderRadius: "0.75rem",
                padding: "0.75rem 1.75rem",
                fontFamily: "Nunito, sans-serif",
                fontWeight: 700,
                fontSize: "1rem",
                cursor: "pointer",
              }}
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
