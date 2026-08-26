import { Component } from 'react'

/**
 * Standalone error boundary that renders a fallback UI when a React child
 * throws during render. Works independently of Sentry configuration.
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            padding: '2rem',
            textAlign: 'center',
            fontFamily: 'system-ui, sans-serif',
          }}
        >
          <h2 style={{ marginBottom: '1rem' }}>Something went wrong</h2>
          <p style={{ color: '#666', marginBottom: '1rem' }}>
            An unexpected error occurred. Please try refreshing the page.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '0.5rem 1rem',
              cursor: 'pointer',
              border: '1px solid #ccc',
              borderRadius: '4px',
              background: '#f5f5f5',
            }}
          >
            Refresh Page
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
