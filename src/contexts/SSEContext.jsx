import { createContext, useContext, useMemo } from 'react'

import { useSSE } from '../hooks/useSSE'

export const SSEContext = createContext({
  connectionState: 2, // CLOSED
  isConnected: false,
  isConnecting: false,
  lastEvent: null,
  error: null,
  connect: () => {},
  disconnect: () => {},
  getConnectionStatus: () => 'disconnected',
})

export const useSSEContext = () => {
  return useContext(SSEContext)
}

export const SSEProvider = ({ children }) => {
  const sseState = useSSE()
  const value = useMemo(
    () => sseState,
    [
      sseState.connectionState,
      sseState.isConnected,
      sseState.isConnecting,
      sseState.lastEvent,
      sseState.error,
      sseState.connect,
      sseState.disconnect,
      sseState.toggleSSEEnabled,
      sseState.isSSEEnabled,
    ],
  )

  return <SSEContext.Provider value={value}>{children}</SSEContext.Provider>
}

export default SSEProvider
