# DyDan Product Functional Inventory

**Purpose:** Provide a complete functional inventory of the current DyDan product so design work can cover the real product capabilities without inventing, removing, or simplifying functionality.

**Important:** This document defines **product capabilities, behavior, roles, entitlements, states, and functional requirements only**. It does **not** prescribe screen structure, navigation patterns, component hierarchy, layout, interaction model, or visual treatment. Figma/design is free to determine the best UI/UX as long as the capabilities below remain represented and usable.

**Current implementation sources reviewed**
- `DyDan-AppWeb` — production client, `develop`
- `DyDan-Server` — production API/backend, `develop`
- `DyDan-AppWeb-ProductExperience` — current product-experience design reference
- `DyDan-AppMobile-Android` — native Android foundation; the production feature-complete mobile experience currently comes primarily from the shared AppWeb/Capacitor client

---

## 1. Product Context

DyDan is a self-hostable productivity, task, household coordination, routine, maintenance, and shared-responsibility product.

It supports:
- Individual/solo users
- Families and shared circles
- Adults
- Managed child accounts
- Circle members
- Circle managers
- Circle administrators/owners
- Basic/free users
- Plus users
- Web/PWA usage
- Native Android/iOS usage through the production Capacitor client
- Self-hosted deployments

The product combines personal task management with shared household coordination, recurring responsibilities, maintenance, meters, routines, shopping, progress, points, rewards, notifications, realtime synchronization, offline operation, and external integrations.

---

# 2. Access, Role, and Context Model

## 2.1 Authentication states

The product supports:
- Unauthenticated visitor
- Authenticated user
- Expired session
- First-time/new user
- Returning user
- Password-authenticated account
- OAuth/social-authenticated account
- MFA-protected account
- Self-hosted user connecting to a specific DyDan server

## 2.2 Effective user roles

The production client recognizes the following effective roles:
- **Child**
- **Adult**
- **Owner**
- **None / inactive / unresolved**

The circle model also contains operational circle roles:
- **Member**
- **Manager**
- **Admin**

Important current behavior:
- Managed child accounts are treated as **Child**.
- An active circle admin resolves to **Owner**.
- Other active adult circle memberships resolve to **Adult** for the central settings permission model.
- Circle managers have additional behavior in relevant flows, including acting as another user and approval-related actions.
- Circle admins/owners have the highest circle-management authority.

## 2.3 Permission groups

Current explicit permission groups include:
- **Manage Account**
- **Manage Circle**
- **Manage Subaccounts**

Current client permission behavior:
- Adult and Owner can access account-management capabilities.
- Adult and Owner can manage subaccounts.
- Owner/admin has the dedicated circle-management authority used for privileged circle actions.
- Personal privacy and personal preference functionality is not limited only to owners.

## 2.4 Product context

Capabilities may also depend on context rather than only role:
- Solo user
- User with an active family/shared circle
- Basic/free subscription
- Plus subscription
- Web/PWA
- Native mobile
- Online
- Offline
- Self-hosted server configuration

Family-specific areas become relevant when the user has at least one other active member in the circle.

---

# 3. Authentication and Account Access

The product supports:

- Account sign-up
- Password login
- Logout
- Session restoration
- Refresh-token based session renewal
- Session expiry handling
- Authentication loading/processing state
- Forgot-password flow
- Password reset/recovery
- Logged-in password change
- OAuth/provider authentication
- Google authentication support
- Apple authentication support
- SSO/provider identity support
- MFA challenge during login
- MFA setup
- MFA verification
- MFA enablement
- MFA disablement
- MFA manual setup key
- MFA QR setup
- MFA backup codes
- Active session listing
- Revoke individual session
- Revoke other sessions
- Revoke all sessions
- Connected authentication-provider visibility
- Account deletion pre-check
- Account deletion
- Authentication-related error handling
- Session-expired recovery
- Safe sign-out and local authenticated-state cleanup

---

# 4. Self-Hosted Server Connection

DyDan supports self-hosted operation.

Users can:
- View/configure the DyDan server URL
- Test connectivity to a server
- Save and connect to a configured server
- Reset to the default server
- Receive connection-specific error states
- Handle startup/server unavailable conditions
- Handle timeout errors
- Handle DNS/unreachable/refused connection errors
- Handle CORS/server configuration errors
- Clear session/local data when changing server where required

---

# 5. First-Run and Onboarding

