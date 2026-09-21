/* ─────────────────────────────────────────────
   Shared PE2 UI replicas used by the Calendar and
   All Tasks route ports. Verbatim ports of the
   Product Experience 2 components (CreateTaskModal,
   TaskDetailModal, ConfirmDialog) plus the toast
   chrome and the local task-state hook that mirrors
   PE2's in-memory household store.
───────────────────────────────────────────── */
import { useCallback, useState } from 'react'

import FigmaIcon from '../components/FigmaIcon'
import { formatDate, getMemberById, MEMBERS, TASKS } from './fixtures'

/* ─── Toast chrome ──────────────────────── */
export function ToastContainer({ toasts }) {
  return (
    <div className='toast-container'>
      {toasts.map(t => (
        <div key={t.id} className='toast'>
          {t.msg}
        </div>
      ))}
    </div>
  )
}

/* ─── Confirm dialog ────────────────────── */
export function ConfirmDialog({ config, onClose }) {
  const handleConfirm = () => {
    config.onConfirm()
    onClose()
  }

  return (
    <div className='modal-overlay' onClick={onClose}>
      <div
        className='modal-panel'
        style={{ maxWidth: 400 }}
        onClick={e => e.stopPropagation()}
      >
        <div className='p-7'>
          <div className='flex items-start gap-4 mb-5'>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 'var(--r-md)',
                flexShrink: 0,
                background: config.danger
                  ? 'var(--sig-over-bg)'
                  : 'var(--brand-faint)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <FigmaIcon
                name={config.danger ? 'trash' : 'info'}
                size={22}
                style={{
                  color: config.danger ? 'var(--sig-over)' : 'var(--brand)',
                }}
              />
            </div>
            <div>
              <div
                className='font-bold text-primary mb-1.5'
                style={{ fontSize: 17 }}
              >
                {config.title}
              </div>
              <div
                className='text-muted'
                style={{ fontSize: 14, lineHeight: 1.6 }}
              >
                {config.message}
              </div>
            </div>
          </div>
          <div className='flex gap-3'>
            <button
              className='btn btn-secondary flex-1'
              style={{ justifyContent: 'center' }}
              onClick={onClose}
            >
              {config.cancelLabel || 'Cancel'}
            </button>
            <button
              className={`btn ${config.danger ? 'btn-danger' : 'btn-primary'} flex-1`}
              style={{ justifyContent: 'center' }}
              onClick={handleConfirm}
            >
              {config.confirmLabel || 'Confirm'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─── Create task modal ─────────────────── */
export function CreateTaskModal({ ctx, onCreated, taskToEdit }) {
  const [title, setTitle] = useState(taskToEdit?.title || '')
  const [assigneeId, setAssigneeId] = useState(
    taskToEdit?.assigneeId || 'sarah',
  )
  const [dueDate, setDueDate] = useState(taskToEdit?.dueDate || '2026-08-20')
  const [priority, setPriority] = useState(
    taskToEdit?.priority === 'high' ? 'high' : 'medium',
  )
  const [category, setCategory] = useState(taskToEdit?.category || 'household')
  const [points, setPoints] = useState(taskToEdit?.points || 20)

  const categories = [
    'household',
    'personal',
    'work',
    'school',
    'health',
    'finance',
  ]

  const submit = () => {
    if (!title.trim()) return
    onCreated?.(title.trim(), {
      assigneeId,
      dueDate,
      priority,
      category,
      points,
    })
    ctx.showToast(
      taskToEdit ? `Task "${title.trim()}" updated` : `"${title.trim()}" added`,
    )
    ctx.closeCreate()
  }

  return (
    <div className='modal-overlay' onClick={ctx.closeCreate}>
      <div className='modal-panel' onClick={e => e.stopPropagation()}>
        <div
          className='flex items-center justify-between px-6 pt-6 pb-4 border-b border-line'
          style={{ borderColor: 'var(--line)' }}
        >
          <h2
            className='text-primary font-bold'
            style={{ fontSize: 18, margin: 0 }}
          >
            {taskToEdit ? 'Edit task' : 'New task'}
          </h2>
          <button className='btn btn-ghost btn-icon' onClick={ctx.closeCreate}>
            <FigmaIcon name='x' size={18} />
          </button>
        </div>

        <div className='px-6 py-5 flex flex-col gap-4'>
          {/* Title */}
          <div>
            <label
              className='section-label'
              style={{ padding: '0 0 6px', display: 'block' }}
            >
              Title
            </label>
            <input
              className='input w-full'
              placeholder='What needs to be done?'
              value={title}
              onChange={e => setTitle(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && submit()}
              autoFocus
              style={{ fontSize: 15, padding: '12px 14px' }}
            />
          </div>

          <div className='grid grid-cols-2 gap-4'>
            {/* Assignee */}
            <div>
              <label
                className='section-label'
                style={{ padding: '0 0 6px', display: 'block' }}
              >
                Assigned to
              </label>
              <div className='flex flex-col gap-2'>
                {MEMBERS.map(m => (
                  <button
                    key={m.id}
                    onClick={() => setAssigneeId(m.id)}
                    className='flex items-center gap-2 px-3 py-2 rounded-lg transition-all'
                    style={{
                      border: `2px solid ${assigneeId === m.id ? 'var(--brand)' : 'var(--line)'}`,
                      background:
                        assigneeId === m.id
                          ? 'var(--brand-faint)'
                          : 'var(--surface-2)',
                      borderRadius: 'var(--r-md)',
                      cursor: 'pointer',
                      fontFamily: 'var(--font-ui)',
                    }}
                  >
                    <div
                      className='avatar'
                      style={{
                        width: 22,
                        height: 22,
                        background: m.avatarColor,
                        fontSize: 9,
                      }}
                    >
                      {m.initials}
                    </div>
                    <span className='text-primary' style={{ fontSize: 13 }}>
                      {m.name}
                    </span>
                    {assigneeId === m.id && (
                      <FigmaIcon
                        name='check'
                        size={12}
                        style={{ color: 'var(--brand)', marginLeft: 'auto' }}
                      />
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className='flex flex-col gap-4'>
              {/* Due date */}
              <div>
                <label
                  className='section-label'
                  style={{ padding: '0 0 6px', display: 'block' }}
                >
                  Due date
                </label>
                <input
                  type='date'
                  className='input w-full'
                  value={dueDate}
                  onChange={e => setDueDate(e.target.value)}
                />
              </div>

              {/* Priority */}
              <div>
                <label
                  className='section-label'
                  style={{ padding: '0 0 6px', display: 'block' }}
                >
                  Priority
                </label>
                <div className='flex gap-2'>
                  {['medium', 'high'].map(p => (
                    <button
                      key={p}
                      onClick={() => setPriority(p)}
                      className='flex-1 py-2 rounded-lg font-semibold text-center'
                      style={{
                        border: `2px solid ${priority === p ? (p === 'high' ? 'var(--sig-flag)' : 'var(--brand)') : 'var(--line)'}`,
                        background:
                          priority === p
                            ? p === 'high'
                              ? 'var(--sig-flag-bg)'
                              : 'var(--brand-faint)'
                            : 'var(--surface-2)',
                        cursor: 'pointer',
                        fontSize: 12,
                        fontFamily: 'var(--font-ui)',
                        color:
                          priority === p
                            ? p === 'high'
                              ? 'var(--sig-flag)'
                              : 'var(--brand)'
                            : 'var(--t-muted)',
                      }}
                    >
                      {p === 'high' ? '🚩 High' : 'Normal'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Points */}
              <div>
                <label
                  className='section-label'
                  style={{ padding: '0 0 6px', display: 'block' }}
                >
                  Points ⭐ {points}
                </label>
                <input
                  type='range'
                  min={5}
                  max={100}
                  step={5}
                  value={points}
                  onChange={e => setPoints(Number(e.target.value))}
                  style={{ width: '100%', accentColor: 'var(--brand)' }}
                />
                <div
                  className='flex justify-between text-faint'
                  style={{ fontSize: 10 }}
                >
                  <span>5</span>
                  <span>100</span>
                </div>
              </div>
            </div>
          </div>

          {/* Category */}
          <div>
            <label
              className='section-label'
              style={{ padding: '0 0 6px', display: 'block' }}
            >
              Category
            </label>
            <div className='flex flex-wrap gap-2'>
              {categories.map(c => (
                <button
                  key={c}
                  onClick={() => setCategory(c)}
                  className='badge'
                  style={{
                    cursor: 'pointer',
                    fontSize: 12,
                    padding: '5px 12px',
                    background:
                      category === c ? 'var(--brand)' : 'var(--surface-2)',
                    color: category === c ? 'white' : 'var(--t-muted)',
                    border: `1px solid ${category === c ? 'var(--brand)' : 'var(--line)'}`,
                  }}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className='flex gap-3 px-6 pb-6'>
          <button
            className='btn btn-secondary flex-1'
            style={{ justifyContent: 'center' }}
            onClick={ctx.closeCreate}
          >
            Cancel
          </button>
          <button
            className='btn btn-primary flex-1'
            style={{ justifyContent: 'center' }}
            onClick={submit}
            disabled={!title.trim()}
          >
            {taskToEdit ? (
              <>
                <FigmaIcon name='check' size={14} />
                Save changes
              </>
            ) : (
              <>
                <FigmaIcon name='plus' size={14} />
                Create task
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─── Task detail modal ─────────────────── */
export function TaskDetailModal({
  ctx,
  onComplete,
  onDelete,
  onEdit,
  onReopen,
  task,
}) {
  const assignee = task.assigneeId ? getMemberById(task.assigneeId) : null
  const isDone = task.status === 'done'
  const isOverdue = task.status === 'overdue'

  const statusColor = isDone
    ? 'var(--sig-done)'
    : isOverdue
      ? 'var(--sig-over)'
      : task.status === 'upcoming'
        ? 'var(--t-muted)'
        : 'var(--sig-due)'
  const statusLabel = isDone
    ? 'Done'
    : isOverdue
      ? 'Overdue'
      : task.status === 'upcoming'
        ? 'Upcoming'
        : 'To do'

  const handleDelete = () => {
    ctx.showConfirm({
      title: 'Delete Task',
      message: `Are you sure you want to delete "${task.title}"? This action cannot be undone.`,
      confirmLabel: 'Delete',
      danger: true,
      onConfirm: () => {
        onDelete(task.id)
      },
    })
  }

  return (
    <div className='modal-overlay' onClick={ctx.closeTask}>
      <div className='drawer-panel' onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div
          className='flex items-start gap-4 px-6 pt-6 pb-4 border-b border-line'
          style={{ borderColor: 'var(--line)' }}
        >
          <button
            onClick={() => !isDone && onComplete(task.id)}
            style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              flexShrink: 0,
              marginTop: 2,
              border: `2px solid ${isDone ? 'var(--sig-done)' : 'var(--line-strong)'}`,
              background: isDone ? 'var(--sig-done)' : 'transparent',
              cursor: isDone ? 'default' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {isDone && (
              <FigmaIcon name='check' size={14} style={{ color: 'white' }} />
            )}
          </button>
          <div className='flex-1 min-w-0'>
            <h2
              className='text-primary font-bold'
              style={{
                fontSize: 18,
                margin: 0,
                textDecoration: isDone ? 'line-through' : 'none',
                opacity: isDone ? 0.6 : 1,
              }}
            >
              {task.title}
            </h2>
            <div className='flex items-center gap-2 mt-2 flex-wrap'>
              <span
                className='badge'
                style={{
                  background: `color-mix(in srgb, ${statusColor} 10%, transparent)`,
                  color: statusColor,
                  fontSize: 11,
                }}
              >
                {statusLabel}
              </span>
              {task.category && (
                <span
                  className='badge bg-surface-2 text-muted'
                  style={{ fontSize: 11 }}
                >
                  {task.category}
                </span>
              )}
              {task.points && (
                <span
                  className='badge bg-brand-faint text-brand'
                  style={{ fontSize: 11 }}
                >
                  ⭐ {task.points} pts
                </span>
              )}
              {task.priority === 'high' && (
                <FigmaIcon
                  name='flag'
                  size={13}
                  style={{ color: 'var(--sig-flag)' }}
                />
              )}
            </div>
          </div>
          <button className='btn btn-ghost btn-icon' onClick={ctx.closeTask}>
            <FigmaIcon name='x' size={18} />
          </button>
        </div>

        {/* Meta */}
        <div
          className='px-6 py-4 border-b border-line flex flex-col gap-3'
          style={{ borderColor: 'var(--line)' }}
        >
          {task.dueDate && (
            <div className='flex items-center gap-3'>
              <FigmaIcon
                name='calendar'
                size={16}
                style={{ color: 'var(--t-muted)', flexShrink: 0 }}
              />
              <span className='text-muted' style={{ fontSize: 13 }}>
                Due
              </span>
              <span
                className='font-medium text-primary'
                style={{
                  fontSize: 13,
                  color: isOverdue ? 'var(--sig-over)' : undefined,
                }}
              >
                {formatDate(task.dueDate)}
              </span>
            </div>
          )}
          {assignee && (
            <div className='flex items-center gap-3'>
              <FigmaIcon
                name='user'
                size={16}
                style={{ color: 'var(--t-muted)', flexShrink: 0 }}
              />
              <span className='text-muted' style={{ fontSize: 13 }}>
                Assigned to
              </span>
              <div className='flex items-center gap-1.5'>
                <div
                  className='avatar'
                  style={{
                    width: 20,
                    height: 20,
                    background: assignee.avatarColor,
                    fontSize: 8,
                  }}
                >
                  {assignee.initials}
                </div>
                <span
                  className='font-medium text-primary'
                  style={{ fontSize: 13 }}
                >
                  {assignee.name}
                </span>
              </div>
            </div>
          )}
          {task.projectId && (
            <div className='flex items-center gap-3'>
              <FigmaIcon
                name='projects'
                size={16}
                style={{ color: 'var(--t-muted)', flexShrink: 0 }}
              />
              <span className='text-muted' style={{ fontSize: 13 }}>
                Project
              </span>
              <span
                className='font-medium text-primary'
                style={{ fontSize: 13 }}
              >
                {task.projectId}
              </span>
            </div>
          )}
        </div>

        {/* Description */}
        {task.description && (
          <div
            className='px-6 py-4 border-b border-line'
            style={{ borderColor: 'var(--line)' }}
          >
            <div className='section-label mb-2' style={{ padding: 0 }}>
              Notes
            </div>
            <div
              className='text-primary'
              style={{ fontSize: 14, lineHeight: 1.6 }}
            >
              {task.description}
            </div>
          </div>
        )}

        {/* Subtasks */}
        {task.subtasks && task.subtasks.length > 0 && (
          <div
            className='px-6 py-4 border-b border-line'
            style={{ borderColor: 'var(--line)' }}
          >
            <div className='section-label mb-3' style={{ padding: 0 }}>
              Subtasks · {task.subtasks.filter(s => s.done).length}/
              {task.subtasks.length}
            </div>
            <div className='flex flex-col gap-2'>
              {task.subtasks.map(s => (
                <div key={s.id} className='flex items-center gap-3'>
                  <div
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: 6,
                      border: `2px solid ${s.done ? 'var(--sig-done)' : 'var(--line-strong)'}`,
                      background: s.done ? 'var(--sig-done)' : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {s.done && (
                      <FigmaIcon
                        name='check'
                        size={10}
                        style={{ color: 'white' }}
                      />
                    )}
                  </div>
                  <span
                    className='text-primary'
                    style={{
                      fontSize: 13,
                      textDecoration: s.done ? 'line-through' : 'none',
                      opacity: s.done ? 0.6 : 1,
                    }}
                  >
                    {s.title}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className='px-6 py-4 flex gap-2 flex-wrap'>
          {!isDone && (
            <button
              className='btn btn-primary'
              onClick={() => {
                onComplete(task.id)
                ctx.closeTask()
              }}
            >
              <FigmaIcon name='check' size={14} />
              Mark done
            </button>
          )}
          {isDone && (
            <button
              className='btn btn-primary'
              onClick={() => onReopen(task.id)}
            >
              <FigmaIcon name='refresh' size={14} />
              Reopen
            </button>
          )}
          <button className='btn btn-secondary' onClick={() => onEdit(task)}>
            <FigmaIcon name='edit' size={14} />
            Edit
          </button>
          <button
            className='btn btn-ghost text-sig-over ms-auto'
            onClick={handleDelete}
          >
            <FigmaIcon name='trash' size={14} />
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─── Task state hook ─────────────────────
   Mirrors PE2's in-memory household store: seed from
   the fixture story, then complete / reopen / delete /
   create / update locally so the ports behave like the
   prototype without touching the production backend. */
export function usePe2Tasks() {
  const [tasks, setTasks] = useState(() => TASKS.map(t => ({ ...t })))
  const [taskDetail, setTaskDetail] = useState(null)
  const [showCreateTask, setShowCreateTask] = useState(false)
  const [taskToEdit, setTaskToEdit] = useState(null)
  const [toasts, setToasts] = useState([])
  const [confirmDialog, setConfirmDialog] = useState(null)

  const showToast = useCallback(msg => {
    const id = Date.now().toString() + Math.random()
    setToasts(prev => [...prev, { id, msg }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 2900)
  }, [])

  const closeConfirm = useCallback(() => setConfirmDialog(null), [])

  const completeTask = useCallback(
    id => {
      setTasks(prev =>
        prev.map(t =>
          t.id === id
            ? { ...t, status: 'done', completedAt: new Date().toISOString() }
            : t,
        ),
      )
      showToast('Task completed ✓')
      setTaskDetail(null)
    },
    [showToast],
  )

  const reopenTask = useCallback(
    id => {
      setTasks(prev =>
        prev.map(t =>
          t.id === id ? { ...t, status: 'todo', completedAt: undefined } : t,
        ),
      )
      showToast('Task reopened')
      setTaskDetail(null)
    },
    [showToast],
  )

  const deleteTask = useCallback(
    id => {
      setTasks(prev => prev.filter(t => t.id !== id))
      showToast('Task deleted')
      setTaskDetail(null)
    },
    [showToast],
  )

  const openEditTask = useCallback(tk => {
    setTaskDetail(null)
    setTaskToEdit(tk)
  }, [])

  const createTask = useCallback((title, details = {}) => {
    setTasks(prev => [
      {
        id: `task-${Date.now()}`,
        title,
        status: 'todo',
        priority: details.priority || 'medium',
        assigneeId: details.assigneeId || 'sarah',
        dueDate: details.dueDate || '2026-08-15',
        points: details.points || 15,
        category: details.category,
      },
      ...prev,
    ])
  }, [])

  const updateTask = useCallback((id, title, details) => {
    setTasks(prev =>
      prev.map(t => (t.id === id ? { ...t, title, ...details } : t)),
    )
  }, [])

  const openTask = useCallback(t => setTaskDetail(t), [])
  const closeTask = useCallback(() => setTaskDetail(null), [])
  const openCreate = useCallback(() => setShowCreateTask(true), [])
  const closeCreate = useCallback(() => {
    setShowCreateTask(false)
    setTaskToEdit(null)
  }, [])

  const ctx = {
    persona: 'parent',
    openTask,
    closeTask,
    openCreate,
    closeCreate,
    showToast,
    showConfirm: c => setConfirmDialog(c),
    navigate: target => showToast(`Demo flow: ${target}`),
  }

  return {
    closeConfirm,
    completeTask,
    confirmDialog,
    ctx,
    createTask,
    deleteTask,
    openEditTask,
    reopenTask,
    showCreateTask,
    taskDetail,
    taskToEdit,
    tasks,
    toasts,
    updateTask,
  }
}
