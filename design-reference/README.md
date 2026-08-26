# DayDan product design reference

This is the isolated, interactive HTML reference for the DayDan application.
It reuses the frontend's React/Vite toolchain, the production DayDan Joy theme,
MUI Joy components, MUI Icons, Fontsource packages, and shared DayDan UI
components. It does not mount production providers, call the API, change routes,
or alter application behavior.

Run from `daydan-app`:

```sh
npm run reference:dev
npm run reference:test
npm run reference:build
```

The production build is written to `design-reference/dist`.

## Repository inventory

- React 18 with Vite 6, SWC, React Router, Vite PWA, and Capacitor 8.
- MUI Joy is the primary component system. MUI Material is present mainly for
  `useMediaQuery`; `@mui/icons-material` is the application icon set. Emotion
  provides the styling engine.
- The app combines Joy `sx`, shared style objects, CSS/CSS Modules, and a small
  Tailwind utility layer. Tailwind preflight is disabled.
- Fonts are self-hosted with Fontsource. The canonical reference uses Comfortaa
  Variable for the complete English DayDan UI, Ubuntu Sans Variable for the
  complete English Sovereign UI, Cairo for Arabic, and JetBrains Mono only for
  compact numeric/data values. The production UI still uses Inter until a later
  migration pass.
- Recharts provides charts; `react-calendar` provides legacy calendar surfaces.
  The app also uses Joy tables/lists and both DnD Kit and Hello Pangea DnD.
- The production theme is `src/theme/daydanTheme.js`, backed by
  `src/theme/tokens.js`. Shared layout rules live in `src/theme/appLayout.js`.
- Existing reusable primitives include `PageHeader`, `SectionCard`, `AppModal`,
  `ModalActions`, `EmptyState`, `QueryLoadingView`, the navigation model/styles,
  category/option picker fields, task rows/cards, sync status, and the profile
  avatar/menu.

## Existing DayDan foundation

- Primary: `#4D40DB` light / `#A59CF5` dark.
- Signal/info: `#0369A1` light / `#7DD3FC` dark.
- Page: `#F6F7F9` light / `#1A1F26` dark.
- Surface: `#FFFFFF` light / `#232830` dark.
- Text: `#1A1F26` light / `#F8FAFC` dark.
- Boundary: `#E0E3EB` light / `#3A4150` dark.
- Radii: 9 px navigation, 10 px controls, 12 px rows, 16 px cards, and
  24 px shells.
- Shadows: 1/2 px through 24/64 px, with low-opacity ink-colored shadows.
- The reference type scale has explicit display, page-title, section-title,
  card-title, row-title, body, small-body, label, button, and metric roles.
  DayDan uses Comfortaa weights 400/600/700 to preserve hierarchy; Sovereign
  uses Ubuntu Sans; Arabic uses equivalent Cairo hierarchy rather than
  inheriting the English face.
- Spacing is based on Joy's 8 px unit, with established 12 px page padding on
  phones, 14 px grid gaps, 18 px card padding, 24 px section rhythm, and 32 px
  tablet/desktop page padding.
- Joy `CssVarsProvider` implements system/light/dark mode. The app also applies
  a root `.dark` class for Tailwind compatibility.
- Localization sets `html[dir]` and `html[lang]`; Arabic uses Cairo. Drawer
  anchoring and directional arrows are handled explicitly, while numeric
  metrics remain LTR with JetBrains Mono.

## Canonical rules established here

- Content uses a 1128 px wide shell and 760 px narrow reading/form shell.
- Mobile `<600`: 12 px page gutters, one content column, drawer navigation,
  stacked page actions, two-up compact stats where space permits, and no fixed
  card widths.
- Tablet `600–899`: 32 px gutters, responsive auto-fit cards (minimum 260 px),
  drawer navigation, and stacked major columns.
- Desktop `>=900`: persistent 248 px sidebar, sticky 64 px top bar, 40 px outer
  gutters at `>=1200`, a two-thirds/one-third split for dashboard/report layouts,
  and equal-height auto-fit card grids.
- The reference intentionally standardizes on the existing MUI breakpoints:
  `xs 0`, `sm 600`, `md 900`, `lg 1200`, `xl 1536`. Existing isolated 480 px and
  768 px calendar queries are not promoted into the canonical system.
- All category, member/avatar, chart, circle, and progress accents resolve via
  semantic theme variables. No DayDan brand color is retained when Sovereign is
  active.
- Member presentation exposes six brand-aware identity roles. Chart roles
  intentionally alias those identity colors, while category, circle, progress,
  status, and product-action roles remain separate. The reference maps sample
  members positionally only as demonstration data; production assignment policy
  remains isolated from presentation tokens.
- Touch controls are at least 44 px on mobile. Focus uses the repository's
  two-layer brand ring, and reduced-motion preferences disable transitions.

## Sovereign reference treatment

No Sovereign theme or branding implementation was found in either repository.
The reference therefore defines an explicit candidate system for review rather
than presenting it as existing production behavior:

