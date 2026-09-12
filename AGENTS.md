# DayDan App Verification Policy

- Run `./scripts/verify.sh` before completing substantial frontend changes.
- Complete local verification in a clean worktree is the authoritative merge
  gate. GitHub Actions may run when infrastructure permits but is
  informational and non-gating; distinguish account/runner failures from real
  repository test, lint, typecheck, or build failures.
- Add regression tests for reasonably testable bug fixes and automated tests for
  new behavior. Use manual browser review only for subjective visual/UX details.
- Repository-wide lint has inherited debt, so CI lints and format-checks changed
  source files while keeping the production build mandatory.
- Commit tests with their feature or fix. Push only after relevant local checks
  pass, then inspect GitHub Actions when available without treating
  infrastructure/account failures as repository failures.
