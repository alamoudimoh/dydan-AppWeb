import PropTypes from 'prop-types'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import FigmaIcon from '../../components/FigmaIcon'

export default function FigmaShoppingScreen({
  activeId,
  canEdit,
  headerSubtitle,
  headerTitle,
  isSolo,
  lists,
  onAddItem,
  onClearDone,
  onDeleteItem,
  onEditItem,
  onInviteMembers,
  onNewList,
  onSelectList,
  onToggleItem,
}) {
  const { t } = useTranslation('shoppingLists')
  const [newItem, setNewItem] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editText, setEditText] = useState('')

  const visibleLists = isSolo ? lists.filter(list => !list.isShared) : lists
  const currentList =
    visibleLists.find(list => list.id === activeId) || visibleLists[0]

  const addItem = listId => {
    const itemName = newItem.trim()
    if (!itemName) return
    onAddItem(itemName)
    setNewItem('')
  }

  const saveEdit = (listId, item) => {
    if (!editText.trim()) return
    onEditItem(item, editText.trim())
    setEditingId(null)
  }

  if (!currentList) {
    return (
      <div className='empty-state'>
        <div style={{ fontSize: 48 }}>🛒</div>
        <div className='text-primary font-bold'>{t('noListsTitle')}</div>
        <button className='btn btn-primary mt-3' onClick={onNewList}>
          <FigmaIcon name='plus' size={15} />
          {t('createList')}
        </button>
      </div>
    )
  }

  const items = currentList.items || []
  const todo = items.filter(item => !item.done)
  const done = items.filter(item => item.done)

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '0 0 40px' }}>
      <div className='page-header pb-5'>
        <div>
          <h1
            className='text-primary'
            style={{ fontSize: 24, fontWeight: 800, margin: 0 }}
          >
            {headerTitle}
          </h1>
          <div className='text-muted' style={{ fontSize: 13, marginTop: 4 }}>
            {headerSubtitle}
          </div>
        </div>
        <button className='btn btn-primary' onClick={onNewList}>
          <FigmaIcon name='plus' size={14} />
          {t('createList')}
        </button>
      </div>

      <div className='px-4 md:px-7'>
        <div
          className='figma-shopping-grid grid gap-5'
        >
          {/* List sidebar */}
          <div className='flex flex-col gap-2'>
            {visibleLists.map(list => {
              const isActive = list.id === currentList.id
              return (
                <button
                  key={list.id}
                  className='cursor-pointer rounded-lg p-3 text-start'
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
                  onClick={() => onSelectList(list.id)}
                >
                  <div className='flex items-center gap-2'>
                    <span style={{ fontSize: 18 }}>{list.emoji}</span>
                    <div className='min-w-0 flex-1'>
                      <div
                        className='truncate font-semibold'
                        style={{
                          fontSize: 13,
                          color: isActive ? 'var(--brand)' : 'var(--t-primary)',
                        }}
                      >
                        {list.name}
                      </div>
                      <div className='text-faint' style={{ fontSize: 11 }}>
                        {t('itemsRemaining', { count: list.remaining })}
                        {list.isShared && ` ${t('shared')}`}
                      </div>
                    </div>
                  </div>
                </button>
              )
            })}
            <button
              className='text-brand rounded-lg border-2 border-dashed p-3 text-center font-semibold'
              style={{
                borderColor: 'var(--line)',
                borderRadius: 'var(--r-lg)',
                fontSize: 12,
                cursor: 'pointer',
                background: 'transparent',
                fontFamily: 'var(--font-ui)',
              }}
              onClick={onNewList}
            >
              <FigmaIcon
                name='plus'
                size={13}
                style={{ display: 'inline', marginRight: 4 }}
              />
              {t('createList')}
            </button>
          </div>

          {/* List content */}
          <div>
            {/* List header */}
            <div className='mb-4 flex items-center justify-between'>
              <div>
                <div className='flex items-center gap-2'>
                  <span style={{ fontSize: 24 }}>{currentList.emoji}</span>
                  <div
                    className='text-primary font-bold'
                    style={{ fontSize: 20, margin: 0 }}
                  >
                    {currentList.name}
                  </div>
                  {currentList.isShared && (
                    <span
                      className='badge bg-brand-faint text-brand'
                      style={{ fontSize: 11 }}
                    >
                      {t('shared')}
                    </span>
                  )}
                </div>
                <div
                  className='text-muted'
                  style={{ fontSize: 12, marginTop: 2 }}
                >
                  {t('itemsRemaining', { count: todo.length })}
                  {done.length > 0 &&
                    ` · ${t('itemsChecked', { count: done.length })}`}
                </div>
              </div>
              {canEdit && done.length > 0 && (
                <button
                  className='btn btn-ghost btn-sm text-muted'
                  onClick={() => onClearDone()}
                >
                  {t('clearCompleted')}
                </button>
              )}
            </div>

            {/* Add item input */}
            {canEdit && (
              <div className='mb-4 flex gap-2'>
                <input
                  className='input flex-1'
                  placeholder={t('addItemPlaceholder')}
                  value={newItem}
                  onChange={event => setNewItem(event.target.value)}
                  onKeyDown={event =>
                    event.key === 'Enter' && addItem(currentList.id)
                  }
                />
                <button
                  className='btn btn-primary'
                  onClick={() => addItem(currentList.id)}
                  disabled={!newItem.trim()}
                >
                  <FigmaIcon name='plus' size={15} />
                  {t('addItem')}
                </button>
              </div>
            )}

            {/* Items */}
            <div className='card overflow-hidden'>
              {todo.length === 0 && done.length === 0 ? (
                <div className='empty-state'>
                  <div style={{ fontSize: 40 }}>{currentList.emoji}</div>
                  <div className='text-primary font-bold'>
                    {t('emptyItemsTitle')}
                  </div>
                  {canEdit && (
                    <div className='text-muted' style={{ fontSize: 13 }}>
                      {t('emptyItemsDescription')}
                    </div>
                  )}
                </div>
              ) : (
                <>
                  {todo.map(item => (
                    <div
                      key={item.id}
                      className='border-line flex items-center gap-3 border-b px-4 py-3'
                      style={{ borderColor: 'var(--line)' }}
                    >
                      <button
                        onClick={() => onToggleItem(item)}
                        disabled={!canEdit}
                        style={{
                          width: 22,
                          height: 22,
                          borderRadius: 6,
                          border: '2px solid var(--line-strong)',
                          background: 'transparent',
                          cursor: canEdit ? 'pointer' : 'default',
                          flexShrink: 0,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      />
                      <div className='min-w-0 flex-1'>
                        {editingId === item.id ? (
                          <input
                            className='input'
                            value={editText}
                            onChange={event => setEditText(event.target.value)}
                            onBlur={() => saveEdit(currentList.id, item)}
                            onKeyDown={event =>
                              event.key === 'Enter' &&
                              saveEdit(currentList.id, item)
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
                      </div>
                      {canEdit && (
                        <>
                          <button
                            className='btn btn-ghost btn-icon'
                            onClick={() => {
                              setEditingId(item.id)
                              setEditText(item.text)
                            }}
                          >
                            <FigmaIcon name='edit' size={13} />
                          </button>
                          <button
                            className='btn btn-ghost btn-icon text-sig-over'
                            onClick={() => onDeleteItem(item)}
                          >
                            <FigmaIcon name='trash' size={13} />
                          </button>
                        </>
                      )}
                    </div>
                  ))}

                  {done.length > 0 && (
                    <>
                      <div
                        className='border-line border-b px-4 py-2'
                        style={{
                          borderColor: 'var(--line)',
                          background: 'var(--surface-2)',
                        }}
                      >
                        <span
                          className='text-faint'
                          style={{ fontSize: 12, fontWeight: 700 }}
                        >
                          {t('checkedOffHeader', { count: done.length })}
                        </span>
                      </div>
                      {done.map(item => (
                        <div
                          key={item.id}
                          className='border-line flex items-center gap-3 border-b px-4 py-3'
                          style={{ borderColor: 'var(--line)', opacity: 0.7 }}
                        >
                          <button
                            onClick={() => onToggleItem(item)}
                            disabled={!canEdit}
                            style={{
                              width: 22,
                              height: 22,
                              borderRadius: 6,
                              border: '2px solid var(--sig-done)',
                              background: 'var(--sig-done)',
                              cursor: canEdit ? 'pointer' : 'default',
                              flexShrink: 0,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <FigmaIcon
                              name='check'
                              size={12}
                              style={{ color: 'white' }}
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
                          {canEdit && (
                            <button
                              className='btn btn-ghost btn-icon text-sig-over'
                              onClick={() => onDeleteItem(item)}
                            >
                              <FigmaIcon name='trash' size={13} />
                            </button>
                          )}
                        </div>
                      ))}
                    </>
                  )}
                </>
              )}
            </div>

            {/* Progress */}
            {items.length > 0 && (
              <div className='mt-3 flex items-center gap-3'>
                <div className='progress-track flex-1' style={{ height: 6 }}>
                  <div
                    className='progress-fill done'
                    style={{ width: `${(done.length / items.length) * 100}%` }}
                  />
                </div>
                <span className='text-muted font-mono' style={{ fontSize: 12 }}>
                  {done.length}/{items.length}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Solo state: promote family lists */}
        {isSolo && (
          <div
            className='card mt-5 flex items-center gap-4 p-5'
            style={{
              border: '1px dashed var(--brand)',
              borderRadius: 'var(--r-xl)',
            }}
          >
            <div style={{ fontSize: 32 }}>👨‍👩‍👧‍👦</div>
            <div>
              <div className='text-primary font-bold' style={{ fontSize: 14 }}>
                {t('shareWithFamilyTitle')}
              </div>
              <div
                className='text-muted'
                style={{ fontSize: 12, marginTop: 2 }}
              >
                {t('shareWithFamilyDescription')}
              </div>
            </div>
            <button
              className='btn btn-secondary ms-auto'
              style={{ whiteSpace: 'nowrap' }}
              onClick={onInviteMembers}
            >
              {t('inviteMembers')}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

FigmaShoppingScreen.propTypes = {
  activeId: PropTypes.string,
  canEdit: PropTypes.bool,
  headerSubtitle: PropTypes.string.isRequired,
  headerTitle: PropTypes.string.isRequired,
  isSolo: PropTypes.bool,
  lists: PropTypes.array.isRequired,
  onAddItem: PropTypes.func,
  onClearDone: PropTypes.func,
  onDeleteItem: PropTypes.func,
  onEditItem: PropTypes.func,
  onInviteMembers: PropTypes.func,
  onNewList: PropTypes.func.isRequired,
  onSelectList: PropTypes.func.isRequired,
  onToggleItem: PropTypes.func,
}

FigmaShoppingScreen.defaultProps = {
  activeId: null,
  canEdit: false,
  isSolo: false,
  onAddItem: () => {},
  onClearDone: () => {},
  onDeleteItem: () => {},
  onEditItem: () => {},
  onInviteMembers: () => {},
  onToggleItem: () => {},
}
