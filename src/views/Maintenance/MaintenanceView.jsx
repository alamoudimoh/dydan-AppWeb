import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'

import AppModal from '../../components/common/AppModal'
import EmptyState from '../../components/common/EmptyState'
import PageHeader from '../../components/common/PageHeader'
import QueryLoadingView from '../../components/common/QueryLoadingView'
import SectionCard from '../../components/common/SectionCard'
import FigmaIcon from '../../components/FigmaIcon'
import { useNotification } from '../../service/NotificationProvider'
import { pageShellSx } from '../../theme/appLayout'
import { sxToStyle } from '../../theme/sxToStyle'
import { getRecurrentChipText } from '../../utils/ChoreCardHelpers'
import {
  AddMeterReading,
  ArchiveAsset,
  CreateAsset,
  GetAsset,
  GetChores,
  GetMaintenance,
  GetMeters,
  LinkAsset,
  MarkChoreComplete,
  SaveAsset,
} from '../../utils/Fetcher'
import FigmaMaintenanceScreen from './FigmaMaintenanceScreen'
import { flattenMaintenance } from './maintenanceViewModel'

const categories = [
  'Vehicle',
  'Appliance',
  'HVAC',
  'Filter',
  'Equipment',
  'Other',
]

const ModalActions = ({ disabled, onClose, onSave, saveLabel, t }) => (
  <div className='flex items-center justify-end gap-2'>
    <button className='btn btn-ghost' onClick={onClose} type='button'>
      {t('cancel')}
    </button>
    <button
      className='btn btn-primary'
      disabled={disabled}
      onClick={onSave}
      type='button'
    >
      {saveLabel}
    </button>
  </div>
)

const ModalField = ({ children, label, required }) => (
  <label className='block'>
    <span
      className='section-label'
      style={{ display: 'block', padding: '0 0 6px' }}
    >
      {label}
      {required && (
        <span aria-hidden='true' style={{ color: 'var(--sig-over)' }}>
          {' '}
          *
        </span>
      )}
    </span>
    {children}
  </label>
)

const AssetForm = ({ asset, onClose, onSaved }) => {
  const { t } = useTranslation('common')
  const [form, setForm] = useState({
    name: asset?.name || '',
    description: asset?.description || '',
    category: asset?.category || '',
  })
  const save = async () => {
    const response = asset?.id
      ? await SaveAsset({ ...form, id: asset.id })
      : await CreateAsset(form)
    if (response.ok) {
      await onSaved()
      onClose()
    }
  }
  return (
    <AppModal
      open
      onClose={onClose}
      title={
        asset?.id ? t('maintenance.editAsset') : t('maintenance.createAsset')
      }
      description={t('maintenance.assetDescription')}
      footer={
        <ModalActions
          t={t}
          saveLabel={t('maintenance.saveAsset')}
          disabled={!form.name.trim()}
          onClose={onClose}
          onSave={save}
        />
      }
    >
      <div className='flex flex-col gap-3'>
        <ModalField label={t('maintenance.name')} required>
          <input
            className='input'
            value={form.name}
            onChange={event => setForm({ ...form, name: event.target.value })}
          />
        </ModalField>
        <ModalField label={t('maintenance.category')}>
          <select
            className='input'
            value={form.category || ''}
            onChange={event =>
              setForm({ ...form, category: event.target.value })
            }
          >
            <option value=''>{t('maintenance.optional')}</option>
            {categories.map(value => (
              <option value={value} key={value}>
                {t(`maintenance.categories.${value.toLowerCase()}`)}
              </option>
            ))}
          </select>
        </ModalField>
        <ModalField label={t('maintenance.description')}>
          <textarea
            className='input'
            rows={3}
            value={form.description}
            onChange={event =>
              setForm({ ...form, description: event.target.value })
            }
          />
        </ModalField>
      </div>
    </AppModal>
  )
}

