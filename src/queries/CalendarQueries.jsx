import { useQuery } from '@tanstack/react-query'

import { GetCalendar } from '../utils/Fetcher'

export const useCalendar = ({ filter, from, to }) => {
  const token = localStorage.getItem('token')
  return useQuery({
    queryKey: ['calendar', token, from, to, filter],
    queryFn: () => GetCalendar(from, to),
    enabled: Boolean(token && from && to),
    placeholderData: previous => previous,
    refetchOnWindowFocus: true,
  })
}
