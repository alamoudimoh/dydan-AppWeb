import { readdirSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import ts from 'typescript'
import { describe, expect, it } from 'vitest'

/**
 * Placement assertions for the Categories section.
 *
 * These read the source rather than rendering SettingsScreen: the screen needs
 * the full provider stack (MUI Joy, ThemeContext, LocalizationContext, LiveData,
 * 13 tab panels, QR codes) before a single row renders, so a render test here
 * would be a test of that stack rather than of placement. The behaviour of the
 * section itself is covered by CategorySettings.test.tsx; what matters here is
 * *where* it is mounted and *under what conditions*, which is exactly what the
 * source determines.
 */
const read = (relative: string) =>
  readFileSync(fileURLToPath(new URL(relative, import.meta.url)), 'utf8')

// Comments are stripped before any structural reasoning: a prose mention of
// isSolo must not read as a guard on the next expression.
const stripComments = (source: string) =>
  source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '')

const settingsScreen = stripComments(read('../screens/SettingsScreen.tsx'))
const categorySettings = read('./CategorySettings.tsx')
const createEntityModal = read('./create/CreateEntityModal.tsx')
const entityConfigs = read('./create/entityConfigs.tsx')

const tabIds = [...settingsScreen.matchAll(/\{ id: '([^']+)', label:/g)].map(
  match => match[1],
)

/** JSX-aware panel lookup survives formatting and accessibility attributes. */
const source = ts.createSourceFile(
  'SettingsScreen.tsx',
  settingsScreen,
  ts.ScriptTarget.Latest,
  true,
  ts.ScriptKind.TSX,
)
const panels = new Map<string, ts.JsxElement>()
const visit = (node: ts.Node) => {
  if (
    ts.isJsxElement(node) &&
    node.openingElement.tagName.getText(source) === 'TabPanel'
  ) {
    const value = node.openingElement.attributes.properties.find(
      p => ts.isJsxAttribute(p) && p.name.getText(source) === 'value',
    ) as ts.JsxAttribute | undefined
    if (value?.initializer && ts.isStringLiteral(value.initializer))
      panels.set(value.initializer.text, node)
  }
  ts.forEachChild(node, visit)
}
visit(source)
const panelBody = (value: string) => {
  const panel = panels.get(value)
  expect(panel, `TabPanel value='${value}' not found`).toBeTruthy()
  return panel!.getText(source)
}

describe('Categories section placement', () => {
  it('mounts the section inside the Space tab, and only there', () => {
    const mounts = settingsScreen.match(/<CategorySettings\s*\/>/g) ?? []
    expect(mounts).toHaveLength(1)
    expect(panelBody('team')).toContain('<CategorySettings />')

    for (const value of tabIds.filter(id => id !== 'team')) {
      expect(panelBody(value)).not.toContain('<CategorySettings />')
    }
  })

  it('does not add a top-level Settings tab for categories', () => {
    expect(tabIds).toHaveLength(13)
    expect(tabIds).toContain('team')
    expect(tabIds).not.toContain('categories')
    expect(new Set(tabIds).size).toBe(tabIds.length)
  })

  it('is not gated on space membership, so Solo users reach it', () => {
    const at = settingsScreen.indexOf('<CategorySettings />')
    expect(at).toBeGreaterThan(-1)

    // Walk back to the closest preceding expression boundary. A
    // `{!isSolo && (` or `{isSolo ? (` guard would land inside this window;
    // an unconditional mount has only a closing `)}` or an opening `{`.
    const before = settingsScreen.slice(0, at)
    const boundary = Math.max(
      before.lastIndexOf(')}'),
      before.lastIndexOf('{'),
      before.lastIndexOf('('),
    )
    const guardWindow = settingsScreen.slice(boundary, at)
    expect(guardWindow).not.toMatch(/isSolo/)
    expect(guardWindow).not.toMatch(/[&?:]/)
  })

  it('keeps the Space panel itself reachable for Solo users', () => {
    const at = panels.get('team')!.getStart(source)
    const before = settingsScreen.slice(0, at)
    const boundary = Math.max(
      before.lastIndexOf(')}'),
      before.lastIndexOf('{'),
      before.lastIndexOf('('),
    )
    expect(settingsScreen.slice(boundary, at)).not.toMatch(/isSolo/)
  })
})

