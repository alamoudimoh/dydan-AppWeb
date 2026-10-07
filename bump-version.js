#!/usr/bin/env node

import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Read package.json
const packageJsonPath = path.join(__dirname, 'package.json')
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))

// Get current version
const currentVersion = packageJson.version
console.log(`Current version: ${currentVersion}`)

// Parse YYYYMM-NN version. The `--bump TYPE` argument is accepted for
// compatibility with scripts/release.sh but in the calendar scheme every
// bump advances the same sequence.
const versionMatch = currentVersion.match(/^(\d{6})-(\d+)$/)
if (!versionMatch) {
  console.error(
    `Invalid version format "${currentVersion}": expected YYYYMM-NN`,
  )
  process.exit(1)
}
const [currentYearMonth, currentSeq] = versionMatch.slice(1, 3)

const now = new Date()
const nowYearMonth =
  String(now.getFullYear()) + String(now.getMonth() + 1).padStart(2, '0')

const newSeq = currentYearMonth === nowYearMonth ? Number(currentSeq) + 1 : 1
const newVersion = `${nowYearMonth}-${String(newSeq).padStart(2, '0')}`

console.log(`New version: ${newVersion}`)

// Update package.json
packageJson.version = newVersion
fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n')
console.log('✓ Updated package.json')

// Read Android build.gradle to get current versionCode
const buildGradlePath = path.join(__dirname, 'android', 'app', 'build.gradle')
let buildGradle = fs.readFileSync(buildGradlePath, 'utf8')

// Extract current versionCode
const versionCodeMatch = buildGradle.match(/versionCode\s+(\d+)/)
const currentVersionCode = versionCodeMatch ? parseInt(versionCodeMatch[1]) : 1
const newVersionCode = currentVersionCode + 1

console.log(`Android versionCode: ${currentVersionCode} → ${newVersionCode}`)

// Use capacitor-set-version to update both iOS and Android
try {
  console.log('\nUpdating iOS and Android versions...')

  // Set version and build number for both platforms
  execSync(
    `npx capacitor-set-version set -v ${newVersion} -b ${newVersionCode}`,
    {
      stdio: 'inherit',
    },
  )

  console.log('\n✓ Successfully bumped version to', newVersion)
  console.log(`✓ Build number: ${newVersionCode}`)
  console.log('\nNext steps:')
  console.log('1. Review the changes')
  console.log(
    '2. Commit: git add . && git commit -m "Bump version to ' +
      newVersion +
      '"',
  )
  console.log('3. Tag: git tag v' + newVersion)
  console.log('4. Push: git push origin main --tags')
} catch (error) {
  console.error('Error updating versions:', error.message)
  process.exit(1)
}
