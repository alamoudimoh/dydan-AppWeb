export const SHOPPING_LIST_SCOPES = Object.freeze({
  PERSONAL: 'personal',
  CIRCLE: 'circle',
})

export const isCircleList = list => list?.circleId != null && list.circleId > 0

export const partitionShoppingLists = (lists = []) => {
  const personal = []
  const family = []
  for (const list of lists) {
    if (isCircleList(list)) {
      family.push(list)
    } else {
      personal.push(list)
    }
  }
  return { personal, family }
}

export const canManageShoppingList = (list, userId, effectiveRole) => {
  if (!list || !userId) return false
  if (!isCircleList(list)) {
    return Number(list.createdBy) === Number(userId)
  }
  return Number(list.createdBy) === Number(userId) || effectiveRole === 'owner'
}

export const canEditShoppingItems = list => Boolean(list)