The product contains first-run and onboarding capabilities including:

- Welcome/get-started journey
- First-launch onboarding gate
- Basic account/workspace introduction
- User setup
- Circle/household setup
- Join an existing circle
- Join by invite code
- Join by invite link/deep link
- Heard-about-us step
- Workspace-ready completion state
- Transition from onboarding into the main product
- Initial experience selection where applicable
- Solo-start support
- Family/shared-circle start support

---

# 6. Home Experience

DyDan supports multiple home experiences.

Capabilities include:
- Personal home overview
- Focus-oriented home experience
- Quest-oriented home experience
- Child-oriented Quest experience
- Adult experience
- Solo experience
- Family/shared context
- Due-task overview
- Overdue-task overview
- Today task overview
- Upcoming task overview
- Quick task completion
- Task status awareness
- Project context
- Household/member context where relevant
- Points/progress context where relevant
- Persistent user preference for supported experience mode
- Role-aware home behavior

---

# 7. Today

The Today capability includes:
- Tasks relevant to the current day
- Overdue work
- Due-today work
- Upcoming work
- Task status
- Task completion
- Pending approval awareness
- Personal assignment context
- Household assignment context
- Loading state
- Empty state
- Error/retry state
- Offline-aware data behavior

---

# 8. Core Task and Chore Management

Tasks/chores are a primary DyDan domain.

Users can:
- Create a task
- View a task
- Edit a task
- Delete a task
- Archive a task
- Restore/unarchive a task
- Complete a task
- Undo completion
- Skip a task
- Approve a task where approval is required
- Reject a task where approval is required
- Send a nudge related to a task
- Assign a task
- Reassign a task
- Change task priority
- Change due date
- Use task descriptions
- Use rich text in descriptions
- Associate a project
- Associate categories/labels
- Add subtasks
- Complete/update subtasks
- Add attachments
- Remove attachments
- View attachment content
- Use task-specific notification/reminder configuration
- Track creator/owner information
- Track assignees
- Track due/schedule information
- Track completion statistics
- View task history
- Track task states
- Work with approval-required tasks
- Work with pending-approval tasks
- Work with recurring tasks
- Save an existing task into a routine
- Use task-trigger behavior where supported
- Use meter-related schedule/trigger behavior where supported
- Work online or through supported offline queued actions

---

# 9. Task Recurrence and Scheduling

Task recurrence supports flexible scheduling.

Current capabilities include:
- One-time tasks
- Daily recurrence
- Weekly recurrence
- Monthly recurrence
- Yearly recurrence
- Custom recurrence interval
- Recurrence by units
- Selected weekdays
- Day-of-month behavior
- More advanced frequency metadata
- Start date handling
- Due date handling
- Recurring task validation
- Recurrence tied to task/routine behavior
- Trigger-based behavior where supported
- Thing-based triggers
- Meter-related schedule behavior

Some advanced trigger capabilities are subscription-dependent in the current client.

---

# 10. Task Assignment Strategies

The product supports shared assignment models.

Capabilities include:
- Assign to a specific member
- Unassigned/any-member behavior where supported
- Random assignment
- Rotating assignment
- Least-assigned strategy
- Least-completed strategy
- Keep-last-assigned strategy
- Assignment behavior inside routines
- Household member assignment
- Personal assignment
- Role-aware assignment behavior
- Task completion on behalf of another user where authorized

---

# 11. Task Approval and Completion Controls

The product supports approval-oriented task flows.

Capabilities include:
- Completion
- Pending approval
- Approval
- Rejection
- Undo
- Skip
- Completion restrictions
- Approval by authorized circle roles
- Approval by the task owner/creator where applicable
- Manager/admin approval behavior
- Completion history
- Status-specific history
- Pending command awareness for offline/realtime operations

---

# 12. Task Timer and Time Sessions

Tasks can include time tracking.

Capabilities include:
- Start task timer
- Pause task timer
- Active/live session
- Work time
- Break time
- Total tracked time
- Session list
- Session history
- Edit a time session
- Delete a time session
- Reset task timer
- Clear time records
- Activity timeline
- Work-versus-break analysis
- Member attribution for sessions
- Time-related task statistics
- Offline-aware start/pause operations where supported

---

# 13. Task History and Activity Records

The product stores task history.

