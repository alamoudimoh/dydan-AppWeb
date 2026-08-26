// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest'

import { CssVarsProvider } from '@mui/joy'
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import SmartInsightsCard from './SmartInsightsCard'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key, options) => {
      const values = {
        'sideCards.smartInsights': 'Smart Insights',
        'sideCards.quickActions': 'Quick actions based on your tasks',
        'sideCards.overdue': 'Overdue',
      }
      if (key === 'sideCards.overdueDescription') {
        return `${options.count} task is overdue`
      }
      return values[key] || key
    },
  }),
}))

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

afterEach(cleanup)

describe('SmartInsightsCard', () => {
  it('does not render when there are no insights', () => {
    const { container } = render(
      <SmartInsightsCard
        applyTempFilter={vi.fn()}
        chores={[]}
        clearTempFilter={vi.fn()}
      />,
    )

    expect(container).toBeEmptyDOMElement()
  })

  it('renders detected insights without crashing', () => {
    render(
      <CssVarsProvider>
        <SmartInsightsCard
          applyTempFilter={vi.fn()}
          chores={[
            {
              id: 1,
              name: 'Overdue task',
              nextDueDate: '2020-01-01T00:00:00Z',
            },
          ]}
          clearTempFilter={vi.fn()}
        />
      </CssVarsProvider>,
    )

    expect(screen.getByText('Smart Insights')).toBeVisible()
    expect(screen.getByText('Overdue')).toBeVisible()
  })
})
