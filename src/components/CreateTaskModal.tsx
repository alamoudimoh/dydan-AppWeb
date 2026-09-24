import { useState } from 'react'

import { AppCtx, Icon } from '../App'
import type { Task } from '../data'
import { useLiveData } from '../model/liveData'
import DateField from './DateField'
import MemberPicker from './MemberPicker'

export default function CreateTaskModal({
  ctx,
  onCreated,
  taskToEdit,
}: {
  ctx: AppCtx
  onCreated?: (title: string, details?: Partial<Task>) => void
  taskToEdit?: Task
}) {
  const { currentUser, members } = useLiveData()
  const [title, setTitle] = useState(taskToEdit?.title || '')
  const [assigneeId, setAssigneeId] = useState(
    taskToEdit?.assigneeId || currentUser?.id || members[0]?.id || '',
  )
  const [dueDate, setDueDate] = useState(taskToEdit?.dueDate || '')
  const [priority, setPriority] = useState<'medium' | 'high'>(
    taskToEdit?.priority === 'high' ? 'high' : 'medium',
  )
  const [category, setCategory] = useState(taskToEdit?.category || '')
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
            className='text-primary font-semibold'
            style={{ fontSize: 18, margin: 0 }}
          >
            {taskToEdit ? 'modify task' : 'new task'}
          </h2>
          <button className='btn btn-ghost btn-icon' onClick={ctx.closeCreate}>
            <Icon name='x' size={18} />
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
                      category === c ? 'var(--selected-bg)' : 'var(--surface)',
                    color:
                      category === c
                        ? 'var(--selected-text)'
                        : 'var(--t-primary)',
                    border: `1px solid ${category === c ? 'var(--selected-border)' : 'var(--line-strong)'}`,
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
                <Icon name='check' size={14} />
                Save changes
              </>
            ) : (
              <>
                <Icon name='plus' size={14} />
                Create task
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
