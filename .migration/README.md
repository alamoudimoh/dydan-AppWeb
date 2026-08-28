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
