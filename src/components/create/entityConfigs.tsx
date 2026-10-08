import { Icon } from '../../App'
import { normalizeCategoryName } from '../../hooks/categoryModel'
import { COLORS } from '../../utils/Colors'
import ColorPicker from '../ColorPicker'
import DateField from '../DateField'
import IconPicker from '../IconPicker'
import MemberPicker from '../MemberPicker'
import ThemeSelect from '../ThemeSelect'
import {
  CreateField,
  CreateSelectField,
  CreateTextareaField,
  CreateTextField,
} from './fields'
import type {
  CreateEntityConfig,
  CreateEntityType,
  CreateFieldContext,
} from './types'

const stringValue = (value: unknown) => String(value ?? '')
const booleanValue = (value: unknown) => Boolean(value)
const numberValue = (value: unknown) => Number(value ?? 0)

const today = () => new Date().toISOString().slice(0, 10)
const nextMonth = () => {
  const date = new Date()
  date.setMonth(date.getMonth() + 1)
  return date.toISOString().slice(0, 10)
}

const taskFields = ({
  disabled,
  setValue,
  submit,
  t,
  values,
}: CreateFieldContext) => (
  <>
    <CreateTextField
      id='task-title'
      label={t('create.task.titleLabel')}
      ariaLabel={t('create.task.titleLabel')}
      value={stringValue(values.title)}
      placeholder={t('create.task.titlePlaceholder')}
      autoFocus
      disabled={disabled}
      onChange={value => setValue('title', value)}
      onSubmit={submit}
    />
    <div className='create-form-grid'>
      <CreateField label={t('create.task.assigneeLabel')}>
        <MemberPicker
          value={stringValue(values.assigneeId)}
          label={t('create.task.assigneeLabel')}
          onChange={value => setValue('assigneeId', value)}
        />
      </CreateField>
      <CreateField label={t('create.task.dueDateLabel')}>
        <DateField
          value={stringValue(values.dueDate)}
          label={t('create.task.dueDateLabel')}
          allowClear
          onChange={value => setValue('dueDate', value)}
        />
      </CreateField>
    </div>
    <CreateField label={t('create.task.priorityLabel')}>
      <div className='flex gap-2'>
        {(['medium', 'high'] as const).map(priority => (
          <button
            key={priority}
            type='button'
            disabled={disabled}
            className='create-choice'
            aria-pressed={values.priority === priority}
            onClick={() => setValue('priority', priority)}
          >
            {priority === 'high' && <Icon name='flag' size={14} />}
            {t(priority === 'high' ? 'create.task.high' : 'create.task.normal')}
          </button>
        ))}
      </div>
    </CreateField>
    <CreateField
      label={`${t('create.task.pointsLabel')} · ${numberValue(values.points)}`}
    >
      <input
        id='task-points'
        aria-label={t('create.task.pointsLabel')}
        type='range'
        min={5}
        max={100}
        step={5}
        disabled={disabled}
        value={numberValue(values.points)}
        onChange={event => setValue('points', Number(event.target.value))}
        style={{ width: '100%', accentColor: 'var(--brand)' }}
      />
    </CreateField>
    <CreateField label={t('create.task.categoryLabel')}>
      {(values.categories as { id: number; name: string }[]).length === 0 ? (
        <div className='text-faint' style={{ fontSize: 12 }}>
          {t('create.task.noCategories')}
        </div>
      ) : (
        <div className='flex flex-wrap gap-2'>
          {(values.categories as { id: number; name: string }[]).map(
            category => (
              <button
                key={category.id}
                type='button'
                disabled={disabled}
                className='badge create-category-choice'
                aria-pressed={values.categoryId === category.id}
                onClick={() =>
                  setValue(
                    'categoryId',
                    values.categoryId === category.id ? null : category.id,
                  )
                }
              >
                {category.name}
              </button>
            ),
          )}
        </div>
      )}
    </CreateField>
  </>
)

