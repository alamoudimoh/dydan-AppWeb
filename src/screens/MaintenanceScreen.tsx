import { useState } from 'react'

import { AppCtx, Icon } from '../App'
import { formatDate } from '../data'
import {
  useMaintenanceMutations,
  useTaskMutations,
} from '../hooks/useHousehold'
import { useLiveData } from '../model/liveData'

type Tab = 'assets' | 'meters' | 'things'

const taskID = (id: string) => Number(id.replace(/^maint-/, ''))

export default function MaintenanceScreen({ ctx }: { ctx: AppCtx }) {
  const { maintenanceItems, meters, things } = useLiveData()
  const taskMutations = useTaskMutations()
  const mutations = useMaintenanceMutations()
  const [tab, setTab] = useState<Tab>('assets')
  const [readingInputs, setReadingInputs] = useState<Record<string, string>>({})

  const markDone = async (id: string) => {
    try {
      await taskMutations.completeTask.mutateAsync(taskID(id))
      ctx.showToast('Maintenance task marked done')
    } catch (error) {
      ctx.showToast(
        error instanceof Error
          ? error.message
          : 'Could not complete maintenance task',
      )
    }
  }
  const saveReading = async (id: string) => {
    const raw = readingInputs[id]
    const reading = Number(raw)
    if (!raw?.trim() || !Number.isInteger(reading) || reading < 0) {
      ctx.showToast('Enter a non-negative whole-number meter reading')
      return
    }
    try {
      await mutations.addMeterReading.mutateAsync({ id: Number(id), reading })
      setReadingInputs(current => ({ ...current, [id]: '' }))
      ctx.showToast('Meter reading saved')
    } catch (error) {
      ctx.showToast(
        error instanceof Error ? error.message : 'Could not save meter reading',
      )
    }
  }
  const toggleThing = async (id: string, state: string) => {
    const next = state === 'on' ? 'off' : 'on'
    try {
      await mutations.updateThingState.mutateAsync({
        id: Number(id),
        state: next,
      })
      ctx.showToast(`Thing updated to ${next}`)
    } catch (error) {
      ctx.showToast(
        error instanceof Error ? error.message : 'Could not update thing',
      )
    }
  }

  return (
    <div style={{ maxWidth: 1080, margin: '0 auto', padding: '0 0 40px' }}>
      <div className='page-header pb-5'>
        <div>
          <h1
            className='text-primary'
            style={{ fontSize: 24, fontWeight: 800, margin: 0 }}
          >
            Maintenance
          </h1>
          <div className='text-muted' style={{ fontSize: 13, marginTop: 4 }}>
            Live maintenance tasks, meters, and things
          </div>
        </div>
      </div>
      <div className='px-4 md:px-7'>
        <div
          className='flex gap-1 mb-5 p-1'
          style={{
            background: 'var(--surface-2)',
            borderRadius: 'var(--r-md)',
          }}
        >
          {(
            [
              {
                id: 'assets',
                label: `Maintenance (${maintenanceItems.length})`,
              },
              { id: 'meters', label: `Meters (${meters.length})` },
              { id: 'things', label: `Things (${things.length})` },
            ] as const
          ).map(item => (
            <button
              key={item.id}
              className='flex-1 py-2 font-semibold'
              onClick={() => setTab(item.id)}
              style={{
                background: tab === item.id ? 'var(--surface)' : 'transparent',
                border: 'none',
                cursor: 'pointer',
                borderRadius: 'var(--r-sm)',
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
        {tab === 'assets' && (
          <div className='flex flex-col gap-3'>
            {maintenanceItems.map(item => (
              <div key={item.id} className='card p-5 flex items-start gap-4'>
                <div style={{ fontSize: 28 }}>{item.icon}</div>
                <div className='flex-1'>
                  <div className='font-bold text-primary'>{item.name}</div>
                  <div className='text-muted'>{item.description}</div>
                  <div className='text-faint mt-2'>
                    Next due:{' '}
                    {item.nextDue ? formatDate(item.nextDue) : 'Not scheduled'}
                  </div>
                </div>
                <span className='badge'>
                  {item.status === 'overdue'
                    ? 'Overdue'
                    : item.status === 'due-soon'
                      ? 'Due soon'
                      : 'Scheduled'}
                </span>
                <button
                  className='btn btn-sm btn-primary'
                  disabled={taskMutations.completeTask.isPending}
                  onClick={() => markDone(item.id)}
                >
                  Mark done
                </button>
              </div>
            ))}
            {maintenanceItems.length === 0 && (
              <div className='empty-state'>No maintenance tasks are due.</div>
            )}
          </div>
        )}
        {tab === 'meters' && (
          <div className='flex flex-col gap-3'>
            {meters.map(meter => (
              <div key={meter.id} className='card p-5'>
                <div className='flex items-start gap-4'>
                  <div style={{ fontSize: 28 }}>{meter.icon}</div>
                  <div className='flex-1'>
                    <div className='font-bold text-primary'>{meter.name}</div>
                    <div className='text-muted'>
                      {meter.currentReading.toLocaleString()} {meter.unit}
                    </div>
                    <div className='text-faint mt-2'>
                      Last updated:{' '}
                      {meter.lastUpdated
                        ? formatDate(meter.lastUpdated)
                        : 'No reading yet'}
                    </div>
                  </div>
                </div>
                <div className='flex gap-2 mt-4'>
                  <input
                    className='input flex-1'
                    aria-label={`New reading for ${meter.name}`}
                    type='number'
                    min='0'
                    step='1'
                    value={readingInputs[meter.id] ?? ''}
                    onChange={event =>
                      setReadingInputs(current => ({
                        ...current,
                        [meter.id]: event.target.value,
                      }))
                    }
                    placeholder={`New reading (${meter.unit})`}
                  />
                  <button
                    className='btn btn-primary'
                    disabled={mutations.addMeterReading.isPending}
                    onClick={() => saveReading(meter.id)}
                  >
                    Save reading
                  </button>
                </div>
              </div>
            ))}
            {meters.length === 0 && (
              <div className='empty-state'>No meters are configured.</div>
            )}
          </div>
        )}
        {tab === 'things' && (
          <div
            className='grid gap-3'
            style={{
              gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            }}
          >
            {things.map(thing => (
              <div key={thing.id} className='card p-5'>
                <div className='flex items-start justify-between'>
                  <div style={{ fontSize: 28 }}>{thing.icon}</div>
                  <span className='badge'>{thing.state}</span>
                </div>
                <div className='font-bold text-primary mt-3'>{thing.name}</div>
                <div className='text-faint'>
                  {thing.category ?? 'Uncategorized'}
                </div>
                {thing.type === 'toggle' ? (
                  <button
                    className='btn btn-sm btn-primary mt-4'
                    disabled={mutations.updateThingState.isPending}
                    onClick={() => toggleThing(thing.id, thing.state)}
                  >
                    Turn {thing.state === 'on' ? 'off' : 'on'}
                  </button>
                ) : (
                  <div className='text-muted mt-4' style={{ fontSize: 12 }}>
                    This thing’s state is read-only because its type does not
                    support a toggle action.
                  </div>
                )}
              </div>
            ))}
            {things.length === 0 && (
              <div className='empty-state'>No things are configured.</div>
            )}
          </div>
        )}
        <div className='text-faint mt-5' style={{ fontSize: 12 }}>
          <Icon name='info' size={12} /> Create, metadata editing, linking, and
          archival are not available in this consolidated view; no local changes
          are simulated.
        </div>
      </div>
    </div>
  )
}
