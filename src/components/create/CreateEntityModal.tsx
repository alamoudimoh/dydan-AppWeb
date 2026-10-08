import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import type { Member } from '../../data'
import {
  useCategoryMutations,
  useChoreCategories,
} from '../../hooks/useChoreCategories'
import {
  useGoalMutations,
  useMaintenanceMutations,
  useProjectMutations,
  useRewardMutations,
  useRoutineMutations,
  useShoppingMutations,
  useTaskMutations,
} from '../../hooks/useHousehold'
import FormModal from '../FormModal'
import { getCreateEntityConfig } from './entityConfigs'
import type {
  CreateDraftValues,
  CreateEntityOptions,
  CreateEntityType,
  CreateRuntime,
  TranslateFn,
} from './types'

type CreateEntityModalProps = {
  type: CreateEntityType
  options?: CreateEntityOptions
  onClose: () => void
  showToast: (message: string) => void
  currentUser?: Member | null
}

/**
 * The single entity-aware controller for every dydan create flow.
 *
 * It resolves the shared CreateEntityConfig, owns draft/validation/loading
 * state, invokes the real persistence mutation, and renders the one canonical
 * FormModal. Contextual actions and the universal selector both mount this
 * exact component with the same config for a given entity type.
 */
export default function CreateEntityModal({
  currentUser = null,
  onClose,
  options,
  showToast,
  type,
}: CreateEntityModalProps) {
  const { t: i18nT } = useTranslation()
  const translate: TranslateFn = (key, interpolation) =>
    String(interpolation ? i18nT(key, interpolation) : i18nT(key))
  const { categories } = useChoreCategories()
  const categoryMutations = useCategoryMutations()
  const taskMutations = useTaskMutations()
  const projectMutations = useProjectMutations()
  const routineMutations = useRoutineMutations()
  const maintenanceMutations = useMaintenanceMutations()
  const shoppingMutations = useShoppingMutations()
  const goalMutations = useGoalMutations()
  const rewardMutations = useRewardMutations()

  const runtime = useMemo<CreateRuntime>(
    () => ({
      categories,
      categoryMutations,
      currentUser,
      goalMutations,
      maintenanceMutations,
      projectMutations,
      rewardMutations,
      routineMutations,
      shoppingMutations,
      taskMutations,
    }),
    [
      categories,
      categoryMutations,
      currentUser,
      goalMutations,
      maintenanceMutations,
      projectMutations,
      rewardMutations,
      routineMutations,
      shoppingMutations,
      taskMutations,
    ],
  )
  const config = getCreateEntityConfig(type)
  const [values, setValues] = useState<CreateDraftValues>(() =>
    config.createDraft(runtime, options),
  )
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const editMode = config.isEdit?.(options) ?? false

  const setValue = (id: string, value: unknown) => {
    setSubmitError(null)
    setValues(current => ({ ...current, [id]: value }))
  }

  const submit = async () => {
    const validation = config.validate(values, translate)
    if (validation || submitting) {
      setSubmitError(validation)
      return
    }
    setSubmitting(true)
    setSubmitError(null)
    try {
      const result = await config.submit(values, {
        ...(options ? { options } : {}),
        runtime,
        showToast,
        t: translate,
      })
      options?.onCreated?.(result)
      onClose()
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : translate('create.error.generic'),
      )
    } finally {
      setSubmitting(false)
    }
  }

  const taskCategories = [...categories]
  if (
    options?.task?.categoryId != null &&
    options.task.category &&
    !taskCategories.some(category => category.id === options.task?.categoryId)
  ) {
    taskCategories.push({
      id: options.task.categoryId,
      name: options.task.category,
    })
  }
  const fieldValues =
    type === 'task' ? { ...values, categories: taskCategories } : values

  return (
    <FormModal
      title={translate(
        editMode && config.editTitleKey ? config.editTitleKey : config.titleKey,
      )}
      icon={config.icon}
      onClose={onClose}
      onSubmit={() => void submit()}
      submitLabel={translate(
        editMode && config.editSubmitKey
          ? config.editSubmitKey
          : config.submitKey,
      )}
      loadingLabel={translate(editMode ? 'action.saving' : 'action.creating')}
      submitting={submitting}
      error={submitError}
    >
      {config.renderFields({
        disabled: submitting,
        setValue,
        submit: () => void submit(),
        t: translate,
        values: fieldValues,
      })}
    </FormModal>
  )
}
