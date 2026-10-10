import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { AppCtx, Icon } from '../App'
import {
  EmptyState,
  EntityGrid,
  EntityList,
  PageShell,
  PageTabs,
} from '../components/page'
import PageHeader from '../components/PageHeader'
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

type Tab = 'assets' | 'meters' | 'trackers'

const METER_UNITS = ['count', 'km', 'miles', 'hours', 'cycles'] as const
const THING_TYPES = ['boolean', 'text', 'number', 'action'] as const

const taskID = (id: string) => Number(id.replace(/^maint-/, ''))

export default function MaintenanceScreen({ ctx }: { ctx: AppCtx }) {
  const { t } = useTranslation()
  const { maintenanceItems } = useLiveData()
  const { data: assets = [] } = useMaintenanceAssets(true)
  const { data: meters = [] } = useMeters()
  const { data: things = [] } = useThings()
  const { data: chores = [] } = useChores()
  const taskMutations = useTaskMutations()
  const mutations = useMaintenanceMutations()

  const [tab, setTab] = useState<Tab>('assets')
  const [readingInputs, setReadingInputs] = useState<Record<string, string>>({})

  // Asset edit / link state. Creation is owned by CreateEntityModal.
  const [assetDrafts, setAssetDrafts] = useState<
    Record<number, { name: string; category: string; description: string }>
  >({})
  const [expandedAsset, setExpandedAsset] = useState<number | null>(null)
  const [linkSelection, setLinkSelection] = useState<
    Record<number, { meterId: string; choreId: string }>
  >({})

  // Meter edit state. Creation is owned by CreateEntityModal.
  const [meterDrafts, setMeterDrafts] = useState<
    Record<number, { name: string; unit: string }>
  >({})
  const [expandedMeter, setExpandedMeter] = useState<number | null>(null)

  // Tracker edit state. Legacy "thing" identifiers remain internal for API compatibility.
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
      ctx.showToast(t('assets.toast.taskDone'))
    } catch (error) {
      ctx.showToast(
        error instanceof Error ? error.message : t('assets.error.completeTask'),
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
      ctx.showToast(t('assets.toast.trackerState', { state: next }))
    } catch (error) {
      ctx.showToast(
        error instanceof Error
          ? error.message
          : t('assets.error.updateTracker'),
      )
    }
  }

  /* ── Asset actions ── */

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
        ...(draft.description.trim() && {
          description: draft.description.trim(),
        }),
        ...(draft.category.trim() && { category: draft.category.trim() }),
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
      ctx.showToast(t('assets.error.chooseLink'))
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

  /* ── Tracker actions (legacy thing API identifiers remain internal) ── */

  const saveThingEdit = async (id: number, currentState: string) => {
    const draft = thingDrafts[id]
    if (!draft || !draft.name.trim()) {
      ctx.showToast(t('create.validation.trackerName'))
      return
    }
    if (!THING_TYPES.includes(draft.type as (typeof THING_TYPES)[number])) {
      ctx.showToast(t('assets.error.trackerType'))
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
      ctx.showToast(t('assets.toast.trackerUpdated'))
    } catch (error) {
      ctx.showToast(
        error instanceof Error
          ? error.message
          : t('assets.error.updateTracker'),
      )
    }
  }

  const deleteThing = async (id: number, name: string) => {
    try {
      await mutations.deleteThing.mutateAsync(id)
      ctx.showToast(t('assets.toast.trackerDeleted', { name }))
    } catch (error) {
      ctx.showToast(
        error instanceof Error
          ? error.message
          : t('assets.error.deleteTracker'),
      )
    }
  }

  return (
    <PageShell
      testId='assets-page'
      header={
        <PageHeader
          title={t('nav.assets')}
          subtitle={t('assets.page.subtitle')}
          actions={
            tab === 'assets' ? (
              <button
                className='btn btn-primary'
                onClick={() => ctx.openCreate('asset')}
              >
                <Icon name='maintenance' size={14} />
                {t('create.asset.title')}
              </button>
            ) : tab === 'meters' ? (
              <button
                className='btn btn-primary'
                onClick={() => ctx.openCreate('meter')}
              >
                <Icon name='meter' size={14} />
                {t('create.meter.title')}
              </button>
            ) : (
              <button
                className='btn btn-primary'
                onClick={() => ctx.openCreate('tracker')}
              >
                <Icon name='activity' size={14} />
                {t('create.tracker.title')}
              </button>
            )
          }
        />
      }
    >
      <PageTabs
        ariaLabel={t('assets.sectionsLabel')}
        testId='assets-tabs'
        value={tab}
        onChange={id => setTab(id as Tab)}
        tabs={[
          {
            id: 'assets',
            label: t('assets.tabs.assets', { count: assets.length }),
          },
          {
            id: 'meters',
            label: t('assets.tabs.meters', { count: meters.length }),
          },
          {
            id: 'trackers',
            label: t('assets.tabs.trackers', { count: things.length }),
          },
        ]}
      />

      {tab === 'assets' && (
        <EntityList>
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
            const unlinkedChores = chores.filter(c => !linkedChoreIds.has(c.id))
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
                        {t('assets.linkedTasks')}
                      </div>
                      {linkedChores.length === 0 && (
                        <div className='text-faint' style={{ fontSize: 12 }}>
                          {t('assets.empty.linkedTasks')}
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
                          aria-label={t('assets.taskToLinkLabel')}
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
                          <option value=''>
                            {t('assets.linkTaskPlaceholder')}
                          </option>
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
                          {t('assets.empty.history')}
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
                            {entry.completedByName ?? 'Space member'}
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
            <EmptyState title={t('assets.empty.assets')} />
          )}

          <div className='font-semibold text-primary mt-2'>
            {t('assets.dueTasks')}
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
            <EmptyState title={t('assets.empty.due')} />
          )}
        </EntityList>
      )}

      {tab === 'meters' && (
        <EntityList>
          {meters.map(meter => {
            const draft = meterDrafts[meter.id] ?? {
              name: meter.name,
              unit: meter.unit ?? 'count',
            }
            return (
              <div key={meter.id} className='card p-5'>
                <div className='flex items-start gap-4 flex-wrap'>
                  <Icon name='meter' size={28} />
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
            <EmptyState title='No meters are configured.' />
          )}
        </EntityList>
      )}

      {tab === 'trackers' && (
        <EntityList>
          <EntityGrid min={260}>
            {things.map(thing => {
              const draft = thingDrafts[thing.id] ?? {
                name: thing.name,
                type: thing.type ?? 'text',
              }
              return (
                <div key={thing.id} className='card p-5'>
                  <div className='flex items-start justify-between'>
                    <Icon name='activity' size={28} />
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
                        aria-label={t('assets.trackerNameAria', {
                          name: thing.name,
                        })}
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
                        placeholder={t('create.tracker.namePlaceholder')}
                      />
                      <select
                        className='input'
                        aria-label={t('assets.trackerTypeAria', {
                          name: thing.name,
                        })}
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
                        {t('assets.trackerReadonly')}
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
                      {expandedThing === thing.id ? 'Hide history' : 'History'}
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
                      {thingHistory.data && thingHistory.data.length === 0 && (
                        <div className='text-faint' style={{ fontSize: 12 }}>
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
                            {entry.createdAt ? formatDate(entry.createdAt) : ''}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </EntityGrid>
          {things.length === 0 && (
            <EmptyState title={t('assets.empty.trackers')} />
          )}
        </EntityList>
      )}
    </PageShell>
  )
}
