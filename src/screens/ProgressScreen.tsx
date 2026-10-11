import { useState } from 'react'

import { AppCtx, Icon } from '../App'
import { PanelCard } from '../components/page'
import { PageFlow } from '../components/page'
import {
  EntityGrid,
  FilterSegment,
  PageEmptyState,
  PageSection,
  PageShell,
  SummaryCard,
} from '../components/page'
import PageHeader from '../components/PageHeader'
import type { Task } from '../data'
import { todayKey, useLiveData } from '../model/liveData'

type Range = '7d' | '30d' | '90d'

const RANGE_LABELS: Record<Range, string> = {
  '7d': '7 days',
  '30d': '30 days',
  '90d': '90 days',
}

const RANGE_DAYS: Record<Range, number> = {
  '7d': 7,
  '30d': 30,
  '90d': 90,
}

/**
 * The reporting window a task belongs to: when it was completed, falling back
 * to its due date for work that is still open. A task with neither date cannot
 * be placed in a window and is excluded, so the selected range always changes
 * the reported figures.
 */
function inRange(task: Task, start: number, now: number): boolean {
  const stamp = task.completedAt ?? task.dueDate
  if (!stamp) return false
  const at = new Date(stamp).getTime()
  if (Number.isNaN(at)) return false
  return at >= start && at <= now
}

const CATEGORIES = [
  'Family',
  'Cleaning',
  'School',
  'Finance',
  'Health',
  'Home',
  'Household',
  'Shopping',
  'Pet Care',
  'Assets',
]

