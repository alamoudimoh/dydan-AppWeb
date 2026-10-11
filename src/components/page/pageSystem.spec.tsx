// @vitest-environment jsdom
/**
 * Fix 05 structural enforcement: the global page UI system must be the single
 * source of truth. These tests read source + stylesheet rather than pixels so
 * they fail when a screen reintroduces a local shell/tabs/empty implementation.
 */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { cleanup, render, screen } from '@testing-library/react'
import ts from 'typescript'
import { afterEach, describe, expect, it } from 'vitest'

import {
  authenticatedRoutes,
  primaryRoutes,
} from '../../../e2e/helpers/primaryRoutes.js'
import PageHeader from '../PageHeader'
import EmptyState from './EmptyState'
import EntityCard, { EntityGrid } from './EntityCard'
import FilterSegment from './FilterSegment'
import PageFlow from './PageFlow'
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
    render(
      <EmptyState icon='tasks' title='Nothing here' description='Zero data.' />,
    )
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
    expect(tab.length).toBe(3) // base, shared mobile adaptation, and semantic scroll track
    expect(stylesheet).toMatch(/\.page-tab[\s\S]*?min-height:\s*36px/)
    expect(stylesheet).toMatch(/\.page-tab[\s\S]*?flex:\s*1/)
  })
})

describe('G. no horizontal overflow at 390px', () => {
  it('shell clips overflow and grids are fluid', () => {
    const stylesheet = css()
    expect(stylesheet).toMatch(/\.page\s*\{[\s\S]*?overflow-x:\s*clip/)
    expect(stylesheet).toMatch(/minmax/)
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
      <PageShell header={<PageHeader title='Title' />}>
        <PageFlow>
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
          <PageHero
            icon='gift'
            label='hero'
            value='42'
            meta='points'
            variant='callout'
          />
          <PageSection title='s'>body</PageSection>
          <EmptyState icon='tasks' title='empty' description='Zero data' />
        </PageFlow>
      </PageShell>,
    )
    expect(screen.getByText('hero')).toBeTruthy()
    document.documentElement.setAttribute('dir', 'ltr')
  })
})

