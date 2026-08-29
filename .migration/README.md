# Phase 2 — Figma Foundation + Shell

Branch: `migration/figma-p02-foundation-shell`

## Binding authority

This file is the complete execution contract for Phase 2. No other policy file is required. If another planning file, prior prompt, repository guard, or stale instruction conflicts with this file, this file controls Phase 2 execution.

When the owner says `Execute Phase 2`, the executing agent must work autonomously to terminal completion. It must not stop merely because implementation remains, a merge/rebase conflict exists, tests fail, verification is pending, a PR is open, a lockfile changed, or a repository configuration is stale. Those are in-repository work items and must be resolved.

`NOT COMPLETE` is valid only for a genuinely external blocker that cannot be resolved through repository changes, normal Git/PR operations, available tooling, or authoritative Figma/repository evidence after all independent executable work is exhausted.

## Authoritative Figma source

Presentation authority is the actual Figma Make source:

- `design-source/figma-make/`
- planning-time dedicated source baseline: `DayDanProductExperience` commit `7131b76979e49351db8ecbc33db6648a75139572`

Read the current imported source before implementation. For every Figma-defined presentation element, Figma wins over current production, `design-reference/`, MUI Joy, historical DayDan UI, agent preference, or an equivalent implementation.

If Figma implements X → Y → Z, production must implement X → Y → Z for that presentation path.

Use the actual Figma DOM/component structure, Tailwind classes, CSS, SVG/icon paths, tokens, dimensions, spacing, typography, borders, radii, shadows, responsive behavior, mobile behavior, dark behavior, and RTL behavior where present.

Forbidden: reinterpretation, approximation, Joy equivalents, `sx` translations, substitute icon libraries, substitute spacing systems, alternate breakpoints, “production-friendly” visual rewrites, or design-reference overrides.

## Production behavior authority

Current merged production remains authoritative for behavior only:

- authentication and authorization
- routing and route guards
- API contracts
- React Query and mutations
- SSE/realtime
- offline/PWA
- persistence
- notifications and permissions
- i18n content
- Capacitor/native behavior
- DayDan/Sovereign product behavior

Required model: **actual Figma presentation + real DayDan behavior**.

## Phase 1 runtime invariant

Preserve the merged Phase 1 runtime:

- React 19
- React DOM 19
- Vite 8
- `@vitejs/plugin-react`
- Tailwind CSS 4
- `@tailwindcss/vite`

No active executable build/test/reference/config path may regress to React 18 assumptions, `@vitejs/plugin-react-swc`, Tailwind 3, obsolete PostCSS/Tailwind integration, or a substituted runtime.

If repository verification executes a stale config, fix that config. `design-reference/` is not visual authority, but its executable build/test tooling must remain compatible if repository verification invokes it.

## Safety and isolation

1. `git fetch --all --prune`.
2. Record current `origin/develop` and the dirty primary checkout state.
3. Never reset, stash, clean, switch, stage, or modify the dirty primary checkout.
4. Use isolated worktrees under `/tmp/opencode`.
5. Do not modify `daydan-server`.
6. Verify Phase 1 is merged before proceeding.

## Mandatory conflict-resolution policy

A merge/rebase conflict is **never a terminal blocker** in Phase 2. If the branch or PR conflicts with current `origin/develop`, resolve the conflict immediately and continue.

Resolution authority is deterministic:

1. **Business/runtime/auth/API/query/native behavior:** preserve the latest legitimate `origin/develop` behavior unless Phase 2 explicitly changes presentation wiring.
2. **Figma-covered presentation:** preserve/restore the exact Figma implementation required by this phase.
3. **React/Vite/Tailwind runtime:** preserve the merged Phase 1 runtime invariant above.
4. **`.migration/README.md`:** preserve this current Phase 2 execution contract; do not revert to an older planning version.
5. **`package.json`:** combine legitimate current-develop dependency/script changes with Phase 2 requirements without regressing Phase 1 runtime.
6. **`package-lock.json`:** never hand-merge semantic dependency state blindly. Resolve `package.json` first, then regenerate the lockfile with the repository’s canonical npm install workflow and verify the resulting dependency graph.
7. **`src/index.css`:** retain legitimate current runtime/global requirements, but for Figma foundation/tokens/shell presentation the exact Figma source wins. Remove conflict markers and reconcile deliberately; never choose one entire side merely for convenience.

After conflict resolution:

- scan for `<<<<<<<`, `=======`, `>>>>>>>` repository-wide in tracked files
- inspect the complete resolved diff
- rerun affected tests/builds
- rerun the complete applicable verification before merge

Do not return `NOT COMPLETE` because conflicts remain. Resolve them.

## Closure PR authorization

The owner explicitly pre-authorizes creation, push, review, merge, and post-merge verification of any narrowly scoped closure branch/PR needed to fix an in-repository regression discovered before, during, or after Phase 2.

Do not ask for authorization again. A required closure PR is work, not a blocker.

If PR #39 is the active Phase 2 PR, resume and update it rather than creating a duplicate unless Git history technically requires a replacement.

## Figma source files to inspect

At minimum inspect directly:

- `design-source/figma-make/src/App.tsx`
- `design-source/figma-make/src/index.css`
- `design-source/figma-make/src/main.tsx`
- `design-source/figma-make/src/imports/**`
- `design-source/figma-make/package.json`
- `design-source/figma-make/vite.config.ts`

Do not rely on screenshots or prior summaries when source code exists.

## Required implementation

Port the actual Figma foundation and application shell.

Foundation includes every applicable Figma-defined value/pattern:

- global CSS
- Tailwind utilities
- CSS variables/tokens
- colors and backgrounds
- fonts and typography
- font sizes/weights/line heights
- spacing
- borders/radii/shadows
- focus/hover/selected states
- responsive rules
- mobile breakpoint behavior
- dark-mode behavior
- RTL rules

Shell includes every actual Figma-defined shell element, including where present:

- `LogoMark` and logo presentation
- exact SVG/custom `Icon` paths
- Sidebar
- desktop navigation
- active navigation state
- mobile navigation
- top/header composition
- search presentation
- current user/member area
- shell controls
- persona/focus/quest presentation
- page chrome/content offsets
- sidebar dimensions
- responsive/mobile transformation

Do not substitute MUI/Material icons when Figma provides icon paths/assets.

Legacy Joy/Emotion may remain only inside genuinely unmigrated route content. It must not implement the migrated shell/foundation.

Allowed temporary boundary:

`Figma Tailwind shell -> legacy unmigrated route content`

Forbidden:

`Joy shell styled to resemble Figma`.

## DayDan / Sovereign

Reproduce DayDan Figma presentation exactly first. Preserve Sovereign’s legitimate brand/functionality boundary without contaminating DayDan Figma geometry, colors, spacing, or composition.

## Arabic / RTL

Preserve real production translations. Use exact Figma RTL behavior where provided. Where the Figma source lacks explicit RTL treatment, apply only the minimum directional adaptation required for correct RTL while preserving the same Figma visual hierarchy/composition.

Verify desktop and mobile RTL, navigation direction, search layout, text alignment, directional icons, Cairo usage where applicable, safe areas, and absence of horizontal overflow.

## Visual acceptance

Run the actual Figma Make source as the reference application and production separately using the same browser engine.

Do not use `design-reference/` as the visual oracle.

Minimum comparison viewports:

- 1440×900
- 390×844
- inspect actual breakpoint behavior around 768px

Required DayDan states:

- light LTR
- dark LTR
- light Arabic RTL
- dark Arabic RTL
- any Figma-defined focus/quest/persona shell variant that changes shell presentation

Compare exact shell geometry, sidebar, header, navigation, search, logo, icon paths/sizes, typography, spacing, colors, borders, radii, shadows, selected states, responsive behavior, and density.

“Looks similar”, “responsive”, “no overflow”, and “tests pass” are not visual parity.

Fix concrete visual differences before completion.

## Product behavior verification

The new shell must preserve real routing, route guards, auth/logout, deep links, navigation, current member/user state, theme persistence, locale/direction persistence, search invocation where capability exists, notifications, offline/SSE state, PWA behavior, and Capacitor/native behavior.

## Tests and verification

Add focused tests for the migrated shell as appropriate, including routing, active navigation, mobile navigation, theme switching, RTL, shell ownership, and migrated interactive controls.

Run the complete applicable local gate from a clean isolated worktree. At minimum attempt the repository’s current canonical equivalents of:

- `npm ci`
- `npm run typecheck`
- `npm test`
- production build
- DayDan build
- Sovereign build
- smoke tests
- Sovereign smoke
- visual tests
- reference tests/build if still part of repository verification
- lint
- formatter check
- `bash scripts/verify.sh`
- applicable Capacitor sync/compatibility verification

If a named historical command no longer exists, locate and run the current canonical equivalent. Do not skip validation merely because a stale executable config fails; repair the config and continue.

A failed test/build/lint/typecheck/visual comparison is a work item. Reproduce it, determine root cause, fix the smallest in-scope cause, add regression coverage where appropriate, rerun the affected gate, then rerun the complete applicable gate.

## GitHub Actions

GitHub Actions are not an authoritative merge gate for this project when they fail before executing repository steps, record zero steps, skip downstream jobs, or fail for runner/account/infrastructure reasons. Record that as `NON-GATING GITHUB ACTIONS INFRASTRUCTURE STATUS` and continue.

If Actions actually executes repository code and exposes a concrete reproducible defect, fix the defect normally.

## Mandatory delivery

Do not stop after preparation, implementation, conflict resolution, local testing, or PR creation.

Complete all of the following:

1. synchronize Phase 2 with current legitimate `origin/develop`
2. resolve all conflicts
3. finish the exact Figma foundation/shell implementation
4. pass local verification
5. pass Figma visual acceptance
6. complete two review passes: Figma fidelity and product integrity
7. commit and push
8. resume/create the Phase 2 PR
9. inspect the entire PR diff
10. merge when authoritative local gates are green
11. fetch final `origin/develop`
12. create a brand-new detached clean worktree from the merged SHA
13. rerun complete applicable post-merge verification
14. rerun critical Figma-vs-production shell comparisons from the merged SHA
15. confirm the detached worktree is clean
16. confirm the dirty primary checkout is unchanged
17. confirm `daydan-server` is unchanged

## No-progress-response rule

Do not send an intermediate response such as:

- `merge conflict remains`
- `implementation is outstanding`
- `verification remains`
- `PR created but not merged`
- `not yet complete`
- `work is underway`

If any of those statements are true, continue working instead of responding.

## Terminal response

Return exactly one terminal report.

Success status:

`PHASE 2 COMPLETE`

Include branch SHA, PR URL, merge SHA, final `origin/develop`, Figma source-to-production mapping, exact reuse evidence, test/build results, visual parity matrix, Arabic/RTL result, Sovereign result, Capacitor result, primary-checkout isolation, and server isolation.

Failure status:

`NOT COMPLETE`

is permitted only for a genuinely external blocker after all in-repository remediation and all independent executable work has been exhausted. A merge/rebase conflict, pending implementation, failed repository test, stale config, unmerged PR, or pending post-merge verification is never such a blocker.

Do not start Phase 3.