describe('Settings Space terminology', () => {
  it('labels the shared-space tab "Space" while the internal id stays "team"', () => {
    const entry = settingsScreen.match(/\{ id: 'team', label: '([^']+)'/)
    expect(entry, 'the team tab entry was not found').not.toBeNull()
    expect(entry?.[1]).toBe('Space')

    // The id is a contract, not copy: the TabPanel, any deep link and the
    // i18n key are all keyed off it, so it must survive the rename untouched.
    expect(tabIds).toContain('team')
    expect(panels.has('team')).toBe(true)
    expect(tabIds).toHaveLength(13)
  })

  it('renames the visible headings and the related invite/leave/rename copy', () => {
    for (const heading of [
      "<Section title='Space settings'>",
      "<Section title='Members'>",
      "<Section title='Space status'>",
    ]) {
      expect(settingsScreen, heading).toContain(heading)
    }
    // The two headings the rename explicitly replaced.
    expect(settingsScreen).not.toContain("<Section title='Team settings'>")
    expect(settingsScreen).not.toContain("<Section title='Team members'>")
    expect(settingsScreen).not.toContain("label='Team name'")
    expect(settingsScreen).not.toContain("title='Rename team'")
    expect(settingsScreen).not.toContain("label='Leave team'")
  })

  it('leaves no user-facing "team" wording in the screen', () => {
    // The only surviving occurrence is the bare internal tab id, which the
    // panel, deep links and the translation key all depend on. Anything else
    // would be copy the user can see.
    const literals = [
      ...settingsScreen.matchAll(/'([^'\n]*)'/g),
      ...settingsScreen.matchAll(/"([^"\n]*)"/g),
    ].map(match => match[1])
    const userFacing = [
      ...new Set(
        literals.filter(
          text => /team/i.test(text) && !text.startsWith('settings-tabs-'),
        ),
      ),
    ]
    expect(userFacing).toEqual(['team'])
  })

  it('renames the translation value but keeps the translation key', () => {
    const i18n = read('../i18n.ts')
    expect(i18n).toContain("'nav.team': 'Space'")
    // App.tsx looks the label up by this key, so the key itself must not move.
    expect(i18n).not.toContain("'nav.space'")
    expect(read('../App.tsx')).toContain("t('nav.team')")
  })

  it('points the task editor empty state at the renamed path', () => {
    const i18n = read('../i18n.ts')
    expect(i18n).toContain('Settings → Space → Categories')
    expect(i18n).not.toContain('Settings → Team → Categories')
  })
})

