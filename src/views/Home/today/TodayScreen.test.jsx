// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest'

import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    i18n: { resolvedLanguage: 'en-US' },
    t: (key, options = {}) => {
      const values = {
        'homeToday.today': 'Today',
        'homeToday.dailyProgress': 'Daily progress',
        'homeToday.dailyProgressLabel': "Today's task completion progress",
        'homeToday.newTask': 'New task',
        'homeToday.forMe': 'For me',
        'homeToday.family': 'Family',
        'homeToday.toDo': 'To do',
        'homeToday.completed': 'Completed',
        'homeToday.markComplete': 'Mark complete',
        'homeToday.overdue': 'Overdue',
        'homeToday.nothingDueHeading': 'Nothing due today!',
        'homeToday.nothingDueSubtitle':
          'Enjoy your free time or add something new.',
        'homeToday.addTask': 'Add a task',
        'homeToday.familyProgressToday': 'Family progress today',
        'homeToday.acrossAllMembers': 'across all members',
        'homeToday.householdWorkload': 'Household workload',
        'homeToday.done': 'Done',
      }
      if (key === 'homeToday.tasksComplete')
        return `${options.done} of ${options.total} tasks complete`
      if (key === 'homeToday.todaysDone')
        return `Today's done (${options.count})`
      if (key === 'homeToday.doneCount') return `${options.count} done`
      return values[key] || key
    },
  }),
}))

const mockNavigate = vi.fn()
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}))

import TodayScreen from './TodayScreen'

afterEach(() => {
  cleanup()
  mockNavigate.mockReset()
})

const noop = vi.fn()

const baseTodo = [
  {
    id: 't1',
    choreId: '10',
    title: 'Wash dishes',
    status: 'todo',
    category: 'Kitchen',
    categoryColor: '#4326ea',
    dueDate: '2026-09-15',
    dueTime: '14:00',
    points: 5,
    isRecurring: true,
    assigneeId: '1',
  },
  {
    id: 't2',
    choreId: '11',
    title: 'Vacuum living room',
    status: 'todo',
    category: 'Home',
    categoryColor: '#0f763f',
    dueDate: '2026-09-15',
    points: 3,
    assigneeId: '1',
  },
]

const baseDone = [
  {
    id: 'd1',
    choreId: '12',
    title: 'Make bed',
    status: 'done',
    category: 'Home',
    categoryColor: '#0f763f',
    points: 2,
    assigneeId: '1',
  },
]

const baseOverdue = [
  {
    id: 'o1',
    choreId: '13',
    title: 'Pay electric bill',
    status: 'overdue',
    category: 'Admin',
    categoryColor: '#c52338',
    dueDate: '2026-09-10',
    points: 0,
    assigneeId: '1',
  },
]

const baseMembers = [
  {
    id: '1',
    name: 'Mohammed',
    initials: 'MO',
    color: 'var(--member-1)',
    isSelf: true,
  },
  {
    id: '2',
    name: 'Sarah',
    initials: 'SA',
    color: 'var(--member-2)',
  },
]

const baseHousehold = [
  {
    id: '1',
    name: 'Mohammed',
    initials: 'MO',
    color: 'var(--member-1)',
    tasks: 3,
    done: 1,
  },
  {
    id: '2',
    name: 'Sarah',
    initials: 'SA',
    color: 'var(--member-2)',
    tasks: 2,
    done: 2,
  },
]

const defaultProps = {
  done: baseDone,
  household: baseHousehold,
  makeTaskDone: noop,
  members: baseMembers,
  overdue: [],
  todayKey: '2026-09-15',
  todo: baseTodo,
}

