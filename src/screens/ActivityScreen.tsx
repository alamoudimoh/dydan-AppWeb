import { useState } from 'react'

import { AppCtx, Icon } from '../App'
import { EmptyState, FilterSegment, PageShell } from '../components/page'
import PageHeader from '../components/PageHeader'
import { formatTimestamp } from '../data'
import { useLiveData } from '../model/liveData'

type FilterType = 'all' | 'task' | 'reward' | 'goal' | 'streak'

export default function ActivityScreen({
  ctx: _ctx,
  isSolo,
}: {
  ctx: AppCtx
  isSolo: boolean
}) {
  const { activity, memberById } = useLiveData()
  const [filter, setFilter] = useState<FilterType>('all')

  const filterLabels: { value: FilterType; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'task', label: 'Tasks' },
    { value: 'goal', label: 'Goals' },
    { value: 'reward', label: 'Rewards' },
    { value: 'streak', label: 'Streaks' },
  ]

  const typeIcon = (type: string) => {
    if (type === 'completed') return 'check'
    if (type === 'reward') return 'gift'
    if (type === 'goal') return 'star'
    if (type === 'streak') return 'flame'
    if (type === 'assigned') return 'user'
    return 'activity'
  }

  const typeColor = (type: string) => {
    if (type === 'completed') return 'var(--sig-done)'
    if (type === 'reward') return 'var(--brand)'
    if (type === 'goal') return 'var(--accent)'
    if (type === 'streak') return 'var(--sig-flag)'
    if (type === 'points') return 'var(--brand)'
    return 'var(--t-muted)'
  }

  const typeCategory = (type: string): FilterType => {
    if (type === 'completed' || type === 'assigned') return 'task'
    if (type === 'reward') return 'reward'
    if (type === 'goal') return 'goal'
    if (type === 'streak') return 'streak'
    return 'all'
  }

  const filtered =
    filter === 'all'
      ? activity
      : activity.filter(a => typeCategory(a.type) === filter)

  return (
    <PageShell
      testId='activity-page'
      header={
        <PageHeader
          title='Activity'
          subtitle={
            <>Recent actions across your {isSolo ? 'account' : 'household'}</>
          }
        />
      }
    >
      <FilterSegment
        ariaLabel='Activity filter'
        testId='activity-filter'
        value={filter}
        onChange={id => setFilter(id as FilterType)}
        options={filterLabels.map(f => ({ id: f.value, label: f.label }))}
      />

      {/* Activity feed */}
      <div className='flex flex-col gap-1'>
        {filtered.length === 0 && (
          <EmptyState
            testId='activity-zero'
            icon={<span aria-hidden='true'>🗓</span>}
            title='No activity yet'
            description='Complete tasks to see your progress here.'
          />
        )}

        {filtered.map((item, i) => {
          const actor = memberById(item.actorId)
          const color = typeColor(item.type)
          const icon = typeIcon(item.type)
          const isLast = i === filtered.length - 1

          return (
            <div key={item.id} className='flex items-start gap-4 py-4 px-1'>
              {/* Timeline line */}
              <div className='flex flex-col items-center flex-shrink-0'>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    background: `color-mix(in srgb, ${color} 10%, transparent)`,
                    border: `1px solid color-mix(in srgb, ${color} 25%, transparent)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Icon name={icon} size={16} style={{ color }} />
                </div>
                {!isLast && (
                  <div
                    style={{
                      width: 2,
                      flex: 1,
                      minHeight: 24,
                      background: 'var(--line)',
                      marginTop: 4,
                    }}
                  />
                )}
              </div>

              <div className='flex-1 min-w-0 pb-1'>
                <div className='flex items-start justify-between gap-2'>
                  <div className='flex items-center gap-2 flex-wrap'>
                    {actor && (
                      <div
                        className='avatar'
                        style={{
                          width: 22,
                          height: 22,
                          background: actor.avatarColor,
                          fontSize: 9,
                        }}
                      >
                        {actor.initials}
                      </div>
                    )}
                    <span
                      className='font-semibold text-primary'
                      style={{ fontSize: 14 }}
                    >
                      {actor?.name ?? 'System'}
                    </span>
                    <span className='text-muted' style={{ fontSize: 14 }}>
                      {item.text}
                    </span>
                  </div>
                  <span
                    className='text-faint flex-shrink-0'
                    style={{ fontSize: 11 }}
                  >
                    {formatTimestamp(item.timestamp)}
                  </span>
                </div>

                {item.points != null && (
                  <div className='mt-1'>
                    <span
                      className='badge'
                      style={{
                        background: `color-mix(in srgb, ${color} 10%, transparent)`,
                        color,
                        fontSize: 11,
                      }}
                    >
                      +{item.points} pts
                    </span>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </PageShell>
  )
}
