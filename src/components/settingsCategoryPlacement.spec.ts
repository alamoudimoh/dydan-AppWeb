import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

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
const createTaskModal = read('./CreateTaskModal.tsx')

const tabIds = [
  ...settingsScreen.matchAll(/\{ id: '([^']+)', label:/g),
].map(match => match[1])

/** The text of the TabPanel that starts at `value`, up to the next panel. */
const panelBody = (value: string) => {
  const start = settingsScreen.indexOf(`<TabPanel value='${value}'`)
  expect(start, `TabPanel value='${value}' not found`).toBeGreaterThan(-1)
  const next = settingsScreen.indexOf('<TabPanel value=', start + 1)
  return settingsScreen.slice(start, next === -1 ? undefined : next)
}

describe('Categories section placement', () => {
  it('mounts the section inside the Team tab, and only there', () => {
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

  it('is not gated on team membership, so Solo users reach it', () => {
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

  it('keeps the Team panel itself reachable for Solo users', () => {
    const at = settingsScreen.indexOf("<TabPanel value='team'")
    const before = settingsScreen.slice(0, at)
    const boundary = Math.max(
      before.lastIndexOf(')}'),
      before.lastIndexOf('{'),
      before.lastIndexOf('('),
    )
    expect(settingsScreen.slice(boundary, at)).not.toMatch(/isSolo/)
  })
})

describe('task editor category picker contract', () => {
  it('reads the active-only category query, so archived rows are not selectable', () => {
    // CreateTaskModal calls the hook with no options, which defaults
    // includeArchived to false. That is what keeps an archived category out of
    // new assignment, and it is the contract PickerHarness mirrors in
    // CategorySettings.test.tsx.
    expect(createTaskModal).toMatch(/useChoreCategories\(\s*\)/)
    expect(createTaskModal).not.toMatch(/useChoreCategories\(\s*\{/)
  })

  it('keeps a task already assigned to an archived category resolved', () => {
    // The editor seeds selection from the task, and the visible name comes from
    // the embedded chore payload rather than the active list, so archiving
    // cannot blank an existing task's category.
    expect(createTaskModal).toMatch(/taskToEdit\?\.categoryId/)
    expect(createTaskModal).toMatch(/categoryId,/)
  })

  it('points the empty state at the section that actually manages categories', () => {
    expect(createTaskModal).toContain('Settings → Team → Categories')
    expect(createTaskModal).not.toContain('Create one from Settings')
  })
})
