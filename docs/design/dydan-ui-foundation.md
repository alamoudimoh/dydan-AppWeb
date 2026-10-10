# dydan — UI/UX foundation

Branch: `fix/04-shopping-layout-diagnostics`

This document is the maintained UI/UX foundation for dydan. It records the
global presentation rules that all current and future product screens must
follow so new pages do not invent their own spacing, page anatomy, tabs, cards,
empty states, hero blocks, or responsive behavior.

Ownership note: this file is maintained by ChatGPT in the product-design
conversation. CLI/coding agents are implementation executors only; they must
not be instructed to read, interpret, rewrite, or maintain this document.
Implementation prompts may contain the relevant rules copied from this document,
but this file itself remains the product-design source maintained here.

The current baseline supports two visual themes (dydan and Sovereign), English
LTR and Arabic RTL, desktop and mobile layouts, and a shared creation system.
The standard below is product-wide: Home, Today, All Tasks, Calendar, Projects,
Routines, Assets, Shopping, Goals, Rewards, Settings, and future screens all
inherit the same global page shell. Feature-specific content may differ; the
underlying layout contract may not.

## 1. Identity anchors and the token model

dydan already has an established semantic token foundation in `src/index.css`.
Product screens must consume semantic tokens rather than introduce raw,
screen-specific color values.

The current product carries two theme families:

| Theme | Core identity | Primary active/accent treatment |
| --- | --- | --- |
| dydan | Rhythm Violet | Violet structure + meaningful Gold |
| Sovereign | Navy & Brass | Navy structure + Brass active/primary |

Current shared semantic roles include:

- page and surface layers,
- primary / muted / faint text,
- normal and strong boundaries,
- primary and secondary action colors,
- selected state,
- focus ring,
- search/input surfaces,
- semantic success / warning / error / information roles,
- member, project, and goal accents,
- radius and shadow scales.

No new page may bypass the semantic layer with a private visual palette unless a
new product-wide token is deliberately approved first.

## 2. State and action grammar

The product uses one state/action grammar across pages.

Primary actions:

- use the shared primary-action treatment,
- occupy the trailing side of the page header when page-contextual,
- use the existing icon system,
- use consistent height, radius, typography, and focus behavior,
- must not be duplicated in the empty state when the same action already exists
  in the page header.

Secondary actions:

- remain visibly subordinate to the page's primary action,
- may live in cards, rows, compact support panels, or entity detail areas,
- must not compete with the primary create action.

Selection:

- tabs and segmented controls use the shared selected-state tokens,
- selected state is communicated by more than text color alone,
- the selected segment geometry does not change from page to page.

Error, loading, empty, and unavailable states must remain distinct. An API
failure must never be rendered as a legitimate empty dataset.

## 3. Typography

The current production stack is:

- Latin / English UI: Comfortaa,
- Arabic UI: Cairo fallback,
- shared UI stack: `var(--font-ui)`.

Typography is role-based rather than screen-specific.

Required hierarchy:

- page title,
- page eyebrow / metadata,
- page subtitle,
- section title,
- card/entity title,
- body,
- supporting/meta text,
- button/control label.

A screen must not invent a different page-title size, weight, line-height, or
top position because its content is different.

The shared `PageHeader` contract owns the primary page-title anchor.
Optional eyebrow content must reserve the same vertical slot so pages with an
eyebrow do not push the title lower than pages without one.

Arabic uses the same hierarchy through Cairo; RTL must not alter semantic
hierarchy or introduce different vertical rhythm.

## 4. Shape and spacing

The application already exposes shared radii:

- `--r-xs: 4px`
- `--r-sm: 8px`
- `--r-md: 12px`
- `--r-lg: 18px`
- `--r-xl: 24px`
- `--r-2xl: 32px`
- `--r-full: 9999px`

New UI must use this shared radius system. Feature pages must not invent their
own arbitrary card or control radii.

The product-wide page rhythm must be centralized around a small spacing scale.
The implementation pass following this record should normalize the current
screen-by-screen spacing into shared tokens/primitives instead of retaining
local margins.

The global vertical sequence is:

