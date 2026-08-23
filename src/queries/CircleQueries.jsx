import { useQuery } from '@tanstack/react-query'
import { useEffect } from 'react'

import {
  profileCircleId,
  resolveActiveCircle,
  syncActiveCircleId,
} from '../utils/ActiveCircle'
import { GetUserCircle } from '../utils/Fetcher'
import { getAccessToken } from '../utils/TokenStorage.js'
import { useUserProfile } from './UserQueries'

const readUserCircles = async () => {
  const response = await GetUserCircle()
  if (!response?.ok) {
    const body = await response.json().catch(() => ({}))
    throw new Error(body?.error || 'Unable to load circles')
  }
  const body = await response.json()
  return body?.res || []
}

export const useUserCircles = () => {
  const token = getAccessToken()
  return useQuery({
    queryKey: ['userCircles', token],
    queryFn: readUserCircles,
    enabled: Boolean(token),
  })
}

export const useActiveCircle = () => {
  const { data: profile } = useUserProfile()
  const circlesQuery = useUserCircles()
  const activeCircleId = profileCircleId(profile)
  const circles = circlesQuery.data || []
  const activeCircle = resolveActiveCircle(circles, activeCircleId)

  useEffect(() => {
    if (activeCircleId) syncActiveCircleId(activeCircleId)
  }, [activeCircleId])

  return {
    activeCircle,
    activeCircleId,
    circles,
    hasMultipleCircles: circles.length > 1,
    ...circlesQuery,
  }
}