Capabilities include:
- View task history
- View household/global activity history
- Completion history
- Skip history
- Rejection history
- Pending-approval history
- Rescheduled/missed states where applicable
- Notes on activity/history records
- View note details
- Edit history records where allowed
- Delete history records where allowed
- Member attribution
- Date/time attribution
- Filter activity/history
- Open a task from relevant history/search results

---

# 14. All Tasks and Task Browsing

The All Tasks experience supports:
- Browse all relevant tasks
- Search tasks
- Filter tasks
- Group tasks
- Group by task state/time
- Overdue grouping
- Today grouping
- Tomorrow grouping
- Next-seven-days grouping
- Future/later grouping
- Priority grouping
- No-priority grouping
- Pending-approval grouping
- Project filtering
- Category/label filtering
- Assignee filtering
- Priority filtering
- Due-date filtering
- Custom filters
- Saved filters
- Card view
- Compact/list view
- Multi-select mode
- Bulk actions
- Keyboard shortcuts where supported
- Quick create
- Navigate to calendar
- Navigate to archived tasks

---

# 15. Archived Tasks

Archived work supports:
- View archived tasks
- Search archived tasks
- Filter archived tasks
- Filter by archived date
- Filter by assignee
- Filter by priority
- Filter by labels
- Restore a task
- Restore multiple tasks
- Permanently delete archived task(s)
- Multi-select
- Card/list presentation support
- Empty state
- Error state

---

# 16. Calendar

The calendar domain includes:
- Calendar view
- Month navigation
- Agenda view
- Date-based task visibility
- Upcoming-event visibility
- Task events
- Maintenance events
- Meter-update events
- Category filtering
- Event/system-type filtering
- Multiple agenda ranges
- Today context
- Scheduled item counts
- Direct task creation from calendar context
- Task completion from calendar context where applicable
- Approval-required indicators
- Projected/scheduled status
- Loading/empty/error states

---

# 17. Projects

Project capabilities include:
- List projects
- Create project
- Edit project
- Delete project
- Project descriptions
- Project task counts/context
- Filter tasks by project
- Open tasks belonging to a project
- Create tasks in project context
- Project-aware global search
- Role-aware project behavior

---

# 18. Categories and Labels

DyDan supports organizational metadata.

Capabilities include:
- View categories
- Create category
- Edit category
- Archive category
- Unarchive/reactivate category where supported
- View labels
- Create labels
- Update labels
- Delete labels
- Color/category metadata
- Use categories/labels on tasks
- Filter by categories/labels
- Search labels
- Use categories in reports/progress views

---

# 19. Saved and Custom Filters

Filter management includes:
- Create custom filter
- Edit custom filter
- Delete custom filter
- Save filter
- Pin filter
- Unpin filter
- Retrieve pinned filters
- Retrieve filters by usage
- Open saved filter
- Advanced filter builder
- Combine task filtering dimensions such as assignee, priority, labels, projects, status, and dates

---

# 20. Routines

Routines are reusable recurring responsibility structures.

Capabilities include:
- View routines
- Create routine
- Edit routine
- Activate/deactivate routine
- Add routine item/task
- Edit routine item/task
- Delete routine item/task
- Reorder routine items
- Apply a routine
- Save an existing task as a routine item/template
- Routine name
- Routine description
- Repetition/frequency
- Custom interval
- Weekday configuration
- Monthly schedule configuration
- Assignment strategy
- Assignee/member behavior
- Approval-required behavior
- Points where applicable
- Asset relationship/selection where applicable
- Role-aware editing behavior

---

# 21. Shopping Lists

Shopping capabilities include:
- View shopping lists
- Personal shopping lists
- Family/shared shopping lists
- Create list
- Edit list
- Archive list
- Delete list
- Open list details
- Add item
- Edit item
- Mark item complete
- Delete item
- Clear completed items
- Personal/family scope awareness
- Family navigation/context
- Empty/loading/error states

---

# 22. Maintenance

Maintenance capabilities include:
- Maintenance center
- View maintenance assets
- Create asset
- Edit asset
- Archive/remove asset
- View asset detail
- Asset name
- Asset category
- Asset description
- Maintenance status
- Next due/update information
- Mark maintenance done
- Maintenance history
- Completion attribution
- Reading-related context where applicable
- Link an asset to a meter
- Link an asset to a task/chore
- View linked meters
- View linked tasks
- Update reminder information
- Load/error/retry handling

---

# 23. Meters

