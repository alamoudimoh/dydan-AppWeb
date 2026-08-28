import assert from 'node:assert/strict'
import test from 'node:test'

import { resolveEffectiveRole } from '../../utils/PermissionModel.js'
import {
  canManageShoppingList,
  isCircleList,
  partitionShoppingLists,
  SHOPPING_LIST_SCOPES,
} from './shoppingListModel.js'

test('partitionShoppingLists splits personal and family lists', () => {
  const lists = [
    { id: 1, name: 'Mine', circleId: null },
    { id: 2, name: 'Family', circleId: 3 },
  ]
  const { family, personal } = partitionShoppingLists(lists)
  assert.equal(personal.length, 1)
  assert.equal(family.length, 1)
  assert.equal(isCircleList(family[0]), true)
})

test('canManageShoppingList respects personal ownership and circle admin', () => {
  const personal = { id: 1, createdBy: 5, circleId: null }
  const family = { id: 2, createdBy: 9, circleId: 3 }

  assert.equal(canManageShoppingList(personal, 5, 'adult'), true)
  assert.equal(canManageShoppingList(personal, 6, 'owner'), false)
  assert.equal(canManageShoppingList(family, 9, 'adult'), true)
  assert.equal(canManageShoppingList(family, 4, 'owner'), true)
  assert.equal(canManageShoppingList(family, 4, 'adult'), false)
})

test('shopping list permissions accept useCircleMembers query payload', () => {
  const familyList = { id: 2, createdBy: 9, circleId: 3 }
  const membersQuery = {
    res: [{ userId: 7, role: 'admin', isActive: true }],
  }

  assert.equal(
    canManageShoppingList(
      familyList,
      7,
      resolveEffectiveRole({ id: 7, userType: 0 }, membersQuery),
    ),
    true,
  )
})

test('shopping list scopes are stable', () => {
  assert.equal(SHOPPING_LIST_SCOPES.PERSONAL, 'personal')
  assert.equal(SHOPPING_LIST_SCOPES.CIRCLE, 'circle')
})
