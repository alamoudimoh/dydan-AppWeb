# Dydan Mobile Identity Remediation Closure

- Repository: `alamoudimoh/daydan-app`
- Remediation branch: `fix/dydan-identity-mobile`
- Base: `origin/develop` at `f4c536461d3341e612302d0685815446704bae75`
- Closure date: 2026-09-15

## Decision Basis

The product owner confirmed that no released app, store listing, Firebase/OAuth registration, hosted Dydan domain, signing identity, RevenueCat entitlement, or user data requires compatibility. This remediation therefore establishes Dydan as the only active product identity and removes unprovisioned hosted-domain/App-Link configuration rather than inventing external endpoints.

## Completed Remediation

- Rebranded active UI, PWA, native resources, release metadata, and design sources to `Dydan`; Arabic display branding uses `دَيْدَن`.
- Set Capacitor/Android identifiers and Java/test package paths to `com.dydan.app`; renamed the iOS widget target and App Group identifiers to Dydan.
- Set the custom URI scheme and Android notification channel to `dydan` and `dydan_notifications`.
- Removed legacy storage/database/channel migration behavior because no user data exists to migrate.
- Removed unprovisioned App Links, Apple associated domains, and assumed `dydan.com` redirects. Hosted-domain detection now requires explicit build-time configuration.
- Retained `alamoudimoh/daydan-app` only as the current GitHub repository locator.

## Verification

- `./scripts/verify.sh`: passed: changed-file lint, 181 node tests, 146 UI tests, and production build.
- `npx cap sync`: passed: Android and iOS Capacitor assets now report `com.dydan.app` and `Dydan`.
- `./gradlew test`: blocked by this machine's missing Android SDK (`ANDROID_HOME` or `android/local.properties`); it did not reach compilation or tests.
- Tracked-content scan found only the intentional `alamoudimoh/daydan-app` GitHub locator; the legacy-identity path scan is empty.
- `git diff --check`: passed.

## Follow-up

- Before provisioning a hosted Dydan service, set `VITE_DYDAN_HOSTED_DOMAIN` and `VITE_DYDAN_MARKETING_HOST`, then configure Android/iOS association assets, App Links, OAuth, Firebase, signing, and store identities together.
