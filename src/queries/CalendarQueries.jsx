import { useQuery } from '@tanstack/react-query'

import { GetCalendar } from '../utils/Fetcher'
import { getAccessToken } from '../utils/TokenStorage.js'

export const useCalendar = ({ category, filter, from, to }) => {
  const token = getAccessToken()
  return useQuery({
    queryKey: ['calendar', token, from, to, category, filter],
    queryFn: () => GetCalendar(from, to),
    enabled: Boolean(token && from && to),
    placeholderData: previous => previous,
    refetchOnWindowFocus: true,
  })
}