1. application top bar,
2. page top anchor,
3. page header,
4. optional hero/support block,
5. optional tabs/filter/navigation strip,
6. page content,
7. optional secondary/support content.

For equivalent page patterns, the gaps between these layers must be identical.

The important rule is not merely that the first DOM child aligns. The visible
page title, tabs, first content row, empty state, and equivalent cards must use
shared anchors and shared spacing.

## 5. Motion

dydan motion remains restrained and functional.

Theme transitions already use short transitions for background, border, color,
and shadow. New page-shell primitives should reuse existing motion behavior and
must respect reduced-motion requirements.

Do not add feature-specific decorative motion to compensate for inconsistent
layout.

Page-to-page navigation should feel spatially stable: common anchors such as
the page title, tabs, and first content region must not jump vertically because
individual screens use different local margins.

## 6. Global page shell

Every primary dydan screen must use one shared page shell.

The shell owns:

- content width behavior,
- horizontal page gutters,
- top page anchor,
- page-header position,
- desktop/mobile adaptation,
- LTR/RTL logical alignment,
- spacing between header and the next major block.

The shell applies to:

- Home
- Today
- All Tasks
- Calendar
- Projects
- Routines
- Assets
- Shopping
- Goals
- Rewards
- Settings
- future primary pages

A screen may have different business content, but it may not redefine the shell.

### Page header contract

The existing `src/components/PageHeader.tsx` is the beginning of this
standard and must remain the canonical page-header primitive.

The header owns:

- optional eyebrow slot,
- primary `h1`,
- optional subtitle,
- optional contextual action area.

Rules:

- the primary `h1` uses one product-wide anchor,
- contextual primary actions occupy the same logical trailing region,
- subtitle spacing is fixed,
- a missing eyebrow must not move the title,
- mobile stacking behavior must be consistent,
- RTL mirrors logical placement without changing measurements.

## 7. Shared page patterns

The global shell is mandatory for all pages. On top of it, pages compose one or
more approved patterns.

### 7.1 Tabs

A single shared page-tab primitive must own:

- total track geometry,
- tab height,
- equal-width behavior where appropriate,
- internal padding,
- selected background,
- typography,
- focus state,
- border/radius,
- desktop/mobile behavior,
- RTL ordering.

Current examples that should converge on this one primitive include:

- Assets / Meters / Trackers,
- Shopping Lists / Items / Overview,
- Rewards / My Requests / Points.

Feature screens must not author their own tab measurements.

### 7.2 Hero / summary block

Hero blocks are optional.

Use them only when the page has genuine summary information that deserves a
higher hierarchy, such as balances, progress summaries, or key status.

A hero is not permission to invent arbitrary width, height, radius, padding, or
typography. A shared `PageHero` / summary primitive should define:

- width behavior,
- minimum/maximum height,
- internal padding,
- title/value hierarchy,
- responsive collapse,
- theme-aware surface treatment.

If no hero is needed, the page proceeds directly from header to tabs/content.

### 7.3 Content section

A shared content-section primitive should define:

- section-title position,
- spacing above/below,
- optional trailing actions,
- content container behavior.

Section titles must not float at arbitrary vertical positions between screens.

### 7.4 Entity cards / rows

Entity presentation may vary by information density, but the base anatomy must
remain consistent.

Shared rules:

- common border/radius family,
- common internal padding scale,
- consistent title/meta spacing,
- consistent action placement,
- no fixed one-off widths unless the page pattern explicitly requires them,
- responsive layouts must reflow instead of clipping.

A compact row and a card may be separate approved variants, but each variant is
global and reusable rather than feature-owned.

### 7.5 Empty state

There must be one canonical empty-state system.

It owns:

- horizontal alignment,
- vertical placement relative to the page content region,
- icon size/treatment,
- title role,
- supporting-text role,
- optional action behavior,
- responsive behavior.

Rules:

- empty-state vertical placement must not vary by feature,
- icons are optional but, when used, follow one size/system,
- primary create CTA is omitted when the same create CTA already exists in the
  page header,
- empty state is not used for API/network failure,
- feature copy changes; geometry does not.

### 7.6 Filters / status controls

