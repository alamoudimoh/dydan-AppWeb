import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

const root = fileURLToPath(new URL('../', import.meta.url))
const read = (path: string) => readFileSync(`${root}${path}`, 'utf8')

describe('global UI architecture contracts', () => {
  it('keeps route and sidebar metadata in the module registry', () => {
    const app = read('App.tsx')
    expect(app).toContain('NAVIGATION_GROUPS')
    expect(app).toContain('SCREEN_PATH')
    expect(app).not.toContain('const NAV_PRIMARY')
    expect(app).not.toContain("maintenance: '/maintenance'")
  })

  it('keeps the legacy maintenance URL as a safe redirect to Assets', () => {
    const registry = read('navigation/moduleRegistry.ts')
    expect(registry).toMatch(/id:\s*'assets'[\s\S]{0,240}?path:\s*'\/assets'/)
    expect(registry).toContain("'/maintenance': '/assets'")
  })

  it('uses the shared page container rather than duplicated inline dimensions', () => {
    const screens = [
      'ActivityScreen.tsx',
      'AllTasksScreen.tsx',
      'CalendarScreen.tsx',
      'GoalsScreen.tsx',
      'MaintenanceScreen.tsx',
      'NotificationsScreen.tsx',
      'ProgressScreen.tsx',
      'ProjectsScreen.tsx',
      'RewardsScreen.tsx',
      'RoutinesScreen.tsx',
      'ShoppingScreen.tsx',
      'TodayScreen.tsx',
    ]
    for (const screen of screens) {
      expect(read(`screens/${screen}`)).not.toContain(
        "maxWidth: 1080, margin: '0 auto'",
      )
    }
  })
})
