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
2. Apply A/B only using copied Figma primitives/classes; retain content/behavior. For every C, stop implementation and request owner design input; do not approximate or “modernize.”
3. Audit imports/build output to identify every remaining `@mui/joy`, `@mui/material`, `@emotion/react`, `@emotion/styled` consumer. Remove packages only when zero legitimate consumers remain; otherwise report exact consumers and defer removal.

# Forbidden Substitutions

No invented auth/public layout, no Joy equivalent of Figma primitives, no `sx`, no design-reference override, no removal of auth/legal/permission/native behavior.

# Dependency Changes

Remove Joy/Emotion/MUI only after a zero-consumer audit; never prematurely. No other dependency change is implied.

# Tests

Auth/MFA/reset/session/onboarding/legal/payment/deep-link tests; accessiblity and Arabic tests; Playwright public/auth flows; `npm test`, build, smoke, `./scripts/verify.sh`.

# Visual Acceptance

For A/B surfaces, compare exact shared Figma primitives at 1440×900/390×844 × DayDan/Sovereign × LTR/RTL. For C, provide no claimed visual parity and obtain owner input.

# RTL / Arabic

Verify login, MFA, reset, onboarding and legal Arabic locale/direction; preserve translations and form validation.

# Capacitor / Native

Test social/deep-link restore, keyboard, storage/session and Android sync.

# Completion Criteria

All non-Figma surfaces are classified; A/B use exact Figma primitives; C has owner-input records; legacy packages are removed only if audit proves zero consumers.

# Final Evidence

Report full A/B/C inventory, owner-input requests, consumer audit, removed/deferred packages, tests/build/sync and screenshot evidence.
