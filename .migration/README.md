# Phase

Phase 4 — `migration/figma-p04-tasks-calendar`: exact task workflow, All Tasks and Calendar.

# Prerequisites

Fetch/prune; verify Phases 1–3 merged; rebase to latest `origin/develop` resolving only planning/base drift. Figma wins over `design-reference/` and legacy UI.

# Authoritative Figma Baseline

`design-source/figma-make/` at `ade3ffa8fff9ca947d0a843cfface61cbad0cb47`, matching dedicated repo `7131b76979e49351db8ecbc33db6648a75139572`.

# Exact Figma Stack

React 19, Vite 8, plugin-react 6, Tailwind 4/@tailwindcss-vite 4, TS 5.7, oxfmt.

# Figma Source Files

`src/screens/{TodayScreen,AllTasksScreen,CalendarScreen}.tsx`, `src/components/{CreateTaskModal,TaskDetailModal}.tsx`, `src/App.tsx`, `src/index.css`.

# Production Targets

`src/views/Chores/{MyChores,ChoreListView,ChoreCard,ArchivedTasks,SortAndGrouping,Sidepanel}/**`, `src/views/ChoreEdit/{ChoreEdit,ChoreView,RepeatSection,ThingTriggerSection}/**`, `src/views/Calendar/CalendarView.jsx`, `src/views/components/{AddTaskModal,DueDatePicker*,AssigneePickerField,ProjectPickerField,LabelsPickerField,RepeatPickerField,ChoreActionMenu}.jsx`, `src/queries/{ChoreQueries,TimeQueries}*`.

# Existing Behavior That Must Be Preserved

Create/edit/detail/clone/archive, recurrence, subtasks, assignment, approval, permissions, timer, categories/projects/labels, filters/sorting, offline optimistic mutations, SSE invalidation, calendar semantics and routes.

# Required Implementation

Port each Figma component DOM/classes directly; wire live query models and handlers. Keep routes `/chores`, `/chores/create`, `/chores/:choreId`, `/chores/:choreId/edit`, history/timer and `/calendar`. Map Figma filters/grouping/search/calendar controls to existing behavior; preserve unsupported product controls through exact reusable Figma primitive composition, not a new design.

# Forbidden Substitutions

No Joy/MUI date picker/card/dialog equivalents, no `sx`, no stripped recurrence/approval/offline behavior, no mock task data, no altered Figma responsive layout.

# Dependency Changes

None expected; retain legacy UI dependencies only while a genuine unmigrated consumer exists.

# Tests

Mutation/query/offline/reconnect tests; task lifecycle and recurrence integration; Playwright create/detail/filter/calendar tests; `npm test`, build, smoke, `./scripts/verify.sh`.

# Visual Acceptance

Figma vs production at 1440×900/1024×768/390×844, DayDan/Sovereign × LTR/RTL, with overdue/todo/done/recurring/assigned/filter/calendar and modal states. Compare DOM composition, controls, spacing, typography, shadows, borders, navigation and density.

# RTL / Arabic

Verify Arabic creation/detail/forms/calendar direction and localized date content without breaking behavior.

# Capacitor / Native

Verify keyboard, modal, touch calendar/task actions, offline mutation queue and Android sync.

# Completion Criteria

All named routes render actual Figma UI while every listed contract works and screenshot matrix passes.

# Final Evidence

Report source/route mapping, preserved mutation list, tests/build/sync, screenshot pairs and any proven blocked parity.
