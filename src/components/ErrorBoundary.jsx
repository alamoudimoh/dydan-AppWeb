import { Component } from 'react'
import { withTranslation } from 'react-i18next'

import FigmaIcon from './FigmaIcon'

class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null, hasError: false }
  }

  static getDerivedStateFromError(error) {
    return { error, hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo)
  }

  retry = () => {
    this.setState({ error: null, hasError: false })
  }

  goHome = () => {
    window.location.assign('/chores')
  }

  render() {
    if (!this.state.hasError) return this.props.children
    const { t } = this.props
    return (
      <div className='figma-error-wrap'>
        <div className='px-4 pt-6 md:px-7'>
          <div className='card figma-error-card mb-5 p-6'>
            <div className='flex items-start gap-4'>
              <div className='figma-error-icon'>
                <FigmaIcon
                  name='error'
                  size={24}
                  style={{ color: 'var(--sig-over)' }}
                />
              </div>
              <div>
                <h2
                  className='text-primary mb-1 font-bold'
                  style={{ fontSize: 18 }}
                >
                  {t('errorBoundary.title', 'Something went wrong')}
                </h2>
                <div className='text-muted figma-error-message'>
                  {t(
                    'errorBoundary.message',
                    'An unexpected error occurred. Your data is safe - please try again.',
                  )}
                </div>
                <div className='badge figma-error-badge mt-2'>
                  RUNTIME_ERROR
                </div>
              </div>
            </div>
          </div>
          <div className='mb-5 flex flex-col gap-3'>
            <button
              className='btn btn-primary figma-error-action'
              onClick={this.retry}
              type='button'
            >
              <FigmaIcon name='repeat' size={16} />
              {t('errorBoundary.refresh', 'Retry')}
            </button>
            <button
              className='btn btn-secondary figma-error-action'
              onClick={this.goHome}
              type='button'
            >
              {t('errorBoundary.goHome', 'Dismiss and continue')}
            </button>
          </div>
        </div>
      </div>
    )
  }
}

export default withTranslation()(ErrorBoundary)