Meter capabilities include:
- List meters
- Create meter
- Edit meter
- Meter name
- Unit
- Initial reading
- Current reading
- Add/update reading
- Reading corrections
- Correction notes
- Reading history
- Reminder frequency
- Reminder assignee
- Manual updates
- Complete meter reminder
- Link meter behavior to maintenance/tasks where applicable
- Use meter data in scheduled/triggered task behavior

---

# 24. Things

“Things” are stateful entities that can participate in automation/task behavior.

Capabilities include:
- View Things
- Create Thing
- Edit Thing
- Delete Thing
- Update Thing state
- Toggle/change Thing state
- View Thing history
- Historical values/events
- Trend/history visualization data
- Use a Thing as a task trigger where supported
- Prevent unsafe deletion when associated data prevents removal

---

# 25. Household / Circle

DyDan supports personal and shared circles.

Capabilities include:
- Personal circle
- Shared/family circle
- View circle
- View circle members
- Active/inactive membership state
- Invite code
- Copy invite code
- Share/copy invite link
- Join using a code
- Join using a link
- Pending join requests
- Accept join request
- Leave a circle
- Remove member
- Member role visibility
- Change member role where authorized
- Member role: Member
- Member role: Manager
- Member role: Admin
- Active member count
- Current-user indicator
- Joined date
- Pending-approval date/status
- Circle-aware assignments
- Circle-aware realtime updates
- Circle-aware notifications
- Circle-aware progress
- Circle webhook integration where authorized

---

# 26. Managed Child Accounts

Managed child-account functionality includes:
- Child/managed-account identity
- Create child account
- List child accounts
- Edit/manage child account
- Change child password
- Delete child account
- Child-specific product experience
- Child Quest experience
- Child permission restrictions
- Parent/adult management
- Family membership integration
- Child task assignment
- Child progress/points/reward participation where applicable

Current client code contains subscription checks around managed subaccount functionality.

---

# 27. Acting as Another User / User Switching

Authorized household roles can work in another member’s context.

Capabilities include:
- Switch acting user
- Impersonate another circle member
- Stop impersonation
- Return to own account
- View tasks from selected member context
- Perform supported actions on behalf of another member
- Complete tasks with the effective member attribution
- Manager/admin support for impersonation
- Clear identification that another member context is active

---

# 28. Family Progress and Household Analytics

Family/shared-circle progress includes:
- Workload reporting
- Today workload
- This-week workload
- Next-30-days workload
- Category filtering
- Overdue counts
- Upcoming counts
- Unassigned counts
- Active-task counts
- Work by category
- Completion reporting
- Seven-day reporting
- Thirty-day reporting
- Ninety-day reporting
- Monthly reporting
- Completed task counts
- Current overdue counts
- Points earned
- Points redeemed
- Points available
- Maintenance completion indicators
- Approaching maintenance indicators
- Deterministic insights
- Completion by category
- Completion by member
- Reward activity
- Goal tracking
- Streak tracking
- Role/member-aware progress

---

# 29. Goals

Goal functionality includes:
- List goals
- Create goal
- Update goal
- Goal name
- Goal metric
- Task-completion goals
- Category-completion goals
- Household progress context
- Goal progress data
- Goal state integrated with family progress

---

# 30. Points

Points functionality includes:
- Current points balance
- Points earned
- Points redeemed
- Points history
- Member points history
- Household/member context
- Redeem points
- Reset member points where authorized
- Reset circle/member points where authorized
- Points related to task completion
- Points integrated with rewards
- Points analytics/history

---

# 31. Rewards

Reward functionality includes:
- List rewards
- Create reward
- Edit/update reward
- Active rewards
- Archived/inactive rewards
- Reactivate reward
- User reward request
- Verify available points
- My reward requests
- Pending requests
- Cancel own request
- Admin/manager request review where authorized
- Approve reward request
- Reject reward request
- Requested date
- Resolved date
- Request status
- Reward activity in progress reporting
- Reward/points integration

---

# 32. Activity

The activity domain includes:
- Household/user activity history
- Task activity
- Completion activity
- Skip/reject/pending states
- Member attribution
- Notes
- View note
- View detailed history entry
- Edit supported history entry
- Delete supported history entry
- Date/time context
- Category/label context
- Filtering
- Offline/loading/error handling where applicable

---

# 33. Notification Center

The product has a real notification inbox, separate from activity history.

