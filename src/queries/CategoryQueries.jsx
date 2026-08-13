import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  CreateCategory,
  GetCategories,
  SetCategoryArchived,
  UpdateCategory,
} from '../utils/Fetcher'
import { activeCategories, categoryCatalog } from './categoryModel'

export const categoryKey = token => ['categories', token]

export const useCategories = (includeArchived = false) => {
  const token = localStorage.getItem('token')
  return useQuery({
    queryKey: categoryKey(token),
    queryFn: async () => categoryCatalog(await GetCategories(true)),
    enabled: Boolean(token),
    select: includeArchived ? undefined : activeCategories,
  })
}

export const useCategoryActions = () => {
  const client = useQueryClient()
  const refresh = () =>
    Promise.all([
      client.invalidateQueries({ queryKey: ['categories'], exact: false }),
      client.invalidateQueries({ queryKey: ['calendar'] }),
      client.invalidateQueries({ queryKey: ['chores'] }),
    ])
  return {
    create: useMutation({ mutationFn: CreateCategory, onSuccess: refresh }),
    update: useMutation({ mutationFn: UpdateCategory, onSuccess: refresh }),
    archive: useMutation({
      mutationFn: ({ archived, id }) => SetCategoryArchived(id, archived),
      onSuccess: refresh,
    }),
  }
}
