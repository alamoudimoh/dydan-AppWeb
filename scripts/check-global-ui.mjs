import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

const screensDir = new URL('../src/screens/', import.meta.url)
const screenFiles = readdirSync(screensDir)
  .filter(name => name.endsWith('.tsx'))
  .map(name => ({
    name,
    text: readFileSync(new URL(name, screensDir), 'utf8'),
  }))

const violations = []
const shellScreens = screenFiles.filter(
  ({ name }) =>
    ![
      'AuthScreen.tsx',
      'EmailChangeVerificationScreen.tsx',
      'OnboardingScreen.tsx',
      'SharedStatesScreens.tsx',
    ].includes(name),
)

for (const { name, text } of shellScreens) {
  if (text.includes('maxWidth: 1080')) {
    violations.push(`${name}: duplicate page width; use PageLayout`)
  }
  if (/className=['"]page-header\b/.test(text)) {
    violations.push(`${name}: local page header; use PageHeader`)
  }
  if (/className=['"]seg-tabs\b/.test(text)) {
    violations.push(`${name}: local segmented tabs; use SegmentedControl`)
  }
  if (/#[0-9a-f]{3,8}\b/i.test(text)) {
    violations.push(`${name}: hard-coded color; use semantic design tokens`)
  }
}

const app = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8')
if (/const NAV_(PRIMARY|ORGANIZE|TEAM)/.test(app)) {
  violations.push('App.tsx: duplicate navigation registry')
}
if (/maintenance:\s*['"]\/maintenance/.test(app)) {
  violations.push('App.tsx: legacy Maintenance route reintroduced as canonical')
}

const registry = readFileSync(
  new URL('../src/navigation/moduleRegistry.ts', import.meta.url),
  'utf8',
)
if (!/id:\s*'assets'[\s\S]{0,240}?path:\s*'\/assets'/.test(registry)) {
  violations.push(
    'moduleRegistry.ts: Assets must remain the canonical asset route',
  )
}
if (!registry.includes("'/maintenance': '/assets'")) {
  violations.push('moduleRegistry.ts: legacy /maintenance redirect is required')
}

if (violations.length) {
  console.error('Global UI architecture violations:')
  for (const violation of violations) console.error(`- ${violation}`)
  process.exit(1)
}

console.log(
  `Global UI architecture check passed for ${shellScreens.length} shell screens.`,
)
