import { useState } from 'react'

import { AppCtx, Icon } from '../App'
import MemberPicker from '../components/MemberPicker'
import PageHeader from '../components/PageHeader'
import ThemeSelect from '../components/ThemeSelect'
import { useRoutineMutations } from '../hooks/useHousehold'
import { useLiveData } from '../model/liveData'

type FilterMode = 'all' | 'active' | 'inactive'
type RoutineForm = {
  name: string
  description: string
  schedule: 'Daily' | 'Weekly' | 'Monthly'
  pointsPerTask: string
  taskTitles: string
  assigneeId: string
  requiresApproval: boolean
}

const emptyForm = (): RoutineForm => ({
  name: '',
  description: '',
  schedule: 'Daily',
  pointsPerTask: '10',
  taskTitles: '',
  assigneeId: '',
  requiresApproval: false,
})

const frequencyFor = (schedule: RoutineForm['schedule']) =>
  schedule.toLowerCase() as 'daily' | 'weekly' | 'monthly'

const routineID = (id: string) => Number(id.replace(/^routine-/, ''))

export default function RoutinesScreen({ ctx }: { ctx: AppCtx }) {
  const { currentUser, memberById, routines } = useLiveData()
  const mutations = useRoutineMutations()
  const [expanded, setExpanded] = useState<string | null>(null)
  const [filter, setFilter] = useState<FilterMode>('all')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<RoutineForm>(emptyForm)

  const isChild = ctx.persona === 'child'
  const visible = isChild
    ? routines.filter(r => r.assigneeId === currentUser?.id)
    : routines
  const filtered = visible.filter(r =>
    filter === 'all'
      ? true
      : filter === 'active'
        ? r.active !== false
        : r.active === false,
  )
  const inactiveCount = visible.filter(r => r.active === false).length

  const closeEditor = () => {
    setEditingId(null)
    setForm(emptyForm())
  }

  const startEdit = (id?: string) => {
    const routine = id ? routines.find(item => item.id === id) : undefined
    if (routine) {
      setEditingId(routine.id)
      setForm({
        name: routine.name,
        description: routine.description ?? '',
        schedule:
          routine.schedule === 'Weekly' || routine.schedule === 'Monthly'
            ? routine.schedule
            : 'Daily',
        pointsPerTask: String(routine.pointsPerTask ?? 0),
        taskTitles: routine.taskTitles.join('\n'),
        assigneeId: routine.assigneeId ?? '',
        requiresApproval: routine.requiresApproval ?? false,
      })
    } else {
      setEditingId('new')
      setForm(emptyForm())
    }
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const save = async () => {
    const name = form.name.trim()
    const points = Number(form.pointsPerTask)
    const taskTitles = form.taskTitles
      .split('\n')
      .map(title => title.trim())
      .filter(Boolean)
    if (!name || taskTitles.length === 0) {
      ctx.showToast('Enter a routine name and at least one step')
      return
    }
    if (!Number.isInteger(points) || points < 0) {
      ctx.showToast('Points must be a whole number of zero or more')
      return
    }
    const input = {
      name,
      description: form.description.trim(),
      items: taskTitles.map(taskName => ({
        name: taskName,
        frequencyType: frequencyFor(form.schedule),
        frequency: 1,
        assignedTo: form.assigneeId ? Number(form.assigneeId) : null,
        assignStrategy: 'no_assignee' as const,
        points,
        requireApproval: form.requiresApproval,
      })),
    }
    try {
      if (editingId && editingId !== 'new') {
        await mutations.updateRoutine.mutateAsync({
          id: routineID(editingId),
          ...input,
        })
        ctx.showToast('Routine saved')
      } else {
        const created = await mutations.createRoutine.mutateAsync(input)
        setExpanded(`routine-${created.id}`)
        ctx.showToast('Routine created')
      }
      closeEditor()
    } catch (error) {
      ctx.showToast(
        error instanceof Error ? error.message : 'Could not save routine',
      )
    }
  }

  const setActive = async (id: string, isActive: boolean) => {
    try {
      await mutations.setRoutineActive.mutateAsync({
        id: routineID(id),
        isActive,
      })
      ctx.showToast(isActive ? 'Routine activated' : 'Routine deactivated')
    } catch (error) {
      ctx.showToast(
        error instanceof Error ? error.message : 'Could not update routine',
      )
    }
  }

  return (
    <div style={{ maxWidth: 1080, margin: '0 auto', padding: '0 0 40px' }}>
      <PageHeader
        title='Routines'
        subtitle='Server-backed recurring task templates'
        actions={
          !isChild ? (
            <button className='btn btn-primary' onClick={() => startEdit()}>
              <Icon name='plus' size={14} /> New routine
            </button>
          ) : undefined
        }
      />

      <div className='px-4 md:px-7'>
        {editingId && !isChild && (
          <div
            className='card mb-5 p-5'
            aria-label={editingId === 'new' ? 'New routine' : 'Modify routine'}
          >
            <div className='form-title text-primary mb-4'>
              {editingId === 'new' ? 'New routine' : 'Modify routine'}
            </div>
            <div
              className='grid gap-4'
              style={{
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              }}
            >
              <label className='flex flex-col gap-1.5'>
                <span className='section-label' style={{ padding: 0 }}>
                  NAME
                </span>
                <input
                  className='input'
                  value={form.name}
                  onChange={event =>
                    setForm(current => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                />
              </label>
              <label className='flex flex-col gap-1.5'>
                <span className='section-label' style={{ padding: 0 }}>
                  SCHEDULE
                </span>
                <ThemeSelect
                  label='Schedule'
                  value={form.schedule}
                  options={['Daily', 'Weekly', 'Monthly'].map(value => ({
                    value,
                    label: value,
                  }))}
                  onChange={schedule =>
                    setForm(current => ({
                      ...current,
                      schedule: schedule as RoutineForm['schedule'],
                    }))
                  }
                />
              </label>
              <label className='flex flex-col gap-1.5'>
                <span className='section-label' style={{ padding: 0 }}>
                  POINTS PER STEP
                </span>
                <input
                  className='input'
                  type='number'
                  min='0'
                  step='1'
                  value={form.pointsPerTask}
                  onChange={event =>
                    setForm(current => ({
                      ...current,
                      pointsPerTask: event.target.value,
                    }))
                  }
                />
              </label>
              <label className='flex flex-col gap-1.5'>
                <span className='section-label' style={{ padding: 0 }}>
                  ASSIGNED TO
                </span>
                <MemberPicker
                  value={form.assigneeId}
                  allowUnassigned
                  onChange={assigneeId =>
                    setForm(current => ({ ...current, assigneeId }))
                  }
                />
              </label>
              <label className='col-span-full flex flex-col gap-1.5'>
                <span className='section-label' style={{ padding: 0 }}>
                  DESCRIPTION
                </span>
                <textarea
                  className='input'
                  rows={2}
                  value={form.description}
                  onChange={event =>
                    setForm(current => ({
                      ...current,
                      description: event.target.value,
                    }))
                  }
                />
              </label>
              <label className='col-span-full flex flex-col gap-1.5'>
                <span className='section-label' style={{ padding: 0 }}>
                  STEPS (ONE PER LINE)
                </span>
                <textarea
                  className='input'
                  rows={4}
                  value={form.taskTitles}
                  onChange={event =>
                    setForm(current => ({
                      ...current,
                      taskTitles: event.target.value,
                    }))
                  }
                />
              </label>
              <label className='col-span-full flex items-center gap-2 text-primary'>
                <input
                  type='checkbox'
                  checked={form.requiresApproval}
                  onChange={event =>
                    setForm(current => ({
                      ...current,
                      requiresApproval: event.target.checked,
                    }))
                  }
                />
                Require approval when each step is completed
              </label>
            </div>
            <div className='flex gap-2 mt-5'>
              <button
                className='btn btn-primary'
                disabled={
                  mutations.createRoutine.isPending ||
                  mutations.updateRoutine.isPending
                }
                onClick={save}
              >
                Save routine
              </button>
              <button className='btn btn-secondary' onClick={closeEditor}>
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className='flex gap-2 mb-4'>
          {(['all', 'active', 'inactive'] as FilterMode[]).map(mode => (
            <button
              key={mode}
              className={`btn btn-sm ${filter === mode ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setFilter(mode)}
            >
              {mode === 'all'
                ? `All (${visible.length})`
                : mode === 'active'
                  ? `Active (${visible.length - inactiveCount})`
                  : `Inactive (${inactiveCount})`}
            </button>
          ))}
        </div>

        <div className='flex flex-col gap-3'>
          {filtered.map(routine => {
            const isExpanded = expanded === routine.id
            const assignee = routine.assigneeId
              ? memberById(routine.assigneeId)
              : null
            const isActive = routine.active !== false
            return (
              <div
                key={routine.id}
                className='card overflow-hidden'
                style={{ opacity: isActive ? 1 : 0.65 }}
              >
                <button
                  className='w-full flex items-center gap-4 px-5 py-4 text-start'
                  style={{
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    fontFamily: 'var(--font-ui)',
                  }}
                  aria-expanded={isExpanded}
                  onClick={() => setExpanded(isExpanded ? null : routine.id)}
                >
                  <span style={{ fontSize: 28 }}>{routine.icon}</span>
                  <span className='flex-1'>
                    <span className='font-bold text-primary block'>
                      {routine.name}
                    </span>
                    <span className='text-muted' style={{ fontSize: 12 }}>
                      {routine.schedule}
                      {assignee ? ` · ${assignee.name}` : ''}
                    </span>
                  </span>
                  {!isActive && (
                    <span className='badge bg-surface-2 text-muted'>
                      Inactive
                    </span>
                  )}
                  <Icon name='chevron_down' size={16} />
                </button>
                {isExpanded && (
                  <div
                    className='border-t px-5 py-4'
                    style={{ borderColor: 'var(--line)' }}
                  >
                    {routine.description && (
                      <p className='text-muted mt-0'>{routine.description}</p>
                    )}
                    <div className='flex flex-col gap-2 mb-4'>
                      {routine.taskTitles.map((title, index) => (
                        <div
                          key={`${routine.id}-${index}`}
                          className='text-primary p-2 rounded-lg'
                          style={{ background: 'var(--surface-2)' }}
                        >
                          {index + 1}. {title}
                        </div>
                      ))}
                    </div>
                    {!isChild && (
                      <div className='flex gap-2'>
                        <button
                          className='btn btn-sm btn-secondary'
                          onClick={() => startEdit(routine.id)}
                        >
                          Modify routine
                        </button>
                        <button
                          className='btn btn-sm btn-ghost'
                          disabled={mutations.setRoutineActive.isPending}
                          onClick={() => setActive(routine.id, !isActive)}
                        >
                          {isActive ? 'Deactivate' : 'Activate'}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
          {filtered.length === 0 && (
            <div className='empty-state'>
              <div style={{ fontSize: 48 }}>🔄</div>
              <div className='font-bold text-primary'>No routines yet</div>
              <div className='text-muted'>
                Routines are saved to your household on creation.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
