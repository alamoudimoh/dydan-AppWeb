import { test } from '@playwright/test'

import { defineRouteSmokeTests } from './helpers/smokeRunner.js'
import { BROWSER_SMOKE_PAGES } from './smoke.manifest.js'

// Original 10 critical routes, run on Chromium, Firefox, and WebKit through
// the shared critical-route manifest and the same runtime error guard as the
// full Chromium suite.
defineRouteSmokeTests(test, BROWSER_SMOKE_PAGES)
