import { isCircleList } from './shoppingListModel'

const EMOJI_PALETTE = [
  '🛒',
  '✏️',
  '🔧',
  '🧺',
  '🍎',
  '🧼',
  '📦',
  '🪴',
  '🧃',
  '🛁',
  '🥫',
  '🕯️',
]

export const emojiFor = name => {
  let hash = 0
  for (const char of String(name || '')) {
    hash = (hash * 31 + char.codePointAt(0)) | 0
  }
  return EMOJI_PALETTE[Math.abs(hash) % EMOJI_PALETTE.length]
}

export const itemFigma = item => ({
  id: item?.id,
  text: item?.name || item?.text || '',
  done: Boolean(item?.isChecked || item?.done),
  quantity: item?.quantity,
  addedById: item?.addedById,
})

export const listFigma = (list, items) => {
  const itemList = Array.isArray(items) ? items : list?.items || []
  const completedCount =
    itemList.length > 0
      ? itemList.filter(item => item.isChecked || item.done).length
      : list?.checkedCount || 0
  const count = itemList.length > 0 ? itemList.length : list?.itemCount || 0
  return {
    id: list?.id,
    name: list?.name,
    isShared: isCircleList(list),
    emoji: emojiFor(list?.name),
    remaining: Math.max(0, count - completedCount),
    items: itemList.map(itemFigma),
  }
}
