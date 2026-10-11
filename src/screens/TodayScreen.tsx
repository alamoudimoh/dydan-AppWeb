import { useState } from 'react'

import { AppCtx, Icon } from '../App'
import { PanelCard } from '../components/page'
import { PageFlow } from '../components/page'
import {
  EntityCard,
  EntityGrid,
  FilterSegment,
  PageEmptyState,
  PageSection,
  PageShell,
} from '../components/page'
import PageHeader from '../components/PageHeader'
import type { Task } from '../data'
import { useLiveData } from '../model/liveData'

function TaskRow({
  compact,
  onComplete,
  onOpen,
  task,
}: {
  task: Task
  onOpen: () => void
  onComplete: (id: string) => void
  compact?: boolean
}) {
  const { memberById } = useLiveData()
  const isDone = task.status === 'done'
  const isOverdue = task.status === 'overdue'
  const assignee = task.assigneeId ? memberById(task.assigneeId) : null
  return (
    <div
      className={`task-row ${isDone ? 'done' : ''}`}
      onClick={onOpen}
      style={{ padding: compact ? '8px 12px' : '11px 14px' }}
    >
      <button
        className={`task-check ${isDone ? 'checked' : ''}`}
        onClick={e => {
          e.stopPropagation()
          if (!isDone) onComplete(task.id)
        }}
        aria-label={isDone ? 'Completed' : 'Mark complete'}
      >
        {isDone && <Icon name='check' size={11} style={{ color: 'white' }} />}
      </button>
      <span
        aria-label={
          task.priority === 'high' && !isDone ? 'High priority' : undefined
        }
        className='task-priority-flag'
      >
        {task.priority === 'high' && !isDone && (
          <Icon name='flag' size={13} style={{ color: 'var(--sig-over)' }} />
        )}
      </span>
      <div className='flex-1 min-w-0'>
        <div
          className='task-title font-medium'
          style={{
            fontSize: 14,
            color: isDone ? 'var(--t-muted)' : 'var(--t-primary)',
          }}
        >
          {task.title}
        </div>
        <div className='flex items-center gap-2 mt-0.5 flex-wrap'>
          {task.category && (
            <span
              className='badge'
              style={{
                background: `color-mix(in srgb, ${task.categoryColor} 10%, transparent)`,
                color: task.categoryColor,
              }}
            >
              {task.category}
            </span>
          )}
          {task.dueTime && (
            <span className='text-faint' style={{ fontSize: 11 }}>
              {task.dueTime}
            </span>
          )}
          {isOverdue && (
            <span className='text-sig-over font-bold' style={{ fontSize: 11 }}>
              Overdue
            </span>
          )}
          {task.subtasks && (
            <span className='text-faint' style={{ fontSize: 11 }}>
              {task.subtasks.filter(s => s.done).length}/{task.subtasks.length}{' '}
              steps
            </span>
          )}
          {task.isRecurring && (
            <Icon name='repeat' size={11} style={{ color: 'var(--t-faint)' }} />
          )}
          {task.points && !isDone && (
            <span
              className='text-brand font-bold font-mono'
              style={{ fontSize: 11 }}
            >
              +{task.points}pts
            </span>
          )}
        </div>
      </div>
      {assignee && (
        <div
          className='avatar'
          style={{
            width: 22,
            height: 22,
            background: assignee.avatarColor,
            fontSize: 9,
          }}
        >
          {assignee.initials}
        </div>
      )}
    </div>
  )
}

