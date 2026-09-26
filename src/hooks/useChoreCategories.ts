import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import * as Fetcher from '../utils/Fetcher'
import { getAccessToken } from '../utils/TokenStorage'
import { readCategoryResponse } from './categoryModel'

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
 * Loads the authenticated circle's categories. Categories are circle
 * scoped, so a category chosen for a task is validated by the server against
 * the caller's circle and can never reference another circle's category.
 *
 * `includeArchived` is for the Settings manager, which has to show archived
 * rows so they can be restored. Task pickers leave it off, which is what
 * keeps an archived category out of new assignment while a task that already
 * points at one keeps resolving through the embedded `chore.category`.
 *
 * The flag is part of the key so the two views cannot overwrite each other's
 * cache. Both still sit under `['circle','categories']`, so a `circle.*`
 * realtime event and the mutations below both invalidate them by prefix.
 */
export function useChoreCategories({ includeArchived = false } = {}) {
  const query = useQuery({
    queryKey: [...categoriesKey, { includeArchived }],
    // `Fetcher.GetCategories` predates the response-returning Fetcher helpers
    // and already parses its JSON body itself. Do not pass it through
    // parseAccountResponse (which expects a Response and would call `.json()`
    // a second time); normalize its direct or `{ res }` contract here.
    queryFn: async () => {
      const body = (await Fetcher.GetCategories(includeArchived)) as
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

export type CategoryInput = { name: string; color?: string }
export type CategoryUpdateInput = CategoryInput & { id: number }

/**
 * Writes for circle categories. Every mutation invalidates the category
 * queries on success, which is what makes a create, rename, recolor, archive
 * or restore show up in the Settings manager and in the task editor at the
 * same time, without a reload.
 *
 * There is deliberately no hard delete: the API has none, and archiving
 * preserves the id that chores, things, routine items and goals already
 * reference.
 */
export function useCategoryMutations() {
  const client = useQueryClient()
  const refresh = () =>
    client.invalidateQueries({ queryKey: [...categoriesKey] })

  const createCategory = useMutation({
    mutationFn: async (input: CategoryInput) =>
      readCategoryResponse<ChoreCategory>(
        await Fetcher.CreateCategory({
          name: input.name,
          color: input.color,
        }),
      ),
    onSuccess: refresh,
  })

  const updateCategory = useMutation({
    mutationFn: async ({ id, ...input }: CategoryUpdateInput) =>
      readCategoryResponse<ChoreCategory>(
        await Fetcher.UpdateCategory({
          id,
          name: input.name,
          color: input.color,
        }),
      ),
    onSuccess: refresh,
  })

  const setArchived = async (id: number, archived: boolean) =>
    readCategoryResponse<unknown>(
      await Fetcher.SetCategoryArchived(id, archived),
    )

  // Two explicit mutations rather than a factory that calls useMutation, so
  // the hooks run unconditionally and in a stable order.
  const archiveCategory = useMutation({
    mutationFn: (id: number) => setArchived(id, true),
    onSuccess: refresh,
  })

  const restoreCategory = useMutation({
    mutationFn: (id: number) => setArchived(id, false),
    onSuccess: refresh,
  })

  return {
    createCategory,
    updateCategory,
    archiveCategory,
    restoreCategory,
  }
}
