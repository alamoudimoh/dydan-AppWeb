# DayDan-AppWeb development

## Requirements

- Node.js 22 or newer
- npm 9 or newer
- A running compatible DayDan-Server for end-to-end behavior
- Android Studio/Xcode only when building native applications

Install dependencies and start the client:

```bash
npm ci
npm run dev
```

The default API base is same-origin `/api`. Use `VITE_APP_API_URL` for a
different API origin during development or a special deployment.

## Checks

```bash
npm run typecheck
npm run lint
npm test
npm run test:smoke
npm run test:smoke:cross-browser
npm run test:visual
```

The unit/component layer uses Node's test runner and Vitest. Playwright covers
production route fixtures, Chromium smoke, Firefox/WebKit critical paths,
visual snapshots, Arabic/RTL behavior, and the alternate Sovereign theme.
Complete local verification in a clean worktree is the authoritative merge
gate. GitHub Actions may run the same checks when runners and account
infrastructure are available, but its status is informational rather than a
required merge gate. A workflow that fails before executing repository steps
because of billing, runner, or account infrastructure is not a repository-code
failure; concrete test, lint, build, or typecheck failures remain actionable.

## Native builds

Build and synchronize Capacitor projects:

```bash
npm run android
npx cap sync ios
```

Android and iOS signing, store uploads, and the supported release lanes are
documented in [AUTOMATED_RELEASE.md](../AUTOMATED_RELEASE.md). That document
contains operational names for existing signing and secret records; those
names are not current product branding and must match the active release
scripts.

## Working with the API

Use the paired repositories when changing a client/server contract. The
backend's API and deployment documentation lives in
[DayDan-Server](https://github.com/alamoudimoh/DayDan-Server), including the
Docker Compose development path and generated API reference.
