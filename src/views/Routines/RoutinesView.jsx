import {
  Add,
  Archive,
  ArrowDownward,
  ArrowUpward,
  Edit,
  PlayArrow,
  Restore,
} from '@mui/icons-material'
import {
  Box,
  Button,
  Card,
  Checkbox,
  Chip,
  Container,
  Divider,
  FormControl,
  FormLabel,
  IconButton,
  Input,
  Option,
  Select,
  Stack,
  Textarea,
  Typography,
} from '@mui/joy'
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import AppModal from '../../components/common/AppModal'
import EmptyState from '../../components/common/EmptyState'
import PageHeader from '../../components/common/PageHeader'
import QueryLoadingView from '../../components/common/QueryLoadingView'
import SectionCard from '../../components/common/SectionCard'
import { useRoutineMutation, useRoutines } from '../../queries/RoutineQueries'
import { useUserProfile } from '../../queries/UserQueries'
import { useNotification } from '../../service/NotificationProvider'
import { pageShellSx, pageStackSpacing } from '../../theme/appLayout'
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

const TaskSummary = ({ item, members }) => {
  const { t } = useTranslation('chores')
  return (
    <Stack spacing={0.35} sx={{ minWidth: 0 }}>
      <Typography level='title-sm'>{item.name}</Typography>
      <Typography level='body-xs'>
        {recurrence(item, t)} ·{' '}
        <Box component='span' className='daydan-metric'>
          {t('dashboard.ptsValue', { count: item.points || 0 })}
        </Box>
        {item.requireApproval ? ` · ${t('routines.approvalRequired')}` : ''}
      </Typography>
      <Typography level='body-xs'>
        {(item.assigneeIds || []).length
          ? item.assigneeIds.map(id => memberName(members, id, t)).join(', ')
          : t('routines.anyActiveMember')}
        {item.requireAsset
          ? ` · ${t('routines.chooseAssetWhenUsedShort')}`
          : ''}
      </Typography>
    </Stack>
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
      open={open}
      onClose={onClose}
      title={pack ? t('routines.editRoutine') : t('routines.newPack')}
      size='md'
    >
      <FormControl required>
        <FormLabel>{t('routines.name')}</FormLabel>
        <Input
          autoFocus
          value={form.name}
          onChange={event => setForm({ ...form, name: event.target.value })}
        />
      </FormControl>
      <FormControl>
        <FormLabel>{t('routines.description')}</FormLabel>
        <Textarea
          minRows={3}
          value={form.description}
          onChange={event =>
            setForm({ ...form, description: event.target.value })
          }
        />
      </FormControl>
      <Button
        loading={busy}
        disabled={!form.name.trim()}
        onClick={() => onSave(form)}
      >
        {t('routines.saveRoutine')}
      </Button>
    </AppModal>
  )
}

