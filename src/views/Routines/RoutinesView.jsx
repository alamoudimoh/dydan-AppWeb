import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import AppModal from '../../components/common/AppModal'
import ModalActions from '../../components/common/ModalActions'
import FigmaIcon from '../../components/FigmaIcon'
import { useRoutineMutation, useRoutines } from '../../queries/RoutineQueries'
import { useUserProfile } from '../../queries/UserQueries'
import { useNotification } from '../../service/NotificationProvider'
import { pageShellSx } from '../../theme/appLayout'
import { sxToStyle } from '../../theme/sxToStyle'
import { GetAllCircleMembers, GetAssets, GetMeters } from '../../utils/Fetcher'
import {
  EFFECTIVE_ROLES,
  normalizeCircleMembers,
  resolveEffectiveRole,
} from '../../utils/PermissionModel'
import FigmaRoutinesScreen from './FigmaRoutinesScreen'

const DAYS = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
]

const emptyTask = {
  name: '',
  description: '',
  frequencyType: 'weekly',
  frequency: 1,
  assignStrategy: 'no_assignee',
  assigneeIds: [],
  points: 0,
  requireApproval: false,
  priority: 0,
  assetMode: 'none',
  assetId: null,
  meterId: null,
  meterInterval: '',
  intervalUnit: 'days',
  weekdays: ['saturday'],
  monthDay: '1',
}

const recurrence = (item, t) => {
  const labels = {
    once: t('routines.once'),
    daily: t('routines.daily'),
    weekly: t('routines.weekly'),
    monthly: t('routines.monthly'),
    yearly: t('routines.yearly'),
    interval: t('routines.recurrenceInterval', {
      count: item.frequency || 1,
      unit: t(`routines.units.${item.frequencyMetadata?.unit || 'days'}`),
    }),
    days_of_the_week: (item.frequencyMetadata?.days || [])
      .map(day => t(`routines.days.${day}`))
      .join(', '),
    day_of_the_month: t('routines.recurrenceMonthlyOnDay', {
      day: item.frequencyMetadata?.days?.[0] || 1,
    }),
  }
  return labels[item.frequencyType] || item.frequencyType
}

const memberName = (members, id, t) =>
  members.find(member => member.userId === id)?.displayName ||
  members.find(member => member.userId === id)?.username ||
  t('routines.member', { id })

const Field = ({ children, hint, label, required }) => (
  <label className='block'>
    <span
      className='section-label'
      style={{ display: 'block', padding: '0 0 6px' }}
    >
      {label}
      {required && (
        <span aria-hidden='true' style={{ color: 'var(--sig-over)' }}>
          {' '}
          *
        </span>
      )}
    </span>
    {children}
    {hint && (
      <span
        className='text-muted'
        style={{ display: 'block', fontSize: 12, marginTop: 4 }}
      >
        {hint}
      </span>
    )}
  </label>
)

const CheckRow = ({ checked, label, onChange }) => (
  <label
    className='flex items-center gap-2'
    style={{ cursor: 'pointer', fontSize: 13 }}
  >
    <input
      checked={checked}
      onChange={onChange}
      style={{ accentColor: 'var(--brand)' }}
      type='checkbox'
    />
    {label}
  </label>
)

const ModalShell = ({ children }) => (
  <div className='flex flex-col gap-3'>{children}</div>
)

const TaskSummary = ({ item, members }) => {
  const { t } = useTranslation('chores')
  return (
    <div className='min-w-0'>
      <div className='text-primary font-bold' style={{ fontSize: 14 }}>
        {item.name}
      </div>
      <div className='text-muted' style={{ fontSize: 12 }}>
        {recurrence(item, t)} ·{' '}
        <span className='dydan-metric'>
          {t('dashboard.ptsValue', { count: item.points || 0 })}
        </span>
        {item.requireApproval ? ` · ${t('routines.approvalRequired')}` : ''}
      </div>
      <div className='text-muted' style={{ fontSize: 12 }}>
        {(item.assigneeIds || []).length
          ? item.assigneeIds.map(id => memberName(members, id, t)).join(', ')
          : t('routines.anyActiveMember')}
        {item.requireAsset
          ? ` · ${t('routines.chooseAssetWhenUsedShort')}`
          : ''}
      </div>
    </div>
  )
}

