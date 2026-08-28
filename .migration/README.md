# Phase

Phase 2 — `migration/figma-p02-foundation-shell`: port the Figma shell and foundation exactly.

# Prerequisites

1. `git fetch --all --prune`; verify Phase 1 is merged. 2. Rebase onto latest `origin/develop`, resolving only planning/base drift. 3. Figma wins over `design-reference/` and current production presentation.

# Authoritative Figma Baseline

`design-source/figma-make/` at app `ade3ffa8fff9ca947d0a843cfface61cbad0cb47`, identical to `DayDanProductExperience` `7131b76979e49351db8ecbc33db6648a75139572`.

# Exact Figma Stack

React 19, Vite 8, `@vitejs/plugin-react` 6, Tailwind 4 + `@tailwindcss/vite` 4, TypeScript 5.7, oxfmt. Use Figma DOM/classes directly.

# Figma Source Files

`src/App.tsx` (Icon, LogoMark, Sidebar, mobile nav, top/shell controls), `src/index.css` (tokens, fonts, shell, helpers, responsive/RTL), `src/main.tsx`, `src/imports/*`.

# Production Targets

`src/App.jsx`, `src/Application.jsx`, `src/index.css`, `src/components/UserProfileAvatar.jsx`, `src/views/components/NavBar*.jsx`, `src/config/AppBranding.js`, `src/contexts/{Router,Theme,Localization}Context.jsx`, and route-shell tests.

# Existing Behavior That Must Be Preserved

Router configuration and guards, auth, SSE/sync state, theme persistence, i18n direction, brand selection, global search invocation, native safe area, offline/PWA, notifications and permissions.

# Required Implementation

1. Copy Figma token/font/theme/RTL/focus and responsive CSS, including DayDan/Sovereign variables, literal radii/shadows/sidebar width and mobile breakpoint (768px), into the production Tailwind foundation.
2. Port `Icon` paths and `LogoMark`; do not substitute MUI icons.
3. Port Figma Sidebar/mobile navigation/top composition and wire production navigation, current member, search, theme, persona/focus/quest controls only where actual product capability exists.
4. Retain production route ownership and guards; render routes within the Figma shell. Keep legacy Joy only around unmigrated route content.

# Forbidden Substitutions

No Joy NavBar/Card approximation, `sx`, MUI icon replacement, altered breakpoint/token/spacing, invented shell, or design-reference override.

# Dependency Changes

None beyond Phase 1. Do not remove MUI/Emotion until a real consumer audit in Phase 7.

# Tests

Add shell routing/theme/RTL/mobile-nav tests; run `npm test`, build, smoke and `./scripts/verify.sh`.

# Visual Acceptance

Compare Figma and production shell at 1440×900 and 390×844, DayDan/Sovereign × LTR/RTL × Focus/Quest/child where present. Match dimensions, nav, fonts, icons, colors, borders, radii, shadows and density pixel-for-pixel; stop on a proven constraint.

# RTL / Arabic

Use Figma `[dir="rtl"]`, logical borders/text alignment and Cairo; verify Arabic desktop/mobile shell.

# Capacitor / Native

Check safe-area mobile nav, keyboard/search and Android sync.

# Completion Criteria

Every shell element is direct Figma structure/classes and visual matrix passes without changing domain behavior.

# Final Evidence

Report source-to-target mapping, screenshots, viewport matrix, tests/build/sync, and remaining legacy surface boundary.

# GitHub Actions / Merge Policy

GitHub Actions are NOT an authoritative merge gate for DayDan; they are intentionally disabled/unavailable as a required validation mechanism. COMPLETE LOCAL VERIFICATION in a clean isolated worktree is authoritative. Do not stop because Actions are red before steps, record zero executed steps, skip downstream jobs, lack runners, or have account/billing/infrastructure failures. Report this as `NON-GATING GITHUB ACTIONS INFRASTRUCTURE STATUS`. Investigate only concrete reproducible repository-code/test failures. Merge after dependency install, typecheck, unit/component tests, lint/format, DayDan/Sovereign builds, required browser/visual Figma parity, Arabic/RTL, Capacitor, `scripts/verify.sh`, PR review and no regression; Actions green is not required. After merge, fetch, create a NEW detached clean worktree at `origin/develop`, rerun all applicable local verification, and confirm it is clean.

# Autonomous End-to-End Execution Contract

When the owner says `Execute Phase 2`, this README is the complete execution contract. Work autonomously from start to terminal completion.

1. Fetch/prune, locate this phase branch, read this entire README, inspect the real repository/Figma sources, update the phase branch onto current legitimate `origin/develop`, and execute all required work. Use isolated worktrees; never reset/stash/clean/touch the dirty primary checkout; do not modify `daydan-server`.
2. Do NOT send intermediate progress/status responses. Never return with `underway`, `started`, `pending`, `still running`, `not migrated`, `not verified`, or equivalent. If a command/process/test suite is running, wait/poll for completion and continue.
3. Test/build/lint/typecheck/visual failures are work items, not stopping points. Reproduce, root-cause, fix in scope, add regression coverage where appropriate, rerun the affected gate, then rerun the complete applicable gate. Continue until green or a genuinely external blocker remains after all reasonable remediation is exhausted.
4. If prior-phase post-merge verification is missing, complete it first; if it exposes a real regression, fix it through a narrow closure PR, merge, reverify, then continue this phase without asking the owner.
5. Complete implementation, local verification, exact Figma visual acceptance, review passes, commit, push, PR creation/update, full diff review, merge, then fresh detached post-merge verification. The phase is not complete before the merged SHA passes the complete applicable verification and required Figma comparison.
6. GitHub Actions is informational/non-gating per policy above. Never wait for it or ask for an override.
7. Do not ask routine implementation questions. Resolve repository/tooling/test/integration choices from code plus authoritative Figma. Only an unavoidable external dependency or explicit owner-design decision not derivable from Figma/repository evidence may block terminal completion; finish every other executable item first and return one consolidated blocker report with exact evidence.
8. Any earlier `stop`, `request owner input`, or `report constraint` wording means terminal handling after all independent work is exhausted, never an early progress response.
9. Return exactly one terminal report: `PHASE 2 COMPLETE` with evidence, or `NOT COMPLETE` only for a concrete unresolved external blocker after remediation is exhausted. Do not start Phase 3.