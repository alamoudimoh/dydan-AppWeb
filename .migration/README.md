# Phase

Phase 8 — `migration/figma-p08-remove-joy-final-parity`.

# Prerequisites

Fetch/prune; verify Phases 1–7 are merged; rebase this branch onto latest `origin/develop`, resolving only planning/base drift.

# Authoritative Figma Baseline

`design-source/figma-make/` in DayDan at `ade3ffa8fff9ca947d0a843cfface61cbad0cb47`, verified identical to `https://github.com/alamoudimoh/DayDanProductExperience` commit `7131b76979e49351db8ecbc33db6648a75139572`.

# Final Objective

Complete presentation-stack convergence and prove Figma parity while retaining real DayDan behavior.

# Required Work

1. Inventory every `@mui/joy`, `@mui/material`, `@emotion/react`, `@emotion/styled`, Tailwind-3-era config/plugin, `@vitejs/plugin-react-swc`, old theme compatibility, design-reference-derived presentation layer, and legacy presentation-component import.
2. Migrate every Figma-covered residual with the actual Figma JSX/DOM/classes from `design-source/figma-make`; retain its source unchanged and wire existing queries, auth, mutations, offline, SSE, Capacitor, i18n and permissions.
3. Remove Joy/Material/Emotion only after consumer evidence proves no legitimate consumer remains. Remove obsolete Tailwind-3/theme/design-reference compatibility only after equivalent evidence.
4. Verify React 19, Tailwind 4-only Figma presentation path, DayDan, Sovereign, Arabic RTL, Capacitor and every Figma-defined screen.
5. Audit every ACTIVE build/test/reference/verification path for stale migrated-runtime tooling. No executable verification path may retain React 18-only assumptions, `@vitejs/plugin-react-swc`, Tailwind 3/PostCSS integration, or another substituted runtime. Historical docs may remain documented; executable paths must converge.

# Forbidden Substitutions

No Joy recreation of Figma components; no `sx` translation of Figma Tailwind; no alternative CSS framework; no design-reference override; no approximate spacing/composition; no invented screen structure; no hidden legacy UI retained merely to avoid migration work. Do not skip a verification gate because its config is stale; migrate the stale executable config to the exact Figma-compatible runtime.

# Visual Closure

For every Figma-defined screen, compare production and Figma with identical viewport, theme, direction and representative fixture. Report only `EXACT FIGMA PARITY ACHIEVED` or `NOT COMPLETE`; never “inspired”, “adapted”, “close” or “equivalent”.

# Final Dependency Closure

Include an exact dependency graph and consumer proof for `@mui/joy`, `@mui/material` where retained only for old UI, `@emotion/react`, `@emotion/styled`, Tailwind 3-era configuration/plugins, `@vitejs/plugin-react-swc`, and obsolete design-system compatibility packages. Do not pre-decide removal.

# Tests

Run all targeted unit/integration/Playwright tests, `npm test`, `npm run typecheck`, DayDan/Sovereign builds and smokes, reference tests where still required, `./scripts/verify.sh`, and Capacitor web/Android sync.

# RTL / Arabic

Compare every applicable Figma surface in Arabic RTL and preserve translations/direction.

# Capacitor / Native

Verify web build, Android sync and native-sensitive flows; report unavailable infrastructure as an environment limitation.

# Completion Criteria

All Figma screens meet explicit visual closure, no unjustified legacy presentation consumer remains, all active executable tooling paths conform to the migrated Figma runtime, business behavior passes, and any non-Figma screen has the required owner-input classification from Phase 6.

# Final Evidence

Provide dependency graph, remaining consumers/removals, active-tooling consistency scan, exact screen comparison matrix/screenshots, test/build/sync output, React 19 result and complete/not-complete result.

# GitHub Actions / Merge Policy

GitHub Actions are NOT an authoritative merge gate for DayDan; they are intentionally disabled/unavailable as a required validation mechanism. COMPLETE LOCAL VERIFICATION in a clean isolated worktree is authoritative. Do not stop because Actions are red before steps, record zero executed steps, skip downstream jobs, lack runners, or have account/billing/infrastructure failures. Report this as `NON-GATING GITHUB ACTIONS INFRASTRUCTURE STATUS`. Investigate only concrete reproducible repository-code/test failures. Merge after dependency install, typecheck, unit/component tests, lint/format, DayDan/Sovereign builds, required browser/visual Figma parity, Arabic/RTL, Capacitor, `scripts/verify.sh`, PR review and no regression; Actions green is not required. After merge, fetch, create a NEW detached clean worktree at `origin/develop`, rerun all applicable local verification, and confirm it is clean.

# Binding Authority, Closure PR Authorization, and Figma Consistency Invariant

