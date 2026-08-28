# Phase

Phase 5 — `migration/figma-p05-organize-household`: exact Figma organize/household screens.

# Prerequisites

Fetch/prune; verify Phases 1–4 merged; rebase latest `origin/develop`, resolving planning/base drift only. Figma overrides `design-reference/` and current production presentation.

# Authoritative Figma Baseline

Imported `design-source/figma-make/` at `ade3ffa8fff9ca947d0a843cfface61cbad0cb47`, identical to `DayDanProductExperience` `7131b76979e49351db8ecbc33db6648a75139572`.

# Exact Figma Stack

React 19, Vite 8, plugin-react 6, Tailwind 4/@tailwindcss-vite 4, TS 5.7, oxfmt; reuse actual JSX/classes.

# Figma Source Files

`src/screens/{ProjectsScreen,RoutinesScreen,ShoppingScreen,GoalsScreen,MaintenanceScreen,ActivityScreen}.tsx`, `src/App.tsx`, `src/data.ts`, `src/index.css`.

# Production Targets

`src/views/Projects/{ProjectView,ProjectQueries}.js*`, `Routines/{RoutinesView,RoutineQueries}.js*`, `ShoppingLists/{ShoppingListsView,ShoppingListDetail,ShoppingListQueries}.js*`, `Maintenance/**`, `User/UserActivities.jsx`, `FamilyProgress/FamilyProgress.jsx`, `History/**`, `Rewards/**`, `src/queries/**`, `src/contexts/RouterContext.jsx`.

# Existing Behavior That Must Be Preserved

Project/routine/shopping CRUD, list item mutations, archival, chores linkage, maintenance assets/history/meters, household permissions, activity history, React Query cache/invalidation, SSE, offline, auth, i18n and existing routes.

# Required Implementation

Port each listed Figma screen structure/classes and wire real models/mutations. Map Projects `/projects`, Routines `/routines`, Shopping `/shopping` and detail, Maintenance `/maintenance`/assets, Activity `/activities`; evaluate Goals against existing FamilyProgress/points/rewards semantics. If a Figma screen covers only part of a product route, preserve remaining behavior using exact Figma shared primitives, not invented layout.

# Forbidden Substitutions

No MUI Joy equivalents, `sx`, mock data, removal of detail/CRUD/permission/offline flows, design-reference override or approximate layouts.

# Dependency Changes

None expected.

# Tests

Add query/mutation and permission tests; Playwright CRUD/list/detail/activity fixtures; run `npm test`, build, smoke and `./scripts/verify.sh`.

# Visual Acceptance

For all six Figma screens, compare 1440×900/390×844 × DayDan/Sovereign × LTR/RTL with populated, empty, error and permission states. Match cards, rows, typography, icons, controls, responsive density and shell.

# RTL / Arabic

Use Figma logical layout and Arabic content for every screen/detail form.

# Capacitor / Native

Check touch CRUD, scrolling, file/asset pathways, offline/reconnect and Android sync.

# Completion Criteria

Every authoritative screen is direct Figma implementation with real behavior and visual matrix pass.

# Final Evidence

Report source/route mapping, behavior inventory, tests, screenshots and constraints.

# GitHub Actions / Merge Policy

GitHub Actions are NOT an authoritative merge gate for DayDan; they are intentionally disabled/unavailable as a required validation mechanism. COMPLETE LOCAL VERIFICATION in a clean isolated worktree is authoritative. Do not stop because Actions are red before steps, record zero executed steps, skip downstream jobs, lack runners, or have account/billing/infrastructure failures. Report this as `NON-GATING GITHUB ACTIONS INFRASTRUCTURE STATUS`. Investigate only concrete reproducible repository-code/test failures. Merge after dependency install, typecheck, unit/component tests, lint/format, DayDan/Sovereign builds, required browser/visual Figma parity, Arabic/RTL, Capacitor, `scripts/verify.sh`, PR review and no regression; Actions green is not required. After merge, fetch, create a NEW detached clean worktree at `origin/develop`, rerun all applicable local verification, and confirm it is clean.
