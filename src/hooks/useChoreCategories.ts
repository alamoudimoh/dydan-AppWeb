import { useQuery } from '@tanstack/react-query'

import * as Fetcher from '../utils/Fetcher'
import { getAccessToken } from '../utils/TokenStorage'

/**
 * A circle category as persisted by the server. The chore API stores only the
 * numeric `categoryId`, so the task modal resolves the visible name through
 * this list rather than a hardcoded client-side set.
 */
export type ChoreCategory = {
  id: number
  name: string
  color?: string
  archivedAt?: string | null
}

const categoriesKey = ['circle', 'categories'] as const

/**
 * Loads the authenticated circle's active categories. Categories are circle
 * scoped, so a category chosen for a task is validated by the server against
 * the caller's circle and can never reference another circle's category.
 */
export function useChoreCategories() {
  const query = useQuery({
    queryKey: categoriesKey,
    // `Fetcher.GetCategories` predates the response-returning Fetcher helpers
    // and already parses its JSON body itself. Do not pass it through
    // parseAccountResponse (which expects a Response and would call `.json()`
    // a second time); normalize its direct or `{ res }` contract here.
    queryFn: async () => {
      const body = (await Fetcher.GetCategories()) as
        ChoreCategory[] | { res?: ChoreCategory[] }
      return Array.isArray(body) ? body : (body.res ?? [])
    },
    enabled: Boolean(getAccessToken()),
  })

  return {
    categories: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
  }
}
