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

# Forbidden Substitutions

No Joy recreation of Figma components; no `sx` translation of Figma Tailwind; no alternative CSS framework; no design-reference override; no approximate spacing/composition; no invented screen structure; no hidden legacy UI retained merely to avoid migration work.

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

All Figma screens meet explicit visual closure, no unjustified legacy presentation consumer remains, business behavior passes, and any non-Figma screen has the required owner-input classification from Phase 6.

# Final Evidence

Provide dependency graph, remaining consumers/removals, exact screen comparison matrix/screenshots, test/build/sync output, React 19 result and complete/not-complete result.
