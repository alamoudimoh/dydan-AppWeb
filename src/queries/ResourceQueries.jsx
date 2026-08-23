import { useQuery } from '@tanstack/react-query'

import { GetResource } from '../utils/Fetcher'
import { getAccessToken, getAccessTokenExpiry } from '../utils/TokenStorage.js'

// Helper to check if we have a valid token
const isTokenValid = () => {
  const token = getAccessToken()
  if (!token) return false

  const expiry = getAccessTokenExpiry()
  if (!expiry) return true // No expiry set, assume valid

  return new Date() < new Date(expiry)
}

export const useResource = () => {
  const { data, error, isLoading, refetch } = useQuery({
    queryKey: ['resource'],
    queryFn: async () => {
      const response = await GetResource()
      return response
    },
    staleTime: 6 * 60 * 60 * 1000, // 6 hours in milliseconds
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  })
  return { data, isLoading, error, refetch }
}
