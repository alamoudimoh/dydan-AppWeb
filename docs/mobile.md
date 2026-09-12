# DayDan mobile and device integrations

DayDan-AppWeb uses Capacitor for Android and iOS packaging. Native plugins
provide secure storage, SQLite, notifications, speech recognition, NFC,
document scanning, OCR, sharing, status-bar behavior, social login, and
subscription purchases.

## Offline behavior

Native builds cache supported task data in Capacitor SQLite and queue commands
through `src/utils/SyncEngine.js`. Reconnection processing is explicit and the
web/PWA build does not provide the same native SQLite store. Offline behavior
therefore depends on platform and the data operation being supported by the
sync engine.

## Widgets and quick capture

Android and iOS widgets use a bounded native snapshot produced by
`src/service/WidgetService.js`. The snapshot includes actionable tasks in a
limited window and a limited member list. Widget taps deep-link to the app;
quick capture enters the normal task flow. Logout clears widget data because
native snapshots may contain task and account context.

## Deep links and notifications

The native shells handle OAuth callbacks, circle invitations, chore links,
widget actions, and notification taps. Android declares the supported app-link
and NFC routes; iOS receives equivalent lifecycle events through Capacitor.
Push and local notification registration is coordinated with the server device
API, while the in-app notification center remains a normal client route.

## Current boundaries

Local AI and some capture capabilities are platform-dependent. Browser builds
cannot provide native SQLite, native widget refresh, NFC, or device speech
features. Native snapshots are intentionally bounded and are not a complete
replacement for the application.
