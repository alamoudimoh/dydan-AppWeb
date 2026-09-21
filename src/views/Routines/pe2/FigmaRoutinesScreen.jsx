/* ─────────────────────────────────────────────
   PE2 RoutinesScreen port. The inner RoutinesScreen
   component is a verbatim JS port of
   Dydan-AppWebProductExperience02/src/screens/RoutinesScreen.tsx
   (create panel + filter/stats + expandable routine
   cards with inline edit / steps view), rendered with
   PE2 fixture data (ROUTINES) through the shared
   pe2 task-store ctx.
───────────────────────────────────────────── */
import { useState } from 'react'

import FigmaIcon from '../../../components/FigmaIcon'
import { getMemberById, ROUTINES } from '../../../pe2/fixtures'
import {
  ConfirmDialog,
  CreateTaskModal,
  TaskDetailModal,
  ToastContainer,
  usePe2Tasks,
} from '../../../pe2/pe2Ui'

const ICONS = [
  '🌅',
  '🌙',
  '🏠',
  '🎒',
  '💪',
  '🍽️',
  '📚',
  '🚶',
  '🧘',
  '🐕',
  '🌿',
  '⚡',
]
const SCHEDULES = [
  'Daily',
  'Weekdays',
  'Weekends',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
  'Weekly',
  'Monthly',
]