const TaskDialog = ({
  assets,
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
  return (
    <AppModal
      open={open}
      onClose={onClose}
      title={item ? t('routines.editTask') : t('routines.addTask')}
      size='lg'
    >
      <FormControl required>
        <FormLabel>{t('routines.taskName')}</FormLabel>
        <Input
          value={form.name}
          onChange={event => setForm({ ...form, name: event.target.value })}
        />
      </FormControl>
      <FormControl>
        <FormLabel>{t('routines.description')}</FormLabel>
        <Textarea
          minRows={2}
          value={form.description}
          onChange={event =>
            setForm({ ...form, description: event.target.value })
          }
        />
      </FormControl>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
        <FormControl sx={{ flex: 1 }}>
          <FormLabel>{t('routines.repeat')}</FormLabel>
          <Select
            value={form.frequencyType}
            onChange={(_, value) => setForm({ ...form, frequencyType: value })}
          >
            <Option value='once'>{t('routines.once')}</Option>
            <Option value='daily'>{t('routines.daily')}</Option>
            <Option value='weekly'>{t('routines.weekly')}</Option>
            <Option value='monthly'>{t('routines.monthly')}</Option>
            <Option value='yearly'>{t('routines.yearly')}</Option>
            <Option value='interval'>{t('routines.customInterval')}</Option>
            <Option value='days_of_the_week'>
              {t('routines.selectedWeekdays')}
            </Option>
            <Option value='day_of_the_month'>{t('routines.dayOfMonth')}</Option>
          </Select>
        </FormControl>
        {form.frequencyType === 'interval' && (
          <>
            <FormControl sx={{ width: { sm: 120 } }}>
              <FormLabel>{t('routines.every')}</FormLabel>
              <Input
                type='number'
                slotProps={{ input: { min: 1 } }}
                value={form.frequency}
                onChange={event =>
                  setForm({ ...form, frequency: event.target.value })
                }
              />
            </FormControl>
            <FormControl sx={{ width: { sm: 150 } }}>
              <FormLabel>{t('routines.unit')}</FormLabel>
              <Select
                value={form.intervalUnit}
                onChange={(_, value) =>
                  setForm({ ...form, intervalUnit: value })
                }
              >
                {['hours', 'days', 'weeks', 'months', 'years'].map(unit => (
                  <Option key={unit} value={unit}>
                    {t(`routines.units.${unit}`)}
                  </Option>
                ))}
              </Select>
            </FormControl>
          </>
        )}
      </Stack>
      {form.frequencyType === 'days_of_the_week' && (
        <FormControl>
          <FormLabel>{t('routines.weekdays')}</FormLabel>
          <Stack direction='row' flexWrap='wrap' gap={1}>
            {DAYS.map(day => (
              <Checkbox
                key={day}
                label={t(`routines.days.${day}`)}
                checked={form.weekdays.includes(day)}
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
          </Stack>
        </FormControl>
      )}
      {form.frequencyType === 'day_of_the_month' && (
        <FormControl>
          <FormLabel>{t('routines.dayOfMonth')}</FormLabel>
          <Input
            type='number'
            slotProps={{ input: { min: 1, max: 31 } }}
            value={form.monthDay}
            onChange={event =>
              setForm({ ...form, monthDay: event.target.value })
            }
          />
        </FormControl>
      )}
      <FormControl>
        <FormLabel>{t('routines.assignmentBehavior')}</FormLabel>
        <Select
          value={form.assignStrategy}
          onChange={(_, value) => setForm({ ...form, assignStrategy: value })}
        >
          <Option value='no_assignee'>{t('routines.anyone')}</Option>
          <Option value='random'>{t('routines.random')}</Option>
          <Option value='round_robin'>{t('routines.rotating')}</Option>
          <Option value='least_assigned'>{t('routines.leastAssigned')}</Option>
          <Option value='least_completed'>
            {t('routines.leastCompleted')}
          </Option>
          <Option value='keep_last_assigned'>
            {t('routines.keepLastAssigned')}
          </Option>
        </Select>
      </FormControl>
      <FormControl>
        <FormLabel>{t('routines.eligibleMembers')}</FormLabel>
        <Stack direction='row' flexWrap='wrap' gap={1}>
          {members.map(member => (
            <Checkbox
              key={member.userId}
              label={member.displayName || member.username}
              checked={form.assigneeIds.includes(member.userId)}
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
        </Stack>
        <Typography level='body-xs'>{t('routines.leaveEmptyHint')}</Typography>
      </FormControl>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
        <FormControl sx={{ flex: 1 }}>
          <FormLabel>{t('routines.points')}</FormLabel>
          <Input
            type='number'
            slotProps={{ input: { min: 0 } }}
            value={form.points}
            onChange={event => setForm({ ...form, points: event.target.value })}
          />
        </FormControl>
        <FormControl sx={{ justifyContent: 'end' }}>
          <Checkbox
            label={t('routines.requireApproval')}
            checked={form.requireApproval}
            onChange={event =>
              setForm({ ...form, requireApproval: event.target.checked })
            }
          />
        </FormControl>
      </Stack>
      <Divider />
      <FormControl>
        <FormLabel>{t('routines.assetBinding')}</FormLabel>
        <Select
          value={form.assetMode}
          onChange={(_, value) =>
            setForm({
              ...form,
              assetMode: value,
              assetId: null,
              meterId: null,
            })
          }
        >
          <Option value='none'>{t('routines.noAsset')}</Option>
          <Option value='fixed'>{t('routines.useExistingAsset')}</Option>
          <Option value='required'>{t('routines.chooseAssetWhenUsed')}</Option>
        </Select>
      </FormControl>
      {form.assetMode === 'fixed' && (
        <FormControl required>
          <FormLabel>{t('routines.asset')}</FormLabel>
          <Select
            value={form.assetId}
            onChange={(_, value) =>
              setForm({ ...form, assetId: value, meterId: null })
            }
          >
            {assets.map(asset => (
              <Option key={asset.id} value={asset.id}>
                {asset.name}
              </Option>
            ))}
          </Select>
        </FormControl>
      )}
      {form.assetMode === 'fixed' && matchingMeters.length > 0 && (
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
          <FormControl sx={{ flex: 1 }}>
            <FormLabel>{t('routines.meterSchedule')}</FormLabel>
            <Select
              value={form.meterId}
              onChange={(_, value) => setForm({ ...form, meterId: value })}
            >
              <Option value={null}>{t('routines.none')}</Option>
              {matchingMeters.map(meter => (
                <Option key={meter.id} value={meter.id}>
                  {meter.name}
                </Option>
              ))}
            </Select>
          </FormControl>
          {form.meterId && (
            <FormControl sx={{ width: { sm: 180 } }} required>
              <FormLabel>{t('routines.everyMeterUnits')}</FormLabel>
              <Input
                type='number'
                slotProps={{ input: { min: 1 } }}
                value={form.meterInterval}
                onChange={event =>
                  setForm({ ...form, meterInterval: event.target.value })
                }
              />
            </FormControl>
          )}
        </Stack>
      )}
      <Button
        disabled={
          !form.name.trim() ||
          (form.frequencyType === 'days_of_the_week' &&
            !form.weekdays.length) ||
          (form.assetMode === 'fixed' && !form.assetId) ||
          (form.meterId && Number(form.meterInterval) < 1)
        }
        onClick={() => onSave(payload())}
      >
        {t('routines.saveTask')}
      </Button>
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
      open={open}
      onClose={onClose}
      title={t('routines.usePackTitle', { name: pack?.name })}
      size='lg'
    >
      <Typography level='body-sm'>
        {t('routines.applyInfo', { count: pack?.items?.length || 0 })}
      </Typography>
      <FormControl required>
        <FormLabel>{t('routines.startApplyDate')}</FormLabel>
        <Input
          type='date'
          value={startDate}
          onChange={event => setStartDate(event.target.value)}
        />
      </FormControl>
      <Stack spacing={1} sx={{ overflowY: 'auto' }}>
        {(pack?.items || []).map((item, index) => (
          <Card key={item.id} variant='outlined'>
            <Stack direction='row' spacing={1.5}>
              <Typography level='body-sm'>{index + 1}.</Typography>
              <Box sx={{ flex: 1 }}>
                <TaskSummary item={item} members={members} />
                {item.requireAsset && (
                  <FormControl required sx={{ mt: 1 }}>
                    <FormLabel>
                      {t('routines.assetFor', { name: item.name })}
                    </FormLabel>
                    <Select
                      value={selections[item.id] || null}
                      onChange={(_, value) =>
                        setSelections({ ...selections, [item.id]: value })
                      }
                    >
                      {assets.map(asset => (
                        <Option key={asset.id} value={asset.id}>
                          {asset.name}
                        </Option>
                      ))}
                    </Select>
                  </FormControl>
                )}
              </Box>
            </Stack>
          </Card>
        ))}
      </Stack>
      <Stack direction='row' justifyContent='flex-end' spacing={1}>
        <Button variant='plain' color='neutral' onClick={onClose}>
          {t('routines.cancel')}
        </Button>
        <Button
          loading={busy}
          disabled={!ready || !pack?.items?.length}
          onClick={() => onApply(startDate, selections)}
        >
          {t('routines.createTasks', { count: pack?.items?.length || 0 })}
        </Button>
      </Stack>
    </AppModal>
  )
}

const RoutinesView = () => {
  const { t } = useTranslation('chores')
  const [includeArchived, setIncludeArchived] = useState(false)
  const { data, error, isLoading, refetch } = useRoutines(includeArchived)
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
  const [legacyMode] = useState(false)
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
    <Box sx={pageShellSx}>
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

      {legacyMode && (
        <Stack spacing={pageStackSpacing}>
          <PageHeader
            title={t('routines.title')}
            subtitle={t('routines.subtitle')}
            action={
              <Button
                startDecorator={<Add />}
                onClick={() => setPackEditor({})}
              >
                {t('routines.newRoutine')}
              </Button>
            }
          />
          <Checkbox
            label={t('routines.showArchived')}
            checked={includeArchived}
            onChange={event => setIncludeArchived(event.target.checked)}
          />
          {isLoading && <QueryLoadingView />}
          {error && (
            <EmptyState
              variant='error'
              size='sm'
              title={t('common:errors.title')}
              description={error.message}
              primaryAction={{
                label: t('common:retry'),
                onClick: () => refetch(),
              }}
            />
          )}
          {!isLoading && packs.length === 0 && (
            <EmptyState
              title={t('routines.noRoutinesTitle')}
              description={t('routines.noRoutinesDescription')}
            />
          )}
          <Stack spacing={1.5}>
            {packs.map(pack => (
              <SectionCard key={pack.id}>
                <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  spacing={1.5}
                  alignItems={{ sm: 'center' }}
                >
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Stack direction='row' spacing={1} alignItems='center'>
                      <Typography level='title-lg'>{pack.name}</Typography>
                      {!pack.isActive && (
                        <Chip color='neutral'>{t('routines.archived')}</Chip>
                      )}
                    </Stack>
                    {pack.description && (
                      <Typography level='body-sm'>
                        {pack.description}
                      </Typography>
                    )}
                    <Typography level='body-xs'>
                      {t('routines.countTasks', {
                        count: pack.items?.length || 0,
                      })}
                    </Typography>
                  </Box>
                  <Stack direction='row' spacing={1} flexWrap='wrap'>
                    <Button variant='soft' onClick={() => setSelected(pack)}>
                      {t('routines.open')}
                    </Button>
                    {pack.isActive && (
                      <Button
                        startDecorator={<PlayArrow />}
                        onClick={() => {
                          setSelected(pack)
                          setApplying(true)
                        }}
                      >
                        {t('routines.useRoutine')}
                      </Button>
                    )}
                  </Stack>
                </Stack>
              </SectionCard>
            ))}
          </Stack>
        </Stack>
      )}

      <AppModal
        open={Boolean(selected) && !applying}
        onClose={() => setSelected(null)}
        size='xl'
      >
        <Stack spacing={2}>
          <Box>
            <Stack direction='row' spacing={1} alignItems='center'>
              <Typography level='h2'>{selected?.name}</Typography>
              {!selected?.isActive && <Chip>{t('routines.archived')}</Chip>}
            </Stack>
            <Typography level='body-sm'>{selected?.description}</Typography>
          </Box>
          <Stack direction='row' spacing={1} flexWrap='wrap'>
            <Button
              startDecorator={<Edit />}
              variant='soft'
              onClick={() => setPackEditor(selected)}
            >
              {t('routines.editRoutine')}
            </Button>
            <Button
              startDecorator={selected?.isActive ? <Archive /> : <Restore />}
              variant='soft'
              color='neutral'
              onClick={() => setActive(selected)}
            >
              {selected?.isActive
                ? t('routines.archive')
                : t('routines.reactivate')}
            </Button>
            {selected?.isActive && (
              <Button
                startDecorator={<PlayArrow />}
                onClick={() => setApplying(true)}
                disabled={!selected?.items?.length}
              >
                {t('routines.useRoutine')}
              </Button>
            )}
          </Stack>
          <Divider />
          <Stack direction='row' justifyContent='space-between'>
            <Typography level='title-lg'>{t('routines.tasks')}</Typography>
            <Button
              size='sm'
              startDecorator={<Add />}
              onClick={() => setTaskEditor({})}
            >
              {t('routines.addTask')}
            </Button>
          </Stack>
          {selected?.items?.map((item, index) => (
            <Card key={item.id} variant='outlined'>
              <Stack direction='row' spacing={1} alignItems='center'>
                <Typography level='body-sm'>{index + 1}.</Typography>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <TaskSummary item={item} members={members} />
                </Box>
                <Stack direction='row'>
                  <IconButton
                    size='sm'
                    disabled={index === 0}
                    aria-label={t('routines.moveTaskUp', { name: item.name })}
                    onClick={() => move(index, -1)}
                  >
                    <ArrowUpward />
                  </IconButton>
                  <IconButton
                    size='sm'
                    disabled={index === selected.items.length - 1}
                    aria-label={t('routines.moveTaskDown', { name: item.name })}
                    onClick={() => move(index, 1)}
                  >
                    <ArrowDownward />
                  </IconButton>
                  <IconButton
                    size='sm'
                    aria-label={t('routines.editTask', { name: item.name })}
                    onClick={() => setTaskEditor(item)}
                  >
                    <Edit />
                  </IconButton>
                  <Button
                    size='sm'
                    color='danger'
                    variant='plain'
                    onClick={() => removeTask(item)}
                  >
                    {t('routines.remove')}
                  </Button>
                </Stack>
              </Stack>
            </Card>
          ))}
        </Stack>
      </AppModal>
      <PackDialog
        open={packEditor !== null}
        pack={packEditor?.id ? packEditor : null}
        onClose={() => setPackEditor(null)}
        onSave={savePack}
        busy={mutation.isPending}
      />
      <TaskDialog
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
    </Box>
  )
}

export default RoutinesView
