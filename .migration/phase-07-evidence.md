# Phase 7 Execution Evidence

## Authority

The reviewed Figma Make source (`design-source/figma-make/src/App.tsx` and
`index.css`) has no auth, marketing, onboarding, legal, invitation, payment,
or notification screen. Its reusable authority is limited to the shared token,
card, input, button, and shell primitives.

## A/B/C Inventory

| Classification | Routes and source evidence                                                                                                                                                                              | Execution                                                                                                                                                                                                                                                                                                                   |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A              | `/login`, `/signup`, `/forgot-password`, `/password/update`, `/auth/:provider`, `/login/settings`; `views/Authorization/{AuthShell,AuthFields,AuthorizationContainer,LoginSettings,Authenticating}.jsx` | Replaced the shared auth shell, card, input, button, divider, progress, alert, password toggle, and server-settings status presentation with compositions of the copied Figma primitives and tokens. Authentication, MFA, reset, PKCE/social login, native-server switching, and return-path behavior remain product-owned. |
| A              | `/payments/success`, `/payments/cancel`; `views/Payments/*`                                                                                                                                             | Replaced Joy payment status presentation with the shared Figma page/card/type primitives. Redirect destinations and five-second timing are unchanged.                                                                                                                                                                       |
| B              | Existing shared shell routes `/privacy`, `/terms`                                                                                                                                                       | No new screen composition was made. These routes retain the Phase 6 shared-shell primitives and legal content; Figma provides no legal layout to copy beyond those primitives.                                                                                                                                              |
| C              | `/welcome`; `views/Landing/**`, `MarketingApp.jsx`, cookie consent                                                                                                                                      | No authoritative public marketing or consent layout exists. Required decision: approved desktop/mobile marketing hierarchy and consent surface.                                                                                                                                                                             |
| C              | `/onboarding`, `/get-started`, `/ready`, `/circle-setup`, `/heard-about`; `views/Onboarding/**`                                                                                                         | No onboarding flow or vignette design exists. Required decision: journey, illustrations, progress treatment, and permission-prompt hierarchy.                                                                                                                                                                               |
| C              | `circle/join`; `views/Circles/JoinCircle.jsx`                                                                                                                                                           | No invite request/approval screen exists. Required decision: invite-state and approval-status composition.                                                                                                                                                                                                                  |
| C              | `/notifications`; `views/Notifications/**`                                                                                                                                                              | No notification inbox screen exists. Required decision: notification list, states, and actions.                                                                                                                                                                                                                             |
| C              | `views/Settings/{DeveloperSettings,APITokenSettings,AdvancedSettings}.jsx`, `components/{RealTimeSettings,SSESettings,SSEConnectionStatus}.jsx`                                                         | No developer, token, realtime, or edge-settings presentation exists. Required decision: information architecture and dangerous-action treatment.                                                                                                                                                                            |
| C              | `components/auth/{RequireAuth,RestorePending}.jsx`, MFA modal boundary                                                                                                                                  | No native/session recovery or MFA modal presentation exists. The product behavior remains intact; required decision: recovery and MFA modal composition.                                                                                                                                                                    |

## Legacy Consumer Audit

The audit command is:

```sh
rg -l "@(mui/(joy|material)|emotion/(react|styled))" src --glob '*.{js,jsx,ts,tsx}' | sort
```

At this commit it reports 204 direct production/test consumers. They include the
active app providers (`contexts/ThemeContext.jsx` and `theme/daydanTheme.js`),
the authenticated shell (`App.jsx`), shared controls/modals, route views,
onboarding and landing surfaces, and their tests. `@mui/joy`, `@mui/material`,
`@emotion/react`, and `@emotion/styled` therefore remain required and were not
removed. The audit is intentionally reproducible from the merged commit rather
than a stale copied file list.

The migrated Phase 7 auth shared primitives no longer consume Joy. `LoginView`
continues to consume Joy for its account-avatar and OAuth-only view composition,
which has no dedicated Figma authority; it is covered by the category C record.

## Verification Record

The phase runs the repository gate from a clean worktree after the implementation
commit. Browser and visual checks cover only A/B surfaces with an authoritative
shared primitive composition; category C routes do not claim screen parity.