1. The owner explicitly pre-authorizes creation, push, review, merge, and post-merge verification of narrowly scoped closure branches/PRs for any concrete in-scope regression found before, during, or after this phase. No additional owner authorization is required.
2. Any prior `do not create another branch/PR` wording only forbids unnecessary duplicate implementation work; it never prohibits a necessary closure branch/PR.
3. If a repository-action guard, prior prompt, or stale planning sentence conflicts with this authorization, this latest README controls the phase execution. Do not return an authority-conflict blocker.
4. Any active build/test/reference/verification configuration that fails because it retained superseded tooling automatically becomes in-scope. Fix it narrowly and keep the gate. `design-reference/` is not visual authority, but its executable tooling must be compatible with the exact Figma runtime whenever repository verification executes it.
5. Figma is exact presentation authority. For every Figma-covered surface, use actual Figma JSX/DOM/classes/assets/tokens/layout/responsive rules. No equivalent library, closest icon, approximate spacing, hidden compatibility shim, or workaround is acceptable where Figma defines the implementation.
6. A need for a closure PR is work, not a blocker. `NOT COMPLETE` is valid only after all normal in-repository remediation is exhausted and only for a genuinely external/owner-design blocker.

# Autonomous End-to-End Execution Contract

When the owner says `Execute Phase 8`, this README is the complete execution contract. Work autonomously from start to terminal completion.

1. Fetch/prune, locate this phase branch, read this entire README, inspect the real repository/Figma sources, update the phase branch onto current legitimate `origin/develop`, and execute all required work in isolated worktrees without touching the dirty primary checkout or `daydan-server`.
2. Do NOT send intermediate progress/status responses. Never return with `underway`, `started`, `pending`, `still running`, `not migrated`, `not verified`, or equivalent. Wait/poll for running commands and continue.
3. Any test/build/lint/typecheck/visual/dependency-parity failure must be reproduced, root-caused, fixed in scope, covered where appropriate, and rerun. Continue until the full final gate is green or a genuinely external blocker remains after reasonable remediation is exhausted.
4. Complete missing prior-phase post-merge verification first if necessary; fix any concrete regression through a narrow closure branch/PR, merge, reverify, then continue without asking the owner.
5. Complete the full consumer audit, all residual Figma migrations, package cleanup supported by consumer evidence, exact screen-by-screen parity matrix, local verification, review passes, commit, push, PR, full diff review, merge, fetch final `origin/develop`, create a fresh detached clean worktree, and rerun the complete final post-merge verification. Phase 8 is not complete before the merged SHA passes all applicable final gates.
6. GitHub Actions is informational/non-gating. Never wait for it or ask for an override.
7. Do not ask routine implementation questions. Resolve repository/tooling/test/UI decisions from authoritative Figma and code. Any owner-design classification inherited from prior phases may block only after every executable migration/cleanup/verification item is finished; return one consolidated exact blocker if unavoidable. Never invent UI.
8. Earlier wording such as `report unavailable infrastructure`, `NOT COMPLETE`, `owner-input classification`, or `report constraint` never authorizes an early progress response; finish all independent executable work first.
9. Return exactly one terminal report: `PHASE 8 COMPLETE — EXACT FIGMA PARITY ACHIEVED` with evidence, or `NOT COMPLETE` only for concrete unresolved external/owner-design blockers after all remediation and independent work are exhausted. Do not create a Phase 9.

# Mandatory Execution-Start and No-Early-Termination Rule

1. Checkout, fetch, rebase, branch preparation, README review, inventory, planning, dependency scanning, or listing remaining work are PREPARATION ONLY and never a terminal outcome.
2. After prerequisites are satisfied, immediately perform the actual migration/cleanup/verification work in `Required Work`. If implementation has not yet happened, START AND COMPLETE IT instead of returning status.
3. A terminal response saying `implementation has not yet been performed`, `phase has not started`, `migration remains outstanding`, `not migrated`, `not verified`, or equivalent is INVALID.
4. `NOT COMPLETE` may not be used because residual migration, dependency cleanup, parity work, tests, verification, PR, merge, or post-merge verification are pending. Those are mandatory work items.
5. Continue until every Figma-covered residual is migrated literally, legacy presentation dependencies are removed where consumer evidence permits, every active tooling path is Figma-runtime-compatible, the complete parity matrix is executed, all in-repo regressions are fixed, local gates pass, PR is merged, and clean post-merge verification passes.
6. Only a genuinely external or unresolved owner-design blocker that cannot be resolved through repository changes, normal branch/PR operations, available tooling, or authoritative Figma/repository evidence may terminate as `NOT COMPLETE`, after all independent executable work is finished.
7. Literal Figma fidelity is mandatory across the final product: no reinterpretation, simplification, approximation, substitution, hidden compatibility shim, or postponement of Figma-defined presentation.
