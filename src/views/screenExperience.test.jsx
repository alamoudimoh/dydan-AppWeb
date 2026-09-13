// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest'

import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import AppModal from '../components/common/AppModal'
import FigmaAllTasksScreen from './Chores/FigmaAllTasksScreen'
import FigmaGoalsScreen from './FamilyProgress/FigmaGoalsScreen'
import FigmaProjectsScreen from './Projects/FigmaProjectsScreen'
import FigmaRoutinesScreen from './Routines/FigmaRoutinesScreen'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    i18n: { resolvedLanguage: 'en-US' },
    t: (key, options = {}) => {
      const values = {
        'detail.close': 'Close project details',
        'detail.completeTask': 'Complete task',
        'empty.addTask': 'Add task',
        'empty.title': 'No tasks yet',
        'familyProgress.createNewReward': 'Create new reward',
        'familyProgress.familyGoals': 'Family goals',
        'familyProgress.goalsProgressSubtitle': 'Track your progress',
        'familyProgress.goalsProgressTitle': 'Goals & Progress',
        'familyProgress.memberPoints': 'Your points',
        'familyProgress.newGoal': 'New goal',
        'familyProgress.noGoals': 'No family goals yet.',
        'familyProgress.rewards': 'Rewards',
        'familyProgress.rewardsAwait': 'Keep going',
        'familyProgress.tasks': 'tasks',
        'familyProgress.viewHistory': 'View history',
        'filters.active': 'Active',
        'filters.priority': 'Priority',
        'filters.status': 'Status',
        'list.addTask': 'Add task',
        'list.allTasks': 'All Tasks',
        'list.clearFilters': 'Clear filters',
        'list.clearSearch': 'Clear search',
        'list.clearTaskSearch': 'Clear task search',
        'list.createTask': 'Create a task',
        'list.dueLater': 'Due later',
        'list.noTasksMatchView': 'No tasks match this view',
        'list.noTasksYetDescription': 'Create your first task.',
        'list.overdue': 'Overdue',
        'list.searchTasks': 'Search tasks',
        'multiselect.all': 'All',
        'rewards.noRewards': 'No rewards yet',
        'routines.active': 'Active',
        'routines.archive': 'Archive',
        'routines.archived': 'Archived',
        'routines.createRoutine': 'Create routine',
        'routines.editRoutine': 'Edit routine',
        'routines.newRoutine': 'New routine',
        'routines.noRoutines': 'No routines yet',
        'routines.noRoutinesHint': 'Create a repeatable flow.',
        'routines.stepsInRoutine': 'Steps in routine',
        'routines.subtitle': 'Recurring daily and weekly flows',
        'routines.title': 'Routines',
        'routines.useRoutine': 'Use routine',
        'swipe.complete': 'Complete',
        'toolbar.assignee': 'Assignee',
        'toolbar.done': 'Done',
        'toolbar.everyone': 'Everyone',
        'toolbar.filters': 'Filters',
        'toolbar.groupBy': 'Group by',
        'toolbar.priority': 'Priority',
        'toolbar.status': 'Status',
      }
      if (key === 'filters.filterTasksCount') {
        return `${options.count} ${options.count === 1 ? 'task' : 'tasks'}`
      }
      if (key === 'list.nothingMatchesTerm') {
        return `Nothing matches ${options.term}`
      }
      if (key === 'routines.countTasks') return `${options.count} tasks`
      if (key === 'familyProgress.streakAndTasksCompleted') {
        return `${options.streak}-day streak · ${options.tasks} tasks completed`
      }
      return values[key] || key
    },
  }),
}))

afterEach(cleanup)

const noop = vi.fn()

describe('task screen interactions', () => {
  const chores = [
    { id: 'late', name: 'Overdue task', dueDate: '2000-01-01' },
    { id: 'later', name: 'Upcoming task', dueDate: '2999-01-01' },
  ]

  const renderTasks = props =>
    render(
      <FigmaAllTasksScreen
        chores={chores}
        members={[]}
        onComplete={noop}
        onCreate={noop}
        onOpen={noop}
        {...props}
      />,
    )

  it('toggles status summary filters and exposes the selected state', async () => {
    const user = userEvent.setup()
    renderTasks()
    const overdue = screen.getByRole('button', { name: '1 Overdue' })

    await user.click(overdue)
    expect(overdue).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByText('1 task')).toBeVisible()

    await user.click(overdue)
    expect(overdue).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByText('2 tasks')).toBeVisible()
  })

  it('clears a narrowed empty state instead of creating an unrelated task', async () => {
    const onCreate = vi.fn()
    const user = userEvent.setup()
    renderTasks({ onCreate })

    await user.type(
      screen.getByRole('textbox', { name: 'Search tasks' }),
      'none',
    )
    await user.click(screen.getByRole('button', { name: 'Clear search' }))

    expect(screen.getByRole('button', { name: 'Overdue task' })).toBeVisible()
    expect(onCreate).not.toHaveBeenCalled()
  })
})

