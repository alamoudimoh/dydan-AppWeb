import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const filePath = path.resolve(__dirname, 'DeveloperSettings.jsx')

test('DeveloperSettings imports getAccessTokenExpiry from TokenStorage', () => {
  const source = fs.readFileSync(filePath, 'utf8')

  const tokenStorageImport = source.match(
    /import\s+\{[^}]*\}\s+from\s+['"]\.\.\/\.\.\/utils\/TokenStorage['"]/s,
  )
  assert.ok(
    tokenStorageImport,
    'DeveloperSettings should import from TokenStorage',
  )

  const importedNames = tokenStorageImport[0]
  assert.ok(
    importedNames.includes('getAccessTokenExpiry'),
    'TokenStorage import must include getAccessTokenExpiry',
  )
})
