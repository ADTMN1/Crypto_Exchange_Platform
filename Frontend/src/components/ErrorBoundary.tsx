import React from 'react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export default class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    console.error('ErrorBoundary caught an error:', error);
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary details:', error, errorInfo);
    
    // Check if this is the list property error
    if (error.message && error.message.includes("Cannot read properties of undefined (reading 'list')")) {
      console.error('🚨 FOUND THE LIST ERROR:', error.stack);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          backgroundColor: '#0f172a',
          color: '#e2e8f0',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          padding: '2rem',
          textAlign: 'center'
        }}>
          <h1 style={{ fontSize: '2rem', marginBottom: '1rem', color: '#f87171' }}>
            Something went wrong
          </h1>
          <p style={{ marginBottom: '2rem', color: '#94a3b8' }}>
            {this.state.error?.message || 'An unexpected error occurred'}
          </p>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: undefined });
              window.location.reload();
            }}
            style={{
              padding: '0.75rem 2rem',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              fontSize: '1rem'
            }}
          >
            Reload Page
          </button>
          {this.state.error && (
            <details style={{ marginTop: '2rem', textAlign: 'left' }}>
              <summary style={{ cursor: 'pointer', color: '#94a3b8' }}>
                Error Details
              </summary>
              <pre style={{ 
                marginTop: '1rem', 
                padding: '1rem', 
                backgroundColor: '#1e293b', 
                borderRadius: '0.5rem',
                overflow: 'auto',
                fontSize: '0.875rem',
                color: '#f1f5f9'
              }}>
                {this.state.error.stack}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}