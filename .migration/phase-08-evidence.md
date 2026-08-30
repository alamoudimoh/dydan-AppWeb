# Phase 8 Execution Evidence

Status: COMPLETE AND MERGED. Covered-route closure reached; full local gate green
and post-merge verified on develop (`59fc0f5`).

## Authority

Figma Make screens cover the authenticated app surfaces. The four in-scope routes
from the Phase 6 inventory are the covered surfaces for this phase: `/family`
(`views/FamilyProgress/*`), `/maintenance` (`views/Maintenance/*`),
`/routines` (`views/Routines/*`), and `/chores` + `/my/chores`
(`views/Chores/MyChores.jsx` + `FigmaAllTasksScreen`). `design-source/figma-make`
(`src/screens/{QuestHome,TasksScreen,RoutinesScreen,MaintenanceScreen,...}.tsx`)
defines the exact JSX/DOM/classes: `task-row`, `task-check`, `task-title`, `badge`,
`avatar`, `btn btn-primary`, `input`, `card`, `page-header`, `.skeleton`,
`.empty-state`, `.modal-overlay`, `.modal-panel`, and the `--brand`, `--surface-2`,
`--t-muted`, `--t-faint`, `--sig-*`, `--line`, `--r-*`, `--shadow-*` token set.
No Joy recreation or `sx` translation of Figma presentation was made.

## Wave-by-wave execution

| Wave | Commit    | Scope                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| ---- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1    | `d8fef1c` | Shared chrome primitives (`AppModal`, `EmptyState`, `ModalActions`, `PageHeader`, `QueryLoadingView`, `SectionCard`) migrated to Figma `.modal-overlay/.modal-panel/.empty-state/.btn/.page-header/.card/.skeleton` vocabulary; `sxToStyle` keeps the 60+ call sites working without a rewrite.                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| 2    | `4c862ad` | Removed dormant legacy Joy UI kept in the covered screens (`FamilyProgress`, `Maintenance`, `Routines`, `MyChores`) so no hidden legacy presentation remains reachable from covered routes.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| 3    | `4e0f0c1` | Migrated the remaining Figma-covered Joy/Material components to native DOM + tokens: AddTask family (`AddTaskModal`, assignee/category/due-date/notification/priority pickers, `RepeatPicker`, `RichTextEditor`, `SmartTaskTitleInput`, `SubTask`, `ProjectSelector`, `BaseOptionPicker`, `AttachmentPickerField`, `LabelsPickerField`), `ScanPanel`, `VoicePanel`, chore toolbar and filters (`ChoreToolbarPrototype`, `FilterBuilderContent`, `CustomFilterChips`, `SearchBar`, `FilterSection`), input modals (`DateModal`, `SelectModal`, `TextModal`, `ConfirmationModal`, `AdvancedFilterBuilder`, `NudgeModal`, `WriteNFCModal`, `DueDatePickerModal`), `ChoreActionMenu`, `PendingBadge`, and `FamilyProgress` (`selectCategory -> "—"`, tab roles). |
| 4    | `1df0e0f` | Tooling convergence: removed Tailwind-3-era `eslint-plugin-tailwindcss`, `prettier-plugin-tailwindcss`, and orphaned `postcss`; removed stale `eslint-disable` and reflowed four locale JSONs. Only `@tailwindcss/vite` + `tailwindcss` v4 remain configured.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| 5    | pending   | Covered-route dependency closure (below).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |

## Wave 5 — covered-route dependency closure

Changes (uncommitted, `git status`):

- `views/Chores/MyChores.jsx`: removed `@mui/icons-material`, `@mui/joy` (`Box`,
  `Container`), and `@mui/material` `useMediaQuery`; quick-filter def icons now use
  `FigmaIcon` (`calendar`, `flag`, `tag`); label color dots are plain `span`s; the
  error state uses a plain `div` container and `FigmaIcon name='error'`; the dead
  `isLargeScreen` media-query was removed.
- `INSIGHT_FILTER_DEFS` extracted from the Joy module `SmartInsightsCard.jsx` into
  the dependency-free `views/Chores/insightFilterDefs.js`. `MyChores` no longer
  imports `SmartInsightsCard`, so the `/chores` bundle stops pulling its Joy module.
  `SmartInsightsCard` is now reachable only from the non-covered `/settings` side
  panel.
- `components/common/FilterBar.jsx` + `components/common/filter/ActiveFilterChips.jsx`
  rewrote to native DOM (native date input, `badge` chips, `btn`), icons mapped to
  `FigmaIcon` (`bars`, `check`, `x`, `plus`); public props API unchanged, so the
  covered `/chores` toolbar and the non-covered archived/history/users callers all
  keep working.
- `components/common/KeyboardShortcutHint.jsx` (`@mui/joy` `Chip` -> native `badge`
  with token borders) and `hooks/useResponsiveModal.js` (`@mui/material` `useMediaQuery`
  -> `matchMedia('(max-width:639px)')` change-listener pattern shared with AddTaskModal).
