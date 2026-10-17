# DYDAN Global UI Audit

Audit date: 2026-10-17  
Branch: `codex/global-ui-standardization`

## Repository findings

- Framework: React 19 + TypeScript + Vite.
- Routing: React Router with the authenticated shell in `src/App.tsx`.
- Server state: TanStack Query-backed hooks and domain mutation hooks.
- Native wrapper: Capacitor 8 for Android/iOS.
- Themes: dydan and sovereign, light/dark variants.
- Internationalization: i18next with English LTR and Arabic RTL.
- Existing design foundation: semantic CSS tokens in `src/index.css`, reusable form/dialog components, and a common application shell.

The architectural inconsistency came from module pages reimplementing shell-width containers, page headers, segmented tabs, icons, and navigation metadata independently.

## Consolidation measurements

Comparing the branch baseline (`HEAD` before this assignment) to the corrected working tree:

| Duplicate pattern | Before | After | Removed/consolidated |
| --- | ---: | ---: | ---: |
| Local `page-header` implementations | 14 | 0 | 14 |
| Local `maxWidth: 1080` page wrappers | 15 | 0 | 15 |
| Local `seg-tabs` implementations | 2 | 0 | 2 |
| App-local navigation arrays (`NAV_PRIMARY/ORGANIZE/TEAM`) | 3 | 0 | 3 |
| **Total duplicate implementation instances** | **34** | **0** | **34** |

## Screen inventory and applied correction

The repository contains 21 `src/screens/*.tsx` files. `SharedStatesScreens.tsx` implements three distinct screens, producing **23 audited screen surfaces**. **22 surfaces were corrected** in this assignment; Email Change Verification was audited and retained without a source change.

| Screen/surface | Route/context | Original inconsistency/root cause | Applied correction | Global source | Validation |
| --- | --- | --- | --- | --- | --- |
| Focus Home | `/`, Focus | Local width/header and page-specific layout | Shared page layout/header/token use retained with Focus identity | `GlobalUI`, tokens | Chromium + visual |
| Quest Home | `/`, Quest | Local 1080 wrapper | Shared layout contract without changing Quest behavior | `GlobalUI`, tokens | Chromium + sovereign |
| Today | `/today` | Local width/header | Global page structure and action alignment | `GlobalUI` | Chromium + RTL |
| All Tasks | `/all-tasks` | Local width/header | Global layout/header; shared empty/action placement | `GlobalUI` | Chromium + visual + mobile |
| Calendar | `/calendar` | Local width/header | Global layout/header | `GlobalUI` | Chromium + RTL |
| Projects | `/projects` | Local width/header | Global layout/header; registry metadata | `GlobalUI`, registry | Chromium |
| Routines | `/routines` | Local width/header | Global layout/header | `GlobalUI` | Chromium + visual |
| Assets | `/assets` | Maintenance naming, duplicate hierarchy, local header/tabs | Canonical Assets owner; All Assets/Meters/Things; shared segmented control; legacy redirect | registry, `GlobalUI` | Chromium + persistence |
| Shopping | `/shopping` | Shopping/list context and header actions inconsistent | Canonical “Shopping lists” header, list/detail/items kept in one owner, global layout/actions | registry, `GlobalUI` | Chromium + visual + persistence |
| Goals | `/goals` | Local width/header | Global layout/header | `GlobalUI` | Chromium |
| Rewards | `/rewards` | Local width/header/local segmented tabs | Global layout/header + shared segmented control | `GlobalUI` | Chromium |
| Progress | `/progress` | Local width/header | Global layout/header | `GlobalUI` | Chromium |
| Activity | `/activity` | Local width/header | Global layout/header | `GlobalUI` | Chromium |
| Notifications | `/notifications` | Local width/header | Global layout/header | `GlobalUI` | Chromium |
| Settings | `/settings` | Local header and category tab treatment | Global header + `GlobalTabs`; desktop wrap/mobile horizontal scroll | `GlobalUI` | Chromium + visual + mobile |
| Search | `/search` | Local width wrapper | Global layout and shared empty-state treatment | `GlobalUI` | Chromium |
| Error | `/error` | Page-specific state styling | Normalized shared state/layout/token behavior | shared tokens/state UI | Chromium suite |
| Auth | unauthenticated/`/login` | Token/icon inconsistencies | Reused theme tokens and canonical icon behavior while retaining auth frame | tokens, `Icon` | Chromium + visual |
| Onboarding | auth sign-up state | Token/control inconsistencies | Normalized shared theme/control behavior while retaining onboarding frame | tokens/shared controls | Chromium suite |
| Email Change Verification | `/email-change/verify` | Audited; no global-shell duplication requiring change | Retained dedicated verification surface | existing shared tokens | Type/build + route logic audit |
| Offline | `/offline` | State-specific presentation | Shared state conventions and global tokens | shared state UI | Chromium suite |
| Unavailable | `/unavailable` | State-specific presentation | Shared state conventions and global tokens | shared state UI | Chromium suite |
| Permission denied | `/permission-denied` | State-specific presentation | Shared state conventions and global tokens | shared state UI | Chromium suite |

## Component and architecture corrections

### Added/centralized

- `src/navigation/moduleRegistry.ts`
- `src/ui/Icon.tsx`
- `src/ui/GlobalUI.tsx`
- `scripts/check-global-ui.mjs`
- `src/ui/globalUiContracts.spec.ts`
- `e2e/global-ui-architecture.spec.js`

### Corrected consumers

- Desktop/sidebar and mobile navigation derive from registry metadata.
- Canonical Assets route is `/assets`.
- `/maintenance` redirects to `/assets`.
- Settings uses the global tab system.
- Assets and Rewards use the global segmented control.
- Shell screens use global page width/header structure.
- Common icons route through the global icon registry.
- English/Arabic navigation includes the Assets label.

## Remaining audit issues

No unresolved source-level global UI architecture violation is reported by `check:ui-architecture`.

Environment-only validation limits are recorded in `DYDAN_UI_VALIDATION_REPORT.md`: Firefox cannot launch on this Windows host because its installed binary has an invalid side-by-side configuration; Android native assembly is blocked by the host JDK/Gradle class-version mismatch; iOS native build tools are unavailable on Windows.

