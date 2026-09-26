// @vitest-environment jsdom
/**
 * Settings -> Space -> Categories, end to end against a fake /api/v1/categories.
 *
 * A picker harness stands in for the task editor: it calls the very same
 * `useChoreCategories()` with the very same defaults that CreateTaskModal
 * uses (see settingsCategoryPlacement.spec.ts, which pins that), so asserting
 * on it asserts the real picker contract. Both live under one QueryClient,
 * which is what makes the cross-component refresh requirement testable.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useChoreCategories } from '../hooks/useChoreCategories'
import { COLORS, LABEL_COLORS } from '../utils/Colors'
import CategorySettings from './CategorySettings'

type FakeCategory = {
  id: number
  name: string
  color?: string
  archivedAt?: string | null
}

// vi.mock factories are hoisted above the module body, so the fake server has
// to be built inside vi.hoisted to be reachable from the factory.
const server = vi.hoisted(() => {
  const state = {
    categories: [] as {
      id: number
      name: string
      color?: string
      archivedAt?: string | null
    }[],
    nextId: 1,
    /** Every category write, in order, for asserting on the API contract. */
    writes: [] as string[],
    /** Incremented on each read, so a refetch can be observed. */
    reads: 0,
  }

  const ok = (res: unknown) => ({
    ok: true,
    status: 200,
    json: async () => ({ res }),
  })
  const fail = (status: number, error: string) => ({
    ok: false,
    status,
    json: async () => ({ error }),
  })

  const duplicate = (name: string, exceptId?: number) =>
    state.categories.some(
      c => c.id !== exceptId && c.name.toLowerCase() === name.toLowerCase(),
    )

  return {
    state,
    api: {
      GetCategories: async (includeArchived = false) => {
        state.reads += 1
        return state.categories.filter(c => includeArchived || !c.archivedAt)
      },
      CreateCategory: async ({
        color,
        name,
      }: {
        name: string
        color?: string
      }) => {
        state.writes.push(`create|${name}|${color ?? ''}`)
        if (duplicate(name)) {
          return fail(409, 'a category with this name already exists')
        }
        const created = { id: state.nextId++, name, color, archivedAt: null }
        state.categories.push(created)
        return ok(created)
      },
      UpdateCategory: async ({
        color,
        id,
        name,
      }: {
        id: number
        name: string
        color?: string
      }) => {
        state.writes.push(`update|${id}|${name}|${color ?? ''}`)
        const found = state.categories.find(c => c.id === id)
        if (!found) return fail(404, 'category not found in circle')
        if (duplicate(name, id)) {
          return fail(409, 'a category with this name already exists')
        }
        found.name = name
        found.color = color
        return ok(found)
      },
      SetCategoryArchived: async (id: number, archived: boolean) => {
        state.writes.push(`archive|${id}|${archived}`)
        const found = state.categories.find(c => c.id === id)
        if (!found) return fail(404, 'category not found in circle')
        found.archivedAt = archived ? '2026-01-01T00:00:00Z' : null
        return ok(found)
      },
    },
  }
})

vi.mock('../utils/Fetcher', () => server.api)

vi.mock('../utils/TokenStorage', () => ({
  getAccessToken: () => 'test-token',
  getRefreshToken: () => 'test-refresh',
  clearAllTokens: () => {},
}))

// The icon set lives in the app shell, which drags in every screen. The icons
// are not what these tests are about, but the name is asserted for the
// archive control, so the stub records it.
vi.mock('../App', () => ({
  Icon: ({ name }: { name: string }) => (
    <svg data-testid='icon' data-icon={name} />
  ),
}))

let client: QueryClient

function Wrapper({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}

/** Mirrors CreateTaskModal: the active-only category query, as buttons. */
function PickerHarness() {
  const { categories } = useChoreCategories()
  return (
    <div data-testid='picker'>
      {categories.length === 0
        ? 'no categories'
        : categories.map(category => (
            <button key={category.id} type='button'>
              {category.name}
            </button>
          ))}
    </div>
  )
}

const seed = (name: string, color: string) => {
  server.state.categories.push({
    id: server.state.nextId++,
    name,
    color,
    archivedAt: null,
  })
}

const swatchColors = () =>
  screen.queryAllByTestId('category-swatch').map(node => node.dataset.color)

const pickerNames = () =>
  Array.from(screen.getByTestId('picker').querySelectorAll('button')).map(
    node => node.textContent,
  )

beforeEach(() => {
  server.state.categories = []
  server.state.nextId = 1
  server.state.writes = []
  server.state.reads = 0
  client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  })
})

