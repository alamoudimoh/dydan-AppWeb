import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  CreateCategory,
  GetCategories,
  SetCategoryArchived,
  UpdateCategory,
} from '../utils/Fetcher'

export const categoryKey = (token, archived = false) => [
  'categories',
  token,
  archived,
]

export const useCategories = (includeArchived = false) => {
  const token = localStorage.getItem('token')
  return useQuery({
    queryKey: categoryKey(token, includeArchived),
    queryFn: async () => (await GetCategories(includeArchived)).res || [],
    enabled: Boolean(token),
  })
}

export const useCategoryActions = () => {
  const client = useQueryClient()
  const refresh = () =>
    Promise.all([
      client.invalidateQueries({ queryKey: ['categories'] }),
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