const projectFields = ({
  disabled,
  setValue,
  submit,
  t,
  values,
}: CreateFieldContext) => (
  <>
    <CreateTextField
      id='project-name'
      label={t('create.project.nameLabel')}
      value={stringValue(values.name)}
      placeholder={t('create.project.namePlaceholder')}
      autoFocus
      disabled={disabled}
      onChange={value => setValue('name', value)}
      onSubmit={submit}
    />
    <CreateTextField
      id='project-description'
      label={t('create.project.descriptionLabel')}
      value={stringValue(values.description)}
      placeholder={t('create.project.descriptionPlaceholder')}
      disabled={disabled}
      onChange={value => setValue('description', value)}
    />
    <div className='create-form-grid'>
      <CreateField label={t('create.project.iconLabel')}>
        <IconPicker
          value={stringValue(values.icon)}
          onChange={value => setValue('icon', value)}
          label={t('create.project.iconLabel')}
        />
      </CreateField>
      <CreateField label={t('create.project.colorLabel')}>
        <ThemeSelect
          label={t('create.project.colorLabel')}
          value={stringValue(values.color)}
          onChange={value => setValue('color', value)}
          options={[
            { value: 'var(--project-1)', label: t('create.project.color1') },
            { value: 'var(--project-2)', label: t('create.project.color2') },
            { value: 'var(--project-3)', label: t('create.project.color3') },
          ]}
        />
      </CreateField>
    </div>
  </>
)

const routineFields = ({
  disabled,
  setValue,
  t,
  values,
}: CreateFieldContext) => (
  <>
    <div className='create-form-grid'>
      <CreateTextField
        id='routine-name'
        label={t('create.routine.nameLabel')}
        value={stringValue(values.name)}
        autoFocus
        disabled={disabled}
        onChange={value => setValue('name', value)}
      />
      <CreateField label={t('create.routine.scheduleLabel')}>
        <ThemeSelect
          label={t('create.routine.scheduleLabel')}
          value={stringValue(values.schedule)}
          onChange={value => setValue('schedule', value)}
          options={[
            { value: 'Daily', label: t('create.routine.daily') },
            { value: 'Weekly', label: t('create.routine.weekly') },
            { value: 'Monthly', label: t('create.routine.monthly') },
          ]}
        />
      </CreateField>
      <CreateTextField
        id='routine-points'
        type='number'
        min='0'
        step='1'
        label={t('create.routine.pointsLabel')}
        value={stringValue(values.pointsPerTask)}
        disabled={disabled}
        onChange={value => setValue('pointsPerTask', value)}
      />
      <CreateField label={t('create.routine.assigneeLabel')}>
        <MemberPicker
          value={stringValue(values.assigneeId)}
          allowUnassigned
          label={t('create.routine.assigneeLabel')}
          onChange={value => setValue('assigneeId', value)}
        />
      </CreateField>
    </div>
    <CreateTextareaField
      id='routine-description'
      label={t('create.routine.descriptionLabel')}
      value={stringValue(values.description)}
      disabled={disabled}
      onChange={value => setValue('description', value)}
    />
    <CreateTextareaField
      id='routine-steps'
      label={t('create.routine.stepsLabel')}
      value={stringValue(values.taskTitles)}
      rows={4}
      disabled={disabled}
      onChange={value => setValue('taskTitles', value)}
    />
    <label className='flex items-center gap-2 text-primary'>
      <input
        type='checkbox'
        checked={booleanValue(values.requiresApproval)}
        disabled={disabled}
        onChange={event => setValue('requiresApproval', event.target.checked)}
      />
      {t('create.routine.approvalLabel')}
    </label>
  </>
)

