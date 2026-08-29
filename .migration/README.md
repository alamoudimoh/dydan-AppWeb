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

# Binding Authority, Closure PR Authorization, and Figma Consistency Invariant

This section overrides any older phase wording that could be read as forbidding necessary remediation branches/PRs.

1. The owner explicitly pre-authorizes creation, push, review, merge, and post-merge verification of narrowly scoped closure branches/PRs for any concrete in-scope regression found before, during, or after this phase. Do not ask for authorization again.
2. Any prior instruction such as `do not create another branch/PR` only forbids unnecessary duplicate implementation work. It never forbids a necessary closure branch/PR after a main phase merge or when a regression cannot be published on the existing branch.
3. If a repository-action guard, prior prompt, or stale planning sentence conflicts with this explicit closure authorization, this latest owner-approved README controls the phase execution. Re-read it and proceed; do not return an authority-conflict blocker.
4. A failing active build/test/reference/verification config becomes in-scope automatically if it is required to execute the authoritative local gate. Fix stale executable configuration narrowly instead of skipping the gate. `design-reference/` is not visual authority, but any active reference build/test tooling must remain compatible with the exact Figma runtime established in Phase 1.
5. Maintain the Phase 1 runtime invariant repo-wide: active executable paths must not regress to React 18 assumptions, `@vitejs/plugin-react-swc`, Tailwind 3/PostCSS integration, or another substituted runtime. Before completion, scan active configs/scripts/tests for stale migrated-tooling references and remediate them.
6. Figma is exact presentation authority: when Figma provides markup/classes/assets/tokens/layout, use them directly. Do not substitute an equivalent library, component, icon, spacing system, or workaround.
7. A need for a closure PR is work, not a blocker. `NOT COMPLETE` is allowed only after all in-repository remediation possible with normal branch/PR operations is exhausted.

# Autonomous End-to-End Execution Contract

When the owner says `Execute Phase 2`, this README is the complete execution contract. Work autonomously from start to terminal completion.

1. Fetch/prune, locate this phase branch, read this entire README, inspect the real repository/Figma sources, update the phase branch onto current legitimate `origin/develop`, and execute all required work. Use isolated worktrees; never reset/stash/clean/touch the dirty primary checkout; do not modify `daydan-server`.
2. Do NOT send intermediate progress/status responses. Never return with `underway`, `started`, `pending`, `still running`, `not migrated`, `not verified`, or equivalent. If a command/process/test suite is running, wait/poll for completion and continue.
3. Test/build/lint/typecheck/visual failures are work items, not stopping points. Reproduce, root-cause, fix in scope, add regression coverage where appropriate, rerun the affected gate, then rerun the complete applicable gate. Continue until green or a genuinely external blocker remains after all reasonable remediation is exhausted.
4. If prior-phase post-merge verification is missing, complete it first; if it exposes a real regression, create a narrow closure branch/PR, fix it, merge it, reverify, then continue this phase without asking the owner.
5. Complete implementation, local verification, exact Figma visual acceptance, review passes, commit, push, PR creation/update, full diff review, merge, then fresh detached post-merge verification. The phase is not complete before the merged SHA passes the complete applicable verification and required Figma comparison.
6. GitHub Actions is informational/non-gating per policy above. Never wait for it or ask for an override.
7. Do not ask routine implementation questions. Resolve repository/tooling/test/integration choices from code plus authoritative Figma. Only an unavoidable external dependency or explicit owner-design decision not derivable from Figma/repository evidence may block terminal completion; finish every other executable item first and return one consolidated blocker report with exact evidence.
8. Any earlier `stop`, `request owner input`, or `report constraint` wording means terminal handling after all independent work is exhausted, never an early progress response.
9. Return exactly one terminal report: `PHASE 2 COMPLETE` with evidence, or `NOT COMPLETE` only for a concrete unresolved external blocker after remediation is exhausted. Do not start Phase 3.

# Mandatory Execution-Start and No-Early-Termination Rule

This section is binding and overrides any interpretation that allows preparation to substitute for implementation.

1. Checkout, fetch, rebase, branch preparation, README review, inventory, planning, or stating what remains are PREPARATION ONLY. They are never a terminal outcome.
2. After prerequisites are satisfied, immediately perform the actual code migration described in `Required Implementation`. If implementation has not yet been performed, the required next action is to START AND COMPLETE IT — not to return a status message.
3. A response such as `implementation has not yet been performed`, `Phase 2 has not started`, `required migration remains outstanding`, `not migrated`, `not verified`, or equivalent is explicitly INVALID as a terminal response. Those statements describe unfinished work inside the repository and therefore require continued execution.
4. `NOT COMPLETE` may not be used merely because work remains to be done, implementation is large, tests are pending, verification has not run, a PR has not been opened, or a merge has not happened. Those are mandatory work items in this phase.
5. Continue autonomously until the implementation exists, the exact Figma parity work is executed, all in-repo failures are remediated, local gates pass, PR is created/reviewed/merged, and clean post-merge verification finishes.
6. The only valid terminal `NOT COMPLETE` condition is a genuinely external blocker that cannot be resolved by repository changes, normal branch/PR operations, available tooling, or authoritative Figma/repository evidence after all independent executable work has been completed.
7. For every Figma-covered element, fidelity is literal: use the actual Figma implementation, classes, assets, structure, dimensions, spacing, tokens and responsive behavior. Do not reinterpret, simplify, approximate, substitute, or postpone Figma-defined UI.
Phase 1 — `migration/figma-p01-react19-runtime`: make the existing product run on the exact Figma Make runtime; do not migrate a screen.

