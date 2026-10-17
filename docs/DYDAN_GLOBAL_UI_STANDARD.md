# DYDAN Global UI Standard

Status: authoritative repository standard for shared UI/UX architecture.

## 1. Sources of truth

The global UI system is defined by these implementation sources:

- `src/index.css` — theme primitives, semantic tokens, shared controls, cards, states, shell sizing, responsive and RTL behavior.
- `src/ui/GlobalUI.tsx` — page layout, page/section headers, tabs, segmented controls, breadcrumbs, and empty states.
- `src/ui/Icon.tsx` — canonical icon registry and logo mark.
- `src/navigation/moduleRegistry.ts` — canonical module identity, route, title, navigation label, icon, group, visibility, and legacy redirects.
- `src/App.tsx` — application shell and router consumer of the registry.

No module may create a competing shell, page-header system, navigation registry, icon registry, or theme palette.

## 2. Design tokens

### Color and theme

Use semantic tokens from `src/index.css`, not page-local hex values.

Core semantic surfaces and text:

- `--page`
- `--surface`, `--surface-2`, `--surface-3`
- `--t-primary`, `--t-muted`, `--t-faint`
- `--line`, `--line-strong`
- `--brand`, `--brand-hover`, `--brand-accent`, `--brand-contrast`
- `--accent`, `--accent-bg`, `--accent-text`

Actions and interaction:

- `--action-primary-*`
- `--action-secondary-*`
- `--selected-*`
- `--focus-ring`, `--focus-offset`
- `--input-*`, `--search-*`

Status:

- `--sig-done*`
- `--sig-due*`
- `--sig-over*`
- `--sig-flag*`

The supported brand/theme combinations are:

1. dydan light
2. dydan dark
3. sovereign light
4. sovereign dark

The dydan identity remains Rhythm Violet / Gold. Sovereign remains Navy / Brass. Feature code consumes semantic tokens so theme changes propagate globally.

### Typography

- UI stack: `--font-ui` = Comfortaa with Cairo Arabic fallback.
- Arabic stack: `--font-ar`.
- Monospace token: `--font-mono`.
- Screen titles use the shared `PageHeader` / `ModulePageHeader` hierarchy.
- Section titles use `SectionHeader`.

### Shape and elevation

- Radius scale: `--r-xs` through `--r-2xl`, plus `--r-full`.
- Shadow scale: `--shadow-xs` through `--shadow-lg`.
- App shell width/height contracts: `--sidebar-w`, `--app-topbar-height`.

## 3. Shared component catalog

### Application shell

`App.tsx` owns the shell, desktop sidebar, mobile navigation, top bar, route outlet, global task modal, confirmation dialog, and toast container.

### Page primitives

Use:

- `PageLayout` — canonical content width and page spacing.
- `PageBody` — standard page content block.
- `PageHeader` — title, description, action area.
- `ModulePageHeader` — page header populated from module metadata.
- `SectionHeader` — section title/action alignment.
- `Breadcrumbs` — contextual hierarchy for nested/detail states.
- `EmptyState` — centered empty-state icon, title, description, action.

Equivalent screens must use these instead of local `.page-header` wrappers or inline `maxWidth: 1080` containers.

### Tabs and segmented controls

- `SegmentedControl` is the canonical compact switcher.
- `GlobalTabs` is the canonical module/settings tab system.
- Desktop tab bars wrap when necessary.
- Smaller viewports stay single-row and horizontally scrollable.

### Buttons

Use shared button classes from `src/index.css`:

- `.btn`
- `.btn-primary`
- `.btn-secondary`
- `.btn-ghost`
- `.btn-danger`
- `.btn-sm`, `.btn-lg`
- `.btn-icon`

Primary page actions belong in the page header action area. Row actions belong in a trailing action region. Icon-only buttons require an accessible name.

### Icons

All general application icons use `Icon` from `src/ui/Icon.tsx`.

Rules:

