# Unified create-system audit (Fix 03)

Audit baseline: `fix/02-page-layout-maintenance-modals` at
`da17d4629997f32fc873edb9e8b541f893fdf54a`.

## Content creation flows found and migrated

| Entity                          | Previous interaction      | Fix 03 interaction                                             | Persistence contract                                    |
| ------------------------------- | ------------------------- | -------------------------------------------------------------- | ------------------------------------------------------- |
| Task                            | Dedicated task popup      | Universal + or task context → canonical `CreateEntityModal`    | Existing chore create API                               |
| Project                         | Inline page card          | Universal + or Projects action → canonical `CreateEntityModal` | Existing project API                                    |
| Routine                         | Inline page card          | Universal + or Routines action → canonical `CreateEntityModal` | Existing routine-pack/item APIs                         |
| Asset                           | Feature-local `FormModal` | Universal + or Assets action → canonical `CreateEntityModal`   | Existing maintenance asset API                          |
| Meter                           | Feature-local `FormModal` | Assets / Meters action → canonical `CreateEntityModal`         | Existing meter API                                      |
| Tracker (legacy internal Thing) | Feature-local `FormModal` | Assets / Trackers action → canonical `CreateEntityModal`       | Existing thing API (identifier intentionally preserved) |
| Shopping List                   | Inline Shopping card      | Universal + or Shopping action → canonical `CreateEntityModal` | Existing shopping-list API                              |
| Shopping Item                   | Permanently inline input  | Open-list New Item action → canonical `CreateEntityModal`      | Existing list-item API with required list context       |
| Goal                            | Inline page card          | Goals action → canonical `CreateEntityModal`                   | Existing goal API                                       |
| Reward                          | Inline page card          | Rewards action → canonical `CreateEntityModal`                 | Existing reward API                                     |
| Category                        | Inline Settings editor    | Settings action → canonical `CreateEntityModal`                | Existing category API                                   |

Edit flows for Task, Project, Routine, Goal, and Reward also use the same
entity configuration and shell. Existing category editing stays in its compact
Settings row because it is an edit rather than a creation action.

## Creation-like flows intentionally outside this content system

- Account/household registration is an authentication/onboarding journey, not
  an in-app entity creation action.
- Personal access tokens, recovery codes, invites, and generated dydan codes
  are security/administration operations inside existing Settings dialogs, not
  top-level content entities.
- Meter readings, links, task completion, reward requests, and state toggles
  are actions on existing entities, not creation entry points.

## Shared architecture

- `FormModal`: one canonical frame and interaction contract.
- `CreateEntityModal`: shared draft, validation, loading, error, persistence,
  and close controller.
- `CreateEntityType` / `CreateEntityConfig`: centralized entity registry.
- `CreateSelector`: the compact universal + menu; only Task, Project, Routine,
  Asset, and Shopping List are top-level choices.
- `entityConfigs.tsx`: field content and existing mutation wiring. No screen
  owns create-modal geometry or footer/header layout.