describe('TodayScreen', () => {
  it('renders a dynamic localized date derived from todayKey', () => {
    render(<TodayScreen {...defaultProps} />)
    // en-US format: "Tuesday, September 15, 2026"
    expect(screen.getByText(/Tuesday.*September.*2026/i)).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Today' })).toBeVisible()
  })

  it('renders todo tasks from real props', () => {
    render(<TodayScreen {...defaultProps} />)
    expect(screen.getByText('Wash dishes')).toBeVisible()
    expect(screen.getByText('Vacuum living room')).toBeVisible()
    expect(screen.getByText('To do')).toBeVisible()
  })

  it('renders completed tasks after expanding the toggle', async () => {
    const user = userEvent.setup()
    render(<TodayScreen {...defaultProps} />)
    expect(screen.queryByText('Make bed')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /Today's done/ }))
    expect(screen.getByText('Make bed')).toBeVisible()
    expect(screen.getByText('Completed')).toBeVisible()
  })

  it('invokes the real completion callback when a task is completed', async () => {
    const user = userEvent.setup()
    render(<TodayScreen {...defaultProps} />)
    const completeButtons = screen.getAllByRole('button', {
      name: 'Mark complete',
    })
    await user.click(completeButtons[0])
    expect(noop).toHaveBeenCalledWith(
      expect.objectContaining({ id: 't1', choreId: '10' }),
    )
  })

  it('navigates to the correct chore route when a task is opened', async () => {
    const user = userEvent.setup()
    render(<TodayScreen {...defaultProps} />)
    await user.click(screen.getByRole('button', { name: 'Wash dishes' }))
    expect(mockNavigate).toHaveBeenCalledWith('/chores/10')
  })

  it('derives daily progress from live done and todo counts', () => {
    render(<TodayScreen {...defaultProps} />)
    const bar = screen.getByRole('progressbar', {
      name: "Today's task completion progress",
    })
    // 1 done, 3 total → 33%
    expect(bar).toHaveAttribute('aria-valuenow', '33')
    expect(bar).toHaveAttribute('aria-valuemin', '0')
    expect(bar).toHaveAttribute('aria-valuemax', '100')
    expect(screen.getByText('33%')).toBeVisible()
    expect(screen.getByText('1 of 3 tasks complete')).toBeVisible()
  })

  it('handles zero-task progress safely', () => {
    render(
      <TodayScreen
        {...defaultProps}
        done={[]}
        todo={[]}
        household={[
          {
            id: '1',
            name: 'Mohammed',
            initials: 'MO',
            color: 'var(--member-1)',
            tasks: 0,
            done: 0,
          },
        ]}
      />,
    )
    const bar = screen.getByRole('progressbar', {
      name: "Today's task completion progress",
    })
    expect(bar).toHaveAttribute('aria-valuenow', '0')
    expect(screen.getByText('0%')).toBeVisible()
    expect(screen.getByText('Nothing due today!')).toBeVisible()
  })

  it('renders household cards using real runtime member data', async () => {
    const user = userEvent.setup()
    render(<TodayScreen {...defaultProps} />)
    await user.click(screen.getByRole('tab', { name: 'Family' }))
    // Member cards show name + done/total
    expect(screen.getByText('1/3 done')).toBeInTheDocument()
    expect(screen.getByText('2/2 done')).toBeInTheDocument()
    // Workload section shows member names
    expect(screen.getByText('Household workload')).toBeVisible()
  })

  it('routes New Task to /chores/create', async () => {
    const user = userEvent.setup()
    render(<TodayScreen {...defaultProps} />)
    await user.click(screen.getByRole('button', { name: /New task/ }))
    expect(mockNavigate).toHaveBeenCalledWith('/chores/create')
  })

  it('renders overdue tasks in a dedicated banner', () => {
    render(<TodayScreen {...defaultProps} overdue={baseOverdue} />)
    expect(screen.getByText('Pay electric bill')).toBeVisible()
    // "Overdue" appears in the banner header and the task row
    expect(screen.getAllByText('Overdue').length).toBeGreaterThanOrEqual(1)
  })

  it('uses proper button semantics for task open and completion', () => {
    render(<TodayScreen {...defaultProps} />)
    // Completion buttons (one per todo task)
    const completeButtons = screen.getAllByRole('button', {
      name: 'Mark complete',
    })
    expect(completeButtons.length).toBe(2)
    expect(completeButtons[0]).toHaveAttribute('type', 'button')
    // Open button (aria-label = task title)
    expect(screen.getByRole('button', { name: 'Wash dishes' })).toHaveAttribute(
      'type',
      'button',
    )
  })
})
