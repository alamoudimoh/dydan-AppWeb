# Enhancement

Use this file as the source of truth for deferred enhancement work.

## Deferred items

1. **Cloud feedback / bug-report relay**
   - Deploy and configure a DayDan/Taskier-owned relay for production builds.
   - Wire `VITE_FEEDBACK_WEBHOOK_URL` and/or `VITE_ERROR_REPORT_WEBHOOK_URL` to the relay.
   - Avoid exposing raw third-party webhook secrets in the frontend.

2. **Hosted instance detection**
   - Replace/extend the inherited `donetick.com`-specific detection so the official DayDan/Taskier cloud domain is correctly recognized as hosted rather than self-hosted.

3. **Report destination overrides**
   - Decide whether `VITE_TASKIER_APP_REPO_URL` and `VITE_FEEDBACK_ISSUES_URL` should remain configurable overrides or be standardized on the final DayDan-owned destination.

4. **Sidebar reorganization**
   - Revisit sidebar ordering/grouping during the later Polish/Enhancement phase.
   - Do not treat this as current hardening work unless a control becomes functionally inaccessible.

## Instructions for future AI agents

- Do not reread this file if you already have its current contents and no relevant changes were made.
- Do not implement these items unless the user explicitly asks to start Enhancement work.
- Keep this file updated as enhancement decisions are made or completed.
- Report back to me after any work based on this file with what changed, verification performed, commits pushed, and any remaining decisions/blockers.
