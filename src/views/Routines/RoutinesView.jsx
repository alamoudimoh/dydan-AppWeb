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
  Modal,
  ModalClose,
  ModalDialog,
  Option,
  Select,
  Stack,
  Textarea,
  Typography,
} from '@mui/joy'
import { useEffect, useMemo, useState } from 'react'

import EmptyState from '../../components/common/EmptyState'
import { useRoutineMutation, useRoutines } from '../../queries/RoutineQueries'
import { useNotification } from '../../service/NotificationProvider'
import { GetAllCircleMembers, GetAssets, GetMeters } from '../../utils/Fetcher'

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

const recurrence = item => {
  const labels = {
    once: 'One-time',
    daily: 'Daily',
    weekly: 'Weekly',
    monthly: 'Monthly',
    yearly: 'Yearly',
    interval: `Every ${item.frequency || 1} ${item.frequencyMetadata?.unit || 'days'}`,
    days_of_the_week: (item.frequencyMetadata?.days || [])
      .map(day => day.slice(0, 3))
      .join(', '),
    day_of_the_month: `Monthly on day ${item.frequencyMetadata?.days?.[0] || 1}`,
  }
  return labels[item.frequencyType] || item.frequencyType
}

const memberName = (members, id) =>
  members.find(member => member.userId === id)?.displayName ||
  members.find(member => member.userId === id)?.username ||
  `Member ${id}`

const TaskSummary = ({ item, members }) => (
  <Stack spacing={0.35} sx={{ minWidth: 0 }}>
    <Typography level='title-sm'>{item.name}</Typography>
    <Typography level='body-xs'>
      {recurrence(item)} · {item.points || 0} pts
      {item.requireApproval ? ' · Approval required' : ''}
    </Typography>
    <Typography level='body-xs'>
      {(item.assigneeIds || []).length
        ? item.assigneeIds.map(id => memberName(members, id)).join(', ')
        : 'Any active Circle member'}
      {item.requireAsset ? ' · Choose Asset when used' : ''}
    </Typography>
  </Stack>
)