const PackDialog = ({ busy, onClose, onSave, open, pack }) => {
  const { t } = useTranslation('chores')
  const [form, setForm] = useState({ name: '', description: '' })
  useEffect(() => {
    if (open)
      setForm({ name: pack?.name || '', description: pack?.description || '' })
  }, [open, pack])
  return (
    <AppModal
      footer={
        <ModalActions
          primary={{
            disabled: !form.name.trim() || busy,
            label: t('routines.saveRoutine'),
            onClick: () => onSave(form),
          }}
          secondary={{ label: t('routines.cancel'), onClick: onClose }}
          stackOnMobile
        />
      }
      open={open}
      onClose={onClose}
      title={pack ? t('routines.editRoutine') : t('routines.newPack')}
      size='md'
    >
      <ModalShell>
        <Field label={t('routines.name')} required>
          <input
            autoFocus
            className='input'
            value={form.name}
            onChange={event => setForm({ ...form, name: event.target.value })}
          />
        </Field>
        <Field label={t('routines.description')}>
          <textarea
            className='input'
            rows={3}
            value={form.description}
            onChange={event =>
              setForm({ ...form, description: event.target.value })
            }
          />
        </Field>
      </ModalShell>
    </AppModal>
  )
}

const TaskDialog = ({
  assets,
  busy,
  item,
  members,
  meters,
  onClose,
  onSave,
  open,
}) => {
  const [form, setForm] = useState(emptyTask)
  const { t } = useTranslation('chores')
  useEffect(() => {
    if (!open) return
    setForm({
      ...emptyTask,
      ...item,
      description: item?.description || '',
      assigneeIds: item?.assigneeIds || [],
      points: item?.points || 0,
      assetMode: item?.requireAsset
        ? 'required'
        : item?.assetId
          ? 'fixed'
          : 'none',
      intervalUnit: item?.frequencyMetadata?.unit || 'days',
      weekdays: item?.frequencyMetadata?.days || ['saturday'],
      monthDay: item?.frequencyMetadata?.days?.[0] || '1',
    })
  }, [open, item])
  const matchingMeters = meters.filter(
    meter => !form.assetId || meter.thingId === form.assetId,
  )
  const payload = () => {
    let frequencyMetadata
    if (form.frequencyType === 'interval')
      frequencyMetadata = { unit: form.intervalUnit }
    if (form.frequencyType === 'days_of_the_week')
      frequencyMetadata = {
        days: form.weekdays,
        weekPattern: 'every_week',
      }
    if (form.frequencyType === 'day_of_the_month')
      frequencyMetadata = { days: [String(form.monthDay)] }
    return {
      name: form.name.trim(),
      description: form.description.trim() || null,
      frequencyType: form.frequencyType,
      frequency: Number(form.frequency) || 1,
      frequencyMetadata,
      assignStrategy: form.assignStrategy,
      assigneeIds: form.assigneeIds,
      assignedTo: form.assigneeIds[0] || null,
      points: Number(form.points) || 0,
      requireApproval: form.requireApproval,
      priority: Number(form.priority) || 0,
      assetId: form.assetMode === 'fixed' ? form.assetId : null,
      requireAsset: form.assetMode === 'required',
      meterId: form.meterId || null,
      meterInterval: form.meterId ? Number(form.meterInterval) : null,
    }
  }
  const disabled =
    !form.name.trim() ||
    (form.frequencyType === 'days_of_the_week' && !form.weekdays.length) ||
    (form.assetMode === 'fixed' && !form.assetId) ||
    (form.meterId && Number(form.meterInterval) < 1)

  return (
    <AppModal
      footer={
        <ModalActions
          primary={{
            disabled: disabled || busy,
            label: t('routines.saveTask'),
            onClick: () => onSave(payload()),
          }}
          secondary={{ label: t('routines.cancel'), onClick: onClose }}
          stackOnMobile
        />
      }
      open={open}
      onClose={onClose}
      title={item ? t('routines.editTask') : t('routines.addTask')}
      size='lg'
    >
      <ModalShell>
        <Field label={t('routines.taskName')} required>
          <input
            className='input'
            value={form.name}
            onChange={event => setForm({ ...form, name: event.target.value })}
          />
        </Field>
        <Field label={t('routines.description')}>
          <textarea
            className='input'
            rows={2}
            value={form.description}
            onChange={event =>
              setForm({ ...form, description: event.target.value })
            }
          />
        </Field>
        <div className='flex flex-col gap-3 sm:flex-row'>
          <Field label={t('routines.repeat')}>
            <select
              className='input'
              value={form.frequencyType}
              onChange={event =>
                setForm({ ...form, frequencyType: event.target.value })
              }
            >
              <option value='once'>{t('routines.once')}</option>
              <option value='daily'>{t('routines.daily')}</option>
              <option value='weekly'>{t('routines.weekly')}</option>
              <option value='monthly'>{t('routines.monthly')}</option>
              <option value='yearly'>{t('routines.yearly')}</option>
              <option value='interval'>{t('routines.customInterval')}</option>
              <option value='days_of_the_week'>
                {t('routines.selectedWeekdays')}
              </option>
              <option value='day_of_the_month'>
                {t('routines.dayOfMonth')}
              </option>
            </select>
          </Field>
          {form.frequencyType === 'interval' && (
            <>
              <Field label={t('routines.every')}>
                <input
                  className='input'
                  min='1'
                  type='number'
                  value={form.frequency}
                  onChange={event =>
                    setForm({ ...form, frequency: event.target.value })
                  }
                />
              </Field>
              <Field label={t('routines.unit')}>
                <select
                  className='input'
                  value={form.intervalUnit}
                  onChange={event =>
                    setForm({ ...form, intervalUnit: event.target.value })
                  }
                >
                  {['hours', 'days', 'weeks', 'months', 'years'].map(unit => (
                    <option key={unit} value={unit}>
                      {t(`routines.units.${unit}`)}
                    </option>
                  ))}
                </select>
              </Field>
            </>
          )}
        </div>
        {form.frequencyType === 'days_of_the_week' && (
          <Field label={t('routines.weekdays')}>
            <div className='flex flex-wrap gap-x-4 gap-y-1'>
              {DAYS.map(day => (
                <CheckRow
                  checked={form.weekdays.includes(day)}
                  key={day}
                  label={t(`routines.days.${day}`)}
                  onChange={event =>
                    setForm({
                      ...form,
                      weekdays: event.target.checked
                        ? [...form.weekdays, day]
                        : form.weekdays.filter(value => value !== day),
                    })
                  }
                />
              ))}
            </div>
          </Field>
        )}
        {form.frequencyType === 'day_of_the_month' && (
          <Field label={t('routines.dayOfMonth')}>
            <input
              className='input'
              max='31'
              min='1'
              type='number'
              value={form.monthDay}
              onChange={event =>
                setForm({ ...form, monthDay: event.target.value })
              }
            />
          </Field>
        )}
        <Field label={t('routines.assignmentBehavior')}>
          <select
            className='input'
            value={form.assignStrategy}
            onChange={event =>
              setForm({ ...form, assignStrategy: event.target.value })
            }
          >
            <option value='no_assignee'>{t('routines.anyone')}</option>
            <option value='random'>{t('routines.random')}</option>
            <option value='round_robin'>{t('routines.rotating')}</option>
            <option value='least_assigned'>
              {t('routines.leastAssigned')}
            </option>
            <option value='least_completed'>
              {t('routines.leastCompleted')}
            </option>
            <option value='keep_last_assigned'>
              {t('routines.keepLastAssigned')}
            </option>
          </select>
        </Field>
        <Field
          hint={t('routines.leaveEmptyHint')}
          label={t('routines.eligibleMembers')}
        >
          <div className='flex flex-wrap gap-x-4 gap-y-1'>
            {members.map(member => (
              <CheckRow
                checked={form.assigneeIds.includes(member.userId)}
                key={member.userId}
                label={member.displayName || member.username}
                onChange={event =>
                  setForm({
                    ...form,
                    assigneeIds: event.target.checked
                      ? [...form.assigneeIds, member.userId]
                      : form.assigneeIds.filter(id => id !== member.userId),
                  })
                }
              />
            ))}
          </div>
        </Field>
        <div className='flex flex-col gap-3 sm:flex-row sm:items-center'>
          <Field label={t('routines.points')}>
            <input
              className='input'
              min='0'
              type='number'
              value={form.points}
              onChange={event =>
                setForm({ ...form, points: event.target.value })
              }
            />
          </Field>
          <CheckRow
            checked={form.requireApproval}
            label={t('routines.requireApproval')}
            onChange={event =>
              setForm({ ...form, requireApproval: event.target.checked })
            }
          />
        </div>
        <hr
          style={{ border: 0, borderTop: '1px solid var(--line)', margin: 0 }}
        />
        <Field label={t('routines.assetBinding')}>
          <select
            className='input'
            value={form.assetMode}
            onChange={event =>
              setForm({
                ...form,
                assetMode: event.target.value,
                assetId: null,
                meterId: null,
              })
            }
          >
            <option value='none'>{t('routines.noAsset')}</option>
            <option value='fixed'>{t('routines.useExistingAsset')}</option>
            <option value='required'>
              {t('routines.chooseAssetWhenUsed')}
            </option>
          </select>
        </Field>
        {form.assetMode === 'fixed' && (
          <Field label={t('routines.asset')} required>
            <select
              className='input'
              value={form.assetId ?? ''}
              onChange={event =>
                setForm({
                  ...form,
                  assetId: event.target.value || null,
                  meterId: null,
                })
              }
            >
              <option value='' disabled>
                {t('routines.useExistingAsset')}
              </option>
              {assets.map(asset => (
                <option key={asset.id} value={asset.id}>
                  {asset.name}
                </option>
              ))}
            </select>
          </Field>
        )}
        {form.assetMode === 'fixed' && matchingMeters.length > 0 && (
          <div className='flex flex-col gap-3 sm:flex-row'>
            <Field label={t('routines.meterSchedule')}>
              <select
                className='input'
                value={form.meterId ?? ''}
                onChange={event =>
                  setForm({ ...form, meterId: event.target.value || null })
                }
              >
                <option value=''>{t('routines.none')}</option>
                {matchingMeters.map(meter => (
                  <option key={meter.id} value={meter.id}>
                    {meter.name}
                  </option>
                ))}
              </select>
            </Field>
            {form.meterId && (
              <Field label={t('routines.everyMeterUnits')} required>
                <input
                  className='input'
                  min='1'
                  type='number'
                  value={form.meterInterval}
                  onChange={event =>
                    setForm({ ...form, meterInterval: event.target.value })
                  }
                />
              </Field>
            )}
          </div>
        )}
      </ModalShell>
    </AppModal>
  )
}

