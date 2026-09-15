// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest'

import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import ModalActions from '../components/common/ModalActions'
import FigmaMaintenanceScreen from './Maintenance/FigmaMaintenanceScreen'
import FigmaShoppingScreen from './ShoppingLists/FigmaShoppingScreen'
import FigmaActivityScreen from './User/FigmaActivityScreen'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    i18n: { resolvedLanguage: 'en-US' },
    t: (key, options = {}) => {
      const values = {
        'activity.account': 'Account',
        'activity.actions.completed': 'completed',
        'activity.empty.description': 'No events to show yet.',
        'activity.empty.title': 'No activity yet',
        'activity.filters.all': 'All',
        'activity.filters.goals': 'Goals',
        'activity.filters.rewards': 'Rewards',
        'activity.filters.streaks': 'Streaks',
        'activity.filters.tasks': 'Tasks',
        'activity.household': 'Household',
        'activity.points': '+{{count}} pts',
        'activity.subtitle': 'Activity for {{scope}}',
        'activity.system': 'Dydan',
        'activity.taskFallback': 'a task',
        'activity.title': 'Activity',
        cancel: 'Cancel',
        'maintenance.addItem': 'Add item',
        'maintenance.attentionDescription': 'Plan the next check or service.',
        'maintenance.everyDays': 'Every {{count}} days',
        'maintenance.itemsNeedAttention': '{{count}} items need attention',
        'maintenance.lastDoneLabel': 'Last done',
        'maintenance.markDone': 'Mark done',
        'maintenance.nextDueLabel': 'Next due',
        'maintenance.noSchedules': 'No schedules yet',
        'maintenance.noSchedulesDescription': 'Create your first schedule.',
        'maintenance.scheduleAction': 'Schedule',
        'maintenance.statusDueSoon': 'Due soon',
        'maintenance.statusOk': 'On track',
        'maintenance.statusOverdue': 'Overdue',
        addItem: 'Add item',
        addItemPlaceholder: 'Milk, batteries, dish soap…',
        checkedOffHeader: '{{count}} checked off',
        clearCompleted: 'Clear completed',
        createList: 'New list',
        deleteItem: 'Delete {{item}}',
        editItem: 'Edit {{item}}',
        emptyItemsDescription: 'Add the first item above.',
        emptyItemsTitle: 'Nothing on this list yet',
        itemsChecked: '{{count}} checked',
        itemsRemaining: '{{count}} remaining',
        noListsTitle: 'No shopping lists yet',
        shared: 'Shared',
        toggleItem: 'Toggle {{item}}',
      }
      if (key === 'activity.subtitle') {
        return `Activity for ${options.scope}`
      }
      if (key === 'maintenance.itemsNeedAttention') {
        return `${options.count} items need attention`
      }
      if (key === 'checkedOffHeader') {
        return `${options.count} checked off`
      }
      if (key === 'itemsRemaining') {
        return `${options.count} remaining`
      }
      if (key === 'itemsChecked') return `${options.count} checked`
      if (key === 'toggleItem') return `Toggle ${options.item}`
      if (key === 'editItem') return `Edit ${options.item}`
      if (key === 'deleteItem') return `Delete ${options.item}`
      if (key === 'activity.actions.completed') {
        return `completed ${options.name}`
      }
      return values[key] || key
    },
  }),
}))

afterEach(cleanup)

const noop = vi.fn()

