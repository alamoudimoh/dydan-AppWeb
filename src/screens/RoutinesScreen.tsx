import { useState } from 'react'

import { AppCtx, Icon } from '../App'
import PageHeader from '../components/PageHeader'
import { useRoutineMutations } from '../hooks/useHousehold'
import { useLiveData } from '../model/liveData'

type FilterMode = 'all' | 'active' | 'inactive'

const routineID = (id: string) => Number(id.replace(/^routine-/, ''))

export default function RoutinesScreen({ ctx }: { ctx: AppCtx }) {
  const { currentUser, memberById, routines } = useLiveData()
  const mutations = useRoutineMutations()
  const [expanded, setExpanded] = useState<string | null>(null)
  const [filter, setFilter] = useState<FilterMode>('all')

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

  const startEdit = (id?: string) => {
    const routine = id ? routines.find(item => item.id === id) : undefined
    ctx.openCreate('routine', {
      ...(routine ? { routine } : {}),
      onCreated: created => {
        const result = created as { id?: number | string }
        if (!routine && result?.id !== undefined)
          setExpanded(`routine-${result.id}`)
      },
    })
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
              <Icon name='repeat' size={14} /> New routine
            </button>
          ) : undefined
        }
      />

      <div className='px-4 md:px-7'>
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
