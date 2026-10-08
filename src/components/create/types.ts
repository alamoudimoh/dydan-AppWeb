import type { ReactNode } from 'react'

import type { Member, Task } from '../../data'
import type { useCategoryMutations } from '../../hooks/useChoreCategories'
import type {
  useGoalMutations,
  useMaintenanceMutations,
  useProjectMutations,
  useRewardMutations,
  useRoutineMutations,
  useShoppingMutations,
  useTaskMutations,
} from '../../hooks/useHousehold'

/* ─────────────────────────────────────────────
   Unified create system (Fix 03) — shared types.

   dydan has ONE creation interaction system: every create/edit flow renders
   inside the canonical CreateEntityModal shell (FormModal). Entity screens
   provide CONTENT through a CreateEntityConfig; they never redefine modal
   geometry, header structure, footer structure, or close behavior.
   ───────────────────────────────────────────── */

/**
 * Every entity the unified create system supports. `tracker` is the user-facing
 * name for the legacy internal "thing" records (the API identifiers stay
 * internal); `shopping-list`/`shopping-item` keep the Shopping hierarchy
 * explicit — an item always requires a list context.
 */
export type CreateEntityType =
  | 'task'
  | 'project'
  | 'routine'
  | 'asset'
  | 'meter'
  | 'tracker'
  | 'shopping-list'
  | 'shopping-item'
  | 'goal'
  | 'reward'
  | 'category'

/**
 * Per-open context a caller may attach when opening the canonical modal
 * directly (contextual action or edit flow). The universal selector opens
 * without options.
 */
export type CreateEntityOptions = {
  /** Existing task → edit mode. */
  task?: Task
  /** Existing project → edit mode. */
  project?: {
    id: string
    name: string
    description: string
    color: string
    icon?: string | undefined
  }
  /** Existing routine → edit mode. */
  routine?: {
    id: string
    name: string
    description?: string | undefined
    schedule: string
    taskTitles: string[]
    assigneeId?: string | undefined
    requiresApproval?: boolean
    pointsPerTask?: number | undefined
  }
  /** Existing goal → edit mode. */
  goal?: {
    id: string
    name: string
    metricType?:
      'TASK_COMPLETIONS' | 'CATEGORY_COMPLETIONS' | 'POINTS_EARNED' | undefined
    target: number
    startDate?: string
    endDate?: string
  }
  /** Existing reward → edit mode. */
  reward?: {
    id: string
    name: string
    description?: string | undefined
    pointsCost: number
  }
  /** Existing shopping list → edit mode. */
  list?: { id: string; name: string }
  /** Shopping-item context: the list the item belongs to. */
  listId?: string
  /** Whether a Shopping List may be shared with the current space. */
  allowShared?: boolean
  /**
   * Called with the persisted entity after the server accepted the write
   * (e.g. Shopping selects the freshly created list).
   */
  onCreated?: (result: unknown) => void
}

/**
 * Runtime dependencies the canonical modal assembles once per mount and hands
 * to the entity configurations. All household mutation bundles are mounted
 * unconditionally; nothing fires until a config's submit calls it.
 */
export type CreateRuntime = {
  taskMutations: ReturnType<typeof useTaskMutations>
  projectMutations: ReturnType<typeof useProjectMutations>
  routineMutations: ReturnType<typeof useRoutineMutations>
  maintenanceMutations: ReturnType<typeof useMaintenanceMutations>
  shoppingMutations: ReturnType<typeof useShoppingMutations>
  goalMutations: ReturnType<typeof useGoalMutations>
  rewardMutations: ReturnType<typeof useRewardMutations>
  categoryMutations: ReturnType<typeof useCategoryMutations>
  currentUser: Member | null
  categories: { id: number; name: string }[]
}

/** Localized translate function shared by the create system. */
export type TranslateFn = (
  key: string,
  options?: Record<string, unknown>,
) => string

/** Named fields used by the supported entity drafts. */
export type CreateDraftValues = Record<string, unknown> & {
  title?: unknown
  assigneeId?: unknown
  dueDate?: unknown
  priority?: unknown
  categoryId?: unknown
  points?: unknown
  categories?: unknown
  name?: unknown
  description?: unknown
  color?: unknown
  icon?: unknown
  schedule?: unknown
  pointsPerTask?: unknown
  taskTitles?: unknown
  requiresApproval?: unknown
  category?: unknown
  unit?: unknown
  initialReading?: unknown
  type?: unknown
  shared?: unknown
  allowShared?: unknown
  quantity?: unknown
  metricType?: unknown
  target?: unknown
  startDate?: unknown
  endDate?: unknown
  costPoints?: unknown
}

/** Context passed to a config's renderFields. */
export type CreateFieldContext = {
  /** Current draft values keyed by field id. */
  values: CreateDraftValues
  /** Writes one field of the draft. */
  setValue: (id: string, value: unknown) => void
  /** True while the submit is pending; fields disable their inputs. */
  disabled: boolean
  /** Localized translate function. */
  t: TranslateFn
  /** Submits the form (used for Enter-key handling on text inputs). */
  submit: () => void
}

/** Context passed to a config's submit handler. */
export type CreateSubmitContext = {
  t: TranslateFn
  showToast: (msg: string) => void
  options?: CreateEntityOptions
  runtime: CreateRuntime
}

/**
 * One entity configuration. The shared shell (CreateEntityModal/FormModal)
 * stays centralized; a config defines only its own presentation + fields +
 * persistence. Entities with custom field logic use renderFields while
 * preserving the same shell/layout contract.
 */
export type CreateEntityConfig = {
  type: CreateEntityType
  /** Entity icon from the shared application icon system (App ICON_PATHS). */
  icon: string
  /** Localized selector/page-action label, e.g. "Project". */
  labelKey: string
  /** Localized modal title for create mode, e.g. "New project". */
  titleKey: string
  /** Localized modal title for edit mode, e.g. "Modify project". */
  editTitleKey?: string
  /** Localized primary submit label for create mode. */
  submitKey: string
  /** Localized primary submit label for edit mode. */
  editSubmitKey?: string
  /** Initial draft values for this open. */
  createDraft: (
    runtime: CreateRuntime,
    options?: CreateEntityOptions,
  ) => CreateDraftValues
  /** True when this open is an edit of an existing entity. */
  isEdit?: (options?: CreateEntityOptions) => boolean
  /** The form body. Same shell/layout contract for every entity. */
  renderFields: (context: CreateFieldContext) => ReactNode
  /** Pre-submit validation message, or null when the draft may be submitted. */
  validate: (values: CreateDraftValues, t: TranslateFn) => string | null
  /**
   * Persists the entity. The returned promise must settle only after the
   * server has accepted the write; the created entity (if any) is returned so
   * options.onCreated can react to it.
   */
  submit: (
    values: CreateDraftValues,
    context: CreateSubmitContext,
  ) => Promise<unknown>
}
