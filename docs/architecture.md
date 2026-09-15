# Dydan-AppWeb architecture

## Runtime layers

Dydan-AppWeb is a React 19/Vite application that runs as a browser SPA, a
PWA, and a Capacitor Android/iOS application. `src/App.jsx` provides the shared
application shell: authentication restoration, onboarding gates, network
status, PWA updates, error boundaries, navigation, server-sent-event setup,
and native lifecycle handling.

Route modules are defined in `src/contexts/RouterContext.jsx` and loaded
lazily. The client is organized around product surfaces rather than a single
screen: home and Today, tasks and calendar, circles, projects, routines,
shopping, maintenance, meters, family progress, rewards, history, activity,
settings, notifications, search, and authentication.

## Data and API flow

`src/utils/ApiClient.js` and `src/utils/Fetcher.jsx` centralize API access.
TanStack Query supplies cache and invalidation behavior through
`src/queries/` and `src/contexts/QueryContext.jsx`. The client is a consumer
of Dydan-Server; server-side authorization and persistence remain authoritative.

Realtime updates use authenticated server-sent events through `src/hooks/useSSE.js`
and `src/contexts/SSEContext.jsx`. Reconnect and network transitions are
handled explicitly so the UI can distinguish offline state from an expired
session.

## Authentication and storage

Browser access tokens are kept in module memory. Browser refresh credentials
are intended to remain in an HttpOnly cookie. Native refresh credentials use
Capacitor secure storage, with migration and cleanup for older local-storage
and Preferences keys in `src/utils/NativeCredentialStorage.js` and
`src/utils/storageMigration.js`.

Native offline support uses Capacitor SQLite through `src/utils/OfflineDB.js`.
`src/utils/SyncEngine.js` maintains cached work and a command queue for
reconnection. The browser/PWA does not use the native SQLite database.

## UX system

Dydan uses a shared theme and token system in `src/theme/`, with light, dark,
and system modes. Localization is provided by i18next and HTTP-loaded locale
bundles. `src/contexts/LocalizationContext.jsx` sets language and direction;
Arabic is treated as a real RTL layout, not only a translated string set.

The current UX direction is represented by the Figma-derived production
surfaces and shared primitives. `design-reference/` is an isolated reference
application; it is not the production runtime or API.
