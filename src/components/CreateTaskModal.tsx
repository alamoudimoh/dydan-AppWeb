import { useState } from 'react'

import { AppCtx, Icon } from '../App'
import type { Task } from '../data'
import { useChoreCategories } from '../hooks/useChoreCategories'
import { useLiveData } from '../model/liveData'
import DateField from './DateField'
import MemberPicker from './MemberPicker'

export default function CreateTaskModal({
  ctx,
  onCreated,
  taskToEdit,
}: {
  ctx: AppCtx
  /**
   * Persists the submitted task. The returned promise must settle only after
   * the server has accepted the write, because this modal reports success and
   * closes on resolution and reports failure without losing the draft.
   */
  onCreated?: (title: string, details?: Partial<Task>) => Promise<void>
  taskToEdit?: Task
}) {
  const { currentUser, members } = useLiveData()
  const { categories } = useChoreCategories()
  const [title, setTitle] = useState(taskToEdit?.title || '')
  const [assigneeId, setAssigneeId] = useState(
    taskToEdit?.assigneeId || currentUser?.id || members[0]?.id || '',
  )
  const [dueDate, setDueDate] = useState(taskToEdit?.dueDate || '')
  const [priority, setPriority] = useState<'medium' | 'high'>(
    taskToEdit?.priority === 'high' ? 'high' : 'medium',
  )
  const [categoryId, setCategoryId] = useState<number | null>(
    taskToEdit?.categoryId ?? null,
  )
  const [points, setPoints] = useState(taskToEdit?.points || 20)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const submit = async () => {
    if (!title.trim() || submitting) return
    setSubmitting(true)
    setSubmitError(null)
    const submittedTitle = title.trim()
    try {
      await onCreated?.(submittedTitle, {
        assigneeId,
        dueDate,
        priority,
        categoryId,
        points,
      })
      ctx.showToast(
        taskToEdit
          ? `Task "${submittedTitle}" updated`
          : `"${submittedTitle}" added`,
      )
      ctx.closeCreate()
    } catch (error) {
      // The draft stays in the modal so the user can retry or correct it.
      setSubmitError(
        error instanceof Error ? error.message : 'Could not save this task',
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className='modal-overlay' onClick={ctx.closeCreate}>
      <div className='modal-panel' onClick={e => e.stopPropagation()}>
        <div
          className='flex items-center justify-between px-6 pt-6 pb-4 border-b border-line'
          style={{ borderColor: 'var(--line)' }}
        >
          <h2
            className='text-primary font-semibold'
            style={{ fontSize: 18, margin: 0 }}
          >
            {taskToEdit ? 'modify task' : 'new task'}
          </h2>
          <button
            className='btn btn-ghost btn-icon'
            onClick={ctx.closeCreate}
            aria-label='Close task editor'
          >
            <Icon name='x' size={18} />
          </button>
        </div>

        <div className='px-6 py-5 flex flex-col gap-4'>
          {/* Title */}
          <div>
            <label
              htmlFor='task-title'
              className='section-label'
              style={{ padding: '0 0 6px', display: 'block' }}
            >
              Title
            </label>
            <input
              id='task-title'
              className='input w-full'
              placeholder='What needs to be done?'
              value={title}
              onChange={e => setTitle(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && void submit()}
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
              <MemberPicker value={assigneeId} onChange={setAssigneeId} />
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
                <DateField value={dueDate} onChange={setDueDate} allowClear />
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
                  {(['medium', 'high'] as const).map(p => (
                    <button
                      key={p}
                      onClick={() => setPriority(p)}
                      className='flex-1 py-2 rounded-lg font-semibold text-center'
                      style={{
                        border: `1px solid ${priority === p ? 'var(--selected-border)' : 'var(--line-strong)'}`,
                        background:
                          priority === p
                            ? 'var(--selected-bg)'
                            : 'var(--surface)',
                        cursor: 'pointer',
                        fontSize: 12,
                        fontFamily: 'var(--font-ui)',
                        color:
                          priority === p
                            ? 'var(--selected-text)'
                            : 'var(--t-primary)',
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
                  htmlFor='task-points'
                  className='section-label'
                  style={{ padding: '0 0 6px', display: 'block' }}
                >
                  Points ⭐ {points}
                </label>
                <input
                  id='task-points'
                  aria-label='Task points'
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
            {categories.length === 0 ? (
              <div className='text-faint' style={{ fontSize: 12 }}>
                No categories yet. Create one from Settings to categorize tasks.
              </div>
            ) : (
              <div className='flex flex-wrap gap-2'>
                {categories.map(c => (
                  <button
                    key={c.id}
                    type='button'
                    onClick={() =>
                      setCategoryId(current => (current === c.id ? null : c.id))
                    }
                    className='badge'
                    style={{
                      cursor: 'pointer',
                      fontSize: 12,
                      padding: '5px 12px',
                      background:
                        categoryId === c.id
                          ? 'var(--selected-bg)'
                          : 'var(--surface)',
                      color:
                        categoryId === c.id
                          ? 'var(--selected-text)'
                          : 'var(--t-primary)',
                      border: `1px solid ${categoryId === c.id ? 'var(--selected-border)' : 'var(--line-strong)'}`,
                    }}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {submitError && (
          <div
            className='px-6 pb-3 text-sm'
            style={{ color: 'var(--danger, #c0392b)' }}
            role='alert'
          >
            {submitError}
          </div>
        )}

        <div className='flex gap-3 px-6 pb-6'>
          <button
            className='btn btn-secondary flex-1'
            style={{ justifyContent: 'center' }}
            onClick={ctx.closeCreate}
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            className='btn btn-primary flex-1'
            style={{ justifyContent: 'center' }}
            onClick={() => void submit()}
            disabled={!title.trim() || submitting}
          >
            {taskToEdit ? (
              <>
                <Icon name='check' size={14} />
                {submitting ? 'Saving…' : 'Save changes'}
              </>
            ) : (
              <>
                <Icon name='plus' size={14} />
                {submitting ? 'Creating…' : 'Create task'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