export default function TodayScreen({
  ctx,
  onComplete,
  tasks,
}: {
  ctx: AppCtx
  tasks: Task[]
  onComplete: (id: string) => void
}) {
  const { currentUser, members, overdueTasks, todayTasks } = useLiveData()
  const [filter, setFilter] = useState<'all' | 'mine' | 'family'>('all')
  const isChild = ctx.persona === 'child'
  const isSolo = ctx.persona === 'solo'
  const me = currentUser ?? members[0]

  const todayBase = todayTasks().map(t => tasks.find(x => x.id === t.id) || t)
  const overdueList = overdueTasks().map(
    t => tasks.find(x => x.id === t.id) || t,
  )

  const matchesFilter = (t: Task) => {
    if (filter === 'mine') return t.assigneeId === me?.id
    if (filter === 'family') return t.assigneeId !== me?.id
    return true
  }

  const filteredToday = todayBase.filter(matchesFilter)
  const filteredOverdue = overdueList.filter(matchesFilter)

  const done = filteredToday.filter(t => t.status === 'done')
  // Overdue work has its own banner below. Keeping it out of the ordinary
  // todo list prevents the same persisted task from appearing twice.
  const todo = filteredToday.filter(
    t => t.status !== 'done' && t.status !== 'overdue',
  )
  const totalPoints = done.reduce((a, t) => a + (t.points || 0), 0)

  return (
    <PageShell
      testId='today-page'
      header={
        <PageHeader
          title='Today'
          eyebrow={new Date().toLocaleDateString('en-GB', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}
          subtitle={
            <>
              {done.length} of {filteredToday.length} tasks complete
              {totalPoints > 0 && (
                <span className='ms-2 text-brand font-bold'>
                  +{totalPoints} pts
                </span>
              )}
            </>
          }
        />
      }
    >
      <PageFlow
        navigation={
          <PageSection>
            {' '}
            {/* Progress */}
            <div>
              <div
                className='flex justify-between text-faint mb-1.5'
                style={{ fontSize: 11 }}
              >
                <span>Daily progress</span>
                <span className='font-bold' style={{ color: 'var(--brand)' }}>
                  {filteredToday.length
                    ? Math.round((done.length / filteredToday.length) * 100)
                    : 0}
                  %
                </span>
              </div>
              <div className='progress-track' style={{ height: 8 }}>
                <div
                  className='progress-fill done'
                  style={{
                    width: filteredToday.length
                      ? `${(done.length / filteredToday.length) * 100}%`
                      : '0%',
                  }}
                />
              </div>
            </div>
            {/* Filter tabs */}
            {!isSolo && !isChild && (
              <FilterSegment
                ariaLabel='Today task filter'
                testId='today-filter'
                value={filter}
                onChange={id => setFilter(id as typeof filter)}
                options={[
                  { id: 'all', label: 'All' },
                  { id: 'mine', label: 'Mine' },
                  { id: 'family', label: 'Household' },
                ]}
              />
            )}
          </PageSection>
        }
      >
        {/* Overdue banner */}
        {filteredOverdue.length > 0 && (
          <div
            className='rounded-lg p-4 '
            style={{
              background: 'var(--sig-over-bg)',
              border: '1px solid var(--sig-over)',
              borderRadius: 'var(--r-lg)',
            }}
          >
            <div className='flex items-center gap-2 mb-2'>
              <Icon
                name='error'
                size={15}
                style={{ color: 'var(--sig-over)' }}
              />
              <span
                className='font-bold text-sig-over'
                style={{ fontSize: 13 }}
              >
                Overdue
              </span>
            </div>
            {filteredOverdue.map(t => (
              <TaskRow
                key={t.id}
                task={t}
                onOpen={() => ctx.openTask(t)}
                onComplete={onComplete}
                compact
              />
            ))}
          </div>
        )}

        {/* Todo tasks */}
        {todo.length > 0 && (
          <PanelCard variant='flush'>
            <div
              className='px-4 py-3 border-b border-line flex items-center gap-2'
              style={{ borderColor: 'var(--line)' }}
            >
              <span className='font-bold text-primary' style={{ fontSize: 14 }}>
                To do
              </span>
              <span className='badge bg-surface-2 text-muted'>
                {todo.length}
              </span>
            </div>
            {todo.map(t => (
              <TaskRow
                key={t.id}
                task={t}
                onOpen={() => ctx.openTask(t)}
                onComplete={onComplete}
              />
            ))}
          </PanelCard>
        )}

        {/* Done tasks */}
        {done.length > 0 && (
          <PanelCard variant='flush'>
            <div
              className='px-4 py-3 border-b border-line flex items-center gap-2'
              style={{ borderColor: 'var(--line)' }}
            >
              <Icon
                name='check'
                size={14}
                style={{ color: 'var(--sig-done)' }}
              />
              <span className='font-bold text-primary' style={{ fontSize: 14 }}>
                Completed
              </span>
              <span className='badge bg-sig-done-bg text-sig-done'>
                {done.length}
              </span>
            </div>
            {done.map(t => (
              <TaskRow
                key={t.id}
                task={t}
                onOpen={() => ctx.openTask(t)}
                onComplete={onComplete}
              />
            ))}
          </PanelCard>
        )}

        {/* Empty state */}
        {filteredToday.length === 0 && (
          <PageEmptyState
            testId='today-zero'
            icon='check'
            title='Nothing due today!'
            description='Enjoy your free time or add something new.'
          />
        )}

        {/* Household section - family only */}
        {!isSolo && !isChild && (
          <PageSection title='Household members'>
            <EntityGrid variant='dense'>
              {members.map(m => {
                const memberTasks = todayBase.filter(t => t.assigneeId === m.id)
                const memberDone = memberTasks.filter(t => t.status === 'done')
                return (
                  <EntityCard key={m.id} align='center' variant='compact'>
                    <div
                      className='avatar mx-auto mb-2'
                      style={{
                        width: 36,
                        height: 36,
                        background: m.avatarColor,
                        fontSize: 13,
                      }}
                    >
                      {m.initials}
                    </div>
                    <div
                      className='font-semibold text-primary'
                      style={{ fontSize: 12 }}
                    >
                      {m.name}
                    </div>
                    <div className='text-faint' style={{ fontSize: 11 }}>
                      {memberDone.length}/{memberTasks.length} done
                    </div>
                    <div
                      className='progress-track mt-1.5'
                      style={{ height: 4 }}
                    >
                      <div
                        className='progress-fill'
                        style={{
                          width: memberTasks.length
                            ? `${(memberDone.length / memberTasks.length) * 100}%`
                            : '0%',
                          background: m.avatarColor,
                        }}
                      />
                    </div>
                  </EntityCard>
                )
              })}
            </EntityGrid>
          </PageSection>
        )}
      </PageFlow>
    </PageShell>
  )
}
