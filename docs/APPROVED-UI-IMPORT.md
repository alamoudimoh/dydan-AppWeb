# Approved UI source import

The complete `Dydan-ApprovedUI` `Develop` snapshot (`1e29d81c87a0a6e3371f58302cf79865cfb16e9e`) is copied without modifying its source to `design-source/approved-ui/`. This is the authoritative approved visual reference. The older `design-source/figma-make/` is not the current approved source.

Run from the AppWeb repository root:

```bash
npm install
npm run approved:dev
```

The standalone, unmodified approved UI is available on port **2925**, bound to `0.0.0.0`. `npm run approved:build` builds this source separately. This preview runs the UI's original fixture/mock data; it is **not yet** AppWeb's live backend-wired application. The existing AppWeb default dev/build, authentication, API integration, and production release remain unchanged until the replacement UI is connected and verified. Do not mistake a complete source copy for a completed application integration.
