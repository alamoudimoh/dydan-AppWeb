import { describe, expect, it } from 'vitest'

import { emojiFor, itemFigma, listFigma } from './shoppingViewModel'

describe('emojiFor', () => {
  it('is deterministic and stable for a given name', () => {
    expect(emojiFor('Groceries')).toBe(emojiFor('Groceries'))
    expect(emojiFor('')).toBe(emojiFor(''))
  })
})

describe('itemFigma', () => {
  it('maps production item fields to the Figma surface', () => {
    expect(
      itemFigma({ id: 1, name: 'Milk', isChecked: true, quantity: '2' }),
    ).toEqual({
      id: 1,
      text: 'Milk',
      done: true,
      quantity: '2',
      addedById: undefined,
    })
    expect(itemFigma({ id: 2, text: 'Bread', done: false })).toMatchObject({
      text: 'Bread',
      done: false,
    })
  })
})

describe('listFigma', () => {
  it('computes remaining from item counts', () => {
    const list = listFigma(
      { id: 7, name: 'Groceries', circleId: 1, itemCount: 4, checkedCount: 1 },
      [],
    )
    expect(list).toMatchObject({
      id: 7,
      name: 'Groceries',
      isShared: true,
      remaining: 3,
    })
  })
  it('derives counts from inline items when present', () => {
    const list = listFigma({ id: 7, name: 'School' }, [
      { id: 1, name: 'Pen', isChecked: false },
      { id: 2, name: 'Paper', isChecked: true },
    ])
    expect(list.remaining).toBe(1)
    expect(list.items).toHaveLength(2)
  })
})