- Ubuntu Sans Variable for the wordmark and UI, with Cairo retained for Arabic
  and JetBrains Mono for data.
- Deep teal primary (`#0F766E` light / `#5EEAD4` dark) and copper signal
  (`#B45309` light / `#FDBA74` dark).
- Neutral green-slate pages/surfaces, tighter 7/8/10/12/20 px geometry, and
  slightly crisper shadows.
- Independent member, category, progress, and chart palettes in both color
  modes. Switching brand changes those semantic colors along with controls,
  navigation, focus, typography, surfaces, and borders.

## Inconsistencies found in the current app

- Desktop navigation remains a top bar plus temporary drawer at every width;
  the repository also contains an unused generic bottom-navigation demo.
- Pages mix default Joy containers, `md`, `lg`, `xl`, 760 px, and 1128 px shells,
  plus many one-off 200–500 px widths. Card grids alternate between Joy Grid,
  auto-fit CSS, fixed widths, and unbounded stacks.
- Newer pages use `PageHeader`, `SectionCard`, `EmptyState`, `AppModal`, and
  shared layout objects, while older meters, rewards, settings, legal, landing,
  and timer surfaces still use one-off cards, raw dialogs, and browser confirms.
- Hard-coded colors remain in projects/chore editing (`#1976d2`), labels
  (`#90a4ae`), onboarding vignettes, timer animations, legacy marketing teal,
  and legal-page light-only styles. These bypass brand and sometimes dark mode.
- The navigation wordmark currently inherits Inter; Comfortaa was not loaded.
  Ubuntu Sans was installed but unused. The reference resolves both issues, but
  no product-brand switch exists in production.
- Joy and Material imports are mixed, and Tailwind utilities coexist with Joy
  `sx`, global CSS, CSS Modules, and several duplicated calendar stylesheets.
- Responsive behavior uses both MUI breakpoints and one-off 480/600/768 px media
  queries. Mobile rows sometimes preserve fixed desktop widths or minimums.
- Some status palettes rely on generated Joy shades. The reference pins semantic
  soft/solid status variables so dark-mode foregrounds and backgrounds cannot
  collapse to the same color.
- Several people/category/project fallbacks use literal colors instead of a
  brand-aware semantic palette, which would leak DayDan colors into Sovereign.

## Screens and specimens

The sidebar exposes dashboard, chores/tasks, calendar, notifications, routines,
projects, shopping lists, meters, family progress/charts, rewards, settings,
account/session management, a complete component sheet, system states, and an
Arabic RTL screen. Global controls switch DayDan/Sovereign, light/dark, and
LTR/RTL without reloading.

## Figma Make convergence decisions

All screens under `design-source/figma-make/src/screens` and both task dialogs
were reviewed. The prototype provides visual/product direction; its React and
Tailwind implementation is not copied into this Joy/Emotion reference.

### Adopt

- Today: date/eyebrow hierarchy, progress summary, segmented scope filters,
  overdue signal treatment, section counts, and dense task metadata.
- Focus Home: contextual greeting, compact metric cards, quick-action grammar,
  workload comparisons, and activity summaries.
- Quest Home and Goals: streak pips, points emphasis, reward progress, and
  restrained celebratory language without hard-coded gamification colors.
- Activity: readable timeline nodes and natural-language family events.
- Search: large search entry point, grouped entity results, and distinct empty
  versus no-results states.
- Settings: repeatable section/row anatomy, theme preview concept, and explicit
  current-member labeling.
- Error: human-first recovery copy, error identifier, report-payload
  transparency, and success confirmation.

### Adapt

- All Tasks uses canonical Joy tabs, chips, search, and responsive filters with
  at least 36 px compact controls instead of prototype-sized clickable badges.
- Calendar keeps selected/today/event hierarchy, but uses semantic accents,
  focusable Joy controls, logical RTL arrows, and responsive cells.
- Projects, Routines, Shopping, Maintenance, and Goals keep their strongest card
  anatomy and progress language, translated to the 1128/760 shell rules and
  auto-fit grids rather than fixed columns or sidebars.
- Create Task remains a centered form dialog; Task Detail remains a logical-side
  detail drawer. Production `AppModal`, `ModalActions`, and accessibility
  behavior are canonical rather than the prototype overlays.
- Prototype tinted tiles, banners, member colors, charts, and progress fills are
  mapped to semantic brand-aware tokens instead of inline color mixing.

### Reject

- Fixed two/three-column layouts without mobile collapse, the fixed 220 px
  shopping rail, and fixed 280 px calendar rail.
- Clickable `div` day cells, unlabeled checkbox-only actions, custom switches
  without switch semantics, missing focus traps, and sub-44 px primary targets.
- Hard-coded dates, raw `#4326EA`, `#1A1A1A`, and `#FF8C42` brand/signal colors,
  opacity-only disabled states, and status colors reused as entity identity.
- Tailwind implementation details, prototype-only mobile navigation, dead demo
  actions, and per-screen spacing/typography values that bypass the canonical
  tokens.
