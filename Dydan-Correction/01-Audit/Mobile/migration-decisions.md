# Mobile Migration Decisions

## Scope

All active client, Capacitor, Android, iOS, widget, release, localization, test, and tracked generated-input identities move to Dydan in this branch.

## Owner Decisions Applied

| Area | Decision |
| --- | --- |
| Installed users and persisted data | None exist; no storage, database, channel, or widget compatibility path is required. |
| Android and iOS identity | Rename to `com.dydan.app` and matching Dydan widget/App Group identities. |
| Deep links | Use `dydan://` only. |
| Hosted domains and App Links | No Dydan domain is provisioned; remove host-specific routes and association assets. |
| Firebase, OAuth, signing, stores, RevenueCat | No production identities exist; do not invent new external configuration. |
| GitHub locator | Preserve `alamoudimoh/daydan-app` until its owner renames the remote. |

## Implementation Rules

- `Dydan` is the English display identity; `دَيْدَن` is used in Arabic display copy.
- `dydan` and `DYDAN` are the technical product forms.
- A hosted deployment must provide its domain explicitly through build configuration. It must add App Links, universal links, OAuth, Firebase, signing, and store registration only after those external resources are provisioned.

## Residual Risk

No released client or external integration is in scope. Future provisioning must treat the external configuration listed above as a single coordinated launch, not as a source-only rename.
