import React from 'react';

interface State {
  hasError: boolean;
  error: Error | null;
}

interface Props {
  children: React.ReactNode;
}

/**
 * Production-grade React Error Boundary.
 * Catches unhandled JavaScript errors in child components and shows
 * a graceful fallback screen instead of a blank white page.
 */
export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // In production, you could send this to a monitoring service like Sentry
    console.error('💥 [ErrorBoundary] Caught error:', error.message, info.componentStack);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #FFF9FC 0%, #F3E8FF 100%)',
            fontFamily: "'Inter', system-ui, sans-serif",
            padding: '24px',
            textAlign: 'center',
          }}
        >
          {/* Animated Heart */}
          <div
            style={{
              width: 72,
              height: 72,
              background: 'rgba(244, 114, 182, 0.12)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 24,
              animation: 'pulse 2s ease-in-out infinite',
            }}
          >
            <svg width="36" height="36" viewBox="0 0 24 24" fill="#F472B6">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
          </div>

          <h1
            style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: 28,
              fontWeight: 700,
              color: '#2D2D2D',
              marginBottom: 12,
            }}
          >
            Something went wrong
          </h1>
          <p
            style={{
              color: '#777777',
              fontSize: 15,
              lineHeight: 1.6,
              maxWidth: 400,
              marginBottom: 8,
            }}
          >
            A small hiccup happened. Don't worry — your data is safe and everything will be okay.
          </p>

          {import.meta.env.DEV && this.state.error && (
            <pre
              style={{
                background: '#FFF0F6',
                border: '1px solid rgba(244,114,182,0.2)',
                borderRadius: 12,
                padding: '12px 16px',
                fontSize: 12,
                color: '#E11D48',
                maxWidth: 480,
                overflowX: 'auto',
                marginBottom: 24,
                textAlign: 'left',
              }}
            >
              {this.state.error.message}
            </pre>
          )}

          <div style={{ display: 'flex', gap: 12, marginTop: 20, flexWrap: 'wrap', justifyContent: 'center' }}>
            <button
              onClick={this.handleGoHome}
              style={{
                background: '#F472B6',
                color: '#fff',
                border: 'none',
                borderRadius: 9999,
                padding: '10px 24px',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: "'Poppins', sans-serif",
                transition: 'opacity 0.2s',
              }}
              onMouseOver={(e) => (e.currentTarget.style.opacity = '0.85')}
              onMouseOut={(e) => (e.currentTarget.style.opacity = '1')}
            >
              Go Home ❤️
            </button>
            <button
              onClick={this.handleReload}
              style={{
                background: 'transparent',
                color: '#F472B6',
                border: '1.5px solid rgba(244,114,182,0.4)',
                borderRadius: 9999,
                padding: '10px 24px',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: "'Poppins', sans-serif",
              }}
            >
              Try Again
            </button>
          </div>

          <style>{`
            @keyframes pulse {
              0%, 100% { transform: scale(1); }
              50% { transform: scale(1.08); }
            }
          `}</style>
        </div>
      );
    }

    return this.props.children;
  }
}
