// @vitest-environment jsdom
/**
 * Fix 05 structural enforcement: the global page UI system must be the single
 * source of truth. These tests read source + stylesheet rather than pixels so
 * they fail when a screen reintroduces a local shell/tabs/empty implementation.
 */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import EmptyState from './EmptyState'
import FilterSegment from './FilterSegment'
import PageHero from './PageHero'
import PageSection from './PageSection'
import PageShell from './PageShell'
import PageTabs from './PageTabs'

const read = (path: string) =>
  readFileSync(resolve(process.cwd(), path), 'utf8')
const css = () => read('src/index.css').replace(/\/\*[\s\S]*?\*\//g, '')

const PRIMARY_SHELL = [
  'src/screens/FocusHome.tsx',
  'src/screens/QuestHome.tsx',
  'src/screens/TodayScreen.tsx',
  'src/screens/AllTasksScreen.tsx',
  'src/screens/CalendarScreen.tsx',
  'src/screens/ProjectsScreen.tsx',
  'src/screens/RoutinesScreen.tsx',
  'src/screens/MaintenanceScreen.tsx',
  'src/screens/ShoppingScreen.tsx',
  'src/screens/GoalsScreen.tsx',
  'src/screens/RewardsScreen.tsx',
  'src/screens/SettingsScreen.tsx',
  'src/screens/ProgressScreen.tsx',
]

const WITH_HEADER = PRIMARY_SHELL.filter(
  f =>
    f !== 'src/screens/QuestHome.tsx' && f !== 'src/screens/SearchScreen.tsx',
)

afterEach(cleanup)

describe('A. primary routes use the canonical shell/header', () => {
  it.each(PRIMARY_SHELL)('%s renders <PageShell>', file => {
    const src = read(file)
    expect(src).toMatch(/from '\.\.\/components\/page'/)
    expect(src).toContain('<PageShell')
    expect(src).not.toMatch(/maxWidth:\s*1080/)
    expect(src).not.toMatch(/className='px-4 md:px-7'/)
  })

  it.each(WITH_HEADER)('%s renders the shared PageHeader', file => {
    const src = read(file)
    expect(src).toContain('PageHeader')
    expect(src).toContain('<PageHeader')
  })

  it('PageShell exposes only centrally defined variants', () => {
    const src = read('src/components/page/PageShell.tsx')
    expect(src).toMatch(/'standard' \| 'wide' \| 'reading'/)
    expect(src).not.toMatch(/maxWidth/)
  })
})

describe('B. equivalent tabbed pages share one PageTabs primitive', () => {
  const TABBED = [
    'src/screens/MaintenanceScreen.tsx',
    'src/screens/ShoppingScreen.tsx',
    'src/screens/RewardsScreen.tsx',
  ]
  it.each(TABBED)('%s uses <PageTabs>', file => {
    expect(read(file)).toContain('<PageTabs')
  })
  it.each(TABBED)('%s has no local seg-tab markup', file => {
    const src = read(file)
    expect(src).not.toContain('seg-tabs')
    expect(src).not.toContain('seg-tab')
  })
  it('PageTabs owns group semantics with roving tabindex', () => {
    render(
      <PageTabs
        ariaLabel='Sections'
        value='a'
        onChange={() => {}}
        tabs={[
          { id: 'a', label: 'A' },
          { id: 'b', label: 'B' },
        ]}
      />,
    )
    expect(screen.getByRole('group', { name: 'Sections' })).toBeTruthy()
    const buttons = screen.getAllByRole('button')
    expect(buttons).toHaveLength(2)
    expect(buttons[0].getAttribute('aria-pressed')).toBe('true')
    expect(buttons[0].getAttribute('tabindex')).toBe('0')
    expect(buttons[1].getAttribute('tabindex')).toBe('-1')
  })
})

describe('C. empty states use the canonical primitive', () => {
  it.each(PRIMARY_SHELL)('%s has no hand-rolled empty-state div', file => {
    expect(read(file)).not.toContain("<div className='empty-state'")
  })
  it('EmptyState owns geometry, pages supply content only', () => {
    render(<EmptyState title='Nothing here' description='Zero data.' />)
    expect(screen.getByText('Nothing here')).toBeTruthy()
    const stylesheet = css()
    expect(stylesheet).toMatch(/\.empty-state__title/)
    expect(stylesheet).toMatch(/\.empty-state__description/)
  })
})

describe('D. no duplicate primary Shopping List CTA when empty', () => {
  it('exactly one New Shopping List action exists', () => {
    const src = read('src/screens/ShoppingScreen.tsx')
    const cta =
      src.match(/shopping-create-list|create\.shoppingList\.title/g) ?? []
    // header button references the label + test id; no second copy in empties
    expect(cta.length).toBeLessThanOrEqual(2)
    expect(src).not.toMatch(/shopping-zero-lists[\s\S]{0,400}btn-primary/)
  })
})

describe('E. page title anchor stays aligned', () => {
  it('eyebrow slot reserves height on every page', () => {
    expect(read('src/components/PageHeader.tsx')).toMatch(/eyebrow/)
    expect(css()).toMatch(/\.page-header__eyebrow[\s\S]*?min-height:\s*17px/)
  })
  it('top inset lives on the shared scroll container, not per screen', () => {
    expect(css()).toMatch(/\.main-scroll[\s\S]*?padding-block-start/)
    for (const file of PRIMARY_SHELL) {
      expect(read(file)).not.toMatch(/padding-block-start/)
    }
  })
})

describe('F. tab geometry is equivalent across Assets/Shopping/Rewards', () => {
  it('single .page-tabs/.page-tab track definition', () => {
    const stylesheet = css()
    const tabs = stylesheet.match(/\.page-tabs\s*\{/g) ?? []
    const tab = stylesheet.match(/\.page-tab\s*\{/g) ?? []
    expect(tabs.length).toBe(1)
    expect(tab.length).toBe(1)
    expect(stylesheet).toMatch(/\.page-tab[\s\S]*?min-height:\s*36px/)
    expect(stylesheet).toMatch(/\.page-tab[\s\S]*?flex:\s*1/)
  })
})

describe('G. no horizontal overflow at 390px', () => {
  it('shell clips overflow and grids are fluid', () => {
    const stylesheet = css()
    expect(stylesheet).toMatch(/\.page\s*\{[\s\S]*?overflow-x:\s*clip/)
    expect(read('src/components/page/EntityCard.tsx')).toMatch(/minmax/)
    expect(stylesheet).toMatch(
      /\.shopping-lists-grid[\s\S]*?grid-template-columns:\s*1fr/,
    )
  })
})

describe('H. RTL uses logical properties, not a second architecture', () => {
  it('new system avoids physical left/right geometry', () => {
    const pageCss =
      read('src/components/page/PageShell.tsx') + read('src/index.css')
    // The page system itself must not introduce physical siding; legacy
    // unrelated rules elsewhere are out of scope for this gate.
    const systemBlock = pageCss.slice(pageCss.indexOf('.page {'))
    expect(systemBlock).not.toMatch(/margin-left:/)
    expect(systemBlock).not.toMatch(/margin-right:/)
    expect(systemBlock).not.toMatch(/padding-left:/)
    expect(systemBlock).not.toMatch(/padding-right:/)
  })
  it('shared primitives render in RTL without crashing', () => {
    document.documentElement.setAttribute('dir', 'rtl')
    render(
      <PageShell header={<div>h</div>}>
        <PageTabs
          ariaLabel='s'
          value='a'
          onChange={() => {}}
          tabs={[{ id: 'a', label: 'A' }]}
        />
        <FilterSegment
          ariaLabel='f'
          value='a'
          onChange={() => {}}
          options={[{ id: 'a', label: 'A' }]}
        />
        <PageHero variant='callout'>hero</PageHero>
        <PageSection title='s'>body</PageSection>
        <EmptyState title='empty' />
      </PageShell>,
    )
    expect(screen.getByText('hero')).toBeTruthy()
    document.documentElement.setAttribute('dir', 'ltr')
  })
})