Filters may be chips, segmented controls, or search/filter rows depending on
function, but each approved control class is shared.

Routines' All / Active / Inactive filters, task filters, and future filters must
consume shared geometry rather than local padding/height rules.

## 8. Creation system

The Fix 03 creation system is a separate global standard and remains canonical.

All create flows use the shared modal system based on:

- `src/components/FormModal.tsx`,
- `src/components/create/CreateEntityModal.tsx`,
- centralized entity configuration,
- centralized icons.

The outer modal frame must stay identical across entity types.

Current top-level universal create options are:

- Task
- Project
- Routine
- Asset
- Shopping List

Contextual actions may skip the selector but must invoke the same canonical
entity configuration.

No inline create form may be introduced on a page that belongs to this creation
class.

## 9. Current product terminology

Current approved user-facing hierarchy:

- Projects → Project
- Routines → Routine
- Assets → Assets / Meters / Trackers
- Shopping → Shopping Lists / Items / Overview
- Goals → Goal
- Rewards → Rewards / My Requests / Points

The former user-facing `Maintenance` primary-page terminology has moved to
`Assets`.

The former user-facing `Things` terminology has moved to `Trackers`.

A later backend migration must decide whether legacy internal route/API names
remain compatibility aliases or are migrated end-to-end. Frontend labels alone
must not be represented as an end-to-end domain rename.

## 10. Shopping page pattern

Shopping follows the same page-shell and tab grammar as Assets.

Its primary tabs are:

1. Shopping Lists
2. Items
3. Overview

Rules:

- page header has one contextual `New Shopping List` action,
- no duplicate primary CTA in the empty state,
- Shopping Lists shows list-level entities,
- Items is a cross-list item view with parent-list context,
- Overview groups items under their parent Shopping List,
- Shopping Item creation remains context-dependent on a parent list,
- sharing remains available but visually secondary to the core shopping
  hierarchy.

Shopping may have unique business content; it does not have unique page
geometry.

## 11. Assets page pattern

Assets is the current clearest example of the desired tabbed-page hierarchy:

Page Header
→ contextual create action
→ Tabs
→ tab-specific content

Tabs:

1. Assets
2. Meters
3. Trackers

The Assets page is a reference for hierarchy, not a license to copy
feature-specific content into other screens.

The next standardization implementation should extract the shared pattern so
Assets also consumes global primitives rather than remaining merely the visual
example other screens imitate manually.

## 12. Goals, Rewards, Routines, and Projects

These screens currently expose visible page-pattern differences that must be
normalized by shared primitives rather than patched one by one.

### Goals

Goal cards must consume the shared entity-card/summary grammar. Their width,
padding, radius, title position, progress placement, and action alignment should
not be private to Goals.

### Rewards

Rewards currently uses:

- a large points summary hero,
- a three-tab navigation strip,
- tab content cards/states.

The hero may remain functionally unique, but its outer geometry must use the
shared hero primitive. Its tabs must use the same page-tab primitive as Assets
and Shopping. Empty and content states must use shared page-content anchors.

### Routines

Routines uses filter/status controls rather than primary page tabs. That is a
valid different pattern, but the page shell, filter-control geometry, and empty
state still follow global standards.

### Projects

Projects may have no tabs at all. That is also valid. Its page shell, page
header, entity-grid/card pattern, and empty state remain governed by the shared
system.

"Different feature" does not mean "different spacing system."

## 13. Home, Today, All Tasks, and Calendar

The global standard is not limited to the lower navigation pages.

Home, Today, All Tasks, and Calendar use the same page shell and page-header
anchor.

They may compose different page patterns:

- Home: dashboard/summary content,
- Today: date eyebrow + progress + task content,
- All Tasks: counters + search/filter controls + task content,
- Calendar: calendar navigation + calendar/content layout.

Their functional structure may differ, but they share:

- page-title anchor,
- horizontal gutters,
- header geometry,
- section spacing,
- card primitives,
- controls,
- empty/loading/error states,
- responsive rules,
- RTL/LTR behavior.

## 14. Responsive layout

The same component system adapts across viewports.

Minimum verification targets:

