import { useState } from 'react'

import { AppCtx, Icon } from '../App'
import { EntityRow, PanelCard } from '../components/page'
import { PageFlow } from '../components/page'
import {
  EntityList,
  InlineEmptyState,
  PageEmptyState,
  PageSection,
  PageShell,
  PageTabs,
} from '../components/page'
import PageHeader from '../components/PageHeader'
import { useLocalization } from '../contexts/LocalizationContext'
import { ShoppingItem, ShoppingList } from '../data'
import { useShoppingLists, useShoppingMutations } from '../hooks/useHousehold'
import { useLiveData } from '../model/liveData'

type ShoppingTab = 'lists' | 'items' | 'overview'

// The list editor, cross-list view, and grouped overview deliberately remain in
// one screen module so every mutation continues to share the selected-list state.
// eslint-disable-next-line max-lines-per-function
export default function ShoppingScreen({
  ctx,
  isSolo,
}: {
  ctx: AppCtx
  isSolo: boolean
}) {
  const { t } = useLocalization()
  const tr = t
  const { memberById, shoppingLists } = useLiveData()
  // LiveData intentionally exposes normalized domain objects. Observe the
  // underlying query as well so a failed request is never rendered as a valid
  // empty account merely because LiveData's normalized fallback is [].
  const shoppingQuery = useShoppingLists()
  const shoppingMutations = useShoppingMutations()
  const [tab, setTab] = useState<ShoppingTab>('lists')
  const [activeListId, setActiveListId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editText, setEditText] = useState('')
  const [isEditingList, setIsEditingList] = useState(false)
  const [editListName, setEditListName] = useState('')

  const visibleLists = isSolo
    ? shoppingLists.filter(list => !list.isShared)
    : shoppingLists
  const activeId = visibleLists.some(list => list.id === activeListId)
    ? activeListId
    : (visibleLists[0]?.id ?? null)
  const currentList = visibleLists.find(list => list.id === activeId)
  const allItems = visibleLists.flatMap(list =>
    list.items.map(item => ({ item, list })),
  )

  const openCreateList = () =>
    ctx.openCreate('shopping-list', {
      allowShared: !isSolo,
      onCreated: list => {
        const created = list as { id?: number | string }
        if (created?.id !== undefined) setActiveListId(String(created.id))
      },
    })

  const numericId = (value: string, errorKey: string) => {
    const id = Number(value)
    if (!Number.isFinite(id)) {
      ctx.showToast(tr(errorKey))
      return null
    }
    return id
  }

  const toggleItem = (list: ShoppingList, item: ShoppingItem) => {
    const listId = numericId(list.id, 'shopping.error.invalidList')
    const itemId = numericId(item.id, 'shopping.error.invalidItem')
    if (listId === null || itemId === null) return
    shoppingMutations.toggleItem.mutate(
      { listId, itemId, checked: !item.done },
      { onError: error => ctx.showToast(error.message) },
    )
  }

  const removeItem = (list: ShoppingList, item: ShoppingItem) => {
    const listId = numericId(list.id, 'shopping.error.invalidList')
    const itemId = numericId(item.id, 'shopping.error.invalidItem')
    if (listId === null || itemId === null) return
    shoppingMutations.removeItem.mutate(
      { listId, itemId },
      { onError: error => ctx.showToast(error.message) },
    )
  }

  const clearDone = (list: ShoppingList) => {
    const listId = numericId(list.id, 'shopping.error.invalidList')
    if (listId === null) return
    shoppingMutations.clearCompleted.mutate(listId, {
      onError: error => ctx.showToast(error.message),
      onSuccess: () => ctx.showToast(tr('shopping.toast.completedCleared')),
    })
  }

  const saveEdit = (list: ShoppingList, item: ShoppingItem) => {
    if (!editText.trim()) return
    const listId = numericId(list.id, 'shopping.error.invalidList')
    const itemId = numericId(item.id, 'shopping.error.invalidItem')
    if (listId === null || itemId === null) return
    shoppingMutations.updateItem.mutate(
      { listId, itemId, name: editText.trim() },
      {
        onError: error => ctx.showToast(error.message),
        onSuccess: () => setEditingId(null),
      },
    )
  }

  const listSummary = (list: ShoppingList) => {
    const completed = list.items.filter(item => item.done).length
    const remaining = list.items.length - completed
    return [
      tr('shopping.count.remaining', { count: remaining }),
      completed ? tr('shopping.count.completed', { count: completed }) : null,
      list.isShared ? tr('shopping.shared') : null,
    ]
      .filter(Boolean)
      .join(' · ')
  }

  const checkButton = (list: ShoppingList, item: ShoppingItem) => (
    <button
      type='button'
      className={`shopping-item-check ${item.done ? 'is-checked' : ''}`}
      aria-label={tr('shopping.toggleItem', { item: item.text })}
      aria-pressed={item.done}
      onClick={() => toggleItem(list, item)}
    >
      {item.done ? <Icon name='check' size={14} /> : null}
    </button>
  )

  const contextualItemRow = (
    list: ShoppingList,
    item: ShoppingItem,
    showParent: boolean,
  ) => (
    <div
      key={`${list.id}-${item.id}`}
      className='shopping-item-row'
      data-testid='shopping-item-row'
    >
      {checkButton(list, item)}
      <div className='flex-1 min-w-0'>
        <div
          className={item.done ? 'text-muted' : 'text-primary'}
          style={{
            fontSize: 14,
            textDecoration: item.done ? 'line-through' : undefined,
          }}
        >
          {item.text}
          {item.quantity ? (
            <span className='text-faint'> · {item.quantity}</span>
          ) : null}
        </div>
        {showParent ? (
          <div className='flex items-center gap-1 text-muted mt-0.5'>
            <Icon name='shopping' size={11} />
            <span style={{ fontSize: 11 }}>{list.name}</span>
          </div>
        ) : null}
      </div>
    </div>
  )

  const zeroLists = (
    <PageEmptyState
      testId='shopping-zero-lists'
      icon='shopping'
      title={tr('shopping.empty.noListsTitle')}
      description={tr('shopping.empty.noListsDescription')}
    />
  )

  const renderListDetail = (list: ShoppingList) => {
    const todo = list.items.filter(item => !item.done)
    const done = list.items.filter(item => item.done)

    if (isEditingList) {
      return (
        <PanelCard testId='shopping-list-detail' variant='standard'>
          <div className='flex items-center justify-between mb-4'>
            <h2 className='form-title text-primary' style={{ margin: 0 }}>
              {tr('shopping.modifyList')}
            </h2>
            <button
              type='button'
              className='btn btn-ghost btn-icon'
              aria-label={tr('action.close')}
              onClick={() => setIsEditingList(false)}
            >
              <Icon name='x' size={16} />
            </button>
          </div>
          <label className='section-label' htmlFor='shopping-edit-list-name'>
            {tr('create.shoppingList.nameLabel')}
          </label>
          <input
            id='shopping-edit-list-name'
            className='input w-full'
            value={editListName}
            autoFocus
            onChange={event => setEditListName(event.target.value)}
          />
          <div className='flex items-center justify-between gap-2 flex-wrap mt-4 pt-4 border-t border-line'>
            <button
              type='button'
              className='btn btn-ghost text-sig-over px-2'
              onClick={() =>
                ctx.showConfirm({
                  title: tr('shopping.deleteList'),
                  message: tr('shopping.deleteListConfirm', {
                    name: list.name,
                  }),
                  confirmLabel: tr('shopping.delete'),
                  danger: true,
                  onConfirm: () => {
                    const id = numericId(list.id, 'shopping.error.invalidList')
                    if (id === null) return
                    shoppingMutations.deleteList.mutate(id, {
                      onError: error => ctx.showToast(error.message),
                      onSuccess: () => {
                        setIsEditingList(false)
                        setActiveListId(null)
                        ctx.showToast(tr('shopping.toast.listDeleted'))
                      },
                    })
                  },
                })
              }
            >
              {tr('shopping.deleteList')}
            </button>
            <div className='flex gap-2'>
              <button
                type='button'
                className='btn btn-ghost'
                onClick={() => setIsEditingList(false)}
              >
                {tr('action.cancel')}
              </button>
              <button
                type='button'
                className='btn btn-primary'
                disabled={!editListName.trim()}
                onClick={() => {
                  const id = numericId(list.id, 'shopping.error.invalidList')
                  if (id === null || !editListName.trim()) return
                  shoppingMutations.updateList.mutate(
                    { id, name: editListName.trim() },
                    {
                      onError: error => ctx.showToast(error.message),
                      onSuccess: () => {
                        setIsEditingList(false)
                        ctx.showToast(tr('shopping.toast.listUpdated'))
                      },
                    },
                  )
                }}
              >
                {tr('shopping.saveChanges')}
              </button>
            </div>
          </div>
        </PanelCard>
      )
    }

    return (
      <section data-testid='shopping-list-detail'>
        <PageSection>
          <div className='shopping-list-actions'>
            <div className='flex items-start gap-3 min-w-0 shopping-detail-identity'>
              <div className='shopping-entity-icon'>
                <Icon name='shopping' size={18} />
              </div>
              <div className='min-w-0'>
                <div className='flex items-center gap-2 flex-wrap'>
                  <h2 className='text-primary font-bold' style={{ margin: 0 }}>
                    {list.name}
                  </h2>
                  {list.isShared ? (
                    <span className='badge bg-brand-faint text-brand'>
                      {tr('shopping.shared')}
                    </span>
                  ) : null}
                </div>
                <div className='text-muted mt-0.5' style={{ fontSize: 12 }}>
                  {listSummary(list)}
                </div>
              </div>
            </div>
            <div className='shopping-list-action-controls'>
              {done.length ? (
                <button
                  type='button'
                  className='btn btn-ghost btn-sm text-muted'
                  onClick={() => clearDone(list)}
                >
                  {tr('shopping.clearCompleted')}
                </button>
              ) : null}
              <button
                type='button'
                className='btn btn-secondary btn-sm'
                onClick={() => {
                  setEditListName(list.name)
                  setIsEditingList(true)
                }}
              >
                <Icon name='edit' size={14} />
                {tr('shopping.modify')}
              </button>
              <button
                type='button'
                className='btn btn-primary'
                onClick={() =>
                  ctx.openCreate('shopping-item', { listId: list.id })
                }
              >
                <Icon name='shopping_item' size={15} />
                {tr('create.shoppingItem.title')}
              </button>
            </div>
          </div>
        </PageSection>
        <PageSection>
          <PanelCard variant='flush'>
            {list.items.length === 0 ? (
              <InlineEmptyState
                testId='shopping-zero-items'
                icon='shopping_item'
                title={tr('shopping.empty.listTitle')}
                description={tr('shopping.empty.listDescription')}
              />
            ) : (
              <>
                {todo.map(item => {
                  const addedBy = item.addedById
                    ? memberById(item.addedById)
                    : null
                  return (
                    <div
                      key={item.id}
                      className='shopping-item-row'
                      data-testid='shopping-list-item'
                    >
                      {checkButton(list, item)}
                      <div className='flex-1 min-w-0'>
                        {editingId === item.id ? (
                          <input
                            className='input w-full'
                            value={editText}
                            autoFocus
                            onChange={event => setEditText(event.target.value)}
                            onBlur={() => saveEdit(list, item)}
                            onKeyDown={event => {
                              if (event.key === 'Enter') saveEdit(list, item)
                            }}
                            style={{ padding: '3px 8px', fontSize: 14 }}
                          />
                        ) : (
                          <div
                            className='text-primary'
                            style={{ fontSize: 14 }}
                          >
                            {item.text}
                            {item.quantity ? (
                              <span className='text-faint'>
                                {' '}
                                · {item.quantity}
                              </span>
                            ) : null}
                          </div>
                        )}
                        {addedBy && list.isShared ? (
                          <div
                            className='text-faint mt-0.5'
                            style={{ fontSize: 10 }}
                          >
                            {tr('shopping.addedBy', { name: addedBy.name })}
                          </div>
                        ) : null}
                      </div>
                      <button
                        type='button'
                        className='btn btn-ghost btn-icon'
                        aria-label={tr('shopping.editItem', {
                          item: item.text,
                        })}
                        onClick={() => {
                          setEditingId(item.id)
                          setEditText(item.text)
                        }}
                      >
                        <Icon name='edit' size={13} />
                      </button>
                      <button
                        type='button'
                        className='btn btn-ghost btn-icon text-sig-over'
                        aria-label={tr('shopping.deleteItem', {
                          item: item.text,
                        })}
                        onClick={() => removeItem(list, item)}
                      >
                        <Icon name='trash' size={13} />
                      </button>
                    </div>
                  )
                })}
                {done.length ? (
                  <div className='shopping-completed-section'>
                    <div className='shopping-completed-heading'>
                      {tr('shopping.checkedOff', { count: done.length })}
                    </div>
                    {done.map(item => contextualItemRow(list, item, false))}
                  </div>
                ) : null}
              </>
            )}
          </PanelCard>
        </PageSection>
      </section>
    )
  }

  const renderListsTab = () => {
    if (!visibleLists.length) return zeroLists
    return (
      <div className='shopping-lists-grid' data-testid='shopping-lists-tab'>
        <div
          className='shopping-mobile-context'
          data-testid='shopping-mobile-context'
        >
          <label className='section-label' htmlFor='shopping-list-switcher'>
            {tr('shopping.tabs.lists')}
          </label>
          <select
            id='shopping-list-switcher'
            className='input w-full'
            value={activeId ?? ''}
            onChange={event => {
              setActiveListId(event.target.value)
              setIsEditingList(false)
            }}
          >
            {visibleLists.map(list => (
              <option key={list.id} value={list.id}>
                {list.name}
              </option>
            ))}
          </select>
          {currentList ? (
            <div className='text-muted shopping-mobile-summary'>
              {listSummary(currentList)}
            </div>
          ) : null}
        </div>
        <EntityList testId='shopping-list-cards'>
          {visibleLists.map(list => (
            <EntityRow
              key={list.id}
              aria-selected={list.id === activeId}
              onClick={() => {
                setActiveListId(list.id)
                setIsEditingList(false)
              }}
            >
              <div className='shopping-entity-icon'>
                <Icon name='shopping' size={17} />
              </div>
              <div className='flex-1 min-w-0'>
                <div className='font-semibold text-primary truncate'>
                  {list.name}
                </div>
                <div className='text-muted mt-0.5' style={{ fontSize: 11 }}>
                  {listSummary(list)}
                </div>
              </div>
            </EntityRow>
          ))}
        </EntityList>
        <div className='min-w-0'>
          {currentList && renderListDetail(currentList)}
        </div>
      </div>
    )
  }

  const renderItemsTab = () => {
    if (!visibleLists.length) return zeroLists
    if (!allItems.length)
      return (
        <PageEmptyState
          testId='shopping-zero-all-items'
          icon='shopping_item'
          title={tr('shopping.empty.allItemsTitle')}
          description={tr('shopping.empty.allItemsDescription')}
        />
      )
    return (
      <PanelCard testId='shopping-items-tab' variant='flush'>
        {allItems.map(({ item, list }) => contextualItemRow(list, item, true))}
      </PanelCard>
    )
  }

  const renderOverviewTab = () => {
    if (!visibleLists.length) return zeroLists
    return (
      <PageSection testId='shopping-overview-tab'>
        {visibleLists.map(list => (
          <PanelCard
            key={list.id}
            testId='shopping-overview-group'
            variant='flush'
          >
            <div className='shopping-overview-heading'>
              <div className='shopping-entity-icon'>
                <Icon name='shopping' size={17} />
              </div>
              <div className='flex-1 min-w-0'>
                <h2 className='text-primary font-bold' style={{ margin: 0 }}>
                  {list.name}
                </h2>
                <div className='text-muted' style={{ fontSize: 11 }}>
                  {listSummary(list)}
                </div>
              </div>
              {list.isShared ? (
                <span className='badge bg-brand-faint text-brand'>
                  {tr('shopping.shared')}
                </span>
              ) : null}
            </div>
            {list.items.length ? (
              <div data-testid='shopping-overview-items'>
                {list.items.map(item => contextualItemRow(list, item, false))}
              </div>
            ) : (
              <InlineEmptyState
                icon='shopping'
                title={tr('shopping.empty.group')}
                testId='shopping-overview-zero-items'
              />
            )}
          </PanelCard>
        ))}
      </PageSection>
    )
  }

  return (
    <PageShell
      testId='shopping-page'
      header={
        <PageHeader
          title={tr('nav.shopping')}
          subtitle={
            isSolo
              ? tr('shopping.page.subtitleSolo')
              : tr('shopping.page.subtitleFamily')
          }
          primaryAction={{
            label: tr('create.shoppingList.title'),
            icon: 'shopping',
            onClick: openCreateList,
            testId: 'shopping-create-list',
          }}
        />
      }
    >
      <PageFlow
        navigation={
          <PageTabs
            ariaLabel={tr('shopping.sectionsLabel')}
            testId='shopping-tabs'
            value={tab}
            onChange={id => setTab(id as ShoppingTab)}
            tabs={[
              { id: 'lists', label: tr('shopping.tabs.lists') },
              { id: 'items', label: tr('shopping.tabs.items') },
              { id: 'overview', label: tr('shopping.tabs.overview') },
            ]}
          />
        }
        secondary={
          isSolo ? (
            <PageSection>
              <aside
                className='shopping-share-row'
                data-testid='shopping-sharing-action'
              >
                <Icon name='users' size={20} />
                <div className='flex-1 min-w-0'>
                  <div
                    className='font-semibold text-primary'
                    style={{ fontSize: 13 }}
                  >
                    {tr('shopping.sharing.title')}
                  </div>
                  <div className='text-muted' style={{ fontSize: 11 }}>
                    {tr('shopping.sharing.description')}
                  </div>
                </div>
                <button
                  type='button'
                  className='btn btn-ghost btn-sm'
                  onClick={() => ctx.navigate('settings')}
                >
                  {tr('shopping.sharing.action')}
                </button>
              </aside>
            </PageSection>
          ) : null
        }
      >
        <PageSection testId='shopping-active-content'>
          {shoppingQuery.isPending ? (
            <PanelCard testId='shopping-loading' variant='standard'>
              <InlineEmptyState
                icon='shopping'
                title={tr('shopping.loading')}
              />
            </PanelCard>
          ) : shoppingQuery.isError ? (
            <PanelCard
              role='alert'
              testId='shopping-load-error'
              variant='standard'
            >
              <InlineEmptyState
                icon='shopping'
                title={tr('shopping.error.loadTitle')}
                description={tr('shopping.error.loadDescription')}
                action={
                  <button
                    type='button'
                    className='btn btn-secondary mt-2'
                    onClick={() => shoppingQuery.refetch()}
                  >
                    {tr('shopping.retry')}
                  </button>
                }
              />
            </PanelCard>
          ) : tab === 'lists' ? (
            renderListsTab()
          ) : tab === 'items' ? (
            renderItemsTab()
          ) : (
            renderOverviewTab()
          )}
        </PageSection>
      </PageFlow>
    </PageShell>
  )
}
