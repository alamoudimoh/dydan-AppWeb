// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest'

import { CssVarsProvider } from '@mui/joy'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const progressMocks = vi.hoisted(() => ({
  canManage: true,
  mutate: vi.fn(),
  goalsState: {
    data: {
      canManage: true,
      goals: [
        {
          id: 5,
          name: 'Home Focus',
          metricType: 'CATEGORY_COMPLETIONS',
          categoryId: 7,
          target: 10,
          progress: 7,
          percent: 70,
          status: 'ACTIVE',
          startDate: '2026-08-01T00:00:00Z',
          endDate: '2026-09-01T00:00:00Z',
        },
      ],
    },
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
  },
}))

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key, options) => {
      const values = {
        'familyProgress.title': 'Family Progress',
        'familyProgress.subtitle': 'Visibility and shared progress.',
        'familyProgress.workload': 'Workload',
        'familyProgress.insights': 'Insights',
        'familyProgress.goals': 'Goals',
        'familyProgress.unassigned': 'Unassigned',
        'familyProgress.workByCategory': 'Work by category',
        'familyProgress.rewardActivity': 'Reward activity',
        'familyProgress.maintenance': 'Maintenance',
        'familyProgress.currentStreak': 'current streak',
        'familyProgress.bestStreak': 'best streak',
        'familyProgress.createGoal': 'Create family goal',
        'familyProgress.archive': 'Archive',
        'familyProgress.goalsLoadError': 'Family goals could not be loaded.',
        'familyProgress.retry': 'Retry',
        edit: 'Edit',
      }
      if (key === 'familyProgress.days') return `${options.count} days`
      return values[key] || key
    },
  }),
}))

vi.mock('../../queries/ProgressQueries', () => ({
  useWorkload: () => ({
    data: {
      canViewFamily: true,
      members: [
        {
          userId: 1,
          name: 'Mohammed',
          today: 2,
          overdue: 1,
          upcoming: 5,
        },
      ],
      unassigned: 3,
      categories: [{ categoryId: 7, name: 'Home', count: 8 }],
      tasks: [{ id: 42, name: 'Change filter', assignedTo: 1, categoryId: 7 }],
    },
    isLoading: false,
  }),
  useReport: () => ({
    data: {
      completed: 18,
      overdue: 3,
      points: { earned: 50, redeemed: 20, available: 30 },
      maintenance: { completed: 2, overdue: 1, approaching: 3 },
      insights: ['18 tasks were completed in this period.'],
      categories: [{ id: 7, name: 'Home', count: 18 }],
      members: [{ id: 1, name: 'Mohammed', count: 18 }],
      rewards: [{ status: 'approved', count: 1 }],
      canViewFamily: true,
    },
    isLoading: false,
  }),
  useStreak: () => ({
    data: { current: 6, best: 9, rule: 'Free days are neutral.' },
  }),
  useGoals: () => ({
    ...progressMocks.goalsState,
    data: {
      ...progressMocks.goalsState.data,
      canManage: progressMocks.canManage,
    },
  }),
  useGoalMutation: () => ({
    mutate: progressMocks.mutate,
    isPending: false,
  }),
}))

vi.mock('../../queries/UserQueries', () => ({
  useUserProfile: () => ({ data: { id: 1, name: 'Mohammed' } }),
  useCircleMembers: () => ({
    data: { res: [{ userId: 1, role: 'admin', displayName: 'Mohammed' }] },
  }),
}))

vi.mock('../../queries/ChoreQueries', () => ({
  useChores: () => ({ data: { res: [] } }),
}))

vi.mock('../../queries/RewardQueries', () => ({
  useMyRewardRequests: () => ({
    data: { balance: { currentBalance: 0, spendableBalance: 0 } },
  }),
  useRewardMutation: () => ({ mutate: vi.fn(), mutateAsync: vi.fn() }),
  useRewards: () => ({ data: { res: [] } }),
}))

vi.mock('../Rewards/RewardsView', () => ({
  RewardEditor: () => null,
}))

import FamilyProgress from './FamilyProgress'

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

const renderPage = () =>
  render(
    <MemoryRouter>
      <CssVarsProvider>
        <FamilyProgress />
      </CssVarsProvider>
    </MemoryRouter>,
  )

describe('Family Progress', () => {
  beforeEach(() => {
    progressMocks.canManage = true
    progressMocks.mutate.mockReset()
    progressMocks.goalsState = {
      data: {
        canManage: true,
        goals: [
          {
            id: 5,
            name: 'Home Focus',
            metricType: 'CATEGORY_COMPLETIONS',
            categoryId: 7,
            target: 10,
            progress: 7,
            percent: 70,
            status: 'ACTIVE',
            startDate: '2026-08-01T00:00:00Z',
            endDate: '2026-09-01T00:00:00Z',
          },
        ],
      },
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    }
  })
  afterEach(cleanup)

  it('shows traceable workload, unassigned work, categories, and streaks', () => {
    renderPage()
    expect(
      screen.getByRole('heading', { name: 'Family Progress' }),
    ).toBeVisible()
    expect(screen.getByText('Mohammed')).toBeVisible()
    expect(screen.getByText('Change filter')).toHaveAttribute(
      'href',
      '/chores/42',
    )
    expect(screen.getByText('Unassigned')).toBeVisible()
    expect(screen.getAllByText('Home')[0]).toBeVisible()
    expect(screen.getByText('6 days')).toBeVisible()
    expect(screen.getByText('9 days')).toBeVisible()
  })

  it('shows factual reports and authoritative accounting summaries', async () => {
    const user = userEvent.setup()
    renderPage()
    await user.click(screen.getByRole('tab', { name: /Insights/ }))
    expect(
      screen.getByText('18 tasks were completed in this period.'),
    ).toBeVisible()
    expect(screen.getByText('Reward activity')).toBeVisible()
    expect(screen.getByText('Maintenance')).toBeVisible()
  })

  it('hides goal administration from ordinary members', async () => {
    progressMocks.canManage = false
    const user = userEvent.setup()
    renderPage()
    await user.click(screen.getByRole('tab', { name: /Goals/ }))
    expect(screen.getByText('Home Focus')).toBeVisible()
    expect(
      screen.queryByRole('button', { name: 'Create family goal' }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Archive' }),
    ).not.toBeInTheDocument()
  })

  it('shows an isolated goals error without crashing the page', async () => {
    progressMocks.goalsState = {
      data: undefined,
      isLoading: false,
      isError: true,
      error: new Error('Goals unavailable'),
      refetch: vi.fn(),
    }
    const user = userEvent.setup()
    renderPage()
    await user.click(screen.getByRole('tab', { name: /Goals/ }))
    expect(screen.getByText('Goals unavailable')).toBeVisible()
    expect(screen.getByRole('button', { name: 'Retry' })).toBeVisible()
  })

  it('archives an active goal without deleting its history', async () => {
    const user = userEvent.setup()
    renderPage()
    await user.click(screen.getByRole('tab', { name: /Goals/ }))
    await user.click(screen.getByRole('button', { name: 'Archive' }))
    expect(progressMocks.mutate).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 5,
        data: expect.objectContaining({ status: 'ARCHIVED' }),
      }),
    )
  })
})