describe('shopping list screen accessibility', () => {
  const lists = [
    {
      emoji: '🛒',
      id: 'list-1',
      isShared: false,
      items: [
        { done: false, id: 'item-1', text: 'Milk' },
        { done: true, id: 'item-2', text: 'Bread' },
      ],
      name: 'Groceries',
      remaining: 1,
    },
  ]
  const renderShopping = props =>
    render(
      <FigmaShoppingScreen
        activeId='list-1'
        canEdit
        headerSubtitle='Keep groceries organized'
        headerTitle='Shopping'
        isSolo={false}
        lists={lists}
        onAddItem={noop}
        onClearDone={noop}
        onDeleteItem={noop}
        onEditItem={noop}
        onInviteMembers={noop}
        onNewList={noop}
        onSelectList={noop}
        onToggleItem={noop}
        {...props}
      />,
    )

  it('exposes item toggles as checkboxes with their checked state', async () => {
    const onToggleItem = vi.fn()
    const user = userEvent.setup()
    renderShopping({ onToggleItem })

    const toggleMilk = screen.getByRole('checkbox', { name: 'Toggle Milk' })
    expect(toggleMilk).toHaveAttribute('aria-checked', 'false')
    expect(
      screen.getByRole('checkbox', { name: 'Toggle Bread' }),
    ).toHaveAttribute('aria-checked', 'true')

    await user.click(toggleMilk)
    expect(onToggleItem).toHaveBeenCalledWith(lists[0].items[0])
  })

  it('labels edit and delete actions and routes them to the right handlers', async () => {
    const onDeleteItem = vi.fn()
    const user = userEvent.setup()
    renderShopping({ onDeleteItem })

    await user.click(screen.getByRole('button', { name: 'Edit Milk' }))
    expect(screen.getByDisplayValue('Milk')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Delete Bread' }))
    expect(onDeleteItem).toHaveBeenCalledWith(lists[0].items[1])
  })
})

describe('activity screen row semantics', () => {
  it('renders non-interactive rows as plain content and source rows as buttons', async () => {
    const onOpenEvent = vi.fn()
    const user = userEvent.setup()
    render(
      <FigmaActivityScreen
        events={[
          {
            action: 'completed',
            category: 'completed',
            color: 'var(--sig-done)',
            icon: 'check',
            id: 'linked',
            relativeTime: '2h ago',
            source: { choreName: 'Clean kitchen', id: 1 },
          },
          {
            action: 'completed',
            category: 'completed',
            color: 'var(--sig-done)',
            icon: 'check',
            id: 'system',
            relativeTime: '3h ago',
          },
        ]}
        isSolo={false}
        onOpenEvent={onOpenEvent}
      />,
    )

    expect(screen.getByRole('button', { name: /Clean kitchen/ })).toBeVisible()
    expect(
      screen.queryByRole('button', { name: /3h ago/ }),
    ).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /Clean kitchen/ }))
    expect(onOpenEvent).toHaveBeenCalledWith({
      choreName: 'Clean kitchen',
      id: 1,
    })
  })
})

describe('maintenance screen statuses and actions', () => {
  it('summarizes needing attention and routes actions to handlers', async () => {
    const onMarkDone = vi.fn()
    const onSchedule = vi.fn()
    const user = userEvent.setup()
    const items = [
      {
        choreId: 1,
        description: 'Replace windshield wipers',
        icon: '🚗',
        id: 'asset-1',
        lastDone: '2026-01-05',
        name: 'Car',
        nextDue: '2026-03-05',
        status: 'overdue',
      },
      {
        icon: '🎛',
        id: 'asset-2',
        name: 'AC filter',
        status: 'ok',
      },
    ]
    render(
      <FigmaMaintenanceScreen
        items={items}
        onAddItem={noop}
        onMarkDone={onMarkDone}
        onSchedule={onSchedule}
        subtitle='Keep your household running'
        title='Maintenance'
      />,
    )

    expect(screen.getByText('1 items need attention')).toBeVisible()
    expect(screen.getByText('Overdue')).toBeVisible()
    expect(screen.getByText('On track')).toBeVisible()
    expect(screen.getByText('Replace windshield wipers')).toBeVisible()

    await user.click(screen.getByRole('button', { name: 'Mark done' }))
    expect(onMarkDone).toHaveBeenCalledWith(items[0])

    await user.click(
      within(screen.getByText('AC filter').closest('.card')).getByRole(
        'button',
        { name: 'Schedule' },
      ),
    )
    expect(onSchedule).toHaveBeenCalledWith(items[1])
  })
})

describe('dialog action layout', () => {
  it('keeps cancel before the primary action in the shared modal actions', () => {
    render(
      <ModalActions
        primary={{ label: 'Save', onClick: noop }}
        secondary={{ label: 'Cancel', onClick: noop }}
      />,
    )

    const buttons = screen.getAllByRole('button')
    expect(buttons.map(button => button.textContent)).toEqual([
      'Cancel',
      'Save',
    ])
  })
})
