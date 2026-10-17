# DYDAN Information Architecture

## Canonical route registry

The canonical authenticated module tree is owned by `src/navigation/moduleRegistry.ts`.

| Group | Module | Canonical route | Ownership |
| --- | --- | --- | --- |
| Primary | Home | `/` | Focus/Quest home mode |
| Primary | Today | `/today` | Today task view |
| Primary | All Tasks | `/all-tasks` | Complete task collection |
| Primary | Calendar | `/calendar` | Calendar/date planning |
| Organize | Projects | `/projects` | Project collection/details |
| Organize | Routines | `/routines` | Routine collection |
| Organize | Assets | `/assets` | Assets, meters, connected things |
| Space | Shopping | `/shopping` | Shopping lists and items |
| Space | Goals | `/goals` | Goals |
| Space | Rewards | `/rewards` | Rewards |
| Space | Progress | `/progress` | Progress analytics |
| Space | Activity | `/activity` | Activity history |
| Utility | Notifications | `/notifications` | Notifications |
| Utility | Settings | `/settings` | Account/space/preferences |
| Utility | Search | `/search` | Global search |
| Utility | Error | `/error` | Explicit error surface |
| Utility | Offline | `/offline` | Offline state |
| Utility | Unavailable | `/unavailable` | Unavailable service/state |
| Utility | Permission denied | `/permission-denied` | Access-denied state |

Desktop sidebar navigation is derived from the registry's Primary, Organize, and Space groups. Mobile navigation uses the registry-backed Home, Today, Shopping, Goals, and Settings entries.

## Assets

Canonical location: `/assets`.

Final module structure:

- **Assets**
  - **All Assets** — canonical maintenance asset collection.
  - **Meters** — readings, history, and asset links.
  - **Things** — connected/trackable state objects implemented by the current domain model.

Asset details remain contextual to the selected asset and expose linked meters/tasks without creating repeated Assets -> Assets nesting.

`/maintenance` remains a compatibility URL and redirects safely to `/assets`.

### Trackers and Memory decision

The inspected repository does not contain a real Trackers module or a real Memory module/data model. The implemented domain contains assets, meters, things, histories, and maintenance/task links. No fictional Trackers/Memory navigation entry was introduced. If either becomes a real domain capability, it must receive an explicit model and registry entry rather than being inferred from a label.

## Shopping

Canonical location: `/shopping`.

The implemented flow is:

**Shopping -> Shopping Lists -> selected List Details -> List Items**

The list collection and selected list detail are intentionally within one module route rather than separate nested URLs. Creation, rename/edit, deletion, item add/edit/delete/toggle, and completed-item actions remain in the same module context. Data continues through the existing shopping query/mutation layer, preserving persisted records across navigation/refetch.

## Home modes

`/` owns both supported modes:

- Focus mode -> `FocusHome`
- Quest mode -> `QuestHome`

The mode changes the home experience, not the route hierarchy or global navigation identity.

## Settings

`/settings` is the single settings owner. Its categories use the shared `GlobalTabs` contract and include profile, security, space, theme, language/region, side panel, notifications, privacy, billing/plan, integrations, advanced, and about.

## Public and conditional surfaces

These surfaces intentionally sit outside the normal authenticated module tree:

| Surface | Path/state | Notes |
| --- | --- | --- |
| Sign in | `/login` and unauthenticated app state | Dedicated auth frame |
| Get started | `/get-started` | Public auth entry |
| Onboarding/sign-up | auth mode state | Dedicated onboarding frame |
| Email change verification | `/email-change/verify` | Dedicated verification screen |
| Splash/loading | auth/profile loading state | Temporary gate before shell |

Unknown authenticated routes redirect to `/`.

## Contextual/detail ownership

- Task create/edit/detail stays in global task modal infrastructure.
- Project detail remains owned by Projects.
- Asset detail/history remains owned by Assets.
- Meter history remains owned by Assets -> Meters.
- Thing history remains owned by Assets -> Things.
- Shopping list items remain owned by the selected Shopping list.
- Confirmation actions use the global confirmation dialog rather than page-specific confirmation systems.

## Navigation rules

1. Canonical route, title, navigation label, icon, grouping, and visibility come from `MODULE_REGISTRY`.
2. Sidebar and mobile navigation must consume registry metadata.
3. Page headers use `ModulePageHeader` when module identity is sufficient.
4. Legacy URLs use explicit redirects.
5. A new route must have one functional owner.
6. No duplicate sidebar entry may point to an equivalent module function.

