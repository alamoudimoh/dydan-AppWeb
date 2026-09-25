# Production action matrix

Audit scope: authenticated AppWeb production routes, shared shell, task
modals, Settings modals, and public auth/error routes. Every action below
reaches either an authenticated API mutation/read followed by query
invalidation, a guarded browser capability, or a deterministic route/state
transition. Server routes enforce authentication, circle scope, and role scope
where the operation changes shared data.

| Surface | Visible interactive actions | Classification |
| --- | --- | --- |
| Shell/sidebar/top bar | navigation, search, task creation, notifications, view/theme/language/sidebar controls, sign-out | REAL + WIRED + AUTHORIZED + PERSISTED/SIDE-EFFECTED + RELOAD-SAFE + TESTED |
| Focus and Quest home | task completion/opening, quick-route cards, goal/activity/project navigation | REAL + WIRED + AUTHORIZED + PERSISTED/SIDE-EFFECTED + RELOAD-SAFE + TESTED |
| Today / All tasks / Calendar / Search | filters, period/date/search controls, task open, complete/reopen/create/edit/delete | REAL + WIRED + AUTHORIZED + PERSISTED/SIDE-EFFECTED + RELOAD-SAFE + TESTED |
| Task editor/detail | title, member, date, priority, points, real circle category, submit/cancel/close | REAL + WIRED + AUTHORIZED + PERSISTED/SIDE-EFFECTED + RELOAD-SAFE + TESTED |
| Projects | create, edit, icon/color selection, delete, task navigation | REAL + WIRED + AUTHORIZED + PERSISTED/SIDE-EFFECTED + RELOAD-SAFE + TESTED |
| Routines | create/edit schedule and members, active state, filter/expand | REAL + WIRED + AUTHORIZED + PERSISTED/SIDE-EFFECTED + RELOAD-SAFE + TESTED |
| Shopping | list create/select/edit/archive/delete, item create/edit/complete/delete, clear complete | REAL + WIRED + AUTHORIZED + PERSISTED/SIDE-EFFECTED + RELOAD-SAFE + TESTED |
| Goals | create/edit/archive, filter and linked navigation | REAL + WIRED + AUTHORIZED + PERSISTED/SIDE-EFFECTED + RELOAD-SAFE + TESTED |
| Rewards | reward create/edit/activate, request/cancel/approve/reject, tabs | REAL + WIRED + AUTHORIZED + PERSISTED/SIDE-EFFECTED + RELOAD-SAFE + TESTED |
| Notifications | filter, mark one/all read, reward resolution, target opening | REAL + WIRED + AUTHORIZED + PERSISTED/SIDE-EFFECTED + RELOAD-SAFE + TESTED |
| Progress / Activity | date range and filters, linked goals/activity navigation | REAL + WIRED + AUTHORIZED + PERSISTED/SIDE-EFFECTED + RELOAD-SAFE + TESTED |
| Maintenance assets | create/edit/archive/restore, detail/history, meter/task link/unlink, mark complete | REAL + WIRED + AUTHORIZED + PERSISTED/SIDE-EFFECTED + RELOAD-SAFE + TESTED |
| Maintenance meters | create/edit, readings, history | REAL + WIRED + AUTHORIZED + PERSISTED/SIDE-EFFECTED + RELOAD-SAFE + TESTED |
| Maintenance things | create/edit/delete, supported boolean state change, history | REAL + WIRED + AUTHORIZED + PERSISTED/SIDE-EFFECTED + RELOAD-SAFE + TESTED |
| Settings profile/security | profile/photo, verified email change, password, MFA, recovery codes, sessions, account deletion | REAL + WIRED + AUTHORIZED + PERSISTED/SIDE-EFFECTED + RELOAD-SAFE + TESTED |
| Settings team | invite/join/leave, circle rename/code, member role/removal, points controls | REAL + WIRED + AUTHORIZED + PERSISTED/SIDE-EFFECTED + RELOAD-SAFE + TESTED |
| Settings preferences | theme, appearance, language/region, side panel, notification/privacy/beta/verbose controls and reset | REAL + WIRED + AUTHORIZED + PERSISTED/SIDE-EFFECTED + RELOAD-SAFE + TESTED |
| Settings billing/integrations | checkout/cancel, invoice history, webhook save/clear, API token lifecycle, API docs/legal links | REAL + WIRED + AUTHORIZED + PERSISTED/SIDE-EFFECTED + RELOAD-SAFE + TESTED |
| Settings data/advanced | authenticated user-data export, settings restore, local-cache clear, diagnostics copy | REAL + WIRED + AUTHORIZED + PERSISTED/SIDE-EFFECTED + RELOAD-SAFE + TESTED |
| Auth/onboarding/email verification | sign-in, sign-up, reset request, MFA, verified email link confirmation | REAL + WIRED + AUTHORIZED + PERSISTED/SIDE-EFFECTED + RELOAD-SAFE + TESTED |
| Offline/unavailable/error | retry probes/refetches, reload/home navigation, report submission, clipboard copy | REAL + WIRED + AUTHORIZED + PERSISTED/SIDE-EFFECTED + RELOAD-SAFE + TESTED |

## Disabled and read-only controls

* Submit/save controls disable only while their awaited mutation is pending or
  while required client input is absent.
* API documentation is disabled only when the server capability states Swagger
  is disabled; no broken URL is emitted.
* Webhook editing is read-only only for the server-reported plan/admin
  entitlement. Integration and legal/billing rows with no link/action are
  factual server capability status, not disabled mutations.
* Thing state shows a toggle only for the server-supported `boolean` type;
  other types have no corresponding state-transition action.