Capabilities include:
- Notification list
- Unread count
- Unread/read state
- Mark individual notification read
- Mark all notifications read
- Notification destination/action routing
- Notification type context
- Paginated/load-more behavior
- Loading state
- Error/retry state
- Empty state
- Realtime notification updates where supported

---

# 34. Notification Preferences and Delivery

Notification capabilities include:
- Local notifications
- Push notifications
- Native device push registration
- Device-token registration
- Device-token removal
- Registered-device visibility
- Device count
- Device activity update
- Push permission handling
- Automatic device registration
- Device-limit handling
- Test notification
- Task due-date notifications
- Pre-due reminders
- Overdue notifications
- Reminder configuration
- Task-specific notification metadata/templates
- Routine-related notification behavior
- Family activity notification behavior
- Reward-related notification behavior
- Deep links from notifications
- External notification targets supported by the server
- Telegram notification target support
- Pushover notification target support
- Discord notification target support
- FCM/native push support

---

# 35. Search

Global search includes:
- Dedicated search experience
- Search palette/quick search
- Keyboard-based search access where supported
- Search tasks
- Search task history/notes
- Search projects
- Search labels/categories
- Search people/circle members
- Search Profile
- Search Settings
- Route directly to matching destination
- Task result routing
- History result routing
- Project-filter routing
- Role-aware Settings search results
- Offline-backed searchable data where available

---

# 36. Profile

Profile capabilities include:
- View profile
- Edit display name
- Handle/username information
- Email display
- Role display
- Effective role awareness
- Timezone
- Profile photo
- Upload/change photo where entitled
- Crop/edit photo
- Member-since information
- Profile preview
- Profile visibility context
- “Who can see” privacy linkage
- Direct access to security settings
- Save/update profile

---

# 37. Settings Overview

Settings provides a product-level overview of configurable behavior including:
- Product appearance
- Product theme
- Light/dark/system appearance mode
- Default experience/view preference
- Language
- Circle/household summary
- Solo status
- Member count
- Invite/manage household actions where applicable
- Notification preference summary
- Task reminder preference
- Routine nudge preference
- Family activity preference
- Reward availability preference
- Weekly summary preference
- Device push context
- Privacy summary
- Activity visibility context
- Data/storage/export-related access
- Feedback
- Bug reporting

The design may regroup these settings as appropriate; the capability set should be retained.

---

# 38. Appearance and Product Theme

Appearance capabilities include:
- Product theme selection
- DyDan product theme
- Sovereign product theme
- Light mode
- Dark mode
- Automatic/system mode
- Persisted appearance preference
- Native status-bar theme integration
- RTL-compatible theming
- Responsive presentation

---

# 39. Localization and Region

Localization capabilities include:
- Language selection
- Arabic
- Arabic Saudi localization
- English
- German
- Spanish
- French
- Japanese
- Dutch
- Portuguese
- Chinese bundles currently present in the client
- RTL support
- LTR support
- Date-format selection
- Date preview
- Time-format selection
- 12-hour time
- 24-hour time
- First day of week selection
- Sunday option
- Monday option
- Saturday option
- Localized dates/times throughout the application
- User timezone

---

# 40. Privacy

Privacy capabilities include:
- Profile visibility preference
- Email visibility preference
- Timezone visibility preference
- Household/circle privacy context
- Activity visibility context
- Diagnostics-sharing preference
- Data/storage privacy information
- Link to household management
- Link to storage/data management
- Privacy-policy access

---

# 41. Security

Security settings include:
- Sign-in/security overview
- Connected account/provider visibility
- Password management
- Change password
- MFA status
- MFA management
- Active sessions
- Session revocation
- Revoke other sessions
- Account deletion
- Security-related success/error feedback
- Role/permission restrictions on security administration

---

# 42. Subscription and Billing

Subscription functionality includes:
- Basic/free plan awareness
- Plus plan awareness
- Active subscription
- Cancelled subscription
- Expiration date
- Plus-until-expiration behavior
- Upgrade
- Subscription purchase flow
- Native in-app purchase integration
- RevenueCat integration
- Cancel subscription
- Native cancellation handling
- Payment success state
- Payment cancellation/failure state
- Plan-aware feature availability

---

# 43. Plus / Entitlement-Aware Capabilities

The current client contains explicit Plus checks around several capabilities.

