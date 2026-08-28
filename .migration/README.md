# Phase

Phase 6 — `migration/figma-p06-search-settings-system`: remaining authoritative Figma surfaces and explicit non-Figma classification.

# Prerequisites

Fetch/prune; verify Phases 1–5 merged; rebase latest `origin/develop`, resolving planning/base drift only. Figma wins; `design-reference/` is not authority.

# Authoritative Figma Baseline

`design-source/figma-make/` at app `ade3ffa8fff9ca947d0a843cfface61cbad0cb47`, identical to dedicated `7131b76979e49351db8ecbc33db6648a75139572`.

# Exact Figma Stack

React 19/Vite 8/plugin-react 6/Tailwind 4 + `@tailwindcss/vite`/TS 5.7/oxfmt.

# Figma Source Files

`src/screens/{SearchScreen,SettingsScreen,ErrorScreen}.tsx`, `src/App.tsx`, `src/index.css`, `src/data.ts`.

# Production Targets

`src/search/{GlobalSearchPage,GlobalSearchPalette,GlobalSearchContext}.jsx`, `src/views/Settings/**`, `src/views/{Error,Notifications/NotificationsView}.jsx`, `src/components/{ErrorBoundary,RealTimeSettings,SSESettings,SSEConnectionStatus}.jsx`, `src/contexts/{Router,Theme,Localization,SSE}Context.jsx`.

# Existing Behavior That Must Be Preserved

Search index/navigation/keyboard shortcut, settings permissions and persistence, account/session/MFA/API token/storage/developer controls, error recovery/reporting, Sentry/OpenReplay, SSE, auth, i18n, Capacitor settings/native effects.

# Required Implementation

Port Figma Search, Settings and Error DOM/classes directly, then wire real callbacks/data. Build an audited route inventory from `RouterContext.jsx`: classify every remaining production-only surface A Figma shared-shell sufficient, B exact reusable Figma primitive composition, or C `no authoritative Figma design — OWNER DESIGN INPUT REQUIRED`. Put the classification in the execution PR/evidence; for C stop and request owner input—do not design it.

# Forbidden Substitutions

No new design for category C; no Joy setting/search/error imitation; no `sx`; no altered permission/error/reporting behavior; no design-reference override.

# Dependency Changes

None expected.

# Tests

Search keyboard/result tests; settings permission/persistence tests; error boundary/retry/report tests; Playwright search/settings/error paths; full build/smoke/`./scripts/verify.sh`.

# Visual Acceptance

Compare Search, Settings and Error Figma/prod at 1440×900 and 390×844, DayDan/Sovereign × LTR/RTL, including query/results, setting groups, loading/error/retry. Validate exact hierarchy/density/control styling; screen parity is not “no overflow.”

# RTL / Arabic

Arabic query, results, setting labels and direction must retain product translations and Figma layout.

# Capacitor / Native

Exercise settings with native side effects, search keyboard and error reporting on web build plus Android sync.

# Completion Criteria

Authoritative screens pass visual parity, behavior works, and every unrepresented production surface has A/B/C evidence with no C invention.

# Final Evidence

Report classification table, mappings, behavior tests, screenshot pairs and owner-input blockers.

# GitHub Actions / Merge Policy

GitHub Actions are NOT an authoritative merge gate for DayDan; they are intentionally disabled/unavailable as a required validation mechanism. COMPLETE LOCAL VERIFICATION in a clean isolated worktree is authoritative. Do not stop because Actions are red before steps, record zero executed steps, skip downstream jobs, lack runners, or have account/billing/infrastructure failures. Report this as `NON-GATING GITHUB ACTIONS INFRASTRUCTURE STATUS`. Investigate only concrete reproducible repository-code/test failures. Merge after dependency install, typecheck, unit/component tests, lint/format, DayDan/Sovereign builds, required browser/visual Figma parity, Arabic/RTL, Capacitor, `scripts/verify.sh`, PR review and no regression; Actions green is not required. After merge, fetch, create a NEW detached clean worktree at `origin/develop`, rerun all applicable local verification, and confirm it is clean.
