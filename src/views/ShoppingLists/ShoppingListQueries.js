import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  ArchiveShoppingList,
  ClearCompletedShoppingItems,
  CreateShoppingList,
  CreateShoppingListItem,
  DeleteShoppingList,
  DeleteShoppingListItem,
  GetShoppingList,
  GetShoppingLists,
  UpdateShoppingList,
  UpdateShoppingListItem,
} from '../../utils/Fetcher'

const parseListResponse = async response => {
  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    throw new Error(body?.error || 'Failed to load shopping lists')
  }
  const data = await response.json()
  return data.res ?? data
}

export const shoppingListKeys = {
  all: ['shoppingLists'],
  detail: id => ['shoppingLists', id],
}

export const useShoppingLists = () =>
  useQuery({
    queryKey: shoppingListKeys.all,
    queryFn: async () => parseListResponse(await GetShoppingLists()),
    staleTime: 60_000,
    refetchOnWindowFocus: true,
  })

export const useShoppingList = id =>
  useQuery({
    queryKey: shoppingListKeys.detail(id),
    queryFn: async () => parseListResponse(await GetShoppingList(id)),
    enabled: Boolean(id),
    staleTime: 30_000,
  })

export const useCreateShoppingList = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async payload => {
      const response = await CreateShoppingList(payload)
      return parseListResponse(response)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: shoppingListKeys.all })
    },
  })
}

export const useUpdateShoppingList = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, name }) => {
      const response = await UpdateShoppingList(id, { name })
      return parseListResponse(response)
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: shoppingListKeys.all })
      queryClient.invalidateQueries({
        queryKey: shoppingListKeys.detail(variables.id),
      })
    },
  })
}

export const useArchiveShoppingList = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async id => parseListResponse(await ArchiveShoppingList(id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: shoppingListKeys.all })
    },
  })
}

export const useDeleteShoppingList = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async id => parseListResponse(await DeleteShoppingList(id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: shoppingListKeys.all })
    },
  })
}

export const useCreateShoppingListItem = listId => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async payload => {
      const response = await CreateShoppingListItem(listId, payload)
      return parseListResponse(response)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: shoppingListKeys.detail(listId),
      })
      queryClient.invalidateQueries({ queryKey: shoppingListKeys.all })
    },
  })
}

export const useUpdateShoppingListItem = listId => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ itemId, ...payload }) => {
      const response = await UpdateShoppingListItem(listId, itemId, payload)
      return parseListResponse(response)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: shoppingListKeys.detail(listId),
      })
      queryClient.invalidateQueries({ queryKey: shoppingListKeys.all })
    },
  })
}

export const useDeleteShoppingListItem = listId => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async itemId => {
      const response = await DeleteShoppingListItem(listId, itemId)
      return parseListResponse(response)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: shoppingListKeys.detail(listId),
      })
      queryClient.invalidateQueries({ queryKey: shoppingListKeys.all })
    },
  })
}

export const useClearCompletedShoppingItems = listId => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async () =>
      parseListResponse(await ClearCompletedShoppingItems(listId)),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: shoppingListKeys.detail(listId),
      })
      queryClient.invalidateQueries({ queryKey: shoppingListKeys.all })
    },
  })
}