Observed subscription-sensitive areas include:
- Server storage usage
- File/image upload functionality
- Rich-text image upload
- Some task attachment/upload capabilities
- Advanced task trigger behavior
- Task reminder metadata in advanced capture flows
- API token functionality
- Webhook notifications/integration
- Realtime configuration options
- Managed child/subaccount functionality
- Some profile/media behavior

This list describes current client entitlement checks; design should allow capabilities to be unavailable, upgrade-gated, or visibly entitlement-dependent without assuming a specific UI treatment.

---

# 44. Integrations and API Access

Integration capabilities include:
- REST API access
- Long-lived API tokens
- Create API token
- List API tokens
- Copy token
- Revoke/delete token
- External automation
- Webhook integration
- Configure webhook URL
- Enable/disable webhook integration
- Circle event delivery
- Task update events
- Thing update events
- Integration with automation platforms such as Home Assistant
- External notification integrations
- Realtime/SSE connectivity
- Self-hosted API compatibility

---

# 45. Realtime Updates

Realtime behavior includes:
- Server-Sent Events
- Realtime connection state
- Realtime task/activity changes
- Circle-aware live updates
- Realtime configuration
- SSE authentication/ticket flow
- Session revocation enforcement
- Connection recovery
- Polling/fallback behavior where implemented
- Developer diagnostics for realtime connection
- Realtime entitlement/configuration behavior

---

# 46. Offline Support and Synchronization

DyDan contains an offline capability.

Capabilities include:
- Enable offline support
- Disable offline support
- Device/browser-specific offline setting
- Local offline task data
- Local queued commands
- Continue supported task operations while offline
- Sync when connectivity returns
- Automatic reconnect synchronization
- Pending command status
- Server probing
- Network status awareness
- Sync status indicator
- Clear offline database
- Clear cached offline data
- Warning when disabling offline support will remove unsynced changes
- Local/browser data reset
- Native SQLite-backed offline storage in the production mobile client

Offline Support is currently identified as an early-access capability in the client.

---

# 47. Storage and Data Management

Storage functionality includes:
- Server storage usage
- Used storage amount
- Total storage allowance
- Storage percentage
- Uploaded files/images/data accounting
- Plus entitlement for server-storage tracking
- Browser/local-storage management
- Clear local storage
- Clear cache
- Warning that local clearing may log the user out
- Native app preferences storage
- Clear native app preferences
- Keep server data separate from device/browser local data

---

# 48. Attachments and Media

Media capabilities include:
- Task file attachments
- Task attachment listing
- Delete task attachment
- Attachment viewer
- Attachment browser
- Secure/signed asset access
- Local or S3-backed server storage
- Profile photo storage
- Image upload
- Image caching
- Rich-text image support
- Draft attachment cleanup
- Content-type/security handling

---

# 49. Voice Capture

Native/mobile task capture includes:
- Speech-recognition permission handling
- Voice capture
- Convert voice input into task data
- Parse task title
- Parse task metadata
- Assignee selection from voice capture flow
- Reminder metadata where entitled
- Native microphone integration
- Quick access to voice task creation

---

# 50. Document Scanning and OCR

Native/mobile task creation supports:
- Document scanning
- Image capture/import
- OCR/text extraction
- Convert scanned information into task-related input
- Scan error handling
- Read/extraction error handling
- Upload handling where applicable

---

# 51. NFC

Native/mobile capabilities include:
- NFC capture
- Write NFC interaction
- NFC-based task/Thing-related workflows where configured
- Native NFC permission/platform handling

---

# 52. Native Quick Capture

Native/mobile quick capture includes:
- Quick task creation
- Voice shortcut
- Scan shortcut
- Deep links into task creation
- Native widget quick-capture actions

---

# 53. Native Widgets

The production AppWeb/Capacitor client includes native home-screen widgets.

Current widget capabilities include:
- Today widget
- Next 7 Days / Week widget
- People widget
- Quick Capture widget
- Today tasks
- Pending-approval awareness
- Upcoming tasks grouped by day
- Household member/task-load snapshot
- Quick add
- Quick voice capture
- Quick scan capture
- Bounded/snapshot data rather than full task-client behavior
- Widget data clearing on logout

---

# 54. Device and Native Integration