const ApplyDialog = ({
  assets,
  busy,
  members,
  onApply,
  onClose,
  open,
  pack,
}) => {
  const { t } = useTranslation('chores')
  const today = useMemo(() => new Date().toLocaleDateString('en-CA'), [open])
  const [startDate, setStartDate] = useState(today)
  const [selections, setSelections] = useState({})
  useEffect(() => {
    if (open) {
      setStartDate(today)
      setSelections({})
    }
  }, [open, today])
  const required = (pack?.items || []).filter(item => item.requireAsset)
  const ready = required.every(item => selections[item.id])
  return (
    <AppModal
      footer={
        <ModalActions
          primary={{
            disabled: !ready || !pack?.items?.length || busy,
            label: t('routines.createTasks', {
              count: pack?.items?.length || 0,
            }),
            onClick: () => onApply(startDate, selections),
          }}
          secondary={{ label: t('routines.cancel'), onClick: onClose }}
          stackOnMobile
        />
      }
      open={open}
      onClose={onClose}
      title={t('routines.usePackTitle', { name: pack?.name })}
      size='lg'
    >
      <ModalShell>
        <div className='text-muted' style={{ fontSize: 13 }}>
          {t('routines.applyInfo', { count: pack?.items?.length || 0 })}
        </div>
        <Field label={t('routines.startApplyDate')} required>
          <input
            className='input'
            type='date'
            value={startDate}
            onChange={event => setStartDate(event.target.value)}
          />
        </Field>
        <div
          className='flex flex-col gap-2'
          style={{ maxHeight: 320, overflowY: 'auto' }}
        >
          {(pack?.items || []).map((item, index) => (
            <div key={item.id} className='card'>
              <div className='flex gap-3 p-4'>
                <div
                  className='text-muted'
                  style={{ fontSize: 13, flexShrink: 0 }}
                >
                  {index + 1}.
                </div>
                <div className='min-w-0 flex-1'>
                  <TaskSummary item={item} members={members} />
                  {item.requireAsset && (
                    <Field
                      label={t('routines.assetFor', { name: item.name })}
                      required
                    >
                      <select
                        className='input'
                        value={selections[item.id] || ''}
                        onChange={event =>
                          setSelections({
                            ...selections,
                            [item.id]: event.target.value || null,
                          })
                        }
                      >
                        <option value='' disabled>
                          {t('routines.useExistingAsset')}
                        </option>
                        {assets.map(asset => (
                          <option key={asset.id} value={asset.id}>
                            {asset.name}
                          </option>
                        ))}
                      </select>
                    </Field>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </ModalShell>
    </AppModal>
  )
}

const RoutinesView = () => {
  const { t } = useTranslation('chores')
  const [includeArchived, setIncludeArchived] = useState(false)
  const { data } = useRoutines(includeArchived)
  const mutation = useRoutineMutation()
  const { showError, showSuccess } = useNotification()
  const [selected, setSelected] = useState(null)
  const [packEditor, setPackEditor] = useState(null)
  const [taskEditor, setTaskEditor] = useState(null)
  const [applying, setApplying] = useState(false)
  const [members, setMembers] = useState([])
  const [assets, setAssets] = useState([])
  const [meters, setMeters] = useState([])
  const { data: userProfile } = useUserProfile()
  const packs = data?.res || []

  const circleMembers = normalizeCircleMembers(members)
  const effectiveRole = resolveEffectiveRole(userProfile, circleMembers)
  const canCreate =
    effectiveRole !== EFFECTIVE_ROLES.CHILD &&
    effectiveRole !== EFFECTIVE_ROLES.NONE

  useEffect(() => {
    Promise.all([GetAllCircleMembers(), GetAssets(), GetMeters()])
      .then(async ([memberData, assetResponse, meterResponse]) => {
        setMembers(memberData?.res || [])
        setAssets((await assetResponse.json()).res || [])
        setMeters((await meterResponse.json()).res || [])
      })
      .catch(() => {})
  }, [])
  useEffect(() => {
    if (!selected) return
    const updated = packs.find(pack => pack.id === selected.id)
    if (updated) setSelected(updated)
  }, [data])

  const run = async operation => {
    try {
      const result = await mutation.mutateAsync(operation)
      return result
    } catch (problem) {
      showError(problem.message)
      return null
    }
  }
  const savePack = async form => {
    const result = await run({
      path: packEditor?.id ? `/routines/${packEditor.id}` : '/routines',
      method: packEditor?.id ? 'put' : 'post',
      data: form,
    })
    if (result) {
      setPackEditor(null)
      setSelected(result.res)
      showSuccess(t('routines.routineSaved'))
    }
  }
  const saveTask = async form => {
    const editing = taskEditor?.id
    const result = await run({
      path: editing
        ? `/routines/${selected.id}/items/${taskEditor.id}`
        : `/routines/${selected.id}/items`,
      method: editing ? 'put' : 'post',
      data: form,
    })
    if (result) {
      const items = editing
        ? selected.items.map(item => (item.id === editing ? result.res : item))
        : [...(selected.items || []), result.res]
      setSelected({ ...selected, items })
      setTaskEditor(null)
      showSuccess(t('routines.routineTaskSaved'))
    }
  }
  const removeTask = async item => {
    const result = await run({
      path: `/routines/${selected.id}/items/${item.id}`,
      method: 'delete',
    })
    if (result !== null)
      setSelected({
        ...selected,
        items: selected.items.filter(candidate => candidate.id !== item.id),
      })
  }
  const move = async (index, direction) => {
    const items = [...selected.items]
    ;[items[index], items[index + direction]] = [
      items[index + direction],
      items[index],
    ]
    const result = await run({
      path: `/routines/${selected.id}/items/reorder`,
      method: 'put',
      data: { itemIds: items.map(item => item.id) },
    })
    if (result) setSelected(result.res)
  }
  const setActive = async pack => {
    const result = await run({
      path: `/routines/${pack.id}/status`,
      method: 'patch',
      data: { isActive: !pack.isActive },
    })
    if (result) {
      setSelected(result.res)
      showSuccess(
        pack.isActive
          ? t('routines.routineArchived')
          : t('routines.routineReactivated'),
      )
    }
  }
  const apply = async (startDate, assetSelections) => {
    const result = await run({
      path: `/routines/${selected.id}/apply`,
      method: 'post',
      data: {
        startDate,
        assetSelections,
        idempotencyKey: crypto.randomUUID(),
      },
    })
    if (result) {
      setApplying(false)
      showSuccess(
        t('routines.tasksCreated', {
          count: result.res.choreIds.length,
        }),
      )
    }
  }

  return (
    <div style={sxToStyle(pageShellSx)}>
      <FigmaRoutinesScreen
        canArchive={canCreate}
        canCreate={canCreate}
        members={members}
        onEditRoutine={pack => setPackEditor(pack)}
        onNewRoutine={() => setPackEditor({})}
        onSetActive={setActive}
        onUseRoutine={pack => {
          setSelected(pack)
          setApplying(true)
        }}
        packs={packs}
      />

      <AppModal
        description={selected?.description}
        open={Boolean(selected) && !applying}
        onClose={() => setSelected(null)}
        size='xl'
        title={selected?.name}
      >
        <div className='flex flex-col gap-4'>
          {!selected?.isActive && (
            <span className='badge self-start'>{t('routines.archived')}</span>
          )}
          <div className='flex flex-wrap gap-2'>
            <button
              className='btn btn-ghost'
              onClick={() => setPackEditor(selected)}
              type='button'
            >
              <FigmaIcon name='edit' size={14} />
              {t('routines.editRoutine')}
            </button>
            <button
              className='btn btn-ghost'
              onClick={() => setActive(selected)}
              type='button'
            >
              <FigmaIcon
                name={selected?.isActive ? 'archive' : 'repeat'}
                size={14}
              />
              {selected?.isActive
                ? t('routines.archive')
                : t('routines.reactivate')}
            </button>
            {selected?.isActive && (
              <button
                className='btn btn-primary'
                disabled={!selected?.items?.length}
                onClick={() => setApplying(true)}
                type='button'
              >
                <FigmaIcon name='play' size={14} />
                {t('routines.useRoutine')}
              </button>
            )}
          </div>
          <hr
            style={{ border: 0, borderTop: '1px solid var(--line)', margin: 0 }}
          />
          <div className='flex items-center justify-between'>
            <div className='text-primary font-bold' style={{ fontSize: 15 }}>
              {t('routines.tasks')}
            </div>
            <button
              className='btn btn-sm btn-primary'
              onClick={() => setTaskEditor({})}
              type='button'
            >
              <FigmaIcon name='plus' size={12} />
              {t('routines.addTask')}
            </button>
          </div>
          {selected?.items?.map((item, index) => (
            <div key={item.id} className='card'>
              <div className='screen-dialog-item flex items-center gap-3 p-4'>
                <div
                  className='text-muted'
                  style={{ fontSize: 13, flexShrink: 0 }}
                >
                  {index + 1}.
                </div>
                <div className='min-w-0 flex-1'>
                  <TaskSummary item={item} members={members} />
                </div>
                <div className='screen-dialog-item-actions flex items-center gap-1'>
                  <button
                    aria-label={t('routines.moveTaskUp', { name: item.name })}
                    className='btn btn-ghost btn-icon'
                    disabled={index === 0}
                    onClick={() => move(index, -1)}
                    type='button'
                  >
                    <FigmaIcon
                      name='chevron_down'
                      size={16}
                      style={{ transform: 'rotate(180deg)' }}
                    />
                  </button>
                  <button
                    aria-label={t('routines.moveTaskDown', { name: item.name })}
                    className='btn btn-ghost btn-icon'
                    disabled={index === selected.items.length - 1}
                    onClick={() => move(index, 1)}
                    type='button'
                  >
                    <FigmaIcon name='chevron_down' size={16} />
                  </button>
                  <button
                    aria-label={t('routines.editTask', { name: item.name })}
                    className='btn btn-ghost btn-icon'
                    onClick={() => setTaskEditor(item)}
                    type='button'
                  >
                    <FigmaIcon name='edit' size={16} />
                  </button>
                  <button
                    className='btn btn-ghost btn-sm'
                    onClick={() => removeTask(item)}
                    type='button'
                  >
                    <FigmaIcon name='trash' size={13} />
                    {t('routines.remove')}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </AppModal>
      <PackDialog
        open={packEditor !== null}
        pack={packEditor?.id ? packEditor : null}
        onClose={() => setPackEditor(null)}
        onSave={savePack}
        busy={mutation.isPending}
      />
      <TaskDialog
        busy={mutation.isPending}
        open={taskEditor !== null}
        item={taskEditor?.id ? taskEditor : null}
        onClose={() => setTaskEditor(null)}
        onSave={saveTask}
        members={members}
        assets={assets}
        meters={meters}
      />
      <ApplyDialog
        open={applying}
        pack={selected}
        onClose={() => setApplying(false)}
        onApply={apply}
        members={members}
        assets={assets}
        busy={mutation.isPending}
      />
    </div>
  )
}

export default RoutinesView
