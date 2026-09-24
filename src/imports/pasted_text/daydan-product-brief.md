Resume and COMPLETE the original DayDan product brief from the beginning of this Figma Make conversation.

IMPORTANT:
“Resume” does NOT mean continue the most recent typography task, theme task, or bug fix.

The original master brief at the beginning of this conversation is the authoritative product scope.

You already built a substantial portion of DayDan across previous versions. Preserve that work.

Your task now is to:

1. Read the ORIGINAL master DayDan prompt from the beginning of this conversation in full.
2. Inspect the CURRENT implementation and all existing source files.
3. Build a complete requirement-by-requirement gap inventory between:
   A. what the original master prompt required, and
   B. what currently exists in the implementation.
4. Then IMPLEMENT every missing requirement that can be implemented in this prototype.
5. Do not stop after identifying gaps.
6. Do not stop after fixing a few bugs.
7. Do not return a progress-only response.
8. Continue working until the remaining original product scope is implemented, connected, navigable, and build-clean.

────────────────────────────────
PRESERVE EXISTING WORK
────────────────────────────────

Do NOT redesign completed screens.

Do NOT replace the existing visual system.

Do NOT change the current:
- DayDan visual direction
- Sovereign visual direction
- existing layouts unless necessary to support a missing original requirement
- component sizing
- spacing system
- current working task flows
- current theme behavior
- current persona behavior
- current data model unnecessarily

Keep the typography decisions already made:
- English / Latin UI: Comfortaa in BOTH DayDan and Sovereign
- Arabic UI: Cairo in BOTH themes

Keep the theme-aware semantic member/project/goal/accent color-token implementation already completed.

Preserve all existing working functionality.

This is a COMPLETION pass, not a redesign.

────────────────────────────────
FIRST: AUDIT THE ORIGINAL MASTER BRIEF
────────────────────────────────

Compare the current app against EVERY section of the original DayDan master prompt.

Do not assume that something is complete merely because a similar screen exists.

Verify that the actual user flow, state, permissions, and navigation required by the original prompt are represented.

In particular, verify all of these areas:

- Quest
- Focus
- solo experience
- family experience
- parent/admin experience
- child experience
- Home
- Today
- All Tasks
- task detail
- create/edit/complete task
- Calendar
- Search
- Projects
- Categories
- Filters
- Routines
- Maintenance
- Archived/history
- Family workload
- Reports/insights
- Streaks
- Goals
- Points
- Rewards
- Activities
- Shopping/personal lists
- Shopping/shared household lists
- Profile
- Account
- Household/Circle management
- member roles
- invitations
- Preferences
- Appearance
- Localization
- Notifications
- Storage/Data
- About
- Support
- Feedback/report-a-problem
- error-reporting flow
- empty/first-use states
- loading
- partial loading
- error/retry
- offline
- permission denied
- destructive confirmation
- success/toast states
- desktop behavior
- mobile behavior
- Arabic/RTL proof
- accessibility behavior
- Quest × DayDan
- Focus × DayDan
- Quest × Sovereign
- Focus × Sovereign

────────────────────────────────
KNOWN LIKELY GAPS — VERIFY AND IMPLEMENT
────────────────────────────────

Previous implementation/review work identified several areas that may still be missing or incomplete.

Do NOT blindly assume this list is exhaustive.
Verify it against the original master brief and current implementation.

Explicitly inspect and complete, where missing:

1. Entry / authentication experience
   - sign in / login
   - account entry state
   - appropriate password/recovery entry
   - representative social/auth entry if needed by the product experience
   - do not build a marketing website instead of the application

2. MFA experience
   - representative MFA challenge/modal/screen
   - verification
   - cancel/back/error behavior where appropriate

3. Session recovery
   - expired session / authentication recovery
   - clear way to re-authenticate
   - preserve user understanding of what happened

4. First-use / onboarding
   - new user entry
   - solo-first experience
   - initial preference/view setup only where useful
   - do not force Family onboarding

5. Circle / household lifecycle
   - solo Circle state
   - invite another member
   - pending invitation
   - another ACTIVE member causing Family functionality to become active
   - join/invite acceptance representation
   - household/member management
   - role-aware controls

Remember the core business rule:
A Circle existing does NOT make the user a Family user.

Family state becomes active only when there is at least one OTHER ACTIVE Circle member.

Pending, inactive, or removed members do not count.

6. Notifications
   - user-facing notifications experience if required
   - meaningful notification preferences
   - role/permission awareness
   - do not invent noisy enterprise notification infrastructure

7. Account / security / advanced settings
   - verify the original Settings IA is complete
   - Profile
   - Account/security
   - Preferences
   - Appearance
   - Localization
   - Notifications
   - Household
   - Storage/Data where appropriate
   - About
   - Support
   - developer/technical settings only where they genuinely belong

8. Support and error recovery
   - representative complete error-report flow
   - retry
   - technical details
   - Show what gets sent
   - copy details/report
   - success result

9. Landing/public/entry states
   - create only what is necessary to make the COMPLETE PRODUCT EXPERIENCE coherent
   - do not turn DayDan into a marketing-site project
   - application/product experience remains the priority

────────────────────────────────
COMPLETE THE REQUIRED CONNECTED FLOWS
────────────────────────────────

Do not merely create isolated screens.

The final prototype must allow me to navigate these flows coherently:

ADULT / FOCUS