describe('Categories section reachability', () => {
  it('is mounted after the solo/shared branch, so it renders in both cases', () => {
    const panel = panelBody('team')
    const mount = panel.indexOf('<CategorySettings />')
    expect(mount).toBeGreaterThan(-1)

    // This panel holds a solo/shared ternary that picks between the members
    // section and the solo status section. The Categories mount comes after
    // both of them, so it is a sibling of the ternary rather than a branch of
    // it, and is therefore reached whether the user is solo or sharing. With
    // the "not gated on space membership" assertion above, that is what makes
    // the section visible for both regardless of member count.
    for (const heading of [
      "<Section title='Space settings'>",
      "<Section title='Members'>",
      "<Section title='Space status'>",
    ]) {
      const at = panel.indexOf(heading)
      expect(at, `${heading} is missing from the team panel`).toBeGreaterThan(
        -1,
      )
      expect(at, `${heading} comes after the Categories mount`).toBeLessThan(
        mount,
      )
    }

    // Sibling position alone is not enough: a `{!isSolo && <CategorySettings />}`
    // wrapper would still sit after both branches while hiding the section from
    // every solo user. Nothing between the last branch boundary and the mount
    // may re-introduce a membership guard.
    const boundary = Math.max(
      panel.lastIndexOf(')}', mount - 1),
      panel.lastIndexOf('{', mount - 1),
      panel.lastIndexOf('(', mount - 1),
    )
    const window = panel.slice(boundary, mount)
    expect(window).not.toMatch(/isSolo/)
    expect(window).not.toMatch(/[&?:]/)
  })

  it('takes no membership input, so member count cannot hide it', () => {
    const component = read('./CategorySettings.tsx')
    // A component that needed to know about the circle's membership would take
    // it as a prop. It takes none, and its only data source is the circle's
    // own category query, which a solo circle has too.
    const body = stripComments(component)
    expect(body).toMatch(/export default function CategorySettings\(\)/)
    expect(body).not.toMatch(/isSolo/)
    expect(body).not.toMatch(/\bmembers\b/)
    expect(body).toMatch(/useChoreCategories\(\{[\s\S]*?includeArchived: true/)
  })
})

describe('single Categories implementation', () => {
  it('defines CategorySettings in exactly one module', () => {
    const componentsDir = fileURLToPath(new URL('.', import.meta.url))
    const definitions = readdirSync(componentsDir)
      .filter(name => name.endsWith('.tsx') && !name.endsWith('.test.tsx'))
      .filter(name =>
        readFileSync(fileURLToPath(new URL(name, import.meta.url)), 'utf8')
          .replace(/\/\*[\s\S]*?\*\//g, '')
          .replace(/\/\/[^\n]*/g, '')
          .includes('export default function CategorySettings'),
      )
    expect(definitions).toEqual(['CategorySettings.tsx'])
  })

  it('imports and mounts it exactly once', () => {
    const imports = settingsScreen.match(/^import CategorySettings /gm) ?? []
    expect(imports).toHaveLength(1)
    expect(settingsScreen.match(/<CategorySettings\s*\/>/g) ?? []).toHaveLength(
      1,
    )
  })

  it('renders only one Categories section in the whole Settings screen', () => {
    // A second implementation would show up as a second heading, or as another
    // component mounting its own categories section. SettingsScreen itself must
    // not contain the heading, because the section owns it.
    expect(settingsScreen.match(/<Section title='Categories'>/g) ?? []).toEqual(
      [],
    )
    expect(read('./CategorySettings.tsx')).toContain(
      "<Section title='Categories'>",
    )

    // Nothing else in the app may pull in a second copy of the section.
    const appRoot = fileURLToPath(new URL('../..', import.meta.url))
    const importers: string[] = []
    const walk = (dir: string) => {
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        if (entry.isDirectory()) {
          if (entry.name === 'node_modules') continue
          walk(`${dir}/${entry.name}`)
        } else if (
          entry.name.endsWith('.tsx') &&
          !entry.name.endsWith('.test.tsx')
        ) {
          const source = readFileSync(`${dir}/${entry.name}`, 'utf8')
          if (/import\s+CategorySettings\b/.test(source)) {
            importers.push(`${dir}/${entry.name}`)
          }
        }
      }
    }
    walk(appRoot)
    expect(importers).toHaveLength(1)
  })
})

describe('category creation contract', () => {
  it('uses the unified entity controller rather than a feature-local form', () => {
    expect(categorySettings).toContain("type='category'")
    expect(categorySettings).not.toContain('<FormModal')
    expect(entityConfigs).toContain("type: 'category'")
  })
})

describe('task editor category picker contract', () => {
  it('reads the active-only category query, so archived rows are not selectable', () => {
    // CreateEntityModal calls the hook with no options, which defaults
    // includeArchived to false. That is what keeps an archived category out of
    // new assignment, and it is the contract PickerHarness mirrors in
    // CategorySettings.test.tsx.
    expect(createEntityModal).toMatch(/useChoreCategories\(\s*\)/)
    expect(createEntityModal).not.toMatch(/useChoreCategories\(\s*\{/)
  })

  it('keeps a task already assigned to an archived category resolved', () => {
    // The editor seeds selection from the task, and the visible name comes from
    // the embedded chore payload rather than the active list, so archiving
    // cannot blank an existing task's category.
    expect(entityConfigs).toMatch(/options\?\.task\?\.categoryId/)
    expect(createEntityModal).toMatch(/options\?\.task\?\.categoryId/)
    expect(createEntityModal).toMatch(/options\.task\.category/)
  })

  it('points the empty state at the section that actually manages categories', () => {
    const i18n = read('../i18n.ts')
    expect(i18n).toContain('Settings → Space → Categories')
    expect(i18n).not.toContain('Create one from Settings')
  })
})
