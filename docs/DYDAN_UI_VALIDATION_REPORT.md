# DYDAN UI Validation Report

Validation date: 2026-10-17  
Branch: `codex/global-ui-standardization`

## Screen coverage matrix

Legend:

- **A** = automated application/browser coverage.
- **V** = representative screenshot rendered and visually inspected in this assignment.
- **R** = RTL/Arabic suite coverage.
- **M** = mobile/responsive suite coverage.

| Screen | A | V | R/M notes |
| --- | :---: | :---: | --- |
| Focus Home | yes | yes | R + M covered in broader Chromium suites |
| Quest Home | yes | representative theme coverage | sovereign project |
| Today | yes | no dedicated snapshot | R + M |
| All Tasks | yes | yes | R + M |
| Calendar | yes | no dedicated snapshot | R + M |
| Projects | yes | no dedicated snapshot | M |
| Routines | yes | yes | M |
| Assets | yes | no dedicated snapshot | persistence + M |
| Shopping | yes | yes, light/dark | persistence + M |
| Goals | yes | no dedicated snapshot | M |
| Rewards | yes | no dedicated snapshot | M |
| Progress | yes | no dedicated snapshot | M |
| Activity | yes | no dedicated snapshot | M |
| Notifications | yes | no dedicated snapshot | M |
| Settings | yes | yes, light/dark | M; long tabs verified after global wrap fix |
| Search | yes | no dedicated snapshot | M |
| Error | yes | no dedicated snapshot | automated suite |
| Auth | yes | yes | public + M |
| Onboarding | yes | no dedicated snapshot | automated suite |
| Email Change Verification | route/source contract + type/build | no | dedicated non-shell surface |
| Offline | yes | no dedicated snapshot | automated state coverage |
| Unavailable | yes | no dedicated snapshot | automated state coverage |
| Permission denied | yes | no dedicated snapshot | automated state coverage |

Only rows marked **V** are claimed as visually inspected. Automated render/testing is not described as manual visual validation.

## Test and build results

### Core repository gate

`./scripts/verify.sh` completed successfully after making the Windows npm/npx wrappers available to Git Bash.

Observed results:

- dependency install: pass using `npm ci --force` because the lock contains a Linux-only Rollup package,
- changed-file ESLint: **0 errors**, 80 inherited warnings,
- Prettier changed-file check: pass,
- global UI architecture check: pass,
- TypeScript `tsc --noEmit`: pass,
- Node tests: **125/125 passed**,
- UI/Vitest: **76/76 passed** across 11 files,
- production build: pass.

### Browser and functional coverage

- `e2e/global-ui-architecture.spec.js`: **2/2 passed** on Chromium.
- maintenance/assets persistence targeted rerun: **1/1 passed** after updating the canonical Assets selector.
- wide Chromium functional batch including Arabic/RTL, mobile, persistence, auth refresh/history, themes, shell and production UI: **132 passed**.
- full Chromium project: **220/220 passed**, with 16 server/mock contract checks preceding browser execution.
- sovereign project: **2 passed, 16 skipped**.
- visual project after final global-tab correction: **9/9 passed** on Windows.

### Cross-browser

After correcting the smoke harness to block service workers and stop waiting for `networkidle` in an application with SSE:

- Chromium critical: **12/12 passed**.
- WebKit: **12/12 passed**.
- Firefox: **0/12 executed successfully** because the browser process cannot start on this host.

Exact Firefox host error outside Playwright:

`The application has failed to start because its side-by-side configuration is incorrect.`

Playwright reports `browserType.launch: spawn UNKNOWN` for the same executable.

This is a browser-host installation failure; no page code runs in those failed cases.

## Visual evidence

Windows visual baselines generated from the final corrected implementation:

- `e2e/visual.spec.js-snapshots/light---visual-win32.png`
- `e2e/visual.spec.js-snapshots/light--all-tasks-visual-win32.png`
- `e2e/visual.spec.js-snapshots/light--routines-visual-win32.png`
- `e2e/visual.spec.js-snapshots/light--shopping-visual-win32.png`
- `e2e/visual.spec.js-snapshots/light--settings-visual-win32.png`
- `e2e/visual.spec.js-snapshots/light--login-visual-win32.png`
- `e2e/visual.spec.js-snapshots/dark---visual-win32.png`
- `e2e/visual.spec.js-snapshots/dark--shopping-visual-win32.png`
- `e2e/visual.spec.js-snapshots/dark--settings-visual-win32.png`

Manual inspection confirmed:

- page title/action alignment is consistent across equivalent pages,
- Shopping list/detail/item hierarchy remains in one visible context,
- empty-state icon/title/action placement is consistent,
- dydan light/dark identity is preserved,
- Settings long tab sets no longer clip on desktop; they wrap through `GlobalTabs`.

Linux visual baselines remain the CI-authoritative platform snapshots already used by the visual project.

## Native/Capacitor validation

- `cap sync android`: pass; 22 Android Capacitor plugins discovered and web assets/config synchronized.
- `cap sync ios`: pass for Capacitor sync; 22 iOS plugins discovered.
- iOS native build: not executable on this Windows host. Capacitor reported CocoaPods missing and `xcodebuild` unavailable.
- Android Gradle `assembleDebug`: attempted and blocked by host Java/Gradle compatibility:
  - `Unsupported class file major version 69`.
  - `JAVA` is not exposed in the shell PATH, while Gradle auto-provisioning selects a JVM that the current build script toolchain cannot analyze.

These native-host limitations do not change the successful web production build or Capacitor sync results.

## Known environment constraint

Plain `npm ci` on this Windows host reports `EBADPLATFORM` because `@rollup/rollup-linux-x64-gnu` is present in the lockfile. The repository verification gate was completed with `npm ci --force`; application typecheck/tests/build then passed.