- desktop: 1440 × 900,
- mobile: 390 × 900.

Rules:

- no horizontal page overflow,
- no fixed card widths that break mobile,
- primary page actions remain reachable,
- tab systems remain usable,
- equivalent geometry remains equivalent after responsive adaptation,
- mobile uses the same primitives, not an unrelated mobile design,
- logical start/end alignment mirrors for RTL.

A future implementation pass should centralize viewport-specific page gutters
and page-shell spacing instead of leaving one-off media-query values in feature
screens.

## 15. RTL / LTR

English uses LTR and Arabic uses RTL.

All shared primitives must use logical layout semantics.

RTL must correctly mirror:

- header actions,
- tab order/alignment where appropriate,
- row action groups,
- icon/label relationships,
- content alignment.

Numeric or technical values that require LTR presentation must remain readable
without changing the surrounding Arabic page anatomy.

No page may maintain a separate RTL-only spacing implementation.

## 16. Accessibility

Global UI standardization must preserve or improve:

- semantic headings,
- keyboard focus,
- visible focus indicators,
- accessible button labels,
- control target sizes,
- contrast,
- reduced motion,
- correct dialog semantics,
- empty/loading/error distinction.

A shared primitive is incomplete if it only makes screenshots align but removes
semantic or keyboard behavior.

## 17. Shared components to establish / maintain

The canonical product-wide presentation layer should converge around shared
primitives equivalent to:

- `PageShell`
- `PageHeader` (already present)
- `PageTabs`
- `PageHero`
- `PageSection`
- `EntityCard` / approved compact row variants
- `EmptyState`
- shared filter/segmented controls
- `FormModal` / `CreateEntityModal` (already canonical for creation)

Names may follow the repository's existing conventions, but ownership must be
global, not feature-specific.

New pages should compose these primitives rather than recreating their CSS.

## 18. Enforcement rule

This standard is architectural, not decorative documentation.

The implementation should eventually include tests/gates proving that primary
screens use the shared page primitives.

A future page must not be accepted merely because it "looks close."

At minimum, verification should be able to detect:

- divergent page-title anchors,
- divergent page gutters,
- custom tab geometry,
- custom empty-state geometry,
- duplicate page-level primary create actions,
- one-off modal shells,
- page overflow at supported mobile width.

The preferred implementation rule is:

If two screens represent the same UI pattern, they must share the same
component/token source.

Do not maintain visual consistency by repeatedly copying numeric CSS values.

## 19. Current observed inconsistencies

The current product screenshots and runtime review show several valid
feature-specific layouts but too many independent presentation implementations.

Observed examples include:

- Shopping, Assets, and Rewards all use three-segment tab-like navigation but
  do not yet share one canonical page-tab component.
- Empty-state placement and treatment differ between Assets, Routines,
  Projects, Rewards, and other pages.
- Hero/summary cards such as Rewards use different geometry from other summary
  surfaces without a shared hero contract.
- Entity cards use different widths, padding, radii, and content offsets.
- First content position after the header/tabs differs between screens.
- Filters and small segmented controls use local sizing.
- Some pages appear visually aligned only because local values happen to be
  similar; they are not yet guaranteed by architecture.

These are global-system issues. They should be solved through shared primitives
and tokens, not six separate screen fixes.

## 20. Verification

Any implementation pass that claims conformance to this foundation should
verify at minimum:

- Home
- Today
- All Tasks
- Calendar
- Projects
- Routines
- Assets
- Shopping
- Goals
- Rewards

At both:

- 1440 × 900
- 390 × 900

And in:

- English LTR
- Arabic RTL

Verification should compare real rendered anchors and geometry, not merely DOM
order.

The creation system must also remain consistent across supported entity types.

## 21. Maintenance of this record

This document is maintained as the product-design foundation for dydan.

When the user approves a new global UI rule, ChatGPT should update this record
on the active dydan development branch.

Implementation agents are not the maintainers of this file and should not be
asked to interpret or modify it.

A branch-specific implementation may change code without changing this record
unless the product-design standard itself has changed.

The purpose of this file is to keep the governing UI decisions stable while
implementation branches evolve.