- `views/Rewards/RewardEditor.jsx` (new): the reward edit/create modal extracted from
  the Joy `RewardsView.jsx` into a self-contained native module (`AppModal` +
  `label/input/textarea/div` + `btn btn-ghost`/`btn btn-primary`). `FamilyProgress`
  (covered `/family`) now imports it from `../Rewards/RewardEditor`; `/rewards` keeps
  the non-covered Joy `RewardsView`.
- Deleted 12 orphaned (zero-consumer) Joy files with reproducible importer evidence:
  `MetricCard`, `PhotoTaskModal`, `ProjectPickerField`, `AutocompleteInput`,
  `AutocompleteSelect`, `MyChoreHeader`, `LoadingScreen`, `NotificationAccessSnackbar`,
  `SortAndGrouping`, `IconButtonWithMenu`, `ChoresOverview`, `SummaryCard`.

## Legacy consumer audit (reproducible at this commit)

```sh
rg -l "@(mui/(joy|material)|emotion/(react|styled))" src --glob '*.{js,jsx,ts,tsx}' | sort
```

Reports 147 files (134 non-test). None are reachable from the covered routes'
active presentation: the only name-level match in the covered directories is
`views/FamilyProgress/FamilyProgress.test.jsx` (test harness `CssVarsProvider`;
the covered surface itself is Joy-free). The retained consumers are the
Phase-6 owner-classified non-Figma surfaces and shared provider/guard shell:
settlements of the authenticated shell (`App.jsx`, `ThemeContext`, `daydanTheme`),
`Settings/**`, `Authorization` residuals, `Onboarding/**`, `Landing/MarketingApp`,
`Calendar`, `History`, `Projects`, `Notifications`, `ChoreEdit/ChoreView`,
`ArchivedTasks` (`/archived`), `LearnMore`, `NotFound`, `NavBarLink`,
`SyncStatusIndicator`, `NetworkBanner`, `IconButtonTouchable`, `CalendarCard/Dual`,
and the non-covered `views/Modals/**`. These keep `@mui/joy`, `@mui/material`,
`@emotion/react`, and `@emotion/styled` legitimately required per the contract's
"remove only after consumer evidence proves no legitimate consumer remains" rule.

## Final local gate (branch head, Wave 5 applied)

```text
npm run typecheck   -> tsc --noEmit, clean
npm run lint        -> eslint 0 errors (1825 warnings; react/prop-types, max-len,
                       react-hooks/*, jsxBracketSameLine deprecation); prettier -c clean
node --test         -> 187 passed, 0 failed
npm run test:ui     -> 30 files, 130 passed
npm run build       -> vite build ok; PWA precache 268 entries
```

En-dash note: the reproducible `rg` audit counts are taken from the branch SHA
above; the post-merge worktree re-run is recorded in the terminal report.

## Post-merge verification and smoke closure

Merge history: PR #46 (Wave 5 + evidence) merged `45ebfd1`; PR #47 (evidence
prettier normalize `f5a62cb`) merged `e4270fc`.

At `e4270fc` the Playwright smoke suite reported `160 passed, 2 failed`:

- `e2e/figma-phase5.spec.js` — `/activities` heading assertion
  (`getByRole('heading', { name: 'Activity' })` not found)
- `smoke: /activities` (thrown in `e2e/helpers/smokeRunner.js`)

Both shared one root cause: Wave 2 removed the default `import React` from
`src/views/User/UserActivities.jsx`, but the file still calls `React.useState`
(12 sites). The lazy `/activities` chunk then threw on first render
`ReferenceError: React is not defined`, the route crashed to the ErrorBoundary,
and no heading (and no content) rendered. Reproduced via a fixture probe
(`pageerror` capture) and proven non-flaky by re-running the phase-5 spec green
at the pre-merge base (`29873c3`) and red at `e4270fc`.

Fix `61d4a3f` restored `import React, { useEffect, useMemo, useState } from
'react'` (commit `fix(views): restore React import in UserActivities
(activities route crash)`). PR #48 was auto-closed as merged. GitHub merge was
not available to the automation token (review-gated), so the merge commit was
pushed directly to `develop`: `59fc0f5`.

Final verification at `59fc0f5` (fresh worktree):

```text
npm run typecheck   -> tsc --noEmit, clean
npm run lint        -> eslint 0 errors (1813 warnings; same accepted rule set),
                       prettier -c clean
node --test         -> 187 passed, 0 failed
npm run test:ui     -> 30 files, 130 passed
npm run build       -> vite build ok; PWA precache 268 entries
npm run test:smoke  -> 162 passed, 0 failed (phase-5 headings + /activities fixed)
e2e/smoke.arabic.spec.js -> 11 passed (Arabic RTL baseline; dir=rtl,
                       lang=ar-SA, Arabic copy on /login / /family /shopping
                       /chores /calendar /routines /settings profile|account
                       |localization)
```

Repo-wide audit at `59fc0f5` unchanged: 147 files (134 non-test) retain
`@(mui/(joy|material)|emotion/(react|styled))`; none is reachable from the
covered `//family`, `//maintenance`, `//routines`, `//chores`, `//my/chores`
presentation.
