import { test } from '@playwright/test'

import { defineRouteSmokeTests } from './helpers/smokeRunner.js'
import { BROWSER_SMOKE_PAGES } from './smoke.manifest.js'

defineRouteSmokeTests(test, BROWSER_SMOKE_PAGES)
