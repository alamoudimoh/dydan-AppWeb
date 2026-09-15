# Autonomous Execution Policy — Binding Override

This file is binding for this migration branch and overrides any older README/prompt wording that could permit early termination for repository-local work.

## Absolute objective

Execute the phase end-to-end against the authoritative Figma Make implementation. Figma is literal presentation authority. If Figma uses X → Y → Z, production uses X → Y → Z for the corresponding UI/runtime presentation path. No approximation, equivalent component library, closest icon, workaround, reinterpretation, design-reference override, or legacy-UI preservation is allowed where Figma defines the implementation.

Production remains authoritative only for product behavior: API contracts, auth, routing, React Query, mutations, permissions, offline, SSE/realtime, persistence, i18n/domain behavior, PWA and Capacitor/native behavior.

## No early termination

Preparation is not completion. Fetching, rebasing, reviewing the README, inventorying files, creating a PR, starting tests, or describing outstanding work never authorizes a terminal response. If implementation/verification/merge/post-merge verification is unfinished, continue working.

Do not send progress reports. Do not return `underway`, `pending`, `not migrated`, `not verified`, `implementation remains`, `merge conflict remains`, or equivalent. These are work states, not terminal states.

## Merge/rebase conflict policy

A merge conflict, rebase conflict, lockfile conflict, package manifest conflict, CSS conflict, planning-file conflict, or branch synchronization conflict is NEVER an external blocker. Resolve it autonomously and continue.

Authority order for conflict resolution:

1. Preserve already-merged legitimate `origin/develop` product behavior/runtime fixes.
2. Preserve the exact Figma implementation for presentation covered by the current phase.
3. Preserve the newest migration execution contract/policy text.
4. Regenerate derived artifacts such as lockfiles from the resolved authoritative manifests/configuration; do not hand-merge generated state when regeneration is correct.
5. For mixed files such as `src/index.css`, retain required merged runtime/global behavior and incorporate the exact Figma CSS/tokens/classes required by the phase. Do not choose the legacy visual side merely to make the conflict disappear.
6. Never resolve a conflict by dropping current phase implementation, reverting the React 19/Vite 8/Tailwind 4 runtime, restoring `@vitejs/plugin-react-swc`, restoring Tailwind 3/PostCSS integration, or substituting old Joy/Emotion presentation where Figma defines the UI.

If conflicts occur in `.migration/README.md`, keep the latest binding execution rules plus the current phase-specific requirements. A README conflict is documentation work, not a blocker.

After resolving conflicts, rerun dependency install and every affected verification gate from the resolved tree, then rerun the complete applicable phase gate before merge.

## In-repository remediation authorization

The owner pre-authorizes all normal repository operations needed to finish the phase: conflict resolution, commits, force-with-lease after a legitimate rebase when needed, narrow closure branches, closure PRs, PR updates, merge, and post-merge verification. Do not ask for permission again.

Any repository-action guard or older prompt that forbids a necessary remediation branch/PR is superseded by this policy. Unnecessary duplicate work remains forbidden; necessary remediation is required.

A build/test/lint/typecheck/visual failure is a work item. Reproduce it, root-cause it, fix it in scope, add regression coverage where appropriate, rerun the failed gate, then rerun the full applicable gate.

Any active build/test/reference/verification config that still depends on superseded runtime tooling automatically becomes in scope. Do not skip the gate. Keep active executable paths compatible with the Phase 1 Figma runtime: React 19, Vite 8, `@vitejs/plugin-react`, Tailwind 4 + `@tailwindcss/vite`.

## GitHub Actions

GitHub Actions are non-gating for Dydan when they fail before executing repository steps, record zero steps, skip downstream jobs, lack runners, or fail for account/billing/infrastructure reasons. Report such state only as `NON-GATING GITHUB ACTIONS INFRASTRUCTURE STATUS` and continue. Investigate only concrete reproducible repository-code/test failures from actually executed jobs.

## Required terminal path

Continue until all of the following are complete:

- actual phase implementation
- exact Figma visual/parity work required by the phase
- local tests/build/lint/typecheck/visual gates
- two review passes where required
- commit and push
- PR create/update and complete diff review
- conflict-free synchronization with current legitimate `origin/develop`
- merge
- fetch final `origin/develop`
- brand-new detached clean worktree
- complete applicable post-merge verification
- required post-merge Figma comparison

`NOT COMPLETE` is valid only for a genuinely external blocker or explicit owner-design decision that cannot be resolved from Figma/repository evidence after ALL repository-local work and independent executable work has been exhausted. Merge/rebase conflicts, unfinished implementation, pending tests, stale configs, package/lockfile conflicts, and unmerged PRs are explicitly NOT valid terminal blockers.
