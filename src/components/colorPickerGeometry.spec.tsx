// @vitest-environment jsdom
/**
 * Geometry assertions for the category color dropdown.
 *
 * These read src/index.css rather than measuring pixels: the values the picker
 * needs are CSS declarations, and the correct widths only exist once the
 * browser resolves cascade and custom properties. Asserting the source keeps
 * the test honest about what it is checking (the stylesheet says this) instead
 * of implying a layout measurement it never performed.
 *
 * The scope matters as much as the values. The dropdown geometry must be
 * opted into by the color field alone, because Projects and Routines render
 * the same ThemeSelect and must keep the shared 228px popover.
 */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { afterEach, describe, expect, it } from 'vitest'

import { COLORS } from '../utils/Colors'
import ColorPicker from './ColorPicker'

// Comments are stripped before matching, so a rule that merely sits under a
// heading (or one a comment names) cannot be mistaken for the rule itself.
const css = readFileSync(
  resolve(process.cwd(), 'src/index.css'),
  'utf8',
).replace(/\/\*[\s\S]*?\*\//g, '')

/** A sibling source file, for the structural assertions about the section. */
const read = (path: string) => readFileSync(path, 'utf8')

/**
 * Every (selector-list, declarations) pair in the stylesheet, in source order.
 *
 * `[^{}]` excludes braces, so a match can never span two blocks: the selector
 * capture is exactly the text between the previous `}` and this `{`, and the
 * declarations are exactly what sits inside. That matters because a loose
 * substring search would happily match a declaration belonging to a different
 * rule, which is the failure mode these assertions exist to prevent.
 */
const allRules = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map(match => ({
  declarations: match[2],
  selectors: match[1].split(',').map(part => part.trim()),
}))

/**
 * The declarations of the LAST rule whose selector list contains `selector`.
 *
 * Last, because the picker styles are appended after the shared ones they
 * override, and CSS applies the later one. Asserting the earlier rule would
 * test a declaration the browser has already discarded.
 */
const rule = (selector: string) => {
  const found = allRules.filter(entry => entry.selectors.includes(selector))
  expect(
    found.length,
    `no rule for \`${selector}\` in index.css`,
  ).toBeGreaterThan(0)
  return found[found.length - 1].declarations
}

/**
 * Every value `selector` sets a property to, across all of its rules.
 *
 * A selector can be targeted by several rules for unrelated reasons — `.input`
 * alone is re-declared later just to set a min-height — so a single-rule read
 * is not enough to say what a property resolves to. Collects them all so a
 * test can assert none of them disagree.
 */
const valuesOf = (selector: string, property: string) =>
  allRules
    .filter(entry => entry.selectors.includes(selector))
    .flatMap(entry =>
      [
        ...entry.declarations.matchAll(
          new RegExp(`${property}\\s*:\\s*([^;]+);`, 'g'),
        ),
      ].map(match => match[1].trim()),
    )

/** Every selector in the stylesheet that mentions `token`, for scope checks. */
const selectorsMentioning = (token: string) =>
  allRules
    .flatMap(entry => entry.selectors)
    .filter(selector => selector.includes(token))

/**
 * How tall one option row is, from the stylesheet rather than a literal.
 *
 * The list's cap only means something relative to this: a cap that fits every
 * color leaves nothing to scroll, and the scrollbar button being hidden here
 * would be hiding a button that is not there.
 */
const ROW_HEIGHT = Number(
  rule('.member-option').match(/min-height:\s*(\d+)px/)?.[1],
)

function Harness({ initial }: { initial: string }) {
  const [value, setValue] = useState(initial)
  return (
    <ColorPicker label='Category color' value={value} onChange={setValue} />
  )
}

afterEach(cleanup)

describe('color field is compact', () => {
  it('caps the field at 320px and keeps it responsive', () => {
    const field = rule('.color-picker-field')
    // width:100% is what keeps it fluid on narrow viewports; the cap is what
    // stops it stretching across the form on wide ones. Both are required:
    // max-width alone would let a flex parent shrink it below the cap.
    expect(field).toMatch(/width:\s*100%/)
    expect(field).toMatch(/max-width:\s*320px/)
  })

  it('applies the compact cap to the color field only', () => {
    // The cap must not leak onto the shared .theme-field, or the Projects and
    // Routines selects would shrink with it.
    expect(rule('.theme-field')).not.toMatch(/max-width/)
    expect(css).not.toMatch(/\.theme-field\s*\{[^}]*max-width/)
  })
})

describe('dropdown matches its trigger', () => {
  it('sizes the popover to the field instead of the shared 228px', () => {
    const popover = rule('.color-picker-field .theme-popover')
    // width:100% against the relatively-positioned field makes the popover
    // exactly as wide as the trigger above it, whatever that width is.
    expect(popover).toMatch(/width:\s*100%/)
    expect(popover).not.toMatch(/width:\s*228px/)
  })

  it('anchors both edges to the field so it cannot drift', () => {
    const popover = rule('.color-picker-field .theme-popover')
    expect(popover).toMatch(/inset-inline-start:\s*0/)
    expect(popover).toMatch(/inset-inline-end:\s*0/)
  })

  it('leaves the shared popover width alone for other callers', () => {
    // Projects and Routines still get the 228px popover. The picker overrides
    // it with a more specific selector rather than editing this rule, so the
    // two geometries coexist.
    expect(rule('.theme-popover')).toMatch(/228px/)
    expect(rule('.theme-popover')).not.toMatch(/max-width:\s*320px/)
  })
})

describe('dropdown geometry aligns with the trigger', () => {
  it('uses the same corner radius as the trigger', () => {
    // The trigger is .input.themed-trigger, both of which are --r-md. A
    // dropdown left at the shared --r-lg reads as a separate, larger surface
    // tethered to a small field, rather than the same control opened up.
    expect(valuesOf('.input', 'border-radius')).toContain('var(--r-md)')
    expect(valuesOf('.themed-trigger', 'border-radius')).toContain(
      'var(--r-md)',
    )
    expect(rule('.color-picker-field .theme-popover')).toMatch(
      /border-radius:\s*var\(--r-md\)/,
    )
  })

  it('keeps the shared popover radius untouched for other callers', () => {
    expect(rule('.theme-popover')).toMatch(/border-radius:\s*var\(--r-lg\)/)
  })

  it('draws a consistent 1px border', () => {
    const popover = rule('.color-picker-field .theme-popover')
    expect(popover).toMatch(/border:\s*1px solid var\(--line-strong\)/)
  })

  it('pads the dropdown so options do not touch the border', () => {
    expect(rule('.color-picker-field .theme-popover')).toMatch(/padding:\s*2px/)
    // Options sit inside that padding, so their own radius is inset by the
    // border to stay concentric with the dropdown's corners.
    expect(rule('.color-picker-field .member-option')).toMatch(
      /border-radius:\s*calc\(var\(--r-md\) - 1px\)/,
    )
  })

  it('keeps the search field inside the dropdown, separated from the list', () => {
    const search = rule('.color-picker-field .theme-select-search')
    // Its own padding, not the utility's, so the field is inset from the
    // rounded corner rather than flush against it.
    expect(search).toMatch(/padding:\s*4px 4px 2px/)
    expect(search).toMatch(/border-bottom:\s*1px solid var\(--line\)/)
    // The bare utility the element also carries must not be what sizes it.
    expect(rule(".color-picker-field .input[type='search']")).toMatch(
      /padding:\s*8px 9px/,
    )
  })
})

describe('options list has no scrollbar button', () => {
  it('hides the webkit scrollbar button, keeping the thin bar', () => {
    const button = rule(
      '.color-picker-field .member-options::-webkit-scrollbar-button',
    )
    // display:none is what removes the arrow/button; the zero dimensions stop
    // it reserving a strip of the 2px gutter.
    expect(button).toMatch(/display:\s*none/)
    expect(button).toMatch(/height:\s*0/)
    expect(button).toMatch(/width:\s*0/)
  })

  it('keeps the scrollbar itself and normal scrolling', () => {
    const list = rule('.color-picker-field .member-options')

    // A cap short enough to force overflow is what puts a scrollbar — and
    // therefore the button being hidden — on this list at all. Compared
    // against the row height rather than any fixed number, so a cap large
    // enough to fit all 23 colors cannot quietly pass.
    const cap = Number(list.match(/max-height:\s*(\d+)px/)?.[1])
    expect(cap).toBeGreaterThan(0)
    expect(cap).toBeLessThan(ROW_HEIGHT * 8)

    // Scrolling stays available. Clipping the overflow, or hiding the bar,
    // would strand the colors below the fold with no way to reach them.
    expect(list).not.toMatch(/overflow:\s*hidden/)
    expect(list).not.toMatch(/scrollbar-width:\s*none/)
    expect(
      rule('.color-picker-field .member-options::-webkit-scrollbar'),
    ).toMatch(/width:\s*2px/)
  })

  it('scopes the button reset to the color dropdown', () => {
    // A blanket ::-webkit-scrollbar-button reset would change every scrollable
    // surface in the app, including the ones that may rely on the default.
    const buttonRules = selectorsMentioning('::-webkit-scrollbar-button')
    expect(buttonRules.length).toBeGreaterThan(0)
    for (const selector of buttonRules) {
      expect(selector).toContain('.color-picker-field')
    }
  })
})

describe('the opt-in reaches the DOM', () => {
  it('marks the field so the stylesheet has something to match', () => {
    render(<Harness initial={COLORS.teal} />)
    const trigger = screen.getByRole('button', { name: 'Category color' })
    expect(trigger.closest('.color-picker-field')).toBeTruthy()
  })

  it("caps the section's color field without capping its name field", () => {
    // The section renders both fields in full-width form columns. Only the
    // color one is capped, so the name input keeps the full row.
    const section = read(
      resolve(process.cwd(), 'src/components/CategorySettings.tsx'),
    )
    // Each labelled field runs from its label to the next one, so the color
    // and name fields can be asserted independently.
    const at = (label: string) => {
      const found = section.search(new RegExp(`>\\s*${label}\\s*<`))
      expect(found, `${label} label not found`).toBeGreaterThan(-1)
      return found
    }
    const color = at('COLOR')
    const name = at('NAME')
    expect(name).toBeLessThan(color)

    // Cut at the start of the Save/Cancel row's tag, not at its className, so
    // the slice does not pick up that row's own opening <div.
    const form = section.indexOf("<div className='flex gap-2'")
    const colorField = section.slice(color, form)
    const nameField = section.slice(name, color)

    // The picker is the only thing in the color column: the cap is applied by
    // the field it renders, so there is no wrapper for the section to keep in
    // step with it. Counting the elements rather than negating a string keeps
    // this from passing just because the slice was wrong.
    const wrappers = colorField.match(/<div/g) ?? []
    expect(wrappers).toHaveLength(0)
    expect(colorField.match(/<ColorPicker/g)).toHaveLength(1)
    expect(colorField).not.toMatch(/color-picker-\w+-shell/)

    // The name field above it, in the same form, still spans the full row:
    // no cap in CSS, and no inline style either.
    expect(nameField).toContain('<input')
    expect(nameField).not.toMatch(/max-?[wW]idth/)
    expect(nameField).not.toMatch(/color-picker/)
  })

  it('renders the dropdown inside that same field, so width:100% resolves', async () => {
    const user = userEvent.setup()
    render(<Harness initial={COLORS.teal} />)
    await user.click(screen.getByRole('button', { name: 'Category color' }))

    const listbox = screen.getByRole('listbox', { name: 'Category color' })
    const popover = listbox.closest('.theme-popover')
    const field = screen
      .getByRole('button', { name: 'Category color' })
      .closest('.color-picker-field')

    // The popover must be a child of the field: its width:100% is resolved
    // against that element, and a detached popover would fall back to the
    // shared 228px rule.
    expect(popover?.parentElement).toBe(field)
    // It must be inside the scoped subtree too, or the overrides never reach
    // it. Checked on the field, not the popover, so a popover that escaped the
    // field entirely cannot pass by carrying the class itself.
    expect(field?.querySelector('.theme-popover')).toBe(popover)
  })

  it('puts the search field inside the dropdown it filters', async () => {
    const user = userEvent.setup()
    render(<Harness initial={COLORS.teal} />)
    await user.click(screen.getByRole('button', { name: 'Category color' }))

    const search = screen.getByLabelText('Search category color')
    const popover = screen.getByRole('listbox').closest('.theme-popover')
    // Contained, and its separator sits above the list it narrows.
    expect(popover?.contains(search)).toBe(true)
    const searchContainer = search.closest('.theme-select-search')
    expect(searchContainer).not.toBeNull()
    expect(
      searchContainer &&
        searchContainer.compareDocumentPosition(screen.getByRole('listbox')) &
          Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy()
  })

  it('gives the options list a real height, so the arrow had somewhere to sit', async () => {
    const user = userEvent.setup()
    render(<Harness initial={COLORS.teal} />)
    await user.click(screen.getByRole('button', { name: 'Category color' }))

    // 23 options in a capped list: the list overflows, which is the whole
    // reason a scrollbar and its button appear at all.
    expect(screen.getAllByRole('option').length).toBeGreaterThan(10)
    expect(screen.getByRole('listbox').className).toContain('member-options')
  })
})
