import { test } from '@playwright/test'

import { defineRouteSmokeTests } from './helpers/smokeRunner.js'
import { groupPagesFor } from './smoke.manifest.js'

defineRouteSmokeTests(test, groupPagesFor('public'))
