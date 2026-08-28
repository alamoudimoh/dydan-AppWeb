# Phase

Phase 3 — `migration/figma-p03-home-today`: exact Figma Home/Today implementation with real DayDan state.

# Prerequisites

1. Fetch/prune; verify Phases 1 and 2 are merged. 2. Rebase on latest `origin/develop`, resolving only planning/base drift. Figma, not `design-reference/`, controls presentation.

# Authoritative Figma Baseline

Imported `design-source/figma-make/` at `ade3ffa8fff9ca947d0a843cfface61cbad0cb47`, identical to `DayDanProductExperience` `7131b76979e49351db8ecbc33db6648a75139572`.

# Exact Figma Stack

React 19/Vite 8/plugin-react 6/Tailwind 4 + `@tailwindcss/vite`/TS 5.7/oxfmt. Preserve its JSX DOM, Tailwind classes, inline token styles and 768px responsive behavior.

# Figma Source Files

`src/screens/FocusHome.tsx`, `QuestHome.tsx`, `TodayScreen.tsx`, `src/App.tsx` screen selection and `Icon`, `src/data.ts`, `src/components/{TaskDetailModal,CreateTaskModal}.tsx`, `src/index.css` task/card/progress helpers.

# Production Targets

`src/views/Dashboard/Dashboard.jsx`, `src/views/Home.jsx`, `src/views/Chores/{MyChores,ChoreCard,CompactChoreCard,Sidepanel,TasksByAssigneeCard,SmartInsightsCard,ActivitesCard}.jsx`, `src/queries/ChoreQueries*`, `src/views/components/AddTaskModal.jsx`, and route tests.

# Existing Behavior That Must Be Preserved

`usePersonalChores`, `useChores`, `useChoresHistory`, React Query invalidation, completion/approval/assignment/recurrence/offline mutations, permissions, SSE, project/member data, auth and i18n.

# Required Implementation

1. Reuse FocusHome, QuestHome and Today markup/classes; replace mock `TASKS/MEMBERS` adapters with typed/view-model adapters from current query data without changing contracts.
2. Wire greeting, metrics, overdue alert, task rows, completion, quick create/detail, family goal/workload, active projects, coming-up, badges/progress/member indicators to live data.
3. Keep Figma persona/view variants only when product state supports them; otherwise document the mapping, never fabricate a layout.
4. Render loading/error/empty states with exact Figma primitives; preserve product-specific errors/actions.

# Forbidden Substitutions

No current Dashboard composition, Joy cards/buttons, `sx` translation, static mock data, dropped capabilities, approximate spacing, or design-reference override.

# Dependency Changes

None expected.

# Tests

Unit-test adapters and live completion; integration-test query/mutation/SSE/error/empty paths; Playwright Home fixture tests; run `npm test`, build, smoke and `./scripts/verify.sh`.

# Visual Acceptance

Side-by-side Figma/production at 1440×900, 1024×768, 390×844; DayDan/Sovereign × LTR/RTL × Focus/Quest × parent/child/solo; use identical representative fixture state. Compare every listed section, hierarchy and density, not overflow alone.

# RTL / Arabic

Arabic data/content, logical layout and Cairo must match Figma in desktop/mobile.

# Capacitor / Native

Verify touch completion, modal, scrolling and offline/reconnect on web build + Android sync.

# Completion Criteria

Home/Today uses direct Figma structure and all real behavior remains working; visual matrix passes or execution stops with a proven constraint.

# Final Evidence

Report adapters, preserved hooks/mutations, tests, fixture definitions, screenshot pairs and discrepancies.

# GitHub Actions / Merge Policy

GitHub Actions are NOT an authoritative merge gate for DayDan; they are intentionally disabled/unavailable as a required validation mechanism. COMPLETE LOCAL VERIFICATION in a clean isolated worktree is authoritative. Do not stop because Actions are red before steps, record zero executed steps, skip downstream jobs, lack runners, or have account/billing/infrastructure failures. Report this as `NON-GATING GITHUB ACTIONS INFRASTRUCTURE STATUS`. Investigate only concrete reproducible repository-code/test failures. Merge after dependency install, typecheck, unit/component tests, lint/format, DayDan/Sovereign builds, required browser/visual Figma parity, Arabic/RTL, Capacitor, `scripts/verify.sh`, PR review and no regression; Actions green is not required. After merge, fetch, create a NEW detached clean worktree at `origin/develop`, rerun all applicable local verification, and confirm it is clean.

# Autonomous End-to-End Execution Contract

When the owner says `Execute Phase 3`, this README is the complete execution contract. Work autonomously from start to terminal completion.

1. Fetch/prune, locate this phase branch, read this entire README, inspect the real repository/Figma sources, update the phase branch onto current legitimate `origin/develop`, and execute all required work in isolated worktrees without touching the dirty primary checkout or `daydan-server`.
2. Do NOT send intermediate progress/status responses. Never return with `underway`, `started`, `pending`, `still running`, `not migrated`, `not verified`, or equivalent. Wait/poll for running commands and continue.
3. Any test/build/lint/typecheck/visual failure must be reproduced, root-caused, fixed in scope, covered where appropriate, and rerun. Continue through all failures until the full applicable gate is green or a genuinely external blocker remains after reasonable remediation is exhausted.
4. Complete missing prior-phase post-merge verification first if necessary; fix any concrete regression through a narrow closure PR, merge, reverify, then continue without asking the owner.
5. Complete implementation, local verification, exact Figma parity matrix, review passes, commit, push, PR, full diff review, merge, fetch final `origin/develop`, fresh detached worktree, and complete post-merge verification. No phase completion before the merged SHA passes.
6. GitHub Actions is informational/non-gating. Never wait for it or ask for an override.
7. Do not ask routine implementation questions. Derive decisions from repository code and authoritative Figma. Only a truly external dependency or explicit owner-design decision not derivable from those sources may block terminal completion; finish every other executable item first and return one consolidated blocker with evidence.
8. Earlier wording such as `execution stops`, `stop`, `request owner input`, or `report constraint` means terminal handling only after all independent executable work is finished, never an early response.
9. Return exactly one terminal report: `PHASE 3 COMPLETE` with evidence, or `NOT COMPLETE` only for a concrete unresolved external blocker after remediation is exhausted. Do not start Phase 4.