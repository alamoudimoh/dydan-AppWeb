// @vitest-environment jsdom
/**
 * Unit tests for the persisted-color dropdown.
 *
 * The dropdown is reached through the category section in
 * CategorySettings.test.tsx, but ColorPicker normalizes its own value, so it
 * is exercised directly here: the section always hands it a concrete color,
 * which would otherwise leave the fallback untested.
 */
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import ColorPicker from './ColorPicker'
import { COLORS, LABEL_COLORS } from '../utils/Colors'

const palette = LABEL_COLORS.filter(color => color.name !== 'Default')

// The section keeps its own state, so the harness does too: that is what lets
// these tests assert on what a change actually selects.
function Harness({ initial }: { initial: string }) {
  const [value, setValue] = useState(initial)
  return (
    <>
      <ColorPicker label='Category color' value={value} onChange={setValue} />
      <output data-testid='value'>{value}</output>
    </>
  )
}

afterEach(cleanup)

describe('ColorPicker', () => {
  it('renders as a dropdown, collapsed, showing the current color by name', () => {
    render(<Harness initial='#7e57c2' />)

    const trigger = screen.getByRole('button', { name: 'Category color' })
    expect(trigger.getAttribute('aria-haspopup')).toBe('listbox')
    expect(trigger.getAttribute('aria-expanded')).toBe('false')
    expect(trigger.textContent).toContain('Grape')
    // Nothing is rendered until it is opened, so the control costs one row
    // rather than a grid.
    expect(screen.queryAllByRole('option')).toHaveLength(0)
  })

  it('selects a color and reports it upward', async () => {
    const user = userEvent.setup()
    render(<Harness initial='#26a69a' />)

    await user.click(screen.getByRole('button', { name: 'Category color' }))
    await user.click(screen.getByRole('option', { name: /Coral/ }))

    expect(screen.getByTestId('value').textContent).toBe('#ff7043')
    // Choosing closes the list, as a single-select dropdown should.
    expect(screen.queryAllByRole('option')).toHaveLength(0)
  })

  it('offers exactly the stored-color palette, by name, each with a swatch', async () => {
    const user = userEvent.setup()
    render(<Harness initial='#26a69a' />)
    await user.click(screen.getByRole('button', { name: 'Category color' }))

    expect(screen.getAllByRole('option')).toHaveLength(palette.length)
    // The legacy no-color sentinel is not a color a user can pick.
    expect(screen.queryByRole('option', { name: /^Default/ })).toBeNull()

    for (const color of palette) {
      const option = screen.getByRole('option', {
        name: new RegExp(color.name),
      })
      expect(
        option.querySelector(
          `[data-testid='color-swatch'][data-color='${color.value}']`,
        ),
      ).toBeTruthy()
    }
  })

  it('marks the current color as the selected option', async () => {
    const user = userEvent.setup()
    render(<Harness initial='#ff7043' />)
    await user.click(screen.getByRole('button', { name: 'Category color' }))

    const selected = screen
      .getAllByRole('option')
      .filter(option => option.getAttribute('aria-selected') === 'true')
    expect(selected).toHaveLength(1)
    expect(selected[0].textContent).toContain('Coral')
  })

  it('searches the palette by color name', async () => {
    const user = userEvent.setup()
    render(<Harness initial='#26a69a' />)
    await user.click(screen.getByRole('button', { name: 'Category color' }))

    await user.type(screen.getByLabelText('Search category color'), 'cobalt')

    expect(screen.getByRole('option', { name: /Cobalt/ })).toBeTruthy()
    expect(screen.queryByRole('option', { name: /^Grape/ })).toBeNull()
  })

  it('falls back to the neutral swatch when the value is empty', () => {
    // An older row, or a default seeded before colors existed. The control
    // must not render empty, and must not silently rewrite the value.
    const onChange = vi.fn()
    render(<ColorPicker label='Category color' value='' onChange={onChange} />)

    const trigger = screen.getByRole('button', { name: 'Category color' })
    expect(trigger.textContent).toContain('Ash')
    expect(
      trigger.querySelector(
        `[data-testid='color-swatch'][data-color='${COLORS.ash}']`,
      ),
    ).toBeTruthy()
    expect(onChange).not.toHaveBeenCalled()
  })

  it('keeps a stored color that is outside the palette visible and selected', async () => {
    const user = userEvent.setup()
    // A row written before the palette was constrained, or by a future server
    // that adds a color. It must not read as "no color", which would look like
    // data loss and make the only way to fix it be picking something else.
    render(<Harness initial='#123456' />)

    const trigger = screen.getByRole('button', { name: 'Category color' })
    expect(trigger.textContent).toContain('#123456')

    await user.click(trigger)
    const stray = screen.getByRole('option', { name: /#123456/ })
    expect(stray.getAttribute('aria-selected')).toBe('true')
    // The palette is still fully available alongside it.
    expect(screen.getByRole('option', { name: /Coral/ })).toBeTruthy()
  })
})