const configs: Record<CreateEntityType, CreateEntityConfig> = {
  task: {
    type: 'task',
    icon: 'tasks',
    labelKey: 'create.selector.task',
    titleKey: 'create.task.title',
    editTitleKey: 'create.task.editTitle',
    submitKey: 'create.task.submit',
    editSubmitKey: 'create.task.submitEdit',
    createDraft: (runtime, options) => ({
      title: options?.task?.title ?? '',
      assigneeId: options?.task?.assigneeId ?? runtime.currentUser?.id ?? '',
      dueDate: options?.task?.dueDate ?? '',
      priority: options?.task?.priority === 'high' ? 'high' : 'medium',
      categoryId: options?.task?.categoryId ?? null,
      points: options?.task?.points ?? 20,
      categories: runtime.categories,
    }),
    isEdit: options => Boolean(options?.task),
    renderFields: taskFields,
    validate: (values, t) =>
      stringValue(values.title).trim()
        ? null
        : t('create.validation.taskTitle'),
    submit: async (values, { options, runtime, showToast, t }) => {
      const title = stringValue(values.title).trim()
      const input = {
        title,
        assigneeId: stringValue(values.assigneeId) || undefined,
        dueDate: stringValue(values.dueDate) || undefined,
        priority: values.priority === 'high' ? 4 : 3,
        points: numberValue(values.points),
        categoryId:
          typeof values.categoryId === 'number' ? values.categoryId : null,
      }
      if (options?.task) {
        const result: unknown =
          await runtime.taskMutations.updateTask.mutateAsync({
            ...input,
            id: options.task.id,
          })
        showToast(t('create.toast.taskUpdated', { title }))
        return result
      }
      const result: unknown =
        await runtime.taskMutations.createTask.mutateAsync(input)
      showToast(t('create.toast.taskAdded', { title }))
      return result
    },
  },
  project: {
    type: 'project',
    icon: 'projects',
    labelKey: 'create.selector.project',
    titleKey: 'create.project.title',
    editTitleKey: 'create.project.editTitle',
    submitKey: 'create.project.submit',
    editSubmitKey: 'create.project.submitEdit',
    createDraft: (_runtime, options) => ({
      name: options?.project?.name ?? '',
      description: options?.project?.description ?? '',
      color: options?.project?.color ?? 'var(--project-1)',
      icon: options?.project?.icon ?? '📁',
    }),
    isEdit: options => Boolean(options?.project),
    renderFields: projectFields,
    validate: (values, t) =>
      stringValue(values.name).trim()
        ? null
        : t('create.validation.projectName'),
    submit: async (values, { options, runtime, showToast, t }) => {
      const input = {
        name: stringValue(values.name).trim(),
        description: stringValue(values.description).trim(),
        color: stringValue(values.color),
        icon: stringValue(values.icon),
      }
      if (options?.project) {
        const result = await runtime.projectMutations.updateProject.mutateAsync(
          {
            ...input,
            id: Number(options.project.id),
          },
        )
        showToast(t('create.toast.projectUpdated'))
        return result
      }
      const result =
        await runtime.projectMutations.createProject.mutateAsync(input)
      showToast(t('create.toast.projectCreated'))
      return result
    },
  },
  routine: {
    type: 'routine',
    icon: 'repeat',
    labelKey: 'create.selector.routine',
    titleKey: 'create.routine.title',
    editTitleKey: 'create.routine.editTitle',
    submitKey: 'create.routine.submit',
    editSubmitKey: 'create.routine.submitEdit',
    createDraft: (_runtime, options) => ({
      name: options?.routine?.name ?? '',
      description: options?.routine?.description ?? '',
      schedule:
        options?.routine?.schedule === 'Weekly' ||
        options?.routine?.schedule === 'Monthly'
          ? options.routine.schedule
          : 'Daily',
      pointsPerTask: String(options?.routine?.pointsPerTask ?? 10),
      taskTitles: options?.routine?.taskTitles.join('\n') ?? '',
      assigneeId: options?.routine?.assigneeId ?? '',
      requiresApproval: options?.routine?.requiresApproval ?? false,
    }),
    isEdit: options => Boolean(options?.routine),
    renderFields: routineFields,
    validate: (values, t) => {
      const steps = stringValue(values.taskTitles)
        .split('\n')
        .map(value => value.trim())
        .filter(Boolean)
      if (!stringValue(values.name).trim() || steps.length === 0)
        return t('create.validation.routine')
      const points = Number(values.pointsPerTask)
      return Number.isInteger(points) && points >= 0
        ? null
        : t('create.validation.routinePoints')
    },
    submit: async (values, { options, runtime, showToast, t }) => {
      const schedule = stringValue(values.schedule) as
        'Daily' | 'Weekly' | 'Monthly'
      const items = stringValue(values.taskTitles)
        .split('\n')
        .map(value => value.trim())
        .filter(Boolean)
        .map(name => ({
          name,
          frequencyType: schedule.toLowerCase() as
            'daily' | 'weekly' | 'monthly',
          frequency: 1,
          assignedTo: stringValue(values.assigneeId)
            ? Number(values.assigneeId)
            : null,
          assignStrategy: 'no_assignee' as const,
          points: Number(values.pointsPerTask),
          requireApproval: booleanValue(values.requiresApproval),
        }))
      const input = {
        name: stringValue(values.name).trim(),
        description: stringValue(values.description).trim(),
        items,
      }
      if (options?.routine) {
        const result = await runtime.routineMutations.updateRoutine.mutateAsync(
          {
            ...input,
            id: Number(options.routine.id.replace(/^routine-/, '')),
          },
        )
        showToast(t('create.toast.routineUpdated'))
        return result
      }
      const result =
        await runtime.routineMutations.createRoutine.mutateAsync(input)
      showToast(t('create.toast.routineCreated'))
      return result
    },
  },
  asset: {
    type: 'asset',
    icon: 'maintenance',
    labelKey: 'create.selector.asset',
    titleKey: 'create.asset.title',
    submitKey: 'create.asset.submit',
    createDraft: () => ({ name: '', category: '', description: '' }),
    renderFields: ({ disabled, setValue, submit, t, values }) => (
      <>
        <CreateTextField
          id='asset-name'
          label={t('create.asset.nameLabel')}
          ariaLabel={t('create.asset.nameLabel')}
          value={stringValue(values.name)}
          placeholder={t('create.asset.namePlaceholder')}
          autoFocus
          disabled={disabled}
          onChange={value => setValue('name', value)}
          onSubmit={submit}
        />
        <CreateTextField
          id='asset-category'
          label={t('create.asset.categoryLabel')}
          ariaLabel={t('create.asset.categoryLabel')}
          value={stringValue(values.category)}
          placeholder={t('create.asset.categoryPlaceholder')}
          disabled={disabled}
          onChange={value => setValue('category', value)}
        />
        <CreateTextField
          id='asset-description'
          label={t('create.asset.descriptionLabel')}
          ariaLabel={t('create.asset.descriptionLabel')}
          value={stringValue(values.description)}
          placeholder={t('create.asset.descriptionPlaceholder')}
          disabled={disabled}
          onChange={value => setValue('description', value)}
        />
      </>
    ),
    validate: (values, t) =>
      stringValue(values.name).trim() ? null : t('create.validation.assetName'),
    submit: async (values, { runtime, showToast, t }) => {
      const result = await runtime.maintenanceMutations.createAsset.mutateAsync(
        {
          name: stringValue(values.name).trim(),
          ...(stringValue(values.category).trim() && {
            category: stringValue(values.category).trim(),
          }),
          ...(stringValue(values.description).trim() && {
            description: stringValue(values.description).trim(),
          }),
        },
      )
      showToast(t('create.toast.assetCreated'))
      return result
    },
  },
  meter: {
    type: 'meter',
    icon: 'meter',
    labelKey: 'create.meter.title',
    titleKey: 'create.meter.title',
    submitKey: 'create.meter.submit',
    createDraft: () => ({ name: '', unit: 'count', initialReading: '' }),
    renderFields: ({ disabled, setValue, submit, t, values }) => (
      <>
        <CreateTextField
          id='meter-name'
          label={t('create.meter.nameLabel')}
          ariaLabel={t('create.meter.nameLabel')}
          value={stringValue(values.name)}
          placeholder={t('create.meter.namePlaceholder')}
          autoFocus
          disabled={disabled}
          onChange={value => setValue('name', value)}
          onSubmit={submit}
        />
        <CreateSelectField
          id='meter-unit'
          label={t('create.meter.unitLabel')}
          ariaLabel={t('create.meter.unitLabel')}
          value={stringValue(values.unit)}
          disabled={disabled}
          options={['count', 'km', 'miles', 'hours', 'cycles'] as const}
          onChange={value => setValue('unit', value)}
        />
        <CreateTextField
          id='meter-reading'
          type='number'
          min='0'
          step='1'
          label={t('create.meter.readingLabel')}
          ariaLabel={t('create.meter.readingLabel')}
          value={stringValue(values.initialReading)}
          placeholder={t('create.meter.readingPlaceholder')}
          disabled={disabled}
          onChange={value => setValue('initialReading', value)}
        />
      </>
    ),
    validate: (values, t) => {
      if (!stringValue(values.name).trim())
        return t('create.validation.meterName')
      const reading = Number(stringValue(values.initialReading) || '0')
      return Number.isInteger(reading) && reading >= 0
        ? null
        : t('create.validation.meterReading')
    },
    submit: async (values, { runtime, showToast, t }) => {
      const result = await runtime.maintenanceMutations.createMeter.mutateAsync(
        {
          name: stringValue(values.name).trim(),
          unit: stringValue(values.unit),
          initialReading: Number(stringValue(values.initialReading) || '0'),
        },
      )
      showToast(t('create.toast.meterCreated'))
      return result
    },
  },
  tracker: {
    type: 'tracker',
    icon: 'activity',
    labelKey: 'create.tracker.title',
    titleKey: 'create.tracker.title',
    submitKey: 'create.tracker.submit',
    createDraft: () => ({ name: '', type: 'boolean' }),
    renderFields: ({ disabled, setValue, submit, t, values }) => (
      <>
        <CreateTextField
          id='tracker-name'
          label={t('create.tracker.nameLabel')}
          ariaLabel={t('create.tracker.nameLabel')}
          value={stringValue(values.name)}
          placeholder={t('create.tracker.namePlaceholder')}
          autoFocus
          disabled={disabled}
          onChange={value => setValue('name', value)}
          onSubmit={submit}
        />
        <CreateSelectField
          id='tracker-type'
          label={t('create.tracker.typeLabel')}
          ariaLabel={t('create.tracker.typeLabel')}
          value={stringValue(values.type)}
          disabled={disabled}
          options={[
            { value: 'boolean', label: t('create.tracker.type.boolean') },
            { value: 'text', label: t('create.tracker.type.text') },
            { value: 'number', label: t('create.tracker.type.number') },
            { value: 'action', label: t('create.tracker.type.action') },
          ]}
          onChange={value => setValue('type', value)}
        />
      </>
    ),
    validate: (values, t) =>
      stringValue(values.name).trim()
        ? null
        : t('create.validation.trackerName'),
    submit: async (values, { runtime, showToast, t }) => {
      const type = stringValue(values.type)
      const result = await runtime.maintenanceMutations.createThing.mutateAsync(
        {
          name: stringValue(values.name).trim(),
          type,
          state: type === 'boolean' ? 'off' : '',
        },
      )
      showToast(t('create.toast.trackerCreated'))
      return result
    },
  },
  'shopping-list': {
    type: 'shopping-list',
    icon: 'shopping',
    labelKey: 'create.selector.shoppingList',
    titleKey: 'create.shoppingList.title',
    submitKey: 'create.shoppingList.submit',
    createDraft: (_runtime, options) => ({
      allowShared: options?.allowShared ?? true,
      name: '',
      shared: false,
    }),
    renderFields: ({ disabled, setValue, submit, t, values }) => (
      <>
        <CreateTextField
          id='shopping-list-name'
          label={t('create.shoppingList.nameLabel')}
          value={stringValue(values.name)}
          placeholder={t('create.shoppingList.namePlaceholder')}
          autoFocus
          disabled={disabled}
          onChange={value => setValue('name', value)}
          onSubmit={submit}
        />
        {booleanValue(values.allowShared) ? (
          <label className='flex items-center gap-2 text-primary'>
            <input
              type='checkbox'
              checked={booleanValue(values.shared)}
              disabled={disabled}
              onChange={event => setValue('shared', event.target.checked)}
            />
            {t('create.shoppingList.sharedLabel')}
          </label>
        ) : null}
      </>
    ),
    validate: (values, t) =>
      stringValue(values.name).trim() ? null : t('create.validation.listName'),
    submit: async (values, { runtime, showToast, t }) => {
      const name = stringValue(values.name).trim()
      const result = await runtime.shoppingMutations.createList.mutateAsync({
        name,
        scope: booleanValue(values.shared) ? 'circle' : 'personal',
      })
      showToast(t('create.toast.listCreated', { name }))
      return result
    },
  },
  'shopping-item': {
    type: 'shopping-item',
    icon: 'shopping_item',
    labelKey: 'create.shoppingItem.title',
    titleKey: 'create.shoppingItem.title',
    submitKey: 'create.shoppingItem.submit',
    createDraft: () => ({ name: '', quantity: '' }),
    renderFields: ({ disabled, setValue, submit, t, values }) => (
      <>
        <CreateTextField
          id='shopping-item-name'
          label={t('create.shoppingItem.nameLabel')}
          value={stringValue(values.name)}
          placeholder={t('create.shoppingItem.namePlaceholder')}
          autoFocus
          disabled={disabled}
          onChange={value => setValue('name', value)}
          onSubmit={submit}
        />
        <CreateTextField
          id='shopping-item-quantity'
          label={t('create.shoppingItem.quantityLabel')}
          value={stringValue(values.quantity)}
          disabled={disabled}
          onChange={value => setValue('quantity', value)}
        />
      </>
    ),
    validate: (values, t) =>
      stringValue(values.name).trim() ? null : t('create.validation.itemName'),
    submit: async (values, { options, runtime, showToast, t }) => {
      if (!options?.listId) throw new Error(t('create.error.noList'))
      const name = stringValue(values.name).trim()
      const result = await runtime.shoppingMutations.addItem.mutateAsync({
        listId: Number(options.listId),
        name,
        ...(stringValue(values.quantity).trim()
          ? { quantity: stringValue(values.quantity).trim() }
          : {}),
      })
      showToast(t('create.toast.itemAdded', { name }))
      return result
    },
  },
  goal: {
    type: 'goal',
    icon: 'goals',
    labelKey: 'create.goal.title',
    titleKey: 'create.goal.title',
    editTitleKey: 'create.goal.editTitle',
    submitKey: 'create.goal.submit',
    editSubmitKey: 'create.goal.submitEdit',
    createDraft: (_runtime, options) => ({
      name: options?.goal?.name ?? '',
      metricType: options?.goal?.metricType ?? 'TASK_COMPLETIONS',
      target: String(options?.goal?.target ?? 10),
      startDate: options?.goal?.startDate ?? today(),
      endDate: options?.goal?.endDate ?? nextMonth(),
    }),
    isEdit: options => Boolean(options?.goal),
    renderFields: ({ disabled, setValue, t, values }) => (
      <>
        <CreateTextField
          id='goal-name'
          label={t('create.goal.nameLabel')}
          value={stringValue(values.name)}
          autoFocus
          disabled={disabled}
          onChange={value => setValue('name', value)}
        />
        <CreateSelectField
          id='goal-measure'
          label={t('create.goal.measureLabel')}
          value={stringValue(values.metricType)}
          disabled={disabled}
          options={[
            {
              value: 'TASK_COMPLETIONS',
              label: t('create.goal.tasksCompleted'),
            },
            { value: 'POINTS_EARNED', label: t('create.goal.pointsEarned') },
          ]}
          onChange={value => setValue('metricType', value)}
        />
        <CreateTextField
          id='goal-target'
          type='number'
          min='1'
          label={t('create.goal.targetLabel')}
          value={stringValue(values.target)}
          disabled={disabled}
          onChange={value => setValue('target', value)}
        />
        <div className='create-form-grid'>
          <CreateField htmlFor='goal-start' label={t('create.goal.startLabel')}>
            <input
              id='goal-start'
              className='input w-full'
              type='date'
              value={stringValue(values.startDate)}
              disabled={disabled}
              onChange={event => setValue('startDate', event.target.value)}
            />
          </CreateField>
          <CreateField htmlFor='goal-end' label={t('create.goal.endLabel')}>
            <input
              id='goal-end'
              className='input w-full'
              type='date'
              value={stringValue(values.endDate)}
              disabled={disabled}
              onChange={event => setValue('endDate', event.target.value)}
            />
          </CreateField>
        </div>
      </>
    ),
    validate: (values, t) =>
      stringValue(values.name).trim() &&
      numberValue(values.target) >= 1 &&
      stringValue(values.startDate) &&
      stringValue(values.endDate)
        ? null
        : t('create.validation.goalName'),
    submit: async (values, { options, runtime, showToast, t }) => {
      const input = {
        name: stringValue(values.name).trim(),
        metricType: stringValue(values.metricType) as
          'TASK_COMPLETIONS' | 'CATEGORY_COMPLETIONS' | 'POINTS_EARNED',
        target: numberValue(values.target),
        startDate: stringValue(values.startDate),
        endDate: stringValue(values.endDate),
        status: 'active' as const,
      }
      if (options?.goal) {
        const result = await runtime.goalMutations.updateGoal.mutateAsync({
          ...input,
          id: options.goal.id,
        })
        showToast(t('create.toast.goalUpdated'))
        return result
      }
      const result = await runtime.goalMutations.createGoal.mutateAsync(input)
      showToast(t('create.toast.goalCreated'))
      return result
    },
  },
  reward: {
    type: 'reward',
    icon: 'gift',
    labelKey: 'create.reward.title',
    titleKey: 'create.reward.title',
    editTitleKey: 'create.reward.editTitle',
    submitKey: 'create.reward.submit',
    editSubmitKey: 'create.reward.submitEdit',
    createDraft: (_runtime, options) => ({
      name: options?.reward?.name ?? '',
      description: options?.reward?.description ?? '',
      costPoints: String(options?.reward?.pointsCost ?? 100),
    }),
    isEdit: options => Boolean(options?.reward),
    renderFields: ({ disabled, setValue, t, values }) => (
      <>
        <CreateTextField
          id='reward-name'
          label={t('create.reward.nameLabel')}
          value={stringValue(values.name)}
          autoFocus
          disabled={disabled}
          onChange={value => setValue('name', value)}
        />
        <CreateTextField
          id='reward-cost'
          type='number'
          min='1'
          step='1'
          label={t('create.reward.costLabel')}
          value={stringValue(values.costPoints)}
          disabled={disabled}
          onChange={value => setValue('costPoints', value)}
        />
        <CreateTextareaField
          id='reward-description'
          label={t('create.reward.descriptionLabel')}
          value={stringValue(values.description)}
          disabled={disabled}
          onChange={value => setValue('description', value)}
        />
      </>
    ),
    validate: (values, t) => {
      const cost = Number(values.costPoints)
      return stringValue(values.name).trim() &&
        Number.isInteger(cost) &&
        cost >= 1
        ? null
        : t('create.validation.reward')
    },
    submit: async (values, { options, runtime, showToast, t }) => {
      const input = {
        name: stringValue(values.name).trim(),
        description: stringValue(values.description).trim(),
        costPoints: Number(values.costPoints),
      }
      if (options?.reward) {
        const result = await runtime.rewardMutations.updateReward.mutateAsync({
          ...input,
          id: options.reward.id,
        })
        showToast(t('create.toast.rewardUpdated'))
        return result
      }
      const result =
        await runtime.rewardMutations.createReward.mutateAsync(input)
      showToast(t('create.toast.rewardCreated'))
      return result
    },
  },
  category: {
    type: 'category',
    icon: 'tag',
    labelKey: 'create.category.title',
    titleKey: 'create.category.title',
    submitKey: 'create.category.submit',
    createDraft: () => ({ name: '', color: COLORS.teal }),
    renderFields: ({ disabled, setValue, submit, t, values }) => (
      <>
        <CreateTextField
          id='category-name'
          label={t('create.category.nameLabel')}
          ariaLabel={t('create.category.nameLabel')}
          value={stringValue(values.name)}
          autoFocus
          disabled={disabled}
          onChange={value => setValue('name', value)}
          onSubmit={submit}
        />
        <CreateField label={t('create.category.colorLabel')}>
          <ColorPicker
            label={t('create.category.colorLabel')}
            value={stringValue(values.color)}
            onChange={value => setValue('color', value)}
          />
        </CreateField>
      </>
    ),
    validate: (values, t) => {
      const name = normalizeCategoryName(stringValue(values.name))
      return name.ok ? null : name.error || t('create.validation.category')
    },
    submit: async (values, { runtime, showToast, t }) => {
      const name = normalizeCategoryName(stringValue(values.name))
      if (!name.ok) throw new Error(name.error)
      const result = await runtime.categoryMutations.createCategory.mutateAsync(
        {
          name: name.name,
          color: stringValue(values.color),
        },
      )
      showToast(t('create.toast.categoryCreated'))
      return result
    },
  },
}

/** Universal + intentionally exposes only top-level content. */
export const CREATE_SELECTOR_TYPES: readonly CreateEntityType[] = [
  'task',
  'project',
  'routine',
  'asset',
  'shopping-list',
]

export const getCreateEntityConfig = (type: CreateEntityType) => configs[type]

/** Stable icon mapping used by selectors, contextual actions, and modal titles. */
export const CREATE_ENTITY_ICONS = Object.fromEntries(
  Object.values(configs).map(config => [config.type, config.icon]),
) as Record<CreateEntityType, string>
