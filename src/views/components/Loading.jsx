import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { networkManager } from '../../hooks/NetworkManager'
import Logo from '../../Logo'

const LoadingComponent = () => {
  const { t } = useTranslation('common')
  const [message, setMessage] = useState(() => t('loading'))
  const [subMessage, setSubMessage] = useState('')
  const [isOnline, setIsOnline] = useState(networkManager.isOnline)

  useEffect(() => {
    if (!isOnline) {
      setMessage('You are offline')
      setSubMessage(
        'This not available while offline. Please check your internet connection and try again.',
      )
    }
  }, [isOnline])
  useEffect(() => {
    networkManager.registerNetworkListener(isOnline => setIsOnline(isOnline))

    // if loading took more than 5 seconds update submessage to mention there might be an error:
    const timeout = setTimeout(() => {
      if (networkManager.isOnline) {
        setSubMessage(
          'This is taking longer than usual. There might be an issue.',
        )
      }
    }, 5000)
    return () => clearTimeout(timeout)
  }, [])

  return (
    <div className='loading-splash'>
      <div className='loading-ring' role='status' aria-live='polite'>
        <Logo size='96px' />
      </div>
      <div
        className='text-primary'
        style={{ fontSize: 24, fontWeight: 700, marginTop: 14 }}
      >
        {message}
      </div>
      <div
        className='text-muted'
        style={{
          fontSize: 14,
          lineHeight: 1.5,
          maxWidth: '34ch',
          textAlign: 'center',
        }}
      >
        {subMessage}
      </div>
      <button
        className='btn btn-secondary'
        style={{ marginTop: 24 }}
        onClick={() => {
          window.location.href = '/' // navigate back to the home page
        }}
        type='button'
      >
        Navigate Back
      </button>
    </div>
  )
}

export default LoadingComponent