function RoutinesScreen({ ctx }) {
  const [expanded, setExpanded] = useState('routine-morning')
  const [filter, setFilter] = useState('all')
  const [activeIds, setActiveIds] = useState(new Set(ROUTINES.map(r => r.id)))
  const [showCreate, setShowCreate] = useState(false)
  const [editingId, setEditingId] = useState(null)

  const [form, setForm] = useState({
    name: '',
    icon: '🌅',
    schedule: 'Daily',
    time: '',
    description: '',
    requiresApproval: false,
    pointsPerTask: '10',
  })

  const isChild = ctx.persona === 'child'
  const routines = isChild
    ? ROUTINES.filter(r => r.assigneeId === 'liam')
    : ROUTINES
  const filtered =
    filter === 'active'
      ? routines.filter(r => activeIds.has(r.id))
      : filter === 'inactive'
        ? routines.filter(r => !activeIds.has(r.id))
        : routines

  const toggleActive = (id, e) => {
    e.stopPropagation()
    setActiveIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
        ctx.showToast('Routine deactivated')
      } else {
        next.add(id)
        ctx.showToast('Routine activated')
      }
      return next
    })
  }

  const handleCreate = () => {
    if (!form.name.trim()) {
      ctx.showToast('Please enter a routine name')
      return
    }
    ctx.showToast(`Routine "${form.name}" created`)
    setForm({
      name: '',
      icon: '🌅',
      schedule: 'Daily',
      time: '',
      description: '',
      requiresApproval: false,
      pointsPerTask: '10',
    })
    setShowCreate(false)
  }

  const handleStartEdit = (id, e) => {
    e.stopPropagation()
    setEditingId(id)
    setExpanded(id)
  }

  const inactiveCount = routines.filter(r => !activeIds.has(r.id)).length

  return (
    <div style={{ maxWidth: 1080, margin: '0 auto', padding: '0 0 40px' }}>
      <div className='page-header pb-5'>
        <div>
          <h1
            className='text-primary'
            style={{ fontSize: 24, fontWeight: 800, margin: 0 }}
          >
            Routines
          </h1>
          <div className='text-muted' style={{ fontSize: 13, marginTop: 4 }}>
            Recurring daily and weekly flows
          </div>
        </div>
        {!isChild && (
          <button
            className='btn btn-primary'
            onClick={() => {
              setShowCreate(!showCreate)
              setEditingId(null)
            }}
          >
            {showCreate ? (
              <>
                <FigmaIcon name='x' size={14} />
                Cancel
              </>
            ) : (
              <>
                <FigmaIcon name='plus' size={14} />
                New routine
              </>
            )}
          </button>
        )}
      </div>

      <div className='px-4 md:px-7'>
        {/* Create routine panel */}
        {showCreate && (
          <div className='card mb-5 overflow-hidden'>
            <div
              className='px-5 py-4 border-b'
              style={{
                borderColor: 'var(--line)',
                background: 'var(--brand-faint)',
              }}
            >
              <div className='font-bold text-primary' style={{ fontSize: 15 }}>
                New routine
              </div>
            </div>
            <div
              className='px-5 py-4 grid gap-4'
              style={{ gridTemplateColumns: '1fr 1fr' }}
            >
              {/* Icon picker */}
              <div className='col-span-full'>
                <div className='section-label mb-2' style={{ padding: 0 }}>
                  Icon
                </div>
                <div className='flex gap-2 flex-wrap'>
                  {ICONS.map(ic => (
                    <button
                      key={ic}
                      onClick={() => setForm(f => ({ ...f, icon: ic }))}
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: 'var(--r-sm)',
                        fontSize: 20,
                        background:
                          form.icon === ic
                            ? 'var(--brand-faint)'
                            : 'var(--surface-2)',
                        border:
                          form.icon === ic
                            ? '2px solid var(--brand)'
                            : '2px solid transparent',
                        cursor: 'pointer',
                      }}
                    >
                      {ic}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label
                  className='section-label'
                  style={{ padding: '0 0 6px', display: 'block' }}
                >
                  Name
                </label>
                <input
                  placeholder='e.g. Morning Routine'
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className='w-full px-3 py-2 rounded-lg border'
                  style={{
                    background: 'var(--surface-2)',
                    border: '1px solid var(--line)',
                    color: 'var(--t-primary)',
                    fontSize: 14,
                    fontFamily: 'var(--font-ui)',
                    borderRadius: 'var(--r-md)',
                  }}
                />
              </div>

              <div>
                <label
                  className='section-label'
                  style={{ padding: '0 0 6px', display: 'block' }}
                >
                  Schedule
                </label>
                <select
                  value={form.schedule}
                  onChange={e =>
                    setForm(f => ({ ...f, schedule: e.target.value }))
                  }
                  className='w-full px-3 py-2 rounded-lg border'
                  style={{
                    background: 'var(--surface-2)',
                    border: '1px solid var(--line)',
                    color: 'var(--t-primary)',
                    fontSize: 14,
                    fontFamily: 'var(--font-ui)',
                    borderRadius: 'var(--r-md)',
                  }}
                >
                  {SCHEDULES.map(s => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  className='section-label'
                  style={{ padding: '0 0 6px', display: 'block' }}
                >
                  Start time (optional)
                </label>
                <input
                  type='time'
                  value={form.time}
                  onChange={e => setForm(f => ({ ...f, time: e.target.value }))}
                  className='w-full px-3 py-2 rounded-lg border'
                  style={{
                    background: 'var(--surface-2)',
                    border: '1px solid var(--line)',
                    color: 'var(--t-primary)',
                    fontSize: 14,
                    fontFamily: 'var(--font-ui)',
                    borderRadius: 'var(--r-md)',
                  }}
                />
              </div>

              <div>
                <label
                  className='section-label'
                  style={{ padding: '0 0 6px', display: 'block' }}
                >
                  Points per task
                </label>
                <input
                  type='number'
                  min='0'
                  max='100'
                  value={form.pointsPerTask}
                  onChange={e =>
                    setForm(f => ({ ...f, pointsPerTask: e.target.value }))
                  }
                  className='w-full px-3 py-2 rounded-lg border'
                  style={{
                    background: 'var(--surface-2)',
                    border: '1px solid var(--line)',
                    color: 'var(--t-primary)',
                    fontSize: 14,
                    fontFamily: 'var(--font-ui)',
                    borderRadius: 'var(--r-md)',
                  }}
                />
              </div>

              <div className='col-span-full'>
                <label
                  className='section-label'
                  style={{ padding: '0 0 6px', display: 'block' }}
                >
                  Description (optional)
                </label>
                <textarea
                  placeholder='What is this routine for?'
                  value={form.description}
                  onChange={e =>
                    setForm(f => ({ ...f, description: e.target.value }))
                  }
                  rows={2}
                  className='w-full px-3 py-2 rounded-lg border'
                  style={{
                    background: 'var(--surface-2)',
                    border: '1px solid var(--line)',
                    color: 'var(--t-primary)',
                    fontSize: 14,
                    fontFamily: 'var(--font-ui)',
                    borderRadius: 'var(--r-md)',
                    resize: 'none',
                  }}
                />
              </div>

              <div className='col-span-full flex items-center gap-2'>
                <input
                  type='checkbox'
                  id='approval'
                  checked={form.requiresApproval}
                  onChange={e =>
                    setForm(f => ({ ...f, requiresApproval: e.target.checked }))
                  }
                  style={{ width: 16, height: 16 }}
                />
                <label
                  htmlFor='approval'
                  className='text-primary'
                  style={{ fontSize: 14 }}
                >
                  Require approval on completion
                </label>
              </div>
            </div>
            <div
              className='px-5 py-3 border-t flex gap-2'
              style={{ borderColor: 'var(--line)' }}
            >
              <button className='btn btn-primary' onClick={handleCreate}>
                Create routine
              </button>
              <button
                className='btn btn-secondary'
                onClick={() => setShowCreate(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Filter + stats row */}
        <div className='flex items-center justify-between gap-3 mb-4 flex-wrap'>
          <div className='flex gap-2'>
            {[
              { id: 'all', label: `All (${routines.length})` },
              {
                id: 'active',
                label: `Active (${routines.length - inactiveCount})`,
              },
              ...(inactiveCount > 0
                ? [{ id: 'inactive', label: `Inactive (${inactiveCount})` }]
                : []),
            ].map(f => (
              <button
                key={f.id}
                className={`btn btn-sm ${filter === f.id ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setFilter(f.id)}
              >
                {f.label}
              </button>
            ))}
          </div>
          <div className='text-faint' style={{ fontSize: 12 }}>
            {routines.reduce((sum, r) => sum + r.streak, 0)} total streak days
            across all routines
          </div>
        </div>

        <div className='flex flex-col gap-3'>
          {filtered.map(r => {
            const assignee = r.assigneeId ? getMemberById(r.assigneeId) : null
            const isExpanded = expanded === r.id
            const isActive = activeIds.has(r.id)
            const streakColor =
              r.streak >= 7
                ? 'var(--sig-done)'
                : r.streak >= 3
                  ? 'var(--sig-due)'
                  : 'var(--t-faint)'
            const isEditing = editingId === r.id

            return (
              <div
                key={r.id}
                className='card overflow-hidden'
                style={{ opacity: isActive ? 1 : 0.65 }}
              >
                <button
                  className='w-full flex items-center gap-4 px-5 py-4'
                  style={{
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    textAlign: 'start',
                    fontFamily: 'var(--font-ui)',
                  }}
                  onClick={() => {
                    setExpanded(isExpanded ? null : r.id)
                    setEditingId(null)
                  }}
                >
                  <span style={{ fontSize: 28, lineHeight: 1 }}>{r.icon}</span>
                  <div className='flex-1 min-w-0'>
                    <div className='flex items-center gap-2 flex-wrap'>
                      <div
                        className='font-bold text-primary'
                        style={{ fontSize: 15 }}
                      >
                        {r.name}
                      </div>
                      {!isActive && (
                        <span
                          className='badge'
                          style={{
                            background: 'var(--surface-2)',
                            color: 'var(--t-muted)',
                            fontSize: 10,
                          }}
                        >
                          Inactive
                        </span>
                      )}
                    </div>
                    <div className='flex items-center gap-3 mt-1 flex-wrap'>
                      <span className='text-muted' style={{ fontSize: 12 }}>
                        {r.schedule}
                        {r.time ? ` · ${r.time}` : ''}
                      </span>
                      <span
                        className='badge'
                        style={{
                          background: `color-mix(in srgb, ${streakColor} 10%, transparent)`,
                          color: streakColor,
                          fontSize: 11,
                        }}
                      >
                        🔥 {r.streak}-day streak
                      </span>
                      {assignee && (
                        <div className='flex items-center gap-1'>
                          <div
                            className='avatar'
                            style={{
                              width: 16,
                              height: 16,
                              background: assignee.avatarColor,
                              fontSize: 7,
                            }}
                          >
                            {assignee.initials}
                          </div>
                          <span className='text-faint' style={{ fontSize: 11 }}>
                            {assignee.name}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className='flex items-center gap-2'>
                    {!isChild && (
                      <button
                        className='btn btn-sm'
                        style={{
                          background: isActive
                            ? 'var(--sig-done-bg)'
                            : 'var(--surface-2)',
                          color: isActive
                            ? 'var(--sig-done)'
                            : 'var(--t-muted)',
                          fontSize: 11,
                          padding: '3px 10px',
                        }}
                        onClick={e => toggleActive(r.id, e)}
                      >
                        {isActive ? 'Active' : 'Inactive'}
                      </button>
                    )}
                    <FigmaIcon
                      name='chevron_down'
                      size={16}
                      style={{
                        color: 'var(--t-faint)',
                        transform: isExpanded ? 'rotate(180deg)' : 'none',
                        transition: 'transform 0.2s',
                      }}
                    />
                  </div>
                </button>

                {isExpanded && (
                  <div
                    className='border-t px-5 py-4'
                    style={{ borderColor: 'var(--line)' }}
                  >
                    {isEditing ? (
                      /* ── Inline edit form ── */
                      <div className='flex flex-col gap-3'>
                        <div className='section-label' style={{ padding: 0 }}>
                          Edit routine
                        </div>
                        <div
                          className='grid gap-3'
                          style={{ gridTemplateColumns: '1fr 1fr' }}
                        >
                          <div>
                            <label
                              className='text-faint'
                              style={{
                                fontSize: 11,
                                fontWeight: 700,
                                textTransform: 'uppercase',
                                letterSpacing: '0.06em',
                                display: 'block',
                                marginBottom: 4,
                              }}
                            >
                              Name
                            </label>
                            <input
                              defaultValue={r.name}
                              className='w-full px-3 py-2 rounded-lg border'
                              style={{
                                background: 'var(--surface-2)',
                                border: '1px solid var(--line)',
                                color: 'var(--t-primary)',
                                fontSize: 14,
                                fontFamily: 'var(--font-ui)',
                                borderRadius: 'var(--r-md)',
                              }}
                            />
                          </div>
                          <div>
                            <label
                              className='text-faint'
                              style={{
                                fontSize: 11,
                                fontWeight: 700,
                                textTransform: 'uppercase',
                                letterSpacing: '0.06em',
                                display: 'block',
                                marginBottom: 4,
                              }}
                            >
                              Schedule
                            </label>
                            <select
                              defaultValue={r.schedule}
                              className='w-full px-3 py-2 rounded-lg border'
                              style={{
                                background: 'var(--surface-2)',
                                border: '1px solid var(--line)',
                                color: 'var(--t-primary)',
                                fontSize: 14,
                                fontFamily: 'var(--font-ui)',
                                borderRadius: 'var(--r-md)',
                              }}
                            >
                              {SCHEDULES.map(s => (
                                <option key={s} value={s}>
                                  {s}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                        <div className='flex gap-2'>
                          <button
                            className='btn btn-sm btn-primary'
                            onClick={() => {
                              setEditingId(null)
                              ctx.showToast('Routine saved')
                            }}
                          >
                            Save changes
                          </button>
                          <button
                            className='btn btn-sm btn-secondary'
                            onClick={() => setEditingId(null)}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* ── Steps view ── */
                      <div>
                        <div
                          className='section-label mb-3'
                          style={{ padding: 0 }}
                        >
                          Steps in this routine
                        </div>
                        <div className='flex flex-col gap-2 mb-4'>
                          {r.taskTitles.map((title, i) => (
                            <div
                              key={i}
                              className='flex items-center gap-3 p-2 rounded-lg'
                              style={{
                                background: 'var(--surface-2)',
                                borderRadius: 'var(--r-md)',
                              }}
                            >
                              <div
                                className='flex items-center justify-center font-bold'
                                style={{
                                  width: 22,
                                  height: 22,
                                  borderRadius: '50%',
                                  background: 'var(--line)',
                                  color: 'var(--t-muted)',
                                  fontSize: 11,
                                  flexShrink: 0,
                                }}
                              >
                                {i + 1}
                              </div>
                              <span
                                className='text-primary flex-1'
                                style={{ fontSize: 13 }}
                              >
                                {title}
                              </span>
                            </div>
                          ))}
                        </div>
                        {!isChild && (
                          <div className='flex gap-2'>
                            <button
                              className='btn btn-sm btn-secondary'
                              onClick={e => handleStartEdit(r.id, e)}
                            >
                              Edit routine
                            </button>
                            <button
                              className='btn btn-sm btn-ghost'
                              onClick={e => toggleActive(r.id, e)}
                            >
                              {isActive ? 'Deactivate' : 'Activate'}
                            </button>
                            <button
                              className='btn btn-sm btn-ghost'
                              style={{ color: 'var(--sig-over)' }}
                              onClick={() =>
                                ctx.showConfirm({
                                  title: 'Delete routine?',
                                  message: `"${r.name}" and all its steps will be permanently deleted.`,
                                  danger: true,
                                  confirmLabel: 'Delete',
                                  onConfirm: () =>
                                    ctx.showToast('Routine deleted'),
                                })
                              }
                            >
                              Delete
                            </button>
                          </div>
                        )}
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
              <div className='font-bold text-primary' style={{ fontSize: 16 }}>
                {filter === 'inactive'
                  ? 'No inactive routines'
                  : 'No routines yet'}
              </div>
              <div className='text-muted' style={{ fontSize: 13 }}>
                Routines help you build consistent habits.
              </div>
              {!isChild && (
                <button
                  className='btn btn-primary mt-2'
                  onClick={() => setShowCreate(true)}
                >
                  <FigmaIcon name='plus' size={15} />
                  Create routine
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/* ─── Route wrapper ─────────────────────── */
const FigmaRoutinesScreen = () => {
  const {
    closeConfirm,
    completeTask,
    confirmDialog,
    createTask,
    ctx,
    deleteTask,
    openEditTask,
    reopenTask,
    showCreateTask,
    taskDetail,
    taskToEdit,
    toasts,
    updateTask,
  } = usePe2Tasks()

  return (
    <>
      <RoutinesScreen ctx={ctx} />
      {taskDetail && (
        <TaskDetailModal
          task={taskDetail}
          ctx={ctx}
          onComplete={completeTask}
          onDelete={deleteTask}
          onEdit={openEditTask}
          onReopen={reopenTask}
        />
      )}
      {showCreateTask && (
        <CreateTaskModal
          ctx={ctx}
          onCreated={(title, details) => createTask(title, details)}
        />
      )}
      {taskToEdit && (
        <CreateTaskModal
          ctx={ctx}
          taskToEdit={taskToEdit}
          onCreated={(title, details) =>
            updateTask(taskToEdit.id, title, details)
          }
        />
      )}
      {confirmDialog && (
        <ConfirmDialog config={confirmDialog} onClose={closeConfirm} />
      )}
      {toasts.length > 0 && <ToastContainer toasts={toasts} />}
    </>
  )
}

export default FigmaRoutinesScreen
