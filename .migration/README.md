# Phase

Phase 7 — `migration/figma-p07-auth-public-nonfigma`: resolve non-Figma production surfaces without inventing design; remove legacy presentation only after audit.

# Prerequisites

Fetch/prune; verify Phases 1–6 merged; rebase latest `origin/develop` resolving only planning/base drift. Figma wins where it defines a presentation; `design-reference/` never overrides it.

# Authoritative Figma Baseline

`design-source/figma-make/` in `ade3ffa8fff9ca947d0a843cfface61cbad0cb47`, equal to dedicated repo `7131b76979e49351db8ecbc33db6648a75139572`. It contains no dedicated auth/public/onboarding/legal screens.

# Exact Figma Stack

React 19, Vite 8, plugin-react 6, Tailwind 4/@tailwindcss-vite 4, TS 5.7, oxfmt.

# Figma Source Files

`src/App.tsx` and `src/index.css` shared shell/primitives only. There is no authoritative Figma auth/public screen source.

# Production Targets

`src/views/Authorization/**`, `Onboarding/**`, `Landing/**`, `PrivacyPolicy/**`, `Terms/**`, `Circles/JoinCircle.jsx`, `Payments/**`, `Notifications/**`, developer/edge settings, `MarketingApp.jsx`, `components/auth/**`, `contexts/RouterContext.jsx`, legacy MUI/Emotion consumer inventory.

# Existing Behavior That Must Be Preserved

Login/signup/social auth/MFA/password reset/session restoration, onboarding and circle setup, legal content, cookie consent, payments, public routing, auth guards, i18n/Arabic, accessibility, Capacitor/deep links and analytics.

# Required Implementation

1. Inventory all remaining production surfaces and classify A shared Figma-shell treatment sufficient, B exact reusable Figma primitive composition possible, C `no authoritative Figma design — OWNER DESIGN INPUT REQUIRED`.
2. Apply A/B only using copied Figma primitives/classes; retain content/behavior. For every C, do not approximate or “modernize”; complete all other executable work before treating it as an owner-design blocker.
3. Audit imports/build output to identify every remaining `@mui/joy`, `@mui/material`, `@emotion/react`, `@emotion/styled` consumer. Remove packages only when zero legitimate consumers remain; otherwise report exact consumers and defer removal.

# Forbidden Substitutions

No invented auth/public layout, no Joy equivalent of Figma primitives, no `sx`, no design-reference override, no removal of auth/legal/permission/native behavior.

# Dependency Changes

Remove Joy/Emotion/MUI only after a zero-consumer audit; never prematurely. No other dependency change is implied.

# Tests

Auth/MFA/reset/session/onboarding/legal/payment/deep-link tests; accessiblity and Arabic tests; Playwright public/auth flows; `npm test`, build, smoke, `./scripts/verify.sh`.

# Visual Acceptance

For A/B surfaces, compare exact shared Figma primitives at 1440×900/390×844 × DayDan/Sovereign × LTR/RTL. For C, provide no claimed visual parity and obtain owner input only as a terminal blocker after all other work is complete.

# RTL / Arabic

Verify login, MFA, reset, onboarding and legal Arabic locale/direction; preserve translations and form validation.

# Capacitor / Native

Test social/deep-link restore, keyboard, storage/session and Android sync.

# Completion Criteria

All non-Figma surfaces are classified; A/B use exact Figma primitives; C has owner-input records; legacy packages are removed only if audit proves zero consumers.

# Final Evidence

Report full A/B/C inventory, owner-input requests, consumer audit, removed/deferred packages, tests/build/sync and screenshot evidence.

# GitHub Actions / Merge Policy