describe('Fix 06 shared mobile contracts', () => {
  it('PageHeader separates semantic primary actions from arbitrary controls', () => {
    const { container } = render(
      <PageHeader
        title='Projects'
        subtitle='Projects in this space'
        actions={<button>Filter</button>}
        primaryAction={{
          label: 'New project',
          icon: 'projects',
          onClick: () => {},
        }}
      />,
    )
    expect(
      container.querySelector('.page-header__primary-action')?.textContent,
    ).toBe('New project')
    expect(container.querySelector('.page-header__actions')?.textContent).toBe(
      'Filter',
    )
    expect(container.querySelector('.page-primary-action')).toBeTruthy()
    expect(screen.getByTestId('page-title').tagName).toBe('H1')
  })

  it.each([
    'Projects',
    'Routines',
    'Maintenance',
    'Shopping',
    'Goals',
    'Rewards',
  ])(
    '%s uses the shared primary-action slot without positioning overrides',
    name => {
      const source = read(`src/screens/${name}Screen.tsx`)
      expect(source).toContain('primaryAction={')
      const header = source.slice(
        source.indexOf('<PageHeader'),
        source.indexOf('/>', source.indexOf('<PageHeader')),
      )
      expect(header).not.toMatch(/position:\s*'absolute'|marginInline|width:/)
    },
  )

  it('stats layout is semantic and CSS-owned, not data branching', () => {
    const { container } = render(
      <EntityGrid variant='stats'>
        <div>One</div>
      </EntityGrid>,
    )
    expect(container.querySelector('.entity-grid--stats')).toBeTruthy()
    expect(css()).toMatch(
      /\.entity-grid--stats > :last-child:nth-child\(odd\)[\s\S]*?grid-column:\s*1 \/ -1/,
    )
  })

  it('dock clearance has one safe-area calculation and one shared scroll owner', () => {
    const stylesheet = css()
    expect(stylesheet).toMatch(/--app-safe-bottom:\s*max\(/)
    expect(stylesheet).toMatch(/--mobile-bottom-clearance:\s*calc\(/)
    expect(stylesheet).toMatch(
      /padding-block-end:\s*var\(--mobile-bottom-clearance\)/,
    )
    expect(read('src/utils/StatusBarManager.js')).not.toContain(
      'document.body.style.paddingBottom',
    )
  })
})

// Fix 07: AST gates cover the actual authenticated route table, including future routes.
const parse = (file: string) =>
  ts.createSourceFile(
    file,
    read(file),
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  )
const tag = (node: ts.Node): string =>
  ts.isJsxElement(node)
    ? node.openingElement.tagName.getText()
    : ts.isJsxSelfClosingElement(node)
      ? node.tagName.getText()
      : ''
const props = (node: ts.Node) =>
  (ts.isJsxElement(node)
    ? node.openingElement
    : ts.isJsxSelfClosingElement(node)
      ? node
      : undefined
  )?.attributes.properties ?? []
const prop = (node: ts.Node, key: string) =>
  props(node).find(p => ts.isJsxAttribute(p) && p.name.getText() === key) as
    ts.JsxAttribute | undefined
const nodes = (root: ts.Node) => {
  const result: ts.Node[] = []
  const walk = (node: ts.Node) => {
    result.push(node)
    ts.forEachChild(node, walk)
  }
  walk(root)
  return result
}
const routeFiles = [
  ...new Set(
    primaryRoutes().flatMap(route =>
      route.screens.map((name: string) => `src/screens/${name}.tsx`),
    ),
  ),
]
const geometryProperties =
  /\b(?:width|height|minWidth|maxWidth|minHeight|maxHeight|padding\w*|margin\w*|borderRadius|gridTemplateColumns)\s*:/

describe('Fix 07 architecture enforcement', () => {
  it('enumerates every authenticated route and both Home implementations', () => {
    expect(authenticatedRoutes()).toHaveLength(19)
    expect(primaryRoutes()).toHaveLength(15)
    expect(routeFiles).toContain('src/screens/QuestHome.tsx')
    expect(routeFiles).toContain('src/screens/NotificationsScreen.tsx')
    expect(routeFiles).toContain('src/screens/SearchScreen.tsx')
    // The inventory expands automatically; update this deliberate review gate when adding routes.
  })
  it.each(routeFiles)(
    '%s obeys shell, flow, actions, grid, card and empty contracts',
    file => {
      const tree = parse(file)
      const all = nodes(tree)
      const shells = all.filter(node => tag(node) === 'PageShell')
      expect(shells.length).toBeGreaterThan(0)
      for (const shell of shells) {
        expect(prop(shell, 'header')?.getText()).toContain('<PageHeader')
        expect(ts.isJsxElement(shell)).toBe(true)
        if (ts.isJsxElement(shell)) {
          const children = shell.children.filter(
            child =>
              !(ts.isJsxText(child) && !child.text.trim()) &&
              !(ts.isJsxExpression(child) && !child.expression),
          )
          expect(children.map(tag)).toEqual(['PageFlow'])
        }
      }
      for (const node of all) {
        const name = tag(node)
        if (name === 'EntityGrid') {
          expect(prop(node, 'min')).toBeUndefined()
          expect(prop(node, 'style')).toBeUndefined()
          expect(nodes(node).some(n => tag(n) === 'PageEmptyState')).toBe(false)
        }
        if (name === 'PageHeader') {
          const action = prop(node, 'primaryAction')
          if (action) {
            expect(action.getText()).not.toMatch(/<|className|style=/)
            expect(action.getText()).toMatch(/label:/)
            expect(action.getText()).toMatch(/icon:/)
            expect(action.getText()).toMatch(/onClick:/)
            expect(action.getText()).not.toMatch(geometryProperties)
          }
          expect(prop(node, 'actions')?.getText() ?? '').not.toMatch(
            /btn-primary|New (?:project|routine|asset|meter|tracker|shopping|goal|reward)/i,
          )
        }
        if (name === 'PageEmptyState') {
          for (const key of ['icon', 'title', 'description'])
            expect(prop(node, key), `${file}: ${key}`).toBeTruthy()
          expect(
            prop(node, 'icon')?.initializer &&
              ts.isStringLiteral(prop(node, 'icon')!.initializer!),
          ).toBe(true)
          expect(prop(node, 'icon')?.getText()).toMatch(
            /^icon=['"][a-z_]+['"]$/,
          )
        }
        if (
          [
            'PageFlow',
            'PageSection',
            'PageTabs',
            'SummaryCard',
            'PageHero',
            'PagePrimaryAction',
            'PageEmptyState',
            'InlineEmptyState',
          ].includes(name)
        ) {
          expect(prop(node, 'style')).toBeUndefined()
          expect(prop(node, 'className')).toBeUndefined()
        }
        if (['EntityCard', 'EntityRow', 'PanelCard'].includes(name)) {
          expect(prop(node, 'style')?.getText() ?? '').not.toMatch(
            geometryProperties,
          )
          expect(prop(node, 'className')).toBeUndefined()
          // Outer sizing/padding must not be overridden.
          expect(prop(node, 'className')?.getText() ?? '').not.toMatch(
            /\b(?:p[xytrblse]?|m[xytrblse]?|w|h|min-w|min-h|max-w|max-h|rounded)-[\w.[\]-]+/,
          )
        }
        if (['EntityCard', 'EntityRow'].includes(name)) {
          let owner = node.parent
          while (owner && !['EntityGrid', 'EntityList'].includes(tag(owner))) {
            expect(prop(owner, 'style')?.getText() ?? '').not.toMatch(
              /gridTemplateColumns/,
            )
            expect(prop(owner, 'className')?.getText() ?? '').not.toMatch(
              /(?:['"`]|\s)grid(?:['"`]|\s)/,
            )
            owner = owner.parent
          }
        }
        if (name && !['EntityCard', 'EntityRow', 'PanelCard'].includes(name)) {
          expect(prop(node, 'className')?.getText() ?? '').not.toMatch(
            /(?:['"`]|\s)card(?:['"`]|\s)/,
          )
        }
        if (
          ['PageTabs', 'PageHero', 'SummaryCard', 'PageEmptyState'].includes(
            name,
          )
        ) {
          const owners: ts.Node[] = []
          let parent = node.parent
          while (parent) {
            owners.push(parent)
            parent = parent.parent
          }
          for (const owner of owners) {
            expect(prop(owner, 'style')?.getText() ?? '').not.toMatch(
              geometryProperties,
            )
            expect(prop(owner, 'className')?.getText() ?? '').not.toMatch(
              /\b(?:mt|mb|my|w|h|min-w|max-w)-/,
            )
          }
          const slot = owners.find(
            n =>
              ts.isJsxAttribute(n) &&
              ['navigation', 'summary'].includes(n.name.getText()),
          )
          if (name === 'PageEmptyState') continue
          // SummaryCard may be composed inside a semantic grid in the summary slot.
          expect(
            slot,
            `${file}: ${name} must be in its semantic PageFlow slot`,
          ).toBeTruthy()
          expect((slot as ts.JsxAttribute).name.getText()).toBe(
            name === 'PageTabs' ? 'navigation' : 'summary',
          )
        }
        if (name) {
          let parent = node.parent
          while (
            parent &&
            (ts.isJsxExpression(parent) ||
              ts.isBinaryExpression(parent) ||
              ts.isParenthesizedExpression(parent) ||
              ts.isConditionalExpression(parent) ||
              ts.isJsxFragment(parent))
          )
            parent = parent.parent
          if (parent && ['PageFlow', 'PageSection'].includes(tag(parent))) {
            expect(prop(node, 'className')?.getText() ?? '').not.toMatch(
              /\b(?:mt|mb|my)-/,
            )
            expect(prop(node, 'style')?.getText() ?? '').not.toMatch(
              /margin\w*\s*:/,
            )
            expect(prop(node, 'className')?.getText() ?? '').not.toMatch(
              /flex-col.*gap-/,
            )
          }
        }
      }
    },
  )
  it('the required tabbed pages all consume the navigation slot', () => {
    for (const name of ['Maintenance', 'Shopping', 'Rewards', 'Settings']) {
      const source = read(`src/screens/${name}Screen.tsx`)
      expect(source).toContain('<PageTabs')
      expect(source).toMatch(/navigation=\{\s*<PageTabs/)
    }
  })
  it('Home and Rewards use mandatory SummaryCard anatomy', () => {
    for (const name of ['FocusHome', 'RewardsScreen'])
      expect(read(`src/screens/${name}.tsx`)).toContain('<SummaryCard')
    render(<PageHero icon='gift' label='Available' value={42} meta='Points' />)
    for (const role of ['icon', 'label', 'value', 'meta'])
      expect(document.querySelector(`.summary-card__${role}`)).toBeTruthy()
    expect(document.querySelector('.summary-card__icon svg')).toBeTruthy()
    expect(read('src/components/page/SummaryCard.tsx')).not.toContain(
      'children:',
    )
    expect(css()).toMatch(/block-size: 140px/)
  })
  it('PageFlow owns region order and PageShell owns its end sentinel', () => {
    const { container } = render(
      <PageShell header={<PageHeader title='Page' />}>
        <PageFlow
          navigation={
            <FilterSegment
              ariaLabel='Navigation'
              value='a'
              onChange={() => {}}
              options={[{ id: 'a', label: 'Navigation' }]}
            />
          }
          summary={
            <PageHero icon='gift' label='Summary' value={42} meta='Points' />
          }
          secondary='Secondary'
        >
          Content
        </PageFlow>
      </PageShell>,
    )
    expect(
      [...container.querySelectorAll('[data-page-slot]')].map(n =>
        n.getAttribute('data-page-slot'),
      ),
    ).toEqual(['navigation', 'summary', 'content', 'secondary'])
    expect(
      screen.getByTestId('page-end').previousElementSibling?.className,
    ).toBe('page-flow')
    expect(read('src/components/PageHeader.tsx')).toContain(
      'primaryAction?: PagePrimaryActionData',
    )
    for (const name of [
      'PageFlow',
      'SummaryCard',
      'EmptyState',
      'PagePrimaryAction',
      'PageTabs',
    ])
      expect(read(`src/components/page/${name}.tsx`)).not.toMatch(
        /style\?:|className\?:/,
      )
  })
  it('rejects arbitrary navigation/summary wrappers at runtime', () => {
    expect(() =>
      render(<PageFlow navigation={<div>Local tabs</div>}>Content</PageFlow>),
    ).toThrow('PageFlow navigation requires')
    expect(() =>
      render(<PageFlow summary={<div>Local summary</div>}>Content</PageFlow>),
    ).toThrow('PageFlow summary requires')
  })
  it('filters geometry out of entity styles even when a variable carries extra properties', () => {
    const style = {
      borderColor: 'red',
      opacity: 0.5,
      padding: 0,
      height: 40,
      width: 190,
      borderRadius: 0,
    }
    const { container } = render(<EntityCard style={style}>Entity</EntityCard>)
    const card = container.querySelector<HTMLElement>('.entity-card')!
    expect(card.style.borderColor).toBe('red')
    expect(card.style.opacity).toBe('0.5')
    for (const key of ['padding', 'height', 'width', 'borderRadius'] as const)
      expect(card.style[key]).toBe('')
  })
  it('rejects a bypass of the canonical shell flow', () => {
    expect(() =>
      render(
        <PageShell header={<PageHeader title='Title' />}>
          <div>Local flow</div>
        </PageShell>,
      ),
    ).toThrow('PageShell requires')
  })
})