export const AssetDetail = () => {
  const { i18n, t } = useTranslation('common')
  const locale = i18n.resolvedLanguage || i18n.language
  const { id } = useParams()
  const navigate = useNavigate()
  const { showError } = useNotification()
  const [asset, setAsset] = useState(null)
  const [loadError, setLoadError] = useState(false)
  const [editing, setEditing] = useState(false)
  const [linking, setLinking] = useState(false)
  const [meters, setMeters] = useState([])
  const [chores, setChores] = useState([])
  const [link, setLink] = useState({ kind: 'meter', id: null })
  const [readingMeter, setReadingMeter] = useState(null)
  const [reading, setReading] = useState('')
  const load = useCallback(async () => {
    setLoadError(false)
    const response = await GetAsset(id)
    if (response.ok) setAsset((await response.json()).res)
    else setLoadError(true)
  }, [id])

  useEffect(() => {
    void load()
  }, [load])

  const openLinks = async () => {
    const [meterResponse, choreResponse] = await Promise.all([
      GetMeters(),
      GetChores(),
    ])
    setMeters((await meterResponse.json()).res || [])
    setChores((await choreResponse.json()).res || [])
    setLinking(true)
  }
  const saveLink = async () => {
    const response = await LinkAsset(
      asset.id,
      link.kind === 'meter' ? { meterId: link.id } : { choreId: link.id },
    )
    if (!response.ok) {
      showError({
        title: t('maintenance.linkErrorTitle'),
        message: (await response.json()).error,
      })
      return
    }
    setLinking(false)
    await load()
  }
  const updateReading = async () => {
    const response = await AddMeterReading(readingMeter.id, {
      reading: Number(reading),
      correction: false,
    })
    if (response.ok) {
      setReadingMeter(null)
      await load()
    }
  }

  if (loadError) {
    return (
      <div style={sxToStyle(pageShellSx)}>
        <EmptyState
          variant='error'
          icon={<FigmaIcon name='error' size={22} />}
          title={t('maintenance.assetLoadError')}
          primaryAction={{ label: t('retry'), onClick: load }}
        />
      </div>
    )
  }
  if (!asset) {
    return (
      <div style={sxToStyle(pageShellSx)}>
        <QueryLoadingView label={t('maintenance.loadingAsset')} />
      </div>
    )
  }

  return (
    <div style={sxToStyle(pageShellSx)}>
      <PageHeader
        title={asset.name}
        subtitle={`${asset.category || t('maintenance.assetFallback')}${
          asset.description ? ` · ${asset.description}` : ''
        }`}
        action={
          <div className='flex flex-wrap gap-2'>
            <button
              className='btn btn-ghost'
              onClick={() => setEditing(true)}
              type='button'
            >
              <FigmaIcon name='edit' size={14} />
              {t('edit')}
            </button>
            <button
              className='btn btn-primary'
              onClick={openLinks}
              type='button'
            >
              <FigmaIcon name='plus' size={14} />
              {t('maintenance.link')}
            </button>
          </div>
        }
      />

      <SectionCard title={t('maintenance.meters')}>
        {asset.meters.length === 0 ? (
          <EmptyState size='sm' title={t('maintenance.noLinkedMeters')} />
        ) : (
          <div className='flex flex-col gap-2'>
            {asset.meters.map(meter => (
              <div key={meter.id} className='card'>
                <div className='flex flex-wrap items-center gap-3 p-4'>
                  <FigmaIcon
                    name='maintenance'
                    size={20}
                    style={{ color: 'var(--t-muted)', flexShrink: 0 }}
                  />
                  <div className='min-w-0 flex-1'>
                    <div
                      className='text-primary font-bold'
                      style={{ fontSize: 14 }}
                    >
                      {meter.name}
                    </div>
                    <div className='text-muted' style={{ fontSize: 12 }}>
                      {t('maintenance.updated', {
                        date: new Date(meter.updatedAt).toLocaleString(locale),
                      })}
                    </div>
                    {meter.updateReminder && (
                      <div
                        className='text-muted'
                        style={{
                          fontSize: 12,
                          color:
                            meter.updateReminder.updateStatus === 'overdue'
                              ? 'var(--sig-over)'
                              : undefined,
                        }}
                      >
                        {t('maintenance.updateReminder', {
                          recurrence: getRecurrentChipText(
                            meter.updateReminder,
                          ),
                        })}
                        {meter.updateReminder.nextUpdateDue
                          ? t('maintenance.nextUpdate', {
                              date: new Date(
                                meter.updateReminder.nextUpdateDue,
                              ).toLocaleString(locale),
                            })
                          : ''}
                        {meter.updateReminder.updateStatus === 'overdue'
                          ? t('maintenance.readingOutdated')
                          : ''}
                      </div>
                    )}
                  </div>
                  <div
                    className='daydan-metric'
                    style={{ fontSize: 20, fontWeight: 700 }}
                  >
                    {meter.currentReading.toLocaleString(locale)} {meter.unit}
                  </div>
                  <button
                    className='btn btn-sm btn-secondary'
                    onClick={() => {
                      setReadingMeter(meter)
                      setReading(meter.currentReading)
                    }}
                    type='button'
                  >
                    {t('maintenance.updateReading')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      <SectionCard title={t('maintenance.maintenanceStatus')}>
        {asset.maintenance.length === 0 ? (
          <EmptyState size='sm' title={t('maintenance.noMaintenance')} />
        ) : (
          <div className='flex flex-col gap-2'>
            {asset.maintenance.map(item => (
              <div key={item.choreId ?? item.id} className='card'>
                <div className='flex flex-wrap items-center justify-between gap-3 p-4'>
                  <div className='min-w-0 flex-1'>
                    <div
                      className='text-primary font-bold'
                      style={{ fontSize: 14 }}
                    >
                      {item.choreName || item.name}
                    </div>
                    {item.description && (
                      <div className='text-muted' style={{ fontSize: 12 }}>
                        {item.description}
                      </div>
                    )}
                    {item.nextDueDate && (
                      <div className='text-muted' style={{ fontSize: 12 }}>
                        {t('maintenance.nextDueLabel')}:{' '}
                        {new Date(item.nextDueDate).toLocaleDateString(locale)}
                      </div>
                    )}
                  </div>
                  <button
                    className='btn btn-sm btn-secondary'
                    onClick={() => navigate(`/chores/${item.choreId}`)}
                    type='button'
                  >
                    {t('maintenance.markDone')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      <SectionCard title={t('maintenance.maintenanceHistory')}>
        {asset.history.length === 0 ? (
          <EmptyState size='sm' title={t('maintenance.noHistory')} />
        ) : (
          <div>
            {asset.history.map(entry => (
              <div key={entry.id} className='border-line border-b py-2'>
                <div
                  className='text-primary font-semibold'
                  style={{ fontSize: 13 }}
                >
                  {entry.choreName}
                </div>
                <div className='text-muted' style={{ fontSize: 12 }}>
                  {t('maintenance.completedBy', {
                    date: new Date(entry.performedAt).toLocaleString(locale),
                    name:
                      entry.completedByName || t('maintenance.unknownMember'),
                  })}
                  {entry.meterReading != null
                    ? t('maintenance.atReading', {
                        reading: entry.meterReading.toLocaleString(locale),
                        unit: entry.meterUnit,
                      })
                    : ''}
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      {editing && (
        <AssetForm
          asset={asset}
          onClose={() => setEditing(false)}
          onSaved={load}
        />
      )}
      <AppModal
        open={linking}
        onClose={() => setLinking(false)}
        title={t('maintenance.linkTitle')}
        footer={
          <ModalActions
            t={t}
            saveLabel={t('maintenance.linkAction')}
            disabled={!link.id}
            onClose={() => setLinking(false)}
            onSave={saveLink}
          />
        }
      >
        <div className='flex flex-col gap-3'>
          <ModalField label={t('maintenance.linkKind')}>
            <div className='view-toggle' style={{ width: '100%' }}>
              <button
                className={`view-toggle-btn ${link.kind === 'meter' ? 'active' : ''}`}
                onClick={() => setLink({ kind: 'meter', id: null })}
                type='button'
              >
                {t('maintenance.meterOption')}
              </button>
              <button
                className={`view-toggle-btn ${link.kind === 'chore' ? 'active' : ''}`}
                onClick={() => setLink({ kind: 'chore', id: null })}
                type='button'
              >
                {t('maintenance.choreOption')}
              </button>
            </div>
          </ModalField>
          <ModalField
            label={t('maintenance.chooseKind', {
              kind: t(`maintenance.${link.kind}Option`),
            })}
          >
            <select
              className='input'
              value={link.id ?? ''}
              onChange={event =>
                setLink({ ...link, id: event.target.value || null })
              }
            >
              <option value=''>
                {t('maintenance.chooseKind', {
                  kind: t(`maintenance.${link.kind}Option`),
                })}
              </option>
              {(link.kind === 'meter' ? meters : chores).map(item => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </ModalField>
        </div>
      </AppModal>
      <AppModal
        open={!!readingMeter}
        onClose={() => setReadingMeter(null)}
        title={t('maintenance.updateTitle', { name: readingMeter?.name })}
        footer={
          <ModalActions
            t={t}
            saveLabel={t('maintenance.saveReading')}
            onClose={() => setReadingMeter(null)}
            onSave={updateReading}
          />
        }
      >
        <div className='flex items-end gap-2'>
          <input
            className='input'
            style={{ minWidth: 0, flex: 1 }}
            type='number'
            value={reading}
            onChange={event => setReading(event.target.value)}
          />
          {readingMeter?.unit && (
            <span className='text-muted' style={{ fontSize: 13 }}>
              {readingMeter.unit}
            </span>
          )}
        </div>
      </AppModal>
    </div>
  )
}

const emptyMaintenance = {
  due: [],
  approaching: [],
  upcoming: [],
  assets: [],
}

const MaintenanceView = () => {
  const { i18n, t } = useTranslation('common')
  const navigate = useNavigate()
  const [data, setData] = useState(emptyMaintenance)
  const [creating, setCreating] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const load = useCallback(async () => {
    setLoadError(false)
    const response = await GetMaintenance()
    if (response.ok) setData((await response.json()).res)
    else setLoadError(true)
    setIsLoading(false)
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const complete = async item => {
    const response = await MarkChoreComplete(item.choreId, {})
    if (response.ok) await load()
    else navigate(`/chores/${item.choreId}`)
  }
  const archive = async id => {
    if ((await ArchiveAsset(id)).ok) await load()
  }

  const maintenanceItems = useMemo(
    () => flattenMaintenance(data, i18n.resolvedLanguage || i18n.language),
    [data, i18n.language, i18n.resolvedLanguage],
  )

  const schedule = item => {
    if (item.assetId) {
      navigate(`/maintenance/assets/${item.assetId}`)
      return
    }
    setCreating(true)
  }

  return (
    <div style={sxToStyle(pageShellSx)}>
      {isLoading && <QueryLoadingView label={t('maintenance.loading')} />}
      {!isLoading && loadError && (
        <EmptyState
          variant='error'
          icon={<FigmaIcon name='error' size={22} />}
          title={t('maintenance.loadError')}
          primaryAction={{ label: t('retry'), onClick: load }}
        />
      )}
      {!isLoading && !loadError && (
        <FigmaMaintenanceScreen
          items={maintenanceItems}
          onAddItem={() => setCreating(true)}
          onMarkDone={complete}
          onSchedule={schedule}
          subtitle={t('maintenance.subtitle')}
          title={t('maintenance.title')}
        />
      )}
      {creating && (
        <AssetForm onClose={() => setCreating(false)} onSaved={load} />
      )}
    </div>
  )
}

export default MaintenanceView
