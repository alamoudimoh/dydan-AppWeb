# DayDan-AppWeb

DayDan-AppWeb is the DayDan web application and native mobile client. It
provides the responsive household experience for DayDan tasks, chores,
projects, routines, shopping lists, maintenance, meters, rewards, history,
notifications, and shared circles.

DayDan is a self-hostable task and household coordination product. This
repository contains the client; the API, persistence, authentication, realtime
events, notifications, integrations, and deployment image are maintained in
[DayDan-Server](https://github.com/alamoudimoh/DayDan-Server).

DayDan originated from the open-source Donetick project and has since evolved
as an independently developed DayDan product.

## Product capabilities

- Personal and shared circles with members, invitations, assignments, managed
  child accounts, permissions, and household progress.
- Tasks and chores with recurrence, priorities, labels, projects, subtasks,
  timers, history, attachments, Things, meters, routines, maintenance, and
  shopping lists.
- Flexible recurrence and assignment strategies, completion restrictions,
  analytics, points, rewards, and progress tracking.
- REST API access, realtime synchronization, Home Assistant integration,
  Telegram/Pushover/Discord notification targets, and webhook-driven
  automation through DayDan-Server.
- Home, Today, calendar, activity, history, family progress, rewards, search,
  dashboards, archived work, and notification views.
- Local and push notifications, device registration, task deep links, voice
  capture, document scanning/OCR, NFC capture, and native quick capture.
- Light/dark/system themes, responsive layouts, Arabic RTL support, and
  localized UI bundles.

The client expects a compatible DayDan-Server API. It does not contain the
authoritative task database or authentication service.

## Run the web client

Requirements: Node.js 22 or newer and npm 9 or newer.

```bash
npm ci
npm run dev
```

The Vite development server is exposed on the host. Set
`VITE_APP_API_URL` only when the API is hosted on a different origin; the
default production build uses same-origin `/api` URLs.

Build and preview the production bundle:

```bash
npm run build
npm run preview
```

For a complete self-hosted deployment, use the Docker Compose instructions in
[DayDan-Server](https://github.com/alamoudimoh/DayDan-Server#quick-start).

## Client architecture

The application is a React 19 and Vite SPA. React Router provides lazy-loaded
route modules, TanStack Query manages server-backed cache state, and the
central API client handles requests to DayDan-Server. Server-sent events are
used for optional realtime updates. Authentication, onboarding, network
status, PWA updates, error boundaries, navigation, and native lifecycle events
are coordinated by the application shell.

The same codebase is wrapped with Capacitor 8 for Android and iOS. Native
capabilities include secure credential storage, SQLite-backed offline caching
and queued synchronization, push/local notifications, speech recognition,
NFC, document scanning, OCR, sharing, status-bar integration, social login,
and in-app purchases.

Native widgets expose bounded snapshots of actionable tasks and household
members. They are not full task clients: snapshots are limited in size and
time window, and widget data is cleared on logout.

More detail is in:

- [Client architecture and security](docs/architecture.md)
- [Development and verification](docs/development.md)
- [Mobile and native integrations](docs/mobile.md)
- [Product implementation evidence](https://github.com/alamoudimoh/DayDan-Server/blob/develop/docs/product-implementation-review.md)

## Verification

Useful checks for client changes:

```bash
npm run typecheck
npm run lint
npm test
npm run test:smoke
npm run test:smoke:cross-browser
npm run test:visual
```

`npm test` runs the Node test suite and the targeted Vitest UI suite.
Playwright covers Chromium, cross-browser, visual, Arabic, and fixture-backed
production route scenarios. The repository's `scripts/verify.sh` combines the required local gates. Local
verification in a clean worktree is the authoritative merge gate. GitHub
Actions may execute these checks when infrastructure permits, but is
informational and non-gating; infrastructure/account failures with zero
repository steps do not replace investigation of real local test or build
failures.

## Contributing

Use a focused branch, keep changes scoped to the client, run the relevant
verification gates, and open a pull request against `develop`. Changes that
depend on API behavior should be coordinated with
[DayDan-Server](https://github.com/alamoudimoh/DayDan-Server).

## License

DayDan-AppWeb is licensed under the AGPLv3. See [LICENSE.md](LICENSE.md).
