# Phase

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
