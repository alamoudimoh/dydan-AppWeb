// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest'

import { Button, CssVarsProvider } from '@mui/joy'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import PropTypes from 'prop-types'
import React from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const categoryMocks = vi.hoisted(() => ({
  categories: [
    { id: 7, name: 'Car', archivedAt: null },
    { id: 8, name: 'Home', archivedAt: null },
  ],
  create: vi.fn(),
}))

vi.mock('../../queries/CategoryQueries', () => ({
  useCategories: () => ({ data: categoryMocks.categories }),
  useCategoryActions: () => ({
    create: { isPending: false, mutateAsync: categoryMocks.create },
  }),
}))

import CategoryPickerField from './CategoryPickerField'

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

const TaskHarness = ({ initialCategory = null, onSave }) => {
  const [categoryId, setCategoryId] = React.useState(initialCategory)
  return (
    <CssVarsProvider>
      <CategoryPickerField value={categoryId} onChange={setCategoryId} />
      <Button
        onClick={() =>
          onSave({
            categoryId,
            frequencyType: 'weekly',
            nextDueDate: '2026-08-20T09:00:00Z',
          })
        }
      >
        Save task
      </Button>
    </CssVarsProvider>
  )
}

TaskHarness.propTypes = {
  initialCategory: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  onSave: PropTypes.func.isRequired,
}

describe('CategoryPickerField interaction', () => {
  beforeEach(() => {
    categoryMocks.create.mockReset()
  })
  afterEach(cleanup)

  it('opens above the task modal and submits a numeric Create Task category', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn()
    render(<TaskHarness onSave={onSave} />)

    await user.click(screen.getByRole('combobox', { name: 'Category' }))
    const car = await screen.findByRole('option', { name: 'Car' })
    expect(screen.getByRole('option', { name: 'Uncategorized' })).toBeVisible()
    expect(screen.getByRole('option', { name: 'Home' })).toBeVisible()
    expect(
      window.getComputedStyle(car.closest('[role="listbox"]')).zIndex,
    ).toBe('2100')
    await user.click(car)
    expect(
      screen.getByRole('combobox', { name: 'Category' }),
    ).toHaveTextContent('Car')

    await user.click(screen.getByRole('button', { name: 'Save task' }))
    expect(onSave).toHaveBeenCalledWith({
      categoryId: 7,
      frequencyType: 'weekly',
      nextDueDate: '2026-08-20T09:00:00Z',
    })
  })

  it('normalizes an Edit Task category, supports keyboard selection, and preserves scheduling', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn()
    render(<TaskHarness initialCategory='7' onSave={onSave} />)
    const select = screen.getByRole('combobox', { name: 'Category' })
    expect(select).toHaveTextContent('Car')

    select.focus()
    await user.keyboard('{Enter}')
    await user.keyboard('{End}{Enter}')
    expect(select).toHaveTextContent('Home')
    await user.click(screen.getByRole('button', { name: 'Save task' }))
    expect(onSave).toHaveBeenCalledWith({
      categoryId: 8,
      frequencyType: 'weekly',
      nextDueDate: '2026-08-20T09:00:00Z',
    })
  })

  it('clears the nullable category through Uncategorized', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn()
    render(<TaskHarness initialCategory={7} onSave={onSave} />)

    await user.click(screen.getByRole('combobox', { name: 'Category' }))
    await user.click(
      await screen.findByRole('option', { name: 'Uncategorized' }),
    )
    await user.click(screen.getByRole('button', { name: 'Save task' }))
    expect(onSave.mock.calls[0][0].categoryId).toBeNull()
  })

  it('auto-selects a newly created Category ID', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn()
    categoryMocks.create.mockResolvedValue({
      ok: true,
      json: async () => ({ res: { id: '9', name: 'Picnic' } }),
    })
    render(<TaskHarness onSave={onSave} />)

    await user.click(
      screen.getByRole('button', { name: 'Create new category' }),
    )
    await user.type(screen.getByPlaceholderText('Category name'), 'Picnic')
    await user.click(screen.getByRole('button', { name: 'Create' }))
    await user.click(screen.getByRole('button', { name: 'Save task' }))
    expect(onSave.mock.calls[0][0].categoryId).toBe(9)
  })

  it('opens from a touch pointer in RTL without closing immediately', async () => {
    document.documentElement.dir = 'rtl'
    render(<TaskHarness onSave={vi.fn()} />)
    const select = screen.getByRole('combobox', { name: 'Category' })

    fireEvent.pointerDown(select, { pointerId: 1, pointerType: 'touch' })
    fireEvent.pointerUp(select, { pointerId: 1, pointerType: 'touch' })
    fireEvent.click(select)
    expect(await screen.findByRole('option', { name: 'Car' })).toBeVisible()
    document.documentElement.dir = ''
  })
})