// Vitest runs with globals disabled here, so Testing Library's automatic
// cleanup never registers itself. Without this, mounted trees (and their
// in-flight category queries) leak into the next test's document.
afterEach(() => {
  cleanup()
  client.clear()
})

describe('Settings -> Space -> Categories', () => {
  it('renders the section with an active category row, swatch, edit and archive actions', async () => {
    seed('Garden', '#26a69a')
    render(<CategorySettings />, { wrapper: Wrapper })

    expect(await screen.findByText('Categories')).toBeTruthy()
    expect(await screen.findByText('Garden')).toBeTruthy()
    expect(screen.getByLabelText('Edit Garden')).toBeTruthy()
    expect(screen.getByLabelText('Archive Garden')).toBeTruthy()
    await waitFor(() => expect(swatchColors()).toEqual(['#26a69a']))
  })

  it('lists archived categories separately and offers only Restore for them', async () => {
    seed('Garden', '#26a69a')
    server.state.categories[0].archivedAt = '2026-01-01T00:00:00Z'
    render(<CategorySettings />, { wrapper: Wrapper })

    expect(await screen.findByText('Archived')).toBeTruthy()
    expect(screen.getByText(/existing tasks keep this category/)).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Restore' })).toBeTruthy()
    // An archived row is not offered for editing or re-archiving.
    expect(screen.queryByLabelText('Edit Garden')).toBeNull()
    expect(screen.queryByLabelText('Archive Garden')).toBeNull()
  })

  it('creates a category and refreshes the list', async () => {
    const user = userEvent.setup()
    render(<CategorySettings />, { wrapper: Wrapper })

    await user.click(
      await screen.findByRole('button', { name: /New category/ }),
    )
    await user.type(screen.getByLabelText('Category name'), '  Garden  ')
    await user.click(screen.getByRole('button', { name: 'Create category' }))

    // The name is trimmed before it is sent.
    expect(server.state.writes).toEqual(['create|Garden|#26a69a'])
    expect(await screen.findByText('Garden')).toBeTruthy()
  })

  it('rejects an empty or whitespace-only name without calling the API', async () => {
    const user = userEvent.setup()
    render(<CategorySettings />, { wrapper: Wrapper })

    await user.click(
      await screen.findByRole('button', { name: /New category/ }),
    )
    await user.click(screen.getByRole('button', { name: 'Create category' }))
    expect(await screen.findByTestId('category-error')).toBeTruthy()
    expect(screen.getByTestId('category-error').textContent).toMatch(
      /cannot be empty/i,
    )
    expect(server.state.writes).toEqual([])

    await user.type(screen.getByLabelText('Category name'), '   ')
    await user.click(screen.getByRole('button', { name: 'Create category' }))
    expect(server.state.writes).toEqual([])
  })

  it('surfaces the server duplicate-name response verbatim', async () => {
    const user = userEvent.setup()
    seed('Garden', '#26a69a')
    render(<CategorySettings />, { wrapper: Wrapper })

    await user.click(
      await screen.findByRole('button', { name: /New category/ }),
    )
    await user.type(screen.getByLabelText('Category name'), 'garden')
    await user.click(screen.getByRole('button', { name: 'Create category' }))

    expect(await screen.findByTestId('category-error')).toBeTruthy()
    // The server's own 409 message, not a generic failure.
    expect(screen.getByTestId('category-error').textContent).toContain(
      'a category with this name already exists',
    )
  })

  it('renames a category and keeps its color', async () => {
    const user = userEvent.setup()
    seed('Garden', '#26a69a')
    render(<CategorySettings />, { wrapper: Wrapper })

    await user.click(await screen.findByLabelText('Edit Garden'))
    const input = screen.getByLabelText('Category name')
    await user.clear(input)
    await user.type(input, 'Backyard')
    await user.click(screen.getByRole('button', { name: 'Save changes' }))

    expect(server.state.writes).toEqual(['update|1|Backyard|#26a69a'])
    expect(await screen.findByText('Backyard')).toBeTruthy()
  })

  it('recolors a category from the color dropdown and keeps its name', async () => {
    const user = userEvent.setup()
    seed('Garden', '#26a69a')
    render(<CategorySettings />, { wrapper: Wrapper })

    await user.click(await screen.findByLabelText('Edit Garden'))

    // The control is a dropdown, not a grid of radios: the trigger shows the
    // current color, and the options only exist once it is open.
    const trigger = screen.getByRole('button', { name: 'Category color' })
    expect(trigger.getAttribute('aria-expanded')).toBe('false')
    expect(trigger.textContent).toContain('Teal')
    expect(screen.queryByRole('option', { name: /Grape/ })).toBeNull()

    await user.click(trigger)
    expect(trigger.getAttribute('aria-expanded')).toBe('true')
    expect(screen.getByRole('option', { name: /Teal/ })).toBeTruthy()

    await user.click(screen.getByRole('option', { name: /Grape/ }))
    // Choosing an option closes the list and reflects the choice in the trigger.
    expect(screen.queryByRole('option', { name: /Grape/ })).toBeNull()
    expect(trigger.textContent).toContain('Grape')

    await user.click(screen.getByRole('button', { name: 'Save changes' }))

    expect(server.state.writes).toEqual(['update|1|Garden|#7e57c2'])
    expect(await screen.findByText('Garden')).toBeTruthy()
    await waitFor(() => expect(swatchColors()).toEqual(['#7e57c2']))
  })

  it('searches the color dropdown by color name', async () => {
    const user = userEvent.setup()
    seed('Garden', '#26a69a')
    render(<CategorySettings />, { wrapper: Wrapper })

    await user.click(await screen.findByLabelText('Edit Garden'))
    await user.click(screen.getByRole('button', { name: 'Category color' }))

    // The palette is large enough that ThemeSelect offers a search field.
    const search = screen.getByLabelText('Search category color')
    await user.type(search, 'cobalt')

    expect(screen.getByRole('option', { name: /Cobalt/ })).toBeTruthy()
    // The list narrows rather than showing every color behind the search term.
    expect(screen.queryByRole('option', { name: /^Grape/ })).toBeNull()

    await user.click(screen.getByRole('option', { name: /Cobalt/ }))
    await user.click(screen.getByRole('button', { name: 'Save changes' }))

    expect(server.state.writes).toEqual(['update|1|Garden|#3f51b5'])
  })

  it('offers every palette color by name and shows its swatch', async () => {
    const user = userEvent.setup()
    seed('Garden', '#26a69a')
    render(<CategorySettings />, { wrapper: Wrapper })

    await user.click(await screen.findByLabelText('Edit Garden'))
    await user.click(screen.getByRole('button', { name: 'Category color' }))

    const palette = LABEL_COLORS.filter(color => color.name !== 'Default')
    const options = screen.getAllByRole('option')
    expect(options).toHaveLength(palette.length)

    // "Default" is the legacy no-color sentinel and stays out of the picker.
    expect(screen.queryByRole('option', { name: /^Default/ })).toBeNull()

    for (const color of palette) {
      const option = screen.getByRole('option', {
        name: new RegExp(color.name),
      })
      // The swatch is what makes the choice legible; the name alone would not
      // tell the user which hex they picked.
      expect(
        option.querySelector(
          `[data-testid='color-swatch'][data-color='${color.value}']`,
        ),
      ).toBeTruthy()
    }
  })

  it('falls back to the neutral swatch for a category that has no color', async () => {
    const user = userEvent.setup()
    // A default seeded before colors existed.
    seed('Garden', '')
    render(<CategorySettings />, { wrapper: Wrapper })

    await user.click(await screen.findByLabelText('Edit Garden'))
    const trigger = screen.getByRole('button', { name: 'Category color' })

    // Nothing is selected, so the control falls back to Ash rather than
    // rendering an empty trigger.
    expect(trigger.textContent).toContain('Ash')
    expect(
      trigger.querySelector(
        `[data-testid='color-swatch'][data-color='${COLORS.ash}']`,
      ),
    ).toBeTruthy()

    // Picking from the dropdown replaces the fallback rather than stacking on
    // top of it.
    await user.click(trigger)
    await user.click(screen.getByRole('option', { name: /Coral/ }))
    expect(trigger.textContent).toContain('Coral')

    await user.click(screen.getByRole('button', { name: 'Save changes' }))
    expect(server.state.writes).toEqual(['update|1|Garden|#ff7043'])
  })

  it('archives a category, keeping the row and its id, and restores it again', async () => {
    const user = userEvent.setup()
    seed('Garden', '#26a69a')
    render(<CategorySettings />, { wrapper: Wrapper })

    await user.click(await screen.findByLabelText('Archive Garden'))
    expect(server.state.writes).toEqual(['archive|1|true'])
    // The row survives so existing task assignments keep resolving.
    expect(await screen.findByText('Garden')).toBeTruthy()
    expect(await screen.findByRole('button', { name: 'Restore' })).toBeTruthy()

    await user.click(screen.getByRole('button', { name: 'Restore' }))
    expect(server.state.writes).toEqual(['archive|1|true', 'archive|1|false'])
    await waitFor(() => expect(screen.queryByText('Archived')).toBeNull())
    expect(screen.getByLabelText('Archive Garden')).toBeTruthy()
  })

  it('refetches the category query after every mutation', async () => {
    const user = userEvent.setup()
    seed('Garden', '#26a69a')
    render(<CategorySettings />, { wrapper: Wrapper })
    await screen.findByText('Garden')
    const readsAfterMount = server.state.reads

    await user.click(screen.getByLabelText('Edit Garden'))
    await user.click(screen.getByRole('button', { name: 'Save changes' }))
    await waitFor(() =>
      expect(server.state.reads).toBeGreaterThan(readsAfterMount),
    )

    const afterRename = server.state.reads
    await user.click(screen.getByLabelText('Archive Garden'))
    await waitFor(() => expect(server.state.reads).toBeGreaterThan(afterRename))
  })

  it('exposes no hard-delete control anywhere in the section', async () => {
    seed('Garden', '#26a69a')
    render(<CategorySettings />, { wrapper: Wrapper })
    await screen.findByText('Garden')

    // No trash affordance and nothing named "delete"/"remove permanently".
    expect(document.querySelectorAll('[data-icon="trash"]')).toHaveLength(0)
    const names = Array.from(document.querySelectorAll('button')).map(
      node => node.getAttribute('aria-label') ?? node.textContent ?? '',
    )
    expect(names.filter(name => /delete/i.test(name))).toEqual([])
    // Removal is spelled as archive/restore, which is reversible.
    expect(names.filter(name => /archive/i.test(name))).toEqual([
      'Archive Garden',
    ])
  })
})

