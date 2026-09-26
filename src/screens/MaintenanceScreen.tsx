import { useState } from 'react'

import { AppCtx } from '../App'
import { formatDate } from '../data'
import {
  useAssetDetail,
  useChores,
  useMaintenanceAssets,
  useMaintenanceMutations,
  useMeterHistory,
  useMeters,
  useTaskMutations,
  useThingHistory,
  useThings,
} from '../hooks/useHousehold'
import { useLiveData } from '../model/liveData'

type Tab = 'assets' | 'meters' | 'things'

const METER_UNITS = ['count', 'km', 'miles', 'hours', 'cycles'] as const
const THING_TYPES = ['boolean', 'text', 'number', 'action'] as const

const taskID = (id: string) => Number(id.replace(/^maint-/, ''))

export default function MaintenanceScreen({ ctx }: { ctx: AppCtx }) {
  const { maintenanceItems } = useLiveData()
  const { data: assets = [] } = useMaintenanceAssets(true)
  const { data: meters = [] } = useMeters()
  const { data: things = [] } = useThings()
  const { data: chores = [] } = useChores()
  const taskMutations = useTaskMutations()
  const mutations = useMaintenanceMutations()

  const [tab, setTab] = useState<Tab>('assets')
  const [readingInputs, setReadingInputs] = useState<Record<string, string>>({})

  // Asset create / edit / link state.
  const [assetForm, setAssetForm] = useState({
    name: '',
    category: '',
    description: '',
  })
  const [assetDrafts, setAssetDrafts] = useState<
    Record<number, { name: string; category: string; description: string }>
  >({})
  const [expandedAsset, setExpandedAsset] = useState<number | null>(null)
  const [linkSelection, setLinkSelection] = useState<
    Record<number, { meterId: string; choreId: string }>
  >({})

  // Meter create / edit state.
  const [meterForm, setMeterForm] = useState({
    name: '',
    unit: 'count',
    initialReading: '',
  })
  const [meterDrafts, setMeterDrafts] = useState<
    Record<number, { name: string; unit: string }>
  >({})
  const [expandedMeter, setExpandedMeter] = useState<number | null>(null)

  // Thing create / edit state.
  const [thingForm, setThingForm] = useState({ name: '', type: 'boolean' })
  const [thingDrafts, setThingDrafts] = useState<
    Record<number, { name: string; type: string }>
  >({})
  const [expandedThing, setExpandedThing] = useState<number | null>(null)

  const assetDetail = useAssetDetail(expandedAsset)
  const meterHistory = useMeterHistory(expandedMeter)
  const thingHistory = useThingHistory(expandedThing)

  /* ── Task + meter + thing base actions ── */

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

  const saveReading = async (id: number) => {
    const raw = readingInputs[String(id)]
    const reading = Number(raw)
    if (!raw?.trim() || !Number.isInteger(reading) || reading < 0) {
      ctx.showToast('Enter a non-negative whole-number meter reading')
      return
    }
    try {
      await mutations.addMeterReading.mutateAsync({ id, reading })
      setReadingInputs(current => ({ ...current, [String(id)]: '' }))
      ctx.showToast('Meter reading saved')
    } catch (error) {
      ctx.showToast(
        error instanceof Error ? error.message : 'Could not save meter reading',
      )
    }
  }

  const toggleThing = async (id: number, state: string) => {
    const next = state === 'on' ? 'off' : 'on'
    try {
      await mutations.updateThingState.mutateAsync({ id, state: next })
      ctx.showToast(`Thing updated to ${next}`)
    } catch (error) {
      ctx.showToast(
        error instanceof Error ? error.message : 'Could not update thing',
      )
    }
  }

  /* ── Asset actions ── */

  const createAsset = async () => {
    if (!assetForm.name.trim()) {
      ctx.showToast('Enter an asset name')
      return
    }
    try {
      await mutations.createAsset.mutateAsync({
        name: assetForm.name.trim(),
        description: assetForm.description.trim() || undefined,
        category: assetForm.category.trim() || undefined,
      })
      setAssetForm({ name: '', category: '', description: '' })
      ctx.showToast('Maintenance asset created')
    } catch (error) {
      ctx.showToast(
        error instanceof Error ? error.message : 'Could not create asset',
      )
    }
  }

  const saveAssetEdit = async (id: number) => {
    const draft = assetDrafts[id]
    if (!draft || !draft.name.trim()) {
      ctx.showToast('Enter an asset name')
      return
    }
    try {
      await mutations.updateAsset.mutateAsync({
        id,
        name: draft.name.trim(),
        description: draft.description.trim() || undefined,
        category: draft.category.trim() || undefined,
      })
      setAssetDrafts(current => {
        const next = { ...current }
        delete next[id]
        return next
      })
      ctx.showToast('Asset updated')
    } catch (error) {
      ctx.showToast(
        error instanceof Error ? error.message : 'Could not update asset',
      )
    }
  }

  const setArchived = async (id: number, archived: boolean) => {
    try {
      await mutations.archiveAsset.mutateAsync({ id, archived })
      ctx.showToast(archived ? 'Asset archived' : 'Asset restored')
    } catch (error) {
      ctx.showToast(
        error instanceof Error ? error.message : 'Could not update asset',
      )
    }
  }

  const linkToAsset = async (id: number) => {
    const selection = linkSelection[id] ?? { meterId: '', choreId: '' }
    if (selection.meterId && selection.choreId) {
      ctx.showToast('Choose a meter or a task, not both')
      return
    }
    if (!selection.meterId && !selection.choreId) {
      ctx.showToast('Choose a meter or maintenance task to link')
      return
    }
    try {
      await mutations.linkAsset.mutateAsync({
        id,
        link: selection.meterId
          ? { meterId: Number(selection.meterId) }
          : { choreId: Number(selection.choreId) },
      })
      setLinkSelection(current => ({
        ...current,
        [id]: { meterId: '', choreId: '' },
      }))
      ctx.showToast('Asset linked')
    } catch (error) {
      ctx.showToast(
        error instanceof Error ? error.message : 'Could not link asset',
      )
    }
  }

  const unlinkFromAsset = async (id: number, link: Record<string, string>) => {
    try {
      await mutations.unlinkAsset.mutateAsync({ id, link })
      ctx.showToast('Asset unlinked')
    } catch (error) {
      ctx.showToast(
        error instanceof Error ? error.message : 'Could not unlink asset',
      )
    }
  }

  /* ── Meter actions ── */

  const createMeter = async () => {
    if (!meterForm.name.trim()) {
      ctx.showToast('Enter a meter name')
      return
    }
    const initialReading = Number(meterForm.initialReading || '0')
    if (
      !Number.isInteger(initialReading) ||
      initialReading < 0 ||
      !METER_UNITS.includes(meterForm.unit as (typeof METER_UNITS)[number])
    ) {
      ctx.showToast('Choose a unit and a non-negative initial reading')
      return
    }
    try {
      await mutations.createMeter.mutateAsync({
        name: meterForm.name.trim(),
        unit: meterForm.unit,
        initialReading,
      })
      setMeterForm({ name: '', unit: 'count', initialReading: '' })
      ctx.showToast('Meter created')
    } catch (error) {
      ctx.showToast(
        error instanceof Error ? error.message : 'Could not create meter',
      )
    }
  }

  const saveMeterEdit = async (id: number) => {
    const draft = meterDrafts[id]
    if (!draft || !draft.name.trim()) {
      ctx.showToast('Enter a meter name')
      return
    }
    if (!METER_UNITS.includes(draft.unit as (typeof METER_UNITS)[number])) {
      ctx.showToast('Choose a valid meter unit')
      return
    }
    try {
      await mutations.updateMeter.mutateAsync({
        id,
        name: draft.name.trim(),
        unit: draft.unit,
      })
      setMeterDrafts(current => {
        const next = { ...current }
        delete next[id]
        return next
      })
      ctx.showToast('Meter updated')
    } catch (error) {
      ctx.showToast(
        error instanceof Error ? error.message : 'Could not update meter',
      )
    }
  }

  /* ── Thing actions ── */

  const createThing = async () => {
    if (!thingForm.name.trim()) {
      ctx.showToast('Enter a thing name')
      return
    }
    if (!THING_TYPES.includes(thingForm.type as (typeof THING_TYPES)[number])) {
      ctx.showToast('Choose a valid thing type')
      return
    }
    try {
      await mutations.createThing.mutateAsync({
        name: thingForm.name.trim(),
        type: thingForm.type,
        state: thingForm.type === 'boolean' ? 'off' : '',
      })
      setThingForm({ name: '', type: 'boolean' })
      ctx.showToast('Thing created')
    } catch (error) {
      ctx.showToast(
        error instanceof Error ? error.message : 'Could not create thing',
      )
    }
  }

  const saveThingEdit = async (id: number, currentState: string) => {
    const draft = thingDrafts[id]
    if (!draft || !draft.name.trim()) {
      ctx.showToast('Enter a thing name')
      return
    }
    if (!THING_TYPES.includes(draft.type as (typeof THING_TYPES)[number])) {
      ctx.showToast('Choose a valid thing type')
      return
    }
    try {
      await mutations.updateThing.mutateAsync({
        id,
        name: draft.name.trim(),
        type: draft.type,
        state: currentState || (draft.type === 'boolean' ? 'off' : ''),
      })
      setThingDrafts(current => {
        const next = { ...current }
        delete next[id]
        return next
      })
      ctx.showToast('Thing updated')
    } catch (error) {
      ctx.showToast(
        error instanceof Error ? error.message : 'Could not update thing',
      )
    }
  }

  const deleteThing = async (id: number, name: string) => {
    try {
      await mutations.deleteThing.mutateAsync(id)
      ctx.showToast(`Thing "${name}" deleted`)
    } catch (error) {
      ctx.showToast(
        error instanceof Error
          ? error.message
          : 'Could not delete thing (is it linked to a task?)',
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
            Live maintenance assets, meters, and things
          </div>
        </div>
      </div>
      <div className='px-4 md:px-7'>
        <div
          className='seg-tabs mb-5'
          role='group'
          aria-label='Maintenance sections'
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
              type='button'
              className={`seg-tab ${tab === item.id ? 'active' : ''}`}
              aria-pressed={tab === item.id}
              onClick={() => setTab(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>

        {tab === 'assets' && (
          <div className='flex flex-col gap-3'>
            <div className='card p-4 flex flex-col gap-2'>
              <div className='flex gap-2 flex-wrap'>
                <input
                  className='input flex-1'
                  aria-label='New maintenance asset name'
                  value={assetForm.name}
                  onChange={event =>
                    setAssetForm(current => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                  placeholder='New asset name'
                />
                <input
                  className='input flex-1'
                  aria-label='New maintenance asset category'
                  value={assetForm.category}
                  onChange={event =>
                    setAssetForm(current => ({
                      ...current,
                      category: event.target.value,
                    }))
                  }
                  placeholder='Category'
                />
                <button
                  className='btn btn-primary'
                  disabled={mutations.createAsset.isPending}
                  onClick={() => void createAsset()}
                >
                  Create asset
                </button>
              </div>
              <input
                className='input'
                aria-label='New maintenance asset description'
                value={assetForm.description}
                onChange={event =>
                  setAssetForm(current => ({
                    ...current,
                    description: event.target.value,
                  }))
                }
                placeholder='Description (optional)'
              />
            </div>

            {assets.map(asset => {
              const draft = assetDrafts[asset.id] ?? {
                name: asset.name,
                category: asset.category ?? '',
                description: asset.description ?? '',
              }
              const selection = linkSelection[asset.id] ?? {
                meterId: '',
                choreId: '',
              }
              const detail = assetDetail.data
              const linkedMeters = detail?.meters ?? []
              // A maintenance link exists before its first completion. Derive
              // it from the server's linked-task collection, not history, so
              // it remains visible, cannot be duplicated, and can be removed.
              const linkedChoreIds = new Set(
                (detail?.maintenance ?? []).map(item => item.choreId),
              )
              const linkedChores = chores.filter(c => linkedChoreIds.has(c.id))
              const unlinkedMeters = meters.filter(
                m => !linkedMeters.some(l => l.id === m.id),
              )
              const unlinkedChores = chores.filter(
                c => !linkedChoreIds.has(c.id),
              )
              return (
                <div key={`asset-${asset.id}`} className='card p-4'>
                  <div className='flex items-center gap-3 flex-wrap'>
                    <div className='flex-1 min-w-[200px]'>
                      <div className='font-bold text-primary'>{asset.name}</div>
                      <div className='text-muted'>
                        {asset.category || 'Uncategorized'}
                        {asset.description ? ` — ${asset.description}` : ''}
                      </div>
                    </div>
                    <span className='badge'>
                      {asset.archivedAt ? 'Archived' : 'Active'}
                    </span>
                    <button
                      className='btn btn-secondary btn-sm'
                      onClick={() =>
                        setAssetDrafts(current =>
                          current[asset.id]
                            ? (() => {
                                const next = { ...current }
                                delete next[asset.id]
                                return next
                              })()
                            : { ...current, [asset.id]: draft },
                        )
                      }
                    >
                      {assetDrafts[asset.id] ? 'Cancel edit' : 'Edit'}
                    </button>
                    <button
                      className='btn btn-secondary btn-sm'
                      disabled={mutations.archiveAsset.isPending}
                      onClick={() =>
                        void setArchived(asset.id, !asset.archivedAt)
                      }
                    >
                      {asset.archivedAt ? 'Restore' : 'Archive'}
                    </button>
                    <button
                      className='btn btn-secondary btn-sm'
                      onClick={() =>
                        setExpandedAsset(current =>
                          current === asset.id ? null : asset.id,
                        )
                      }
                    >
                      {expandedAsset === asset.id ? 'Hide details' : 'Details'}
                    </button>
                  </div>

                  {assetDrafts[asset.id] && (
                    <div className='flex flex-col gap-2 mt-3 p-3'>
                      <input
                        className='input'
                        aria-label={`Asset ${asset.name} name`}
                        value={draft.name}
                        onChange={event =>
                          setAssetDrafts(current => ({
                            ...current,
                            [asset.id]: {
                              ...current[asset.id],
                              name: event.target.value,
                            },
                          }))
                        }
                        placeholder='Asset name'
                      />
                      <input
                        className='input'
                        aria-label={`Asset ${asset.name} category`}
                        value={draft.category}
                        onChange={event =>
                          setAssetDrafts(current => ({
                            ...current,
                            [asset.id]: {
                              ...current[asset.id],
                              category: event.target.value,
                            },
                          }))
                        }
                        placeholder='Category'
                      />
                      <input
                        className='input'
                        aria-label={`Asset ${asset.name} description`}
                        value={draft.description}
                        onChange={event =>
                          setAssetDrafts(current => ({
                            ...current,
                            [asset.id]: {
                              ...current[asset.id],
                              description: event.target.value,
                            },
                          }))
                        }
                        placeholder='Description'
                      />
                      <div className='flex gap-2'>
                        <button
                          className='btn btn-primary btn-sm'
                          disabled={mutations.updateAsset.isPending}
                          onClick={() => void saveAssetEdit(asset.id)}
                        >
                          Save changes
                        </button>
                      </div>
                    </div>
                  )}

                  {expandedAsset === asset.id && (
                    <div className='mt-3 flex flex-col gap-3'>
                      <div className='flex flex-col gap-2 p-3'>
                        <div className='font-semibold text-primary'>
                          Linked meters
                        </div>
                        {linkedMeters.length === 0 && (
                          <div className='text-faint' style={{ fontSize: 12 }}>
                            No meters linked to this asset.
                          </div>
                        )}
                        {linkedMeters.map(meter => (
                          <div
                            key={`linked-meter-${meter.id}`}
                            className='flex items-center gap-2'
                          >
                            <span className='flex-1'>
                              {meter.name} (
                              {meter.currentReading ?? meter.currentValue ?? 0}{' '}
                              {meter.unit})
                            </span>
                            <button
                              className='btn btn-secondary btn-sm'
                              disabled={mutations.unlinkAsset.isPending}
                              onClick={() =>
                                void unlinkFromAsset(asset.id, {
                                  meterId: String(meter.id),
                                })
                              }
                            >
                              Unlink
                            </button>
                          </div>
                        ))}
                        <div className='flex gap-2'>
                          <select
                            className='input flex-1'
                            aria-label='Meter to link'
                            value={selection.meterId}
                            onChange={event =>
                              setLinkSelection(current => ({
                                ...current,
                                [asset.id]: {
                                  ...current[asset.id],
                                  meterId: event.target.value,
                                  choreId: '',
                                },
                              }))
                            }
                          >
                            <option value=''>Link a meter…</option>
                            {unlinkedMeters.map(meter => (
                              <option key={meter.id} value={meter.id}>
                                {meter.name} ({meter.unit})
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className='flex flex-col gap-2 p-3'>
                        <div className='font-semibold text-primary'>
                          Linked maintenance tasks
                        </div>
                        {linkedChores.length === 0 && (
                          <div className='text-faint' style={{ fontSize: 12 }}>
                            No maintenance tasks linked to this asset.
                          </div>
                        )}
                        {linkedChores.map(chore => (
                          <div
                            key={`linked-chore-${chore.id}`}
                            className='flex items-center gap-2'
                          >
                            <span className='flex-1'>{chore.name}</span>
                            <button
                              className='btn btn-secondary btn-sm'
                              disabled={mutations.unlinkAsset.isPending}
                              onClick={() =>
                                void unlinkFromAsset(asset.id, {
                                  choreId: String(chore.id),
                                })
                              }
                            >
                              Unlink
                            </button>
                          </div>
                        ))}
                        <div className='flex gap-2'>
                          <select
                            className='input flex-1'
                            aria-label='Maintenance task to link'
                            value={selection.choreId}
                            onChange={event =>
                              setLinkSelection(current => ({
                                ...current,
                                [asset.id]: {
                                  ...current[asset.id],
                                  choreId: event.target.value,
                                  meterId: '',
                                },
                              }))
                            }
                          >
                            <option value=''>Link a maintenance task…</option>
                            {unlinkedChores.map(chore => (
                              <option key={chore.id} value={chore.id}>
                                {chore.name}
                              </option>
                            ))}
                          </select>
                          <button
                            className='btn btn-primary btn-sm'
                            disabled={mutations.linkAsset.isPending}
                            onClick={() => void linkToAsset(asset.id)}
                          >
                            Link
                          </button>
                        </div>
                      </div>

                      <div className='flex flex-col gap-2 p-3'>
                        <div className='font-semibold text-primary'>
                          Service history
                        </div>
                        {detail && detail.history.length === 0 && (
                          <div className='text-faint' style={{ fontSize: 12 }}>
                            No completed maintenance recorded yet.
                          </div>
                        )}
                        {(detail?.history ?? []).map(entry => (
                          <div
                            key={`history-${entry.id}-${entry.choreId}-${entry.performedAt}`}
                            className='flex items-center gap-2'
                            style={{ fontSize: 13 }}
                          >
                            <span className='flex-1'>
                              {entry.choreName} —{' '}
                              {entry.completedByName ?? 'Team member'}
                            </span>
                            <span className='text-faint'>
                              {entry.performedAt
                                ? formatDate(entry.performedAt)
                                : ''}
                            </span>
                            {(entry.points ?? 0) > 0 && (
                              <span className='badge'>+{entry.points} pts</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
            {assets.length === 0 && (
              <div className='empty-state'>No assets are configured.</div>
            )}

            <div className='font-semibold text-primary mt-2'>
              Due maintenance tasks
            </div>
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
            <div className='card p-4 flex gap-2 flex-wrap'>
              <input
                className='input flex-1'
                aria-label='New meter name'
                value={meterForm.name}
                onChange={event =>
                  setMeterForm(current => ({
                    ...current,
                    name: event.target.value,
                  }))
                }
                placeholder='New meter name'
              />
              <select
                className='input'
                aria-label='New meter unit'
                value={meterForm.unit}
                onChange={event =>
                  setMeterForm(current => ({
                    ...current,
                    unit: event.target.value,
                  }))
                }
              >
                {METER_UNITS.map(unit => (
                  <option key={unit} value={unit}>
                    {unit}
                  </option>
                ))}
              </select>
              <input
                className='input'
                aria-label='New meter initial reading'
                type='number'
                min='0'
                step='1'
                value={meterForm.initialReading}
                onChange={event =>
                  setMeterForm(current => ({
                    ...current,
                    initialReading: event.target.value,
                  }))
                }
                placeholder='Initial reading'
              />
              <button
                className='btn btn-primary'
                disabled={mutations.createMeter.isPending}
                onClick={() => void createMeter()}
              >
                Create meter
              </button>
            </div>

            {meters.map(meter => {
              const draft = meterDrafts[meter.id] ?? {
                name: meter.name,
                unit: meter.unit ?? 'count',
              }
              return (
                <div key={meter.id} className='card p-5'>
                  <div className='flex items-start gap-4 flex-wrap'>
                    <div style={{ fontSize: 28 }}>📊</div>
                    <div className='flex-1 min-w-[200px]'>
                      <div className='font-bold text-primary'>{meter.name}</div>
                      <div className='text-muted'>
                        {(
                          meter.currentReading ??
                          meter.currentValue ??
                          0
                        ).toLocaleString()}{' '}
                        {meter.unit}
                      </div>
                      <div className='text-faint mt-2'>
                        Last updated:{' '}
                        {meter.lastReadingAt
                          ? formatDate(meter.lastReadingAt)
                          : 'No reading yet'}
                      </div>
                    </div>
                    <button
                      className='btn btn-secondary btn-sm'
                      onClick={() =>
                        setMeterDrafts(current =>
                          current[meter.id]
                            ? (() => {
                                const next = { ...current }
                                delete next[meter.id]
                                return next
                              })()
                            : { ...current, [meter.id]: draft },
                        )
                      }
                    >
                      {meterDrafts[meter.id] ? 'Cancel edit' : 'Edit'}
                    </button>
                    <button
                      className='btn btn-secondary btn-sm'
                      onClick={() =>
                        setExpandedMeter(current =>
                          current === meter.id ? null : meter.id,
                        )
                      }
                    >
                      {expandedMeter === meter.id ? 'Hide history' : 'History'}
                    </button>
                  </div>

                  {meterDrafts[meter.id] && (
                    <div className='flex flex-col gap-2 mt-3 p-3'>
                      <input
                        className='input'
                        aria-label={`Meter ${meter.name} name`}
                        value={draft.name}
                        onChange={event =>
                          setMeterDrafts(current => ({
                            ...current,
                            [meter.id]: {
                              ...current[meter.id],
                              name: event.target.value,
                            },
                          }))
                        }
                        placeholder='Meter name'
                      />
                      <select
                        className='input'
                        aria-label={`Meter ${meter.name} unit`}
                        value={draft.unit}
                        onChange={event =>
                          setMeterDrafts(current => ({
                            ...current,
                            [meter.id]: {
                              ...current[meter.id],
                              unit: event.target.value,
                            },
                          }))
                        }
                      >
                        {METER_UNITS.map(unit => (
                          <option key={unit} value={unit}>
                            {unit}
                          </option>
                        ))}
                      </select>
                      <button
                        className='btn btn-primary btn-sm'
                        disabled={mutations.updateMeter.isPending}
                        onClick={() => void saveMeterEdit(meter.id)}
                      >
                        Save changes
                      </button>
                    </div>
                  )}

                  {expandedMeter === meter.id && (
                    <div className='mt-3 flex flex-col gap-2 p-3'>
                      <div className='font-semibold text-primary'>
                        Reading history
                      </div>
                      {meterHistory.data && meterHistory.data.length === 0 && (
                        <div className='text-faint' style={{ fontSize: 12 }}>
                          No readings recorded yet.
                        </div>
                      )}
                      {(meterHistory.data ?? []).map(reading => (
                        <div
                          key={`reading-${reading.id}`}
                          className='flex items-center gap-2'
                          style={{ fontSize: 13 }}
                        >
                          <span className='flex-1'>
                            {reading.reading.toLocaleString()} {meter.unit}
                          </span>
                          <span className='text-faint'>
                            {reading.note ?? 'Regular reading'}
                          </span>
                          <span className='text-faint'>
                            {reading.recordedAt
                              ? formatDate(reading.recordedAt)
                              : ''}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className='flex gap-2 mt-4'>
                    <input
                      className='input flex-1'
                      aria-label={`New reading for ${meter.name}`}
                      type='number'
                      min='0'
                      step='1'
                      value={readingInputs[String(meter.id)] ?? ''}
                      onChange={event =>
                        setReadingInputs(current => ({
                          ...current,
                          [String(meter.id)]: event.target.value,
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
              )
            })}
            {meters.length === 0 && (
              <div className='empty-state'>No meters are configured.</div>
            )}
          </div>
        )}

        {tab === 'things' && (
          <div className='flex flex-col gap-3'>
            <div className='card p-4 flex gap-2 flex-wrap'>
              <input
                className='input flex-1'
                aria-label='New thing name'
                value={thingForm.name}
                onChange={event =>
                  setThingForm(current => ({
                    ...current,
                    name: event.target.value,
                  }))
                }
                placeholder='New thing name'
              />
              <select
                className='input'
                aria-label='New thing type'
                value={thingForm.type}
                onChange={event =>
                  setThingForm(current => ({
                    ...current,
                    type: event.target.value,
                  }))
                }
              >
                {THING_TYPES.map(type => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
              <button
                className='btn btn-primary'
                disabled={mutations.createThing.isPending}
                onClick={() => void createThing()}
              >
                Create thing
              </button>
            </div>

            <div
              className='grid gap-3'
              style={{
                gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
              }}
            >
              {things.map(thing => {
                const draft = thingDrafts[thing.id] ?? {
                  name: thing.name,
                  type: thing.type ?? 'text',
                }
                return (
                  <div key={thing.id} className='card p-5'>
                    <div className='flex items-start justify-between'>
                      <div style={{ fontSize: 28 }}>
                        {(thing.categoryRef ?? thing.category)?.name ===
                        'plants'
                          ? '🌿'
                          : '🔧'}
                      </div>
                      <span className='badge'>{thing.state || thing.type}</span>
                    </div>
                    <div className='font-bold text-primary mt-3'>
                      {thing.name}
                    </div>
                    <div className='text-faint'>
                      {(thing.categoryRef ?? thing.category)?.name ??
                        thing.type ??
                        'Uncategorized'}
                    </div>

                    {thingDrafts[thing.id] && (
                      <div className='flex flex-col gap-2 mt-3'>
                        <input
                          className='input'
                          aria-label={`Thing ${thing.name} name`}
                          value={draft.name}
                          onChange={event =>
                            setThingDrafts(current => ({
                              ...current,
                              [thing.id]: {
                                ...current[thing.id],
                                name: event.target.value,
                              },
                            }))
                          }
                          placeholder='Thing name'
                        />
                        <select
                          className='input'
                          aria-label={`Thing ${thing.name} type`}
                          value={draft.type}
                          onChange={event =>
                            setThingDrafts(current => ({
                              ...current,
                              [thing.id]: {
                                ...current[thing.id],
                                type: event.target.value,
                              },
                            }))
                          }
                        >
                          {THING_TYPES.map(type => (
                            <option key={type} value={type}>
                              {type}
                            </option>
                          ))}
                        </select>
                        <button
                          className='btn btn-primary btn-sm'
                          disabled={mutations.updateThing.isPending}
                          onClick={() =>
                            void saveThingEdit(thing.id, thing.state ?? '')
                          }
                        >
                          Save changes
                        </button>
                      </div>
                    )}

                    <div className='flex gap-2 mt-4 flex-wrap'>
                      {thing.type === 'boolean' ? (
                        <button
                          className='btn btn-sm btn-primary'
                          disabled={mutations.updateThingState.isPending}
                          onClick={() =>
                            void toggleThing(thing.id, thing.state ?? 'off')
                          }
                        >
                          Turn {thing.state === 'on' ? 'off' : 'on'}
                        </button>
                      ) : (
                        <div className='text-muted' style={{ fontSize: 12 }}>
                          This thing’s state is read-only because its type does
                          not support a toggle action.
                        </div>
                      )}
                      <button
                        className='btn btn-secondary btn-sm'
                        onClick={() =>
                          setThingDrafts(current =>
                            current[thing.id]
                              ? (() => {
                                  const next = { ...current }
                                  delete next[thing.id]
                                  return next
                                })()
                              : { ...current, [thing.id]: draft },
                          )
                        }
                      >
                        {thingDrafts[thing.id] ? 'Cancel edit' : 'Edit'}
                      </button>
                      <button
                        className='btn btn-secondary btn-sm'
                        onClick={() =>
                          setExpandedThing(current =>
                            current === thing.id ? null : thing.id,
                          )
                        }
                      >
                        {expandedThing === thing.id
                          ? 'Hide history'
                          : 'History'}
                      </button>
                      <button
                        className='btn btn-danger btn-sm'
                        disabled={mutations.deleteThing.isPending}
                        onClick={() => void deleteThing(thing.id, thing.name)}
                      >
                        Delete
                      </button>
                    </div>

                    {expandedThing === thing.id && (
                      <div className='mt-3 flex flex-col gap-2'>
                        <div className='font-semibold text-primary'>
                          State history
                        </div>
                        {thingHistory.data &&
                          thingHistory.data.length === 0 && (
                            <div
                              className='text-faint'
                              style={{ fontSize: 12 }}
                            >
                              No state changes recorded yet.
                            </div>
                          )}
                        {(thingHistory.data ?? []).map(entry => (
                          <div
                            key={`thing-history-${entry.id}`}
                            className='flex items-center gap-2'
                            style={{ fontSize: 13 }}
                          >
                            <span className='flex-1'>{entry.state}</span>
                            <span className='text-faint'>
                              {entry.createdAt
                                ? formatDate(entry.createdAt)
                                : ''}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
            {things.length === 0 && (
              <div className='empty-state'>No things are configured.</div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