export default function ProgressScreen({
  ctx,
  tasks,
}: {
  ctx: AppCtx
  tasks: Task[]
}) {
  const { activity, goals, memberById, members } = useLiveData()
  const [range, setRange] = useState<Range>('30d')

  // Scope every reported figure to the selected window, so changing the range
  // changes the numbers instead of only the button styling.
  const now = new Date()
  now.setHours(23, 59, 59, 999)
  const windowStart = new Date(now)
  windowStart.setDate(windowStart.getDate() - RANGE_DAYS[range])
  windowStart.setHours(0, 0, 0, 0)

  const rangedTasks = tasks.filter(task =>
    inRange(task, windowStart.getTime(), now.getTime()),
  )

  const doneTasks = rangedTasks.filter(t => t.status === 'done')
  const overdueTasks = rangedTasks.filter(t => t.status === 'overdue')
  const upcomingTasks = rangedTasks.filter(t => t.status === 'upcoming')
  const activeTasks = rangedTasks.filter(t => t.status === 'todo')
  const totalTasks = rangedTasks.length
  const completionRate = totalTasks
    ? Math.round((doneTasks.length / totalTasks) * 100)
    : 0

  const memberStats = members.map(m => ({
    member: m,
    completed: rangedTasks.filter(
      t => t.assigneeId === m.id && t.status === 'done',
    ).length,
    assigned: rangedTasks.filter(t => t.assigneeId === m.id).length,
    points: m.points,
    streak: m.streak,
  }))

  const catStats = CATEGORIES.map(cat => {
    const catTasks = rangedTasks.filter(t => t.category === cat)
    const catDone = catTasks.filter(t => t.status === 'done')
    return { cat, total: catTasks.length, done: catDone.length }
  }).filter(c => c.total > 0)

  const goalsDone = goals.filter(g => g.progress >= g.target).length

  return (
    <PageShell
      testId='progress-page'
      header={
        <PageHeader
          title='Progress'
          subtitle={
            <>
              team workload and completion reporting for the last{' '}
              {RANGE_LABELS[range].toLowerCase()}
            </>
          }
          actions={
            <FilterSegment
              ariaLabel='Reporting range'
              value={range}
              onChange={id => setRange(id as Range)}
              options={(['7d', '30d', '90d'] as Range[]).map(r => ({
                id: r,
                label: RANGE_LABELS[r],
              }))}
            />
          }
        />
      }
    >
      <PageFlow
        summary={
          <EntityGrid variant='stats'>
            {[
              {
                label: 'Completed',
                value: doneTasks.length,
                icon: 'check',
              },
              {
                label: 'Active',
                value: activeTasks.length,
                icon: 'tasks',
              },
              {
                label: 'Overdue',
                value: overdueTasks.length,
                icon: 'error',
              },
              {
                label: 'Upcoming',
                value: upcomingTasks.length,
                icon: 'calendar',
              },
              {
                label: 'Completion rate',
                value: `${completionRate}%`,
                icon: 'award',
              },
              {
                label: 'Goals achieved',
                value: `${goalsDone}/${goals.length}`,
                icon: 'star',
              },
            ].map(stat => (
              <SummaryCard
                key={stat.label}
                icon={stat.icon}
                label={stat.label}
                value={stat.value}
                meta={RANGE_LABELS[range]}
              />
            ))}
          </EntityGrid>
        }
      >
        {tasks.length === 0 && goals.length === 0 && activity.length === 0 ? (
          <PageEmptyState
            icon='activity'
            title='No progress yet'
            description='Complete tasks to start tracking your progress.'
            testId='progress-zero'
          />
        ) : (
          <PageSection>
            {/* Overview stat row */}

            {/* Member breakdown */}
            <PageSection title='Completion by member'>
              <PanelCard variant='flush'>
                <div>
                  {memberStats.map((ms, i) => {
                    const pct =
                      ms.assigned > 0
                        ? Math.round((ms.completed / ms.assigned) * 100)
                        : 0
                    const isLast = i === memberStats.length - 1
                    return (
                      <div
                        key={ms.member.id}
                        className='px-5 py-4 flex items-center gap-4'
                        style={{
                          borderBottom: isLast
                            ? 'none'
                            : '1px solid var(--line)',
                        }}
                      >
                        <div
                          className='avatar'
                          style={{
                            width: 38,
                            height: 38,
                            background: ms.member.avatarColor,
                            fontSize: 13,
                          }}
                        >
                          {ms.member.initials}
                        </div>
                        <div className='flex-1 min-w-0'>
                          <div className='flex items-center justify-between mb-1'>
                            <div
                              className='font-semibold text-primary'
                              style={{ fontSize: 14 }}
                            >
                              {ms.member.name}
                            </div>
                            <div className='flex items-center gap-3'>
                              <span
                                className='text-muted'
                                style={{ fontSize: 12 }}
                              >
                                {ms.completed}/{ms.assigned} tasks
                              </span>
                              <span
                                className='badge'
                                style={{
                                  background: 'var(--brand-faint)',
                                  color: 'var(--brand)',
                                  fontWeight: 700,
                                }}
                              >
                                {ms.points} pts
                              </span>
                              <span
                                className='badge'
                                style={{
                                  background: 'var(--sig-due-bg)',
                                  color: 'var(--sig-due)',
                                }}
                              >
                                🔥 {ms.streak}d
                              </span>
                            </div>
                          </div>
                          <div className='flex items-center gap-2'>
                            <div
                              className='progress-track flex-1'
                              style={{ height: 6 }}
                            >
                              <div
                                className='progress-fill'
                                style={{
                                  width: `${pct}%`,
                                  background: ms.member.avatarColor,
                                }}
                              />
                            </div>
                            <span
                              className='text-faint font-semibold'
                              style={{ fontSize: 11, minWidth: 30 }}
                            >
                              {pct}%
                            </span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </PanelCard>
            </PageSection>

            {/* Two columns: Category breakdown + Goals */}
            <div
              className='grid gap-5 home-columns'
              style={{ gridTemplateColumns: '1fr 1fr' }}
            >
              {/* Category breakdown */}
              <PageSection title='By category'>
                <PanelCard variant='flush'>
                  <div className='px-5 py-3 flex flex-col gap-3'>
                    {catStats.map(cs => {
                      const pct =
                        cs.total > 0
                          ? Math.round((cs.done / cs.total) * 100)
                          : 0
                      const catColor =
                        tasks.find(t => t.category === cs.cat)?.categoryColor ||
                        'var(--brand)'
                      return (
                        <div key={cs.cat}>
                          <div className='flex items-center justify-between mb-1'>
                            <span
                              className='text-primary'
                              style={{ fontSize: 13 }}
                            >
                              {cs.cat}
                            </span>
                            <span
                              className='text-muted'
                              style={{ fontSize: 12 }}
                            >
                              {cs.done}/{cs.total}
                            </span>
                          </div>
                          <div className='progress-track' style={{ height: 5 }}>
                            <div
                              className='progress-fill'
                              style={{ width: `${pct}%`, background: catColor }}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </PanelCard>
              </PageSection>

              {/* Goals progress */}
              <PageSection title='Goals'>
                <PanelCard variant='flush'>
                  <div className='px-5 py-3 flex flex-col gap-4'>
                    {goals.map(g => {
                      const pct = Math.min(
                        Math.round((g.progress / g.target) * 100),
                        100,
                      )
                      const done = g.progress >= g.target
                      return (
                        <div key={g.id}>
                          <div className='flex items-center gap-2 mb-1'>
                            <span style={{ fontSize: 18 }}>{g.emoji}</span>
                            <div className='flex-1 min-w-0'>
                              <div className='flex items-center justify-between'>
                                <span
                                  className='text-primary font-semibold truncate'
                                  style={{ fontSize: 13 }}
                                >
                                  {g.name}
                                </span>
                                {done && (
                                  <span
                                    className='badge'
                                    style={{
                                      background: 'var(--sig-done-bg)',
                                      color: 'var(--sig-done)',
                                      fontSize: 10,
                                    }}
                                  >
                                    Done!
                                  </span>
                                )}
                              </div>
                              <div
                                className='text-faint'
                                style={{ fontSize: 11 }}
                              >
                                {g.progress}/{g.target} {g.unit}
                              </div>
                            </div>
                          </div>
                          <div className='progress-track' style={{ height: 6 }}>
                            <div
                              className='progress-fill'
                              style={{
                                width: `${pct}%`,
                                background: done ? 'var(--sig-done)' : g.color,
                              }}
                            />
                          </div>
                        </div>
                      )
                    })}
                    <button
                      className='btn btn-secondary btn-sm mt-1'
                      onClick={() => ctx.navigate('goals')}
                    >
                      <Icon name='star' size={13} />
                      View all goals
                    </button>
                  </div>
                </PanelCard>
              </PageSection>
            </div>

            {/* Workload by time horizon */}
            <PageSection title='Workload overview'>
              <PanelCard variant='flush'>
                <div
                  className='px-5 py-4 grid gap-4'
                  style={{
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  }}
                >
                  {[
                    {
                      label: 'Today',
                      count: tasks.filter(
                        t => t.dueDate === todayKey() && t.status !== 'done',
                      ).length,
                      color: 'var(--sig-over)',
                      icon: 'clock',
                    },
                    {
                      label: 'Next 7 days',
                      count: upcomingTasks.slice(0, 4).length,
                      color: 'var(--sig-due)',
                      icon: 'calendar',
                    },
                    {
                      label: 'Unassigned',
                      count: tasks.filter(
                        t => !t.assigneeId && t.status !== 'done',
                      ).length,
                      color: 'var(--t-muted)',
                      icon: 'user',
                    },
                    {
                      label: 'Overdue',
                      count: overdueTasks.length,
                      color: 'var(--sig-over)',
                      icon: 'error',
                    },
                  ].map(item => (
                    <div
                      key={item.label}
                      className='flex items-center gap-3 p-3 rounded-lg'
                      style={{
                        background: 'var(--surface-2)',
                        borderRadius: 'var(--r-md)',
                      }}
                    >
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 'var(--r-sm)',
                          background: `color-mix(in srgb, ${item.color} 10%, transparent)`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Icon
                          name={item.icon}
                          size={16}
                          style={{ color: item.color }}
                        />
                      </div>
                      <div>
                        <div
                          style={{
                            fontSize: 20,
                            fontWeight: 800,
                            color: 'var(--t-primary)',
                          }}
                        >
                          {item.count}
                        </div>
                        <div className='text-faint' style={{ fontSize: 11 }}>
                          {item.label}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </PanelCard>
            </PageSection>

            {/* Recent activity summary */}
            <PageSection
              title='Recent activity'
              action={
                <button
                  className='btn btn-sm btn-ghost'
                  onClick={() => ctx.navigate('activity')}
                >
                  View all <Icon name='chevron_right' size={13} />
                </button>
              }
            >
              <PanelCard variant='flush'>
                <div className='px-5 py-3 flex flex-col gap-2'>
                  {activity.slice(0, 5).map(item => {
                    const actor = memberById(item.actorId)
                    return (
                      <div
                        key={item.id}
                        className='flex items-center gap-3 py-1'
                      >
                        {actor && (
                          <div
                            className='avatar'
                            style={{
                              width: 24,
                              height: 24,
                              background: actor.avatarColor,
                              fontSize: 9,
                            }}
                          >
                            {actor.initials}
                          </div>
                        )}
                        <span
                          className='flex-1 text-muted'
                          style={{ fontSize: 13 }}
                        >
                          {item.text}
                        </span>
                        {item.points != null && (
                          <span
                            className='text-sig-done font-semibold'
                            style={{ fontSize: 12, color: 'var(--sig-done)' }}
                          >
                            +{item.points}
                          </span>
                        )}
                      </div>
                    )
                  })}
                </div>
              </PanelCard>
            </PageSection>
          </PageSection>
        )}
      </PageFlow>
    </PageShell>
  )
}