describe('project screen interactions', () => {
  it('uses a selectable project button and routes Add task through its own action', async () => {
    const onAddTask = vi.fn()
    const onNewProject = vi.fn()
    const project = {
      color: '#4326ea',
      description: 'Shared work',
      id: 'project-1',
      name: 'Kitchen',
      progress: 0,
      status: 'active',
      taskCount: 0,
    }
    const user = userEvent.setup()
    render(
      <FigmaProjectsScreen
        canCreate
        canManageProject={() => false}
        chores={[]}
        members={[]}
        onAddTask={onAddTask}
        onCompleteTask={noop}
        onDeleteProject={noop}
        onEditProject={noop}
        onNewProject={onNewProject}
        onOpenTask={noop}
        projects={[project]}
      />,
    )

    const projectButton = screen.getByRole('button', { name: /Kitchen/ })
    await user.click(projectButton)
    expect(projectButton).toHaveAttribute('aria-pressed', 'true')

    await user.click(screen.getAllByRole('button', { name: 'Add task' })[0])
    expect(onAddTask).toHaveBeenCalledWith(project)
    expect(onNewProject).not.toHaveBeenCalled()
  })
})

describe('routine and goal screen hierarchy', () => {
  it('allows the initially expanded routine to remain collapsed', async () => {
    const user = userEvent.setup()
    render(
      <FigmaRoutinesScreen
        canArchive
        canCreate
        members={[]}
        onEditRoutine={noop}
        onNewRoutine={noop}
        onSetActive={noop}
        onUseRoutine={noop}
        packs={[
          {
            id: 'morning',
            isActive: true,
            items: [{ frequencyType: 'daily', name: 'Open curtains' }],
            name: 'Morning',
          },
        ]}
      />,
    )

    const trigger = screen.getByRole('button', { name: /Morning/ })
    expect(trigger).toHaveAttribute('aria-expanded', 'true')
    await user.click(trigger)
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByText('Open curtains')).not.toBeInTheDocument()
  })

  it('hides routine creation from a user without management permission', () => {
    render(
      <FigmaRoutinesScreen
        canArchive={false}
        canCreate={false}
        members={[]}
        onEditRoutine={noop}
        onNewRoutine={noop}
        onSetActive={noop}
        onUseRoutine={noop}
        packs={[]}
      />,
    )

    expect(
      screen.queryByRole('button', { name: 'Create routine' }),
    ).not.toBeInTheDocument()
  })

  it('avoids a duplicate page heading when Goals is embedded in Family Progress', () => {
    render(
      <FigmaGoalsScreen
        balance={{ currentBalance: 0, spendableBalance: 0 }}
        canManageGoals
        canManageRewards={false}
        embedded
        goals={[]}
        onArchiveGoal={noop}
        onCreateGoal={noop}
        onCreateReward={noop}
        onEditGoal={noop}
        onRequestReward={noop}
        onViewHistory={noop}
        rewards={[]}
        tasksCompleted={0}
      />,
    )

    expect(
      screen.queryByRole('heading', { level: 1, name: 'Goals & Progress' }),
    ).not.toBeInTheDocument()
    expect(screen.getByText('No family goals yet.')).toBeVisible()
    expect(screen.getByText('No rewards yet')).toBeVisible()
    expect(screen.getAllByRole('button', { name: 'New goal' })).toHaveLength(1)
  })
})

describe('dialog action layout', () => {
  it('keeps the modal body and footer in a constrained flex panel', () => {
    render(
      <AppModal
        footer={<button type='button'>Save</button>}
        onClose={noop}
        open
        title='Edit routine'
      >
        <div>Routine fields</div>
      </AppModal>,
    )

    expect(screen.getByRole('dialog', { name: 'Edit routine' })).toHaveStyle({
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    })
    expect(screen.getByRole('button', { name: 'Save' })).toBeVisible()
  })
})
