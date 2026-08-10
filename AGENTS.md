# Taskier App Verification Policy

- Run `./scripts/verify.sh` before completing substantial frontend changes.
- Never bypass failing required CI; fix regressions before declaring work complete.
- Add regression tests for reasonably testable bug fixes and automated tests for
  new behavior. Use manual browser review only for subjective visual/UX details.
- Repository-wide lint has inherited debt, so CI lints and format-checks changed
  source files while keeping the production build mandatory.
- Commit tests with their feature or fix. Push only after relevant local checks
  pass, then inspect GitHub Actions and resolve failures when access permits.
