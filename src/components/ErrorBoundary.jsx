import { Component } from 'react'
import { withTranslation } from 'react-i18next'

/**
 * Standalone error boundary that renders a fallback UI when a React child
 * throws during render. Works independently of Sentry configuration.
 */
class ErrorBoundary extends Component {
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

  handleGoHome = () => {
    window.location.href = '/'
  }

  render() {
    if (this.state.hasError) {
      const { t } = this.props
      return (
        <div
          style={{
            padding: '2rem',
            textAlign: 'center',
            fontFamily: 'system-ui, sans-serif',
          }}
        >
          <h2 style={{ marginBottom: '1rem' }}>
            {t('errorBoundary.title', 'Something went wrong')}
          </h2>
          <p style={{ color: '#666', marginBottom: '1rem' }}>
            {t(
              'errorBoundary.message',
              'An unexpected error occurred. Please try refreshing the page.',
            )}
          </p>
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
            <button
              onClick={this.handleGoHome}
              style={{
                padding: '0.5rem 1rem',
                cursor: 'pointer',
                border: '1px solid #ccc',
                borderRadius: '4px',
                background: '#f5f5f5',
              }}
            >
              {t('errorBoundary.goHome', 'Go to Home')}
            </button>
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
              {t('errorBoundary.refresh', 'Refresh Page')}
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default withTranslation()(ErrorBoundary)