Native capabilities include:
- Android/iOS Capacitor client
- Secure credential storage
- Native Preferences
- Native SQLite-backed offline cache
- Push notifications
- Local notifications
- Speech recognition
- NFC
- Document scanning
- OCR
- Native sharing
- Native status-bar integration
- Social login
- In-app purchases
- App lifecycle handling
- Safe-area handling
- Native deep links
- Device registration
- App-specific local preference reset

---

# 55. Side Panel / Navigation Personalization

Users can configure supported navigation presentation including:
- Visibility of configurable side-panel items
- Reordering configurable items
- Enable/disable supported side-panel modules
- Reset to defaults
- User Switcher entry
- Progress-related entries
- Welcome/profile-related entries
- Calendar/history/reward-related configurable entries

The exact navigation UI is not prescribed by this document.

---

# 56. Developer and Diagnostic Capabilities

Developer/diagnostic settings include:
- Authentication token diagnostics
- Token time-left information
- Platform information
- Network status
- Sync offset information
- Recovery actions
- Feedback/review prompt diagnostics
- Prompt eligibility/state
- Server-Sent Events diagnostics
- Realtime/SSE status
- Refresh/recovery actions
- Diagnostic tools
- Experimental/developer-oriented information

---

# 57. Feedback and Bug Reporting

The product supports:
- Send feedback
- Report a bug
- Feedback modal
- Error-report modal
- Diagnostic context attached to reports where applicable
- Recent error context
- App/build/version context
- Feedback/review prompt logic
- Prompt eligibility/cooldown behavior

---

# 58. Error, Recovery, and Shared System States

The product must handle:
- Generic application error
- Route-level error
- Component/error-boundary failure
- Retry/recovery action
- Error reporting
- Copy diagnostic information where supported
- Offline state
- Network unreachable state
- Server unavailable state
- Permission denied state
- Authentication/session expired state
- Loading state
- Empty state
- Partial-data state
- Not found / unknown route
- Maintenance/startup-type server states where applicable
- New application version available
- PWA refresh/update action

---

# 59. Network Awareness

Capabilities include:
- Detect online/offline state
- Network status banner
- Reconnect handling
- Automatic sync after reconnect
- Distinguish device connectivity from server reachability
- Retry/probe server
- Preserve supported cached data
- Show stale/pending/sync state where needed

---

# 60. PWA Behavior

Web/PWA capabilities include:
- Progressive Web App support
- Service worker
- Offline-ready support
- Application update detection
- User-triggered reload to apply a new version
- Installable web app behavior
- Web application icons/manifest support
- Responsive desktop/tablet/mobile web layouts

---

# 61. Legal and Public Information

Public/supporting content includes:
- Public landing/welcome experience
- Product information
- Getting-started information
- Features information
- Pricing information
- Installation information
- Privacy Policy
- Terms
- Cookie-permission handling
- Payment result states

---

# 62. Searchable Settings and Destinations

Current search integrates settings destinations including:
- Circle / household
- Subscription
- Subaccounts
- Notifications
- Multi-factor authentication
- API tokens
- Storage
- Side panel
- Appearance
- Language and region
- Advanced settings
- Developer settings
- Profile as its own destination

Role-restricted settings are filtered based on user access.

---

# 63. Product Data Domains

The current backend contains first-class domains for:
- Authentication
- Users
- Sessions
- MFA
- Circles
- Devices
- Tasks/chores
- Subtasks
- Task history
- Labels
- Categories
- Projects
- Filters
- Routines
- Shopping lists
- Shopping items
- Things
- Meters
- Maintenance assets
- Points
- Progress
- Goals
- Rewards
- Reward requests
- Notifications/inbox
- Notification targets
- Storage/files
- Realtime events
- Sync
- Payments/subscriptions
- External notification delivery
- Webhook/event delivery

---

# 64. Role/Context Capability Summary