GitHub Actions are NOT an authoritative merge gate for DayDan; they are intentionally disabled/unavailable as a required validation mechanism. COMPLETE LOCAL VERIFICATION in a clean isolated worktree is authoritative. Do not stop because Actions are red before steps, record zero executed steps, skip downstream jobs, lack runners, or have account/billing/infrastructure failures. Report this as `NON-GATING GITHUB ACTIONS INFRASTRUCTURE STATUS`. Investigate only concrete reproducible repository-code/test failures. Merge after dependency install, typecheck, unit/component tests, lint/format, DayDan/Sovereign builds, required browser/visual Figma parity, Arabic/RTL, Capacitor, `scripts/verify.sh`, PR review and no regression; Actions green is not required. After merge, fetch, create a NEW detached clean worktree at `origin/develop`, rerun all applicable local verification, and confirm it is clean.

# Binding Authority, Closure PR Authorization, and Figma Consistency Invariant

1. The owner explicitly pre-authorizes creation, push, review, merge, and post-merge verification of narrowly scoped closure branches/PRs for any concrete in-scope regression found before, during, or after this phase. No additional authorization is required.
2. Any prior `do not create another branch/PR` wording only forbids unnecessary duplicate implementation work; it never prohibits a necessary closure branch/PR.
3. If a repository-action guard, prior prompt, or stale planning sentence conflicts with this authorization, this latest README controls the phase execution. Do not return an authority-conflict blocker.
4. Any active build/test/reference/verification configuration that fails because it retained superseded Phase 1 tooling automatically becomes in-scope. Fix it narrowly; never skip the gate. `design-reference/` is not visual authority, but executable reference tooling must remain compatible with the Figma runtime whenever repository verification executes it.
5. Preserve the repo-wide Phase 1 runtime invariant: no active executable path may regress to React 18 assumptions, `@vitejs/plugin-react-swc`, Tailwind 3/PostCSS integration, or substituted runtime tooling. Scan active configs/scripts/tests before completion and fix stale references.
6. Where Figma defines presentation, it is exact authority: use actual Figma primitives/classes/assets/tokens. For category C, never invent a design. No equivalent library, closest icon, approximate spacing, or workaround is acceptable where Figma has an implementation.
7. A needed closure PR is work, not a blocker. `NOT COMPLETE` is allowed only after all normal in-repository remediation is exhausted and any remaining category C truly requires owner design input.

# Autonomous End-to-End Execution Contract

When the owner says `Execute Phase 7`, this README is the complete execution contract. Work autonomously from start to terminal completion.

1. Fetch/prune, locate this phase branch, read this entire README, inspect the real repository/Figma sources, update the phase branch onto current legitimate `origin/develop`, and execute all required work in isolated worktrees without touching the dirty primary checkout or `daydan-server`.
2. Do NOT send intermediate progress/status responses. Never return with `underway`, `started`, `pending`, `still running`, `not migrated`, `not verified`, or equivalent. Wait/poll for running commands and continue.
3. Any test/build/lint/typecheck/visual failure must be reproduced, root-caused, fixed in scope, covered where appropriate, and rerun. Continue until the full applicable gate is green or a genuinely external blocker remains after reasonable remediation is exhausted.
4. Complete missing prior-phase post-merge verification first if necessary; fix any concrete regression through a narrow closure branch/PR, merge, reverify, then continue without asking the owner.
5. Complete every A/B surface, behavior preservation task, dependency consumer audit, local verification, visual checks, review passes, commit, push, PR, diff review, merge, and fresh detached post-merge verification before considering the phase terminal.
6. GitHub Actions is informational/non-gating. Never wait for it or ask for an override.
7. Do not ask routine implementation questions. For category C, exhaust Figma shared primitives and repository evidence first, finish all A/B and independent work, then return unresolved C surfaces only once as a consolidated terminal owner-design blocker with exact route/source evidence and minimum required design decisions. Never invent UI.
8. Earlier wording such as `stop`, `request owner input`, `obtain owner input`, or `report blocker` means terminal handling only after all independent executable work is complete, never an early progress response.
9. Return exactly one terminal report: `PHASE 7 COMPLETE` with evidence when completion criteria are satisfied, or `NOT COMPLETE` only for concrete unresolved owner-design/external blockers after all other work/remediation is exhausted. Do not start Phase 8.