- Sidebar/navigation: leading icon, then label.
- Page title: optional module icon in the same shared title block.
- Primary action: icon precedes action label.
- List/card icon: leading position.
- Row actions: trailing position.
- Empty-state icon: centered above title.
- Directional icons mirror with RTL when semantic direction changes.
- Size is passed through the shared component; modules must not introduce a second icon library for equivalent UI.

### Cards, lists, forms, dialogs and states

- Shared card surface: `.card`.
- Shared form controls use semantic input tokens and existing reusable field components.
- Confirmation behavior uses `ConfirmDialog`.
- Empty states use `EmptyState` or the shared empty-state classes.
- Global loading/success/error feedback uses the existing application query states, toast system, and shared state screens.

## 4. Mandatory screen structure

Equivalent routed application screens follow this order:

1. Application shell.
2. Navigation context/breadcrumbs when the user is below a module root.
3. Page header.
4. Title and optional description.
5. Primary action in the header action area.
6. Search/filter/tab controls when applicable.
7. Main content.
8. Empty/loading/error state.
9. Secondary/contextual actions beside the content they affect.

Authentication, onboarding, email verification, and full-screen mode surfaces may use their dedicated frame because they are not normal shell pages.

## 5. Navigation and module metadata

`MODULE_REGISTRY` is the single module metadata registry. Consumers use:

- `MODULE_BY_ID`
- `SCREEN_PATH`
- `PATH_SCREEN`
- `NAVIGATION_GROUPS`
- `MOBILE_NAVIGATION`
- `LEGACY_ROUTE_REDIRECTS`

A module identity must not be duplicated in page-local navigation arrays.

## 6. Responsive behavior

- Desktop shell uses the fixed shared sidebar width token.
- Mobile uses the shared bottom navigation.
- Page content uses `PageLayout`; screens do not define their own 1080px wrappers.
- Long tab sets wrap at large breakpoints and horizontally scroll at smaller breakpoints.
- Primary page actions remain in the header action zone and collapse with the global responsive header behavior.
- Cards/grids may change columns by breakpoint, but spacing and surface treatment remain token-based.

## 7. RTL/LTR

- English uses LTR.
- Arabic uses RTL and Cairo fallback.
- Directional controls and alignment follow document direction.
- Logical CSS spacing (`ms`, `me`, logical alignment) is preferred over hard-coded left/right placement.
- Navigation icon/label ordering is mirrored by the shared shell.
- Tabs, headers, cards, and forms must remain usable without clipping in either direction.

## 8. Screen-state conventions

Each data surface supports the states applicable to its domain:

- populated
- empty
- loading
- recoverable error
- disabled/permission state where applicable

The state container must not move the page title or primary action. Empty-state actions appear inside the shared empty-state action region.

## 9. Focus and Quest

Focus and Quest preserve their distinct home experiences while sharing:

- shell
- route metadata
- tokens
- common controls
- responsive rules
- icon system

Mode identity is content behavior, not a license to fork the design system.

## 10. Enforcement

`npm run check:ui-architecture` executes `scripts/check-global-ui.mjs`.

It currently prevents:

- reintroduction of local shell page widths,
- local `.page-header` implementations,
- local `.seg-tabs` implementations,
- hard-coded colors in shell screens,
- duplicate application navigation registries,
- restoration of `/maintenance` as the canonical Assets route,
- removal of the required legacy `/maintenance -> /assets` redirect.

The check intentionally excludes Auth, Onboarding, Email Change Verification, and Shared State screens from shell-only rules because those surfaces use dedicated frames. Theme primitives in `src/index.css` are also a supported exception to the no-hard-coded-color screen rule.

## 11. Future implementation rules

1. Add or change module identity only in `moduleRegistry.ts`.
2. Build routed shell pages with `PageLayout` and the global header primitives.
3. Use `Icon` for application icons.
4. Use semantic CSS variables for colors and interaction states.
5. Use shared buttons, cards, forms, dialogs, tabs, and empty states before adding a new primitive.
6. Add a new global primitive only when the behavior is genuinely reusable.
7. Add regression coverage with any new shared behavior.
8. Run `./scripts/verify.sh` plus applicable Playwright/RTL/visual/native checks before completing substantial frontend work.