| Capability Area | Child | Adult | Manager | Owner/Admin | Solo | Family Circle | Plus Dependency |
|---|---|---|---|---|---|---|---|
| Personal tasks | Yes | Yes | Yes | Yes | Yes | Yes | Core no |
| Today/Home | Yes | Yes | Yes | Yes | Yes | Yes | Core no |
| Quest experience | Yes | Available by product context | Available by product context | Available by product context | Yes | Yes | No |
| Projects/Categories/Filters | Role/context dependent actions | Yes | Yes | Yes | Yes | Yes | Mostly no |
| Routines | Role/context dependent | Yes | Yes | Yes | Yes | Yes | Some advanced behavior may vary |
| Shopping | Yes where permitted | Yes | Yes | Yes | Yes | Yes | Core no |
| Maintenance/Meters/Things | Role/context dependent | Yes | Yes | Yes | Yes | Yes | Some triggers may be Plus |
| Family Progress | With active family context | Yes | Yes | Yes | No family view without other member | Yes | Core no |
| Points/Rewards | Yes where enabled | Yes | Yes | Yes | Context dependent | Yes | Core no |
| User impersonation | No | Normally no | Yes | Yes | No | Yes | No |
| Manage account/security | No | Yes | Yes | Yes | Yes | Yes | No |
| Manage subaccounts | No | Yes | Yes | Yes | Possible before/while forming family | Yes | Current client contains Plus checks |
| Manage circle roles/members | No | Limited | Limited manager behavior | Yes | N/A | Yes | No |
| Profile/privacy/preferences | Yes where route permitted | Yes | Yes | Yes | Yes | Yes | Some media may be Plus |
| API tokens | No/guarded | Yes | Yes | Yes | Yes | Yes | Current client Plus-gated |
| Webhook integration | No | Not privileged | Not full circle admin authority | Yes | Context dependent | Yes | Plus |
| Realtime configuration | Available subject to account/context | Yes | Yes | Yes | Yes | Yes | Some options Plus-gated |
| Server storage usage | Available only when entitled | Available only when entitled | Available only when entitled | Available only when entitled | Yes | Yes | Plus |
| Notifications | Yes | Yes | Yes | Yes | Yes | Yes | Core + entitlement-specific options |
| Offline support | Yes where supported | Yes | Yes | Yes | Yes | Yes | Early Access |
| Native capture/widgets | Yes where platform permits | Yes | Yes | Yes | Yes | Yes | Some upload/reminder features may be Plus |

This table is a functional summary, not a substitute for backend permission enforcement.

---

# 65. Design Handoff Rule

The design system should use this file as a **capability checklist**, not as a screen map.

Figma/design may:
- Combine related capabilities
- Split complex capabilities
- Change navigation structure
- Change information architecture
- Use drawers, sheets, dialogs, pages, cards, tabs, progressive disclosure, or other interaction patterns
- Create role-specific variants
- Create responsive variants
- Simplify visual complexity

Figma/design should not:
- Remove an implemented capability merely because it is not present in the current prototype
- Invent incompatible product behavior
- Assume every capability belongs on its own screen
- Assume the current production page structure is the required future UI structure
- Treat family, child, manager, admin, Plus, offline, or native states as identical
- Merge Activity and Notifications as if they were the same data domain
- Remove system states such as loading, empty, error, offline, permission-denied, or session-expired behavior

The final design should represent the product’s actual capabilities while allowing the design process to determine the best UI/UX.

---

# 66. Functional Coverage Checklist

A complete DyDan product design should account for the following capability groups:

- Authentication
- Sessions
- MFA
- Password recovery
- Self-hosted server connection
- Onboarding
- Solo use
- Family/shared use
- Child/managed account use
- Adult/member use
- Manager behavior
- Owner/admin behavior
- Home
- Focus experience
- Quest experience
- Today
- Tasks
- Task detail
- Task create/edit
- Task recurrence
- Task assignment
- Task approval
- Task timer
- Task history
- Task attachments
- Archived tasks
- Calendar
- Projects
- Categories
- Labels
- Filters
- Routines
- Shopping lists
- Shopping items
- Maintenance
- Assets
- Meters
- Things
- Circle membership
- Invite/join
- Member roles
- User switching/impersonation
- Family progress
- Reports/analytics
- Goals
- Streaks
- Points
- Rewards
- Reward requests
- Activity history
- Notification inbox
- Notification preferences
- Push/local notifications
- External notification targets
- Search
- Profile
- Settings
- Appearance
- Theme mode
- Localization
- RTL
- Privacy
- Security
- Subscription/billing
- Plus entitlements
- Integrations
- API tokens
- Webhooks
- Realtime/SSE
- Offline support
- Sync
- Storage
- Media/files
- Voice capture
- Document scan/OCR
- NFC
- Native quick capture
- Native widgets
- Native device integration
- Side-panel personalization
- Developer diagnostics
- Feedback
- Bug reporting
- Error/recovery states
- Network states
- PWA update behavior
- Legal/public content
- Payment result states

---

**End of functional inventory.**