describe('task editor picker reacts to category changes without a reload', () => {
  it('drops an archived category from selection and brings it back on restore', async () => {
    const user = userEvent.setup()
    seed('Garden', '#26a69a')
    seed('Work', '#3f51b5')
    render(
      <>
        <CategorySettings />
        <PickerHarness />
      </>,
      { wrapper: Wrapper },
    )

    expect(await screen.findByText('Garden')).toBeTruthy()
    await waitFor(() => expect(pickerNames()).toEqual(['Garden', 'Work']))

    await user.click(screen.getByLabelText('Archive Work'))
    // A task picker offers only active categories.
    await waitFor(() => expect(pickerNames()).toEqual(['Garden']))
    // ...while Settings still lists it, because archiving is not a delete.
    expect(screen.getByText('Work')).toBeTruthy()

    await user.click(screen.getByRole('button', { name: 'Restore' }))
    await waitFor(() => expect(pickerNames()).toEqual(['Garden', 'Work']))
  })

  it('shows a newly created category in the picker immediately', async () => {
    const user = userEvent.setup()
    render(
      <>
        <CategorySettings />
        <PickerHarness />
      </>,
      { wrapper: Wrapper },
    )

    await waitFor(() => expect(pickerNames()).toEqual([]))
    await user.click(
      await screen.findByRole('button', { name: /New category/ }),
    )
    await user.type(screen.getByLabelText('Category name'), 'Garden')
    await user.click(screen.getByRole('button', { name: 'Create category' }))

    await waitFor(() => expect(pickerNames()).toEqual(['Garden']))
  })
})