const PackDialog = ({ busy, onClose, onSave, open, pack }) => {
  const [form, setForm] = useState({ name: '', description: '' })
  useEffect(() => {
    if (open)
      setForm({ name: pack?.name || '', description: pack?.description || '' })
  }, [open, pack])
  return (
    <Modal open={open} onClose={onClose}>
      <ModalDialog sx={{ width: 'min(520px, calc(100vw - 32px))' }}>
        <ModalClose />
        <Typography level='h3'>
          {pack ? 'Edit Routine' : 'New Routine Pack'}
        </Typography>
        <FormControl required>
          <FormLabel>Name</FormLabel>
          <Input
            autoFocus
            value={form.name}
            onChange={event => setForm({ ...form, name: event.target.value })}
          />
        </FormControl>
        <FormControl>
          <FormLabel>Description</FormLabel>
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
          Save Routine
        </Button>
      </ModalDialog>
    </Modal>
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
    <Modal open={open} onClose={onClose}>
      <ModalDialog
        layout='fullscreen'
        sx={{ width: 'min(720px, 100vw)', overflowY: 'auto' }}
      >
        <ModalClose />
        <Typography level='h3'>{item ? 'Edit Task' : 'Add Task'}</Typography>
        <FormControl required>
          <FormLabel>Task name</FormLabel>
          <Input
            value={form.name}
            onChange={event => setForm({ ...form, name: event.target.value })}
          />
        </FormControl>
        <FormControl>
          <FormLabel>Description</FormLabel>
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
            <FormLabel>Repeat</FormLabel>
            <Select
              value={form.frequencyType}
              onChange={(_, value) =>
                setForm({ ...form, frequencyType: value })
              }
            >
              <Option value='once'>One-time</Option>
              <Option value='daily'>Daily</Option>
              <Option value='weekly'>Weekly</Option>
              <Option value='monthly'>Monthly</Option>
              <Option value='yearly'>Yearly</Option>
              <Option value='interval'>Custom interval</Option>
              <Option value='days_of_the_week'>Selected weekdays</Option>
              <Option value='day_of_the_month'>Day of month</Option>
            </Select>
          </FormControl>
          {form.frequencyType === 'interval' && (
            <>
              <FormControl sx={{ width: { sm: 120 } }}>
                <FormLabel>Every</FormLabel>
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
                <FormLabel>Unit</FormLabel>
                <Select
                  value={form.intervalUnit}
                  onChange={(_, value) =>
                    setForm({ ...form, intervalUnit: value })
                  }
                >
                  {['hours', 'days', 'weeks', 'months', 'years'].map(unit => (
                    <Option key={unit} value={unit}>
                      {unit}
                    </Option>
                  ))}
                </Select>
              </FormControl>
            </>
          )}
        </Stack>
        {form.frequencyType === 'days_of_the_week' && (
          <FormControl>
            <FormLabel>Weekdays</FormLabel>
            <Stack direction='row' flexWrap='wrap' gap={1}>
              {DAYS.map(day => (
                <Checkbox
                  key={day}
                  label={day.slice(0, 3)}
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
            <FormLabel>Day of month</FormLabel>
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
          <FormLabel>Assignment behavior</FormLabel>
          <Select
            value={form.assignStrategy}
            onChange={(_, value) => setForm({ ...form, assignStrategy: value })}
          >
            <Option value='no_assignee'>Anyone</Option>
            <Option value='random'>Random</Option>
            <Option value='round_robin'>Rotating</Option>
            <Option value='least_assigned'>Least assigned</Option>
            <Option value='least_completed'>Least completed</Option>
            <Option value='keep_last_assigned'>Keep last assigned</Option>
          </Select>
        </FormControl>
        <FormControl>
          <FormLabel>Eligible Circle members</FormLabel>
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
          <Typography level='body-xs'>
            Leave empty to include all active Circle members when the Routine is
            used.
          </Typography>
        </FormControl>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
          <FormControl sx={{ flex: 1 }}>
            <FormLabel>Points</FormLabel>
            <Input
              type='number'
              slotProps={{ input: { min: 0 } }}
              value={form.points}
              onChange={event =>
                setForm({ ...form, points: event.target.value })
              }
            />
          </FormControl>
          <FormControl sx={{ justifyContent: 'end' }}>
            <Checkbox
              label='Require approval'
              checked={form.requireApproval}
              onChange={event =>
                setForm({ ...form, requireApproval: event.target.checked })
              }
            />
          </FormControl>
        </Stack>
        <Divider />
        <FormControl>
          <FormLabel>Asset binding</FormLabel>
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
            <Option value='none'>No Asset</Option>
            <Option value='fixed'>Use an existing Asset</Option>
            <Option value='required'>Choose an Asset when used</Option>
          </Select>
        </FormControl>
        {form.assetMode === 'fixed' && (
          <FormControl required>
            <FormLabel>Asset</FormLabel>
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
              <FormLabel>Meter schedule (optional)</FormLabel>
              <Select
                value={form.meterId}
                onChange={(_, value) => setForm({ ...form, meterId: value })}
              >
                <Option value={null}>None</Option>
                {matchingMeters.map(meter => (
                  <Option key={meter.id} value={meter.id}>
                    {meter.name}
                  </Option>
                ))}
              </Select>
            </FormControl>
            {form.meterId && (
              <FormControl sx={{ width: { sm: 180 } }} required>
                <FormLabel>Every meter units</FormLabel>
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
          Save Task
        </Button>
      </ModalDialog>
    </Modal>
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
    <Modal open={open} onClose={onClose}>
      <ModalDialog
        sx={{ width: 'min(620px, calc(100vw - 24px))', maxHeight: '90vh' }}
      >
        <ModalClose />
        <Typography level='h3'>Use “{pack?.name}”?</Typography>
        <Typography level='body-sm'>
          {pack?.items?.length || 0} independent Tasks will be created. Editing
          this Routine later will not change them.
        </Typography>
        <FormControl required>
          <FormLabel>Start / Apply Date</FormLabel>
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
                      <FormLabel>Asset for {item.name}</FormLabel>
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
            Cancel
          </Button>
          <Button
            loading={busy}
            disabled={!ready || !pack?.items?.length}
            onClick={() => onApply(startDate, selections)}
          >
            Create {pack?.items?.length || 0} Tasks
          </Button>
        </Stack>
      </ModalDialog>
    </Modal>
  )
}

const RoutinesView = () => {
  const [includeArchived, setIncludeArchived] = useState(false)
  const { data, error, isLoading } = useRoutines(includeArchived)
  const mutation = useRoutineMutation()
  const { showError, showSuccess } = useNotification()
  const [selected, setSelected] = useState(null)
  const [packEditor, setPackEditor] = useState(null)
  const [taskEditor, setTaskEditor] = useState(null)
  const [applying, setApplying] = useState(false)
  const [members, setMembers] = useState([])
  const [assets, setAssets] = useState([])
  const [meters, setMeters] = useState([])
  const packs = data?.res || []

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
      showSuccess('Routine saved')
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
      showSuccess('Routine task saved')
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
      showSuccess(pack.isActive ? 'Routine archived' : 'Routine reactivated')
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
      showSuccess(`${result.res.choreIds.length} Tasks created`)
    }
  }

  return (
    <Container sx={{ py: 3, pb: 10 }}>
      <Stack spacing={2.5}>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1.5}
          justifyContent='space-between'
          alignItems={{ sm: 'center' }}
        >
          <Box>
            <Typography level='h2'>Routines</Typography>
            <Typography level='body-sm'>
              Save repeatable sets of Tasks and use them whenever you need them.
            </Typography>
          </Box>
          <Button startDecorator={<Add />} onClick={() => setPackEditor({})}>
            New Routine
          </Button>
        </Stack>
        <Checkbox
          label='Show archived Routines'
          checked={includeArchived}
          onChange={event => setIncludeArchived(event.target.checked)}
        />
        {error && <Typography color='danger'>{error.message}</Typography>}
        {!isLoading && packs.length === 0 && (
          <EmptyState
            title='No Routines yet'
            description='Create a Routine Pack for chores you repeat together.'
          />
        )}
        <Stack spacing={1.5}>
          {packs.map(pack => (
            <Card key={pack.id} variant='outlined'>
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={1.5}
                alignItems={{ sm: 'center' }}
              >
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Stack direction='row' spacing={1} alignItems='center'>
                    <Typography level='title-lg'>{pack.name}</Typography>
                    {!pack.isActive && <Chip color='neutral'>Archived</Chip>}
                  </Stack>
                  {pack.description && (
                    <Typography level='body-sm'>{pack.description}</Typography>
                  )}
                  <Typography level='body-xs'>
                    {pack.items?.length || 0} Tasks
                  </Typography>
                </Box>
                <Stack direction='row' spacing={1} flexWrap='wrap'>
                  <Button variant='soft' onClick={() => setSelected(pack)}>
                    Open
                  </Button>
                  {pack.isActive && (
                    <Button
                      startDecorator={<PlayArrow />}
                      onClick={() => {
                        setSelected(pack)
                        setApplying(true)
                      }}
                    >
                      Use Routine
                    </Button>
                  )}
                </Stack>
              </Stack>
            </Card>
          ))}
        </Stack>
      </Stack>

      <Modal
        open={Boolean(selected) && !applying}
        onClose={() => setSelected(null)}
      >
        <ModalDialog
          layout='fullscreen'
          sx={{ width: 'min(760px, 100vw)', overflowY: 'auto' }}
        >
          <ModalClose />
          <Stack spacing={2}>
            <Box>
              <Stack direction='row' spacing={1} alignItems='center'>
                <Typography level='h2'>{selected?.name}</Typography>
                {!selected?.isActive && <Chip>Archived</Chip>}
              </Stack>
              <Typography level='body-sm'>{selected?.description}</Typography>
            </Box>
            <Stack direction='row' spacing={1} flexWrap='wrap'>
              <Button
                startDecorator={<Edit />}
                variant='soft'
                onClick={() => setPackEditor(selected)}
              >
                Edit Routine
              </Button>
              <Button
                startDecorator={selected?.isActive ? <Archive /> : <Restore />}
                variant='soft'
                color='neutral'
                onClick={() => setActive(selected)}
              >
                {selected?.isActive ? 'Archive' : 'Reactivate'}
              </Button>
              {selected?.isActive && (
                <Button
                  startDecorator={<PlayArrow />}
                  onClick={() => setApplying(true)}
                  disabled={!selected?.items?.length}
                >
                  Use Routine
                </Button>
              )}
            </Stack>
            <Divider />
            <Stack direction='row' justifyContent='space-between'>
              <Typography level='title-lg'>Tasks</Typography>
              <Button
                size='sm'
                startDecorator={<Add />}
                onClick={() => setTaskEditor({})}
              >
                Add Task
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
                      onClick={() => move(index, -1)}
                    >
                      <ArrowUpward />
                    </IconButton>
                    <IconButton
                      size='sm'
                      disabled={index === selected.items.length - 1}
                      onClick={() => move(index, 1)}
                    >
                      <ArrowDownward />
                    </IconButton>
                    <IconButton size='sm' onClick={() => setTaskEditor(item)}>
                      <Edit />
                    </IconButton>
                    <Button
                      size='sm'
                      color='danger'
                      variant='plain'
                      onClick={() => removeTask(item)}
                    >
                      Remove
                    </Button>
                  </Stack>
                </Stack>
              </Card>
            ))}
          </Stack>
        </ModalDialog>
      </Modal>
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
    </Container>
  )
}

export default RoutinesView
