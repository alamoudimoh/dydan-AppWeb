import { useState } from 'react'

import { AppCtx, Icon } from '../App'
import PageHeader from '../components/PageHeader'
import { useLocalization } from '../contexts/LocalizationContext'
import { useShoppingMutations } from '../hooks/useHousehold'
import { useLiveData } from '../model/liveData'

export default function ShoppingScreen({
  ctx,
  isSolo,
}: {
  ctx: AppCtx
  isSolo: boolean
}) {
  const { t } = useLocalization()
  const { memberById, shoppingLists } = useLiveData()
  const shoppingMutations = useShoppingMutations()
  const lists = shoppingLists
  const [activeListId, setActiveListId] = useState<string | null>(null)
  const activeId = activeListId ?? lists[0]?.id ?? null
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editText, setEditText] = useState('')

  const [isEditingList, setIsEditingList] = useState(false)
  const [editListName, setEditListName] = useState('')

  const visibleLists = isSolo ? lists.filter(l => !l.isShared) : lists
  const currentList =
    visibleLists.find(l => l.id === activeId) || visibleLists[0]

  const toggleItem = (listId: string, itemId: string) => {
    const nlistId = Number(listId)
    if (!Number.isFinite(nlistId)) {
      ctx.showToast('Invalid shopping list')
      return
    }
    const item = lists
      .find(l => l.id === listId)
      ?.items.find(i => i.id === itemId)
    if (!item) return
    const nitemId = Number(itemId)
    if (!Number.isFinite(nitemId)) {
      ctx.showToast('Invalid shopping item')
      return
    }
    shoppingMutations.toggleItem.mutate(
      { listId: nlistId, itemId: nitemId, checked: !item.done },
      { onError: error => ctx.showToast(error.message) },
    )
  }

  const removeItem = (listId: string, itemId: string) => {
    const nlistId = Number(listId)
    if (!Number.isFinite(nlistId)) {
      ctx.showToast('Invalid shopping list')
      return
    }
    const nitemId = Number(itemId)
    if (!Number.isFinite(nitemId)) {
      ctx.showToast('Invalid shopping item')
      return
    }
    shoppingMutations.removeItem.mutate(
      { listId: nlistId, itemId: nitemId },
      { onError: error => ctx.showToast(error.message) },
    )
  }

  const clearDone = (listId: string) => {
    shoppingMutations.clearCompleted.mutate(Number(listId), {
      onError: error => ctx.showToast(error.message),
      onSuccess: () => ctx.showToast('Completed items cleared'),
    })
  }

  const saveEdit = (listId: string, itemId: string) => {
    if (!editText.trim()) return
    shoppingMutations.updateItem.mutate(
      { listId: Number(listId), itemId: Number(itemId), name: editText.trim() },
      {
        onError: error => ctx.showToast(error.message),
        onSuccess: () => setEditingId(null),
      },
    )
  }

  const todo = currentList?.items.filter(i => !i.done) ?? []
  const done = currentList?.items.filter(i => i.done) ?? []

  return (
    <div style={{ maxWidth: 1080, margin: '0 auto', padding: '0 0 40px' }}>
      <PageHeader
        title='Shopping'
        subtitle={isSolo ? 'Personal lists' : 'Personal and shared space lists'}
        actions={
          <button
            className='btn btn-primary'
            onClick={() =>
              ctx.openCreate('shopping-list', {
                allowShared: !isSolo,
                onCreated: list => {
                  const created = list as { id?: number | string }
                  if (created?.id !== undefined)
                    setActiveListId(String(created.id))
                },
              })
            }
          >
            <Icon name='shopping' size={14} />
            {t('create.shoppingList.title')}
          </button>
        }
      />

      <div className='px-4 md:px-7'>
        <div
          className='grid gap-5 shopping-lists-grid'
          style={{ gridTemplateColumns: '220px minmax(0, 1fr)' }}
        >
          {/* List sidebar */}
          <div className='flex flex-col gap-2'>
            {visibleLists.map(l => {
              const completedCount = l.items.filter(i => i.done).length
              const isActive = l.id === activeId
              return (
                <button
                  key={l.id}
                  className='card text-start p-3 cursor-pointer'
                  style={{
                    background: isActive
                      ? 'var(--brand-faint)'
                      : 'var(--surface)',
                    border: isActive
                      ? '1px solid var(--brand)'
                      : '1px solid var(--line)',
                    borderRadius: 'var(--r-lg)',
                    fontFamily: 'var(--font-ui)',
                  }}
                  onClick={() => setActiveListId(l.id)}
                >
                  <div className='flex items-center gap-2'>
                    <span style={{ fontSize: 18 }}>{l.emoji}</span>
                    <div className='flex-1 min-w-0'>
                      <div
                        className='font-semibold truncate'
                        style={{
                          fontSize: 13,
                          color: isActive ? 'var(--brand)' : 'var(--t-primary)',
                        }}
                      >
                        {l.name}
                      </div>
                      <div className='text-faint' style={{ fontSize: 11 }}>
                        {l.items.length - completedCount} remaining
                        {l.isShared && ' · Shared'}
                      </div>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>

          {/* List content */}
          <div className='min-w-0'>
            {isEditingList && currentList ? (
              <div
                className='card p-5 border border-line'
                style={{ borderRadius: 'var(--r-xl)' }}
              >
                <div className='flex items-center justify-between mb-4'>
                  <h2
                    className='form-title text-primary'
                    style={{ fontSize: 18, margin: 0 }}
                  >
                    modify list
                  </h2>
                  <button
                    className='btn btn-ghost btn-icon'
                    onClick={() => setIsEditingList(false)}
                  >
                    <Icon name='x' size={16} />
                  </button>
                </div>
                <div className='flex flex-col gap-4'>
                  <div className='flex gap-3'>
                    <div className='flex flex-col gap-1 flex-1'>
                      <label className='section-label' style={{ padding: 0 }}>
                        LIST NAME
                      </label>
                      <input
                        className='input'
                        value={editListName}
                        onChange={e => setEditListName(e.target.value)}
                        autoFocus
                      />
                    </div>
                  </div>
                  <div
                    className='flex items-center justify-between mt-2 pt-4 border-t border-line'
                    style={{ borderColor: 'var(--line)' }}
                  >
                    <button
                      className='btn btn-ghost text-sig-over px-2'
                      onClick={() => {
                        ctx.showConfirm({
                          title: 'Delete List',
                          message: `Are you sure you want to delete "${currentList.name}"? This cannot be undone.`,
                          confirmLabel: 'Delete',
                          danger: true,
                          onConfirm: () => {
                            shoppingMutations.deleteList.mutate(
                              Number(currentList.id),
                              {
                                onError: error => ctx.showToast(error.message),
                                onSuccess: () => {
                                  setIsEditingList(false)
                                  setActiveListId(null)
                                  ctx.showToast('List deleted')
                                },
                              },
                            )
                          },
                        })
                      }}
                    >
                      Delete list
                    </button>
                    <div className='flex gap-2'>
                      <button
                        className='btn btn-ghost'
                        onClick={() => setIsEditingList(false)}
                      >
                        Cancel
                      </button>
                      <button
                        className='btn btn-primary'
                        onClick={() => {
                          if (!editListName.trim()) return
                          shoppingMutations.updateList.mutate(
                            {
                              id: Number(currentList.id),
                              name: editListName.trim(),
                            },
                            {
                              onError: error => ctx.showToast(error.message),
                              onSuccess: () => {
                                setIsEditingList(false)
                                ctx.showToast('List updated')
                              },
                            },
                          )
                        }}
                        disabled={!editListName.trim()}
                      >
                        Save changes
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : currentList ? (
              <>
                {/* List header */}
                <div className='flex items-center justify-between gap-3 flex-wrap mb-4'>
                  <div>
                    <div className='flex items-center gap-2 flex-wrap'>
                      <span style={{ fontSize: 24 }}>{currentList.emoji}</span>
                      <h2
                        className='text-primary font-bold'
                        style={{ fontSize: 20, margin: 0 }}
                      >
                        {currentList.name}
                      </h2>
                      {currentList.isShared && (
                        <span
                          className='badge bg-brand-faint text-brand'
                          style={{ fontSize: 11 }}
                        >
                          Shared
                        </span>
                      )}
                    </div>
                    <div
                      className='text-muted'
                      style={{ fontSize: 12, marginTop: 2 }}
                    >
                      {todo.length} item{todo.length !== 1 ? 's' : ''} remaining
                      {done.length > 0 && ` · ${done.length} done`}
                    </div>
                  </div>
                  <div className='flex items-center gap-2'>
                    {done.length > 0 && (
                      <button
                        className='btn btn-ghost btn-sm text-muted'
                        onClick={() => clearDone(currentList.id)}
                      >
                        Clear done
                      </button>
                    )}
                    <button
                      className='btn btn-secondary btn-sm'
                      onClick={() => {
                        setEditListName(currentList.name)
                        setIsEditingList(true)
                      }}
                    >
                      <Icon name='edit' size={14} /> Modify
                    </button>
                    <button
                      className='btn btn-ghost btn-sm'
                      style={{ color: 'var(--sig-over)' }}
                      onClick={() =>
                        ctx.showConfirm({
                          title: 'Delete list?',
                          message: `Delete "${currentList.name}" and all its items?`,
                          confirmLabel: 'Delete',
                          danger: true,
                          onConfirm: () => {
                            shoppingMutations.deleteList.mutate(
                              Number(currentList.id),
                              {
                                onError: error => ctx.showToast(error.message),
                                onSuccess: () => {
                                  setActiveListId(null)
                                  ctx.showToast('List deleted')
                                },
                              },
                            )
                          },
                        })
                      }
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {/* Shopping items are created through the canonical modal. */}
                <div className='flex justify-end mb-4'>
                  <button
                    className='btn btn-primary'
                    onClick={() =>
                      ctx.openCreate('shopping-item', {
                        listId: currentList.id,
                      })
                    }
                  >
                    <Icon name='shopping_item' size={15} />
                    {t('create.shoppingItem.title')}
                  </button>
                </div>

                {/* Items */}
                <div className='card overflow-hidden'>
                  {todo.length === 0 && done.length === 0 ? (
                    <div className='empty-state'>
                      <div style={{ fontSize: 40 }}>{currentList.emoji}</div>
                      <div className='font-bold text-primary'>
                        List is empty
                      </div>
                      <div className='text-muted' style={{ fontSize: 13 }}>
                        {t('shopping.emptyInstruction')}
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Todo items */}
                      {todo.map(item => {
                        const addedBy = item.addedById
                          ? memberById(item.addedById)
                          : null
                        return (
                          <div
                            key={item.id}
                            className='flex items-center gap-3 px-4 py-3 border-b border-line'
                            style={{ borderColor: 'var(--line)' }}
                          >
                            <button
                              onClick={() =>
                                toggleItem(currentList.id, item.id)
                              }
                              style={{
                                width: 22,
                                height: 22,
                                borderRadius: 6,
                                border: '1px solid var(--line-strong)',
                                background: 'transparent',
                                cursor: 'pointer',
                                flexShrink: 0,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            />
                            <div className='flex-1 min-w-0'>
                              {editingId === item.id ? (
                                <input
                                  className='input'
                                  value={editText}
                                  onChange={e => setEditText(e.target.value)}
                                  onBlur={() =>
                                    saveEdit(currentList.id, item.id)
                                  }
                                  onKeyDown={e =>
                                    e.key === 'Enter' &&
                                    saveEdit(currentList.id, item.id)
                                  }
                                  autoFocus
                                  style={{ padding: '3px 8px', fontSize: 14 }}
                                />
                              ) : (
                                <div className='flex items-center gap-2'>
                                  <span
                                    className='text-primary'
                                    style={{ fontSize: 14 }}
                                  >
                                    {item.text}
                                  </span>
                                  {item.quantity && (
                                    <span
                                      className='text-faint'
                                      style={{ fontSize: 11 }}
                                    >
                                      ({item.quantity})
                                    </span>
                                  )}
                                </div>
                              )}
                              {addedBy && currentList.isShared && (
                                <div className='flex items-center gap-1 mt-0.5'>
                                  <div
                                    className='avatar'
                                    style={{
                                      width: 14,
                                      height: 14,
                                      background: addedBy.avatarColor,
                                      fontSize: 6,
                                    }}
                                  >
                                    {addedBy.initials}
                                  </div>
                                  <span
                                    className='text-faint'
                                    style={{ fontSize: 10 }}
                                  >
                                    Added by {addedBy.name}
                                  </span>
                                </div>
                              )}
                            </div>
                            <button
                              className='btn btn-ghost btn-icon'
                              title='Modify item'
                              aria-label='Modify item'
                              onClick={() => {
                                setEditingId(item.id)
                                setEditText(item.text)
                              }}
                            >
                              <Icon name='edit' size={13} />
                            </button>
                            <button
                              className='btn btn-ghost btn-icon text-sig-over'
                              title='Delete item'
                              aria-label='Delete item'
                              onClick={() =>
                                removeItem(currentList.id, item.id)
                              }
                            >
                              <Icon name='trash' size={13} />
                            </button>
                          </div>
                        )
                      })}

                      {/* Done items */}
                      {done.length > 0 && (
                        <>
                          <div
                            className='px-4 py-2 border-b border-line'
                            style={{
                              borderColor: 'var(--line)',
                              background: 'var(--surface-2)',
                            }}
                          >
                            <span
                              className='text-faint'
                              style={{ fontSize: 12, fontWeight: 700 }}
                            >
                              Checked off ({done.length})
                            </span>
                          </div>
                          {done.map(item => (
                            <div
                              key={item.id}
                              className='flex items-center gap-3 px-4 py-3 border-b border-line'
                              style={{ borderColor: 'var(--line)' }}
                            >
                              <button
                                onClick={() =>
                                  toggleItem(currentList.id, item.id)
                                }
                                style={{
                                  width: 22,
                                  height: 22,
                                  borderRadius: 6,
                                  border: '1px solid var(--check-bg)',
                                  background: 'var(--check-bg)',
                                  cursor: 'pointer',
                                  flexShrink: 0,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                }}
                              >
                                <Icon
                                  name='check'
                                  size={15}
                                  style={{
                                    color: 'var(--check-text)',
                                    strokeWidth: 3,
                                  }}
                                />
                              </button>
                              <span
                                className='text-muted flex-1'
                                style={{
                                  fontSize: 14,
                                  textDecoration: 'line-through',
                                }}
                              >
                                {item.text}
                              </span>
                              <button
                                className='btn btn-ghost btn-icon text-sig-over'
                                onClick={() =>
                                  removeItem(currentList.id, item.id)
                                }
                              >
                                <Icon name='trash' size={13} />
                              </button>
                            </div>
                          ))}
                        </>
                      )}
                    </>
                  )}
                </div>

                {/* Progress */}
                {currentList.items.length > 0 && (
                  <div className='mt-3 flex items-center gap-3'>
                    <div
                      className='progress-track flex-1'
                      style={{ height: 6 }}
                    >
                      <div
                        className='progress-fill done'
                        style={{
                          width: `${(done.length / currentList.items.length) * 100}%`,
                        }}
                      />
                    </div>
                    <span
                      className='text-muted font-mono'
                      style={{ fontSize: 12 }}
                    >
                      {done.length}/{currentList.items.length}
                    </span>
                  </div>
                )}
              </>
            ) : (
              <div className='empty-state'>
                <div style={{ fontSize: 40 }}>🛒</div>
                <div className='font-bold text-primary'>
                  No shopping lists yet
                </div>
                <button
                  className='btn btn-primary mt-3'
                  onClick={() =>
                    ctx.openCreate('shopping-list', {
                      allowShared: !isSolo,
                      onCreated: list => {
                        const created = list as { id?: number | string }
                        if (created?.id !== undefined)
                          setActiveListId(String(created.id))
                      },
                    })
                  }
                >
                  <Icon name='shopping' size={15} />
                  {t('create.shoppingList.title')}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Solo state: promote family lists */}
        {isSolo && (
          <div
            className='mt-5 card p-5 flex items-center gap-4'
            style={{
              border: '1px dashed var(--brand)',
              borderRadius: 'var(--r-xl)',
            }}
          >
            <div style={{ fontSize: 32 }}>👨‍👩‍👧‍👦</div>
            <div>
              <div className='font-bold text-primary' style={{ fontSize: 14 }}>
                Share lists with team
              </div>
              <div
                className='text-muted'
                style={{ fontSize: 12, marginTop: 2 }}
              >
                Invite household members to collaborate on shared shopping
                lists.
              </div>
            </div>
            <button
              className='btn btn-secondary ms-auto'
              style={{ whiteSpace: 'nowrap' }}
              onClick={() => ctx.navigate('settings')}
            >
              Invite members
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