# Prerequisites

1. `git fetch --all --prune`; verify no phase is required before Phase 1.
2. Rebase this branch onto latest `origin/develop`; resolve only planning-file/base drift.
3. Do not use `design-reference/` as UI authority.

# Authoritative Figma Baseline

Imported source: `design-source/figma-make/` in DayDan commit `ade3ffa8fff9ca947d0a843cfface61cbad0cb47`. Dedicated source: `https://github.com/alamoudimoh/DayDanProductExperience`, `7131b76979e49351db8ecbc33db6648a75139572`. `diff -qr` found no discrepancy; both are authoritative-identical at planning time.

# Exact Figma Stack

`react`/`react-dom` `^19.0.0`; `vite` `^8.0.0`; `@vitejs/plugin-react` `^6.0.0`; `tailwindcss`/`@tailwindcss/vite` `^4.0.0`; TypeScript `^5.7.0`; `oxfmt` `^0.2.0`; pnpm lockfile. Integration is `react(), tailwindcss()` in `design-source/figma-make/vite.config.ts` and `@import 'tailwindcss'` in `src/index.css`, with no Tailwind config or PostCSS config.

# Figma Source Files

`design-source/figma-make/package.json`, `pnpm-lock.yaml`, `vite.config.ts`, `tsconfig.json`, `src/main.tsx`, and `src/index.css`.

# Production Targets

`package.json`, `package-lock.json`, `vite.config.js`, `src/main.jsx`, `src/index.css`, test configuration, `capacitor.config.*`, and any React-version patches. Preserve PWA/Sentry behavior while changing only the renderer/tooling needed for the Figma stack.

# Existing Behavior That Must Be Preserved

`src/contexts/{Query,Router,Theme,SSE}Context.jsx`, `src/hooks/useAuth.jsx`, `src/hooks/useSSE.js`, API `src/queries/**`, Capacitor/native bridges, offline/PWA, i18n, routing and both DayDan/Sovereign builds.

# Required Implementation

1. Change React, React DOM and React type packages to the Figma major/version range; replace `@vitejs/plugin-react-swc` with exact Figma `@vitejs/plugin-react` and update Vite 6→8.
2. Replace Tailwind 3, `autoprefixer`, Tailwind config/PostCSS integration and old Tailwind formatter integration with Tailwind 4 + `@tailwindcss/vite`; preserve current UI during coexistence, but establish Figma-compatible global entrypoint.
3. Add `oxfmt` and its Figma script only if it can coexist with required repository lint; do not let formatter changes rewrite product sources.
4. Audit every React-bound dependency in `package.json` and lockfile (Router, Query, i18n, Capacitor, MUI/Emotion, DnD, calendar, Recharts, Quill, Testing Library, Vitest, Playwright, Sentry, OpenReplay, RevenueCat, social login) against React 19; upgrade/patch only documented compatibility blockers.
5. Repair React 19 test/act/ref behavior and prove production and Capacitor web builds.

# Forbidden Substitutions

No React 18 retention; no SWC React plugin; no Tailwind 3 emulation; no Joy/Emotion wrapper around Figma utilities; no UI redesign; no `design-reference` override.

# Dependency Changes

Delta: React 18.2→19; React DOM 18.2→19; Vite 6.4→8; plugin-react-swc→plugin-react; Tailwind 3.4→4 plus `@tailwindcss/vite`; TypeScript 5.8 is compatible but align to Figma 5.7 only after checking repository tooling; add oxfmt. MUI Joy/Emotion remain temporarily for unmigrated surfaces.

# Tests

Run `npm ci`, `npm run typecheck`, targeted React 19 fixes, `npm test`, `npm run build`, `npm run build:smoke`, `npm run cap` (or `npm run build && npx cap sync android`), and `./scripts/verify.sh`.

# Visual Acceptance

No visual migration is allowed. Capture baseline screenshots for DayDan/Sovereign × light/dark × LTR/Arabic RTL at desktop 1440×900 and mobile 390×844; report only unintended regressions.

# RTL / Arabic

Keep locale loading, `dir`, Arabic fonts/content and parity tests unchanged; verify one authenticated Arabic RTL route.

# Capacitor / Native

Verify web build, Android sync and native imports; do not alter native projects.

# Completion Criteria

React 19/Figma toolchain is installed, app boots, behavior tests/builds pass, no screen uses a Joy imitation of Figma, and both brands work.

# Final Evidence

Report resolved versions/lockfile, compatibility audit and fixes, command results, DayDan/Sovereign screenshot locations, Android sync result, and remaining temporary MUI/Emotion consumers.