Enter DayDan
→ authenticate/enter app where appropriate
→ Focus Home
→ Today
→ open task
→ edit or complete
→ create task
→ Calendar
→ Project
→ Routine
→ Maintenance
→ Family/Household
→ workload/progress
→ Shopping
→ Settings/Profile/Account
→ Localization/Appearance
→ switch visual theme

CHILD / QUEST

Enter as child/member
→ Quest Home
→ see own responsibilities
→ open responsibility
→ complete it
→ resulting progress updates
→ points
→ rewards
→ personal/family goal
→ appropriate activity
→ no parent/admin controls

SOLO

Enter as solo user
→ no false Family navigation/data
→ personal tasks
→ projects/routines
→ personal goals/progress
→ personal shopping
→ Settings complete
→ clear optional path to invite another member

HOUSEHOLD ACTIVATION

Solo user
→ invite another person
→ pending invitation still remains Solo
→ other member becomes Active
→ Family functionality becomes available appropriately

SHOPPING

Shopping
→ open personal/shared list as applicable
→ add item
→ check/uncheck
→ edit
→ remove
→ clear completed

SETTINGS

Settings
→ understand information architecture
→ Profile
→ Account/security
→ Household if applicable
→ Preferences
→ Appearance
→ Localization
→ Notifications
→ Data/About/Support where applicable

ERROR / SUPPORT

Representative error
→ retry
→ inspect details
→ Show what gets sent
→ copy information
→ report problem
→ confirmation

AUTH / RECOVERY

Sign in
→ MFA where representative
→ success

and

expired/recoverable session
→ explain condition
→ re-authenticate
→ return safely to product

────────────────────────────────
QUEST / FOCUS REQUIREMENTS
────────────────────────────────

Quest and Focus must remain different product lenses over the SAME data.

Do not duplicate underlying data.

Quest:
- motivation
- participation
- progress
- responsibilities
- points/rewards
- goals
- accomplishments

Focus:
- execution
- planning
- prioritization
- management
- workload
- assignments
- household visibility

Do not make Quest childish.

Do not make Focus enterprise SaaS.

────────────────────────────────
ROLE AND PERMISSION REQUIREMENTS
────────────────────────────────

Verify realistic states for:

- solo user
- parent/admin
- adult member
- child/member

A child must not see controls they cannot use.

A solo user must not see fake Family activity, workload, rewards, member management, or shared-list behavior as if other members existed.

A parent/admin should have appropriate management capability.

────────────────────────────────
RESPONSIVE REQUIREMENTS
────────────────────────────────

Do not consider a desktop-only implementation complete.

Verify the connected experience at representative desktop and mobile sizes.

Mobile must be a real interaction model, not a compressed desktop.

Pay particular attention to:
- Quest
- Today
- completing tasks
- creating tasks
- shopping
- Calendar
- rewards/progress
- Activity
- Settings
- authentication/onboarding
- household invitations

────────────────────────────────
RTL / ARABIC
────────────────────────────────

Keep Cairo for Arabic.

Provide sufficient representative Arabic/RTL states to prove:
- layout mirrors correctly
- navigation mirrors correctly
- directional icons behave correctly
- text alignment works
- mixed Arabic/Latin content works
- dialogs/drawers remain coherent
- mobile navigation remains correct

Do not implement RTL as text-align only.

────────────────────────────────
DESIGN CONSISTENCY
────────────────────────────────

Use the existing established component system and semantic tokens.

New missing screens should look as though they were always part of the same product.

Do not introduce:
- a new design language
- a third component system
- random new colors
- random radii
- new typography
- arbitrary spacing
- unrelated navigation patterns

Reuse existing:
- shell
- navigation
- cards
- forms
- buttons
- inputs
- modal/drawer patterns
- task components
- member indicators
- state components
- progress components
- theme variables

────────────────────────────────
REALISTIC SHARED DATA
────────────────────────────────

Continue using one coherent prototype story.

Do not create random disconnected sample data for every new screen.

The same:
- users
- Circle
- tasks
- goals
- rewards
- projects
- routines
- shopping lists
- activities

should make sense across the complete application.

Actions should update the prototype state where appropriate.

────────────────────────────────
TECHNICAL COMPLETION
────────────────────────────────

Before stopping:

- resolve all TypeScript errors
- resolve runtime errors
- ensure every imported screen/component exists
- ensure all navigation destinations work
- ensure dialogs/drawers open and close
- ensure interactive prototype actions work
- ensure theme switching remains correct
- ensure Quest/Focus switching remains correct
- ensure persona switching remains correct
- ensure RTL remains correct
- ensure the build succeeds

Do NOT leave:
- placeholder pages
- “coming soon” pages for original required functionality
- dead navigation items
- disconnected screens
- broken buttons
- TODO-only implementations

────────────────────────────────
TERMINAL COMPLETION RULE
────────────────────────────────

Do not stop after producing an audit or checklist.

The audit is only Step 1.

Immediately implement the missing work.

Continue until the original master DayDan brief has been completed as far as a Figma Make interactive product prototype can reasonably represent it.

Only then respond with:

1. What was missing
2. What you implemented in this completion pass
3. Any requirement from the ORIGINAL prompt that still cannot be represented, with a precise technical reason
4. Confirmation that TypeScript/build/runtime checks are clean
5. Confirmation that the connected Adult, Child, Solo, Household Activation, Shopping, Settings, Error, and Auth/Recovery flows are navigable

Do not treat the most recent small edit as the scope.
Do not merely resume Version 4.
Resume and COMPLETE the ORIGINAL DAYDAN MASTER BRIEF.