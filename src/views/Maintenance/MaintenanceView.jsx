import { Add, Archive, Build, Edit, Speed } from '@mui/icons-material'
import {
  Box,
  Button,
  Card,
  Chip,
  Divider,
  FormControl,
  FormLabel,
  Input,
  Option,
  Select,
  Stack,
  Tab,
  TabList,
  TabPanel,
  Tabs,
  Textarea,
  Typography,
} from '@mui/joy'
import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'

import AppModal from '../../components/common/AppModal'
import EmptyState from '../../components/common/EmptyState'
import PageHeader from '../../components/common/PageHeader'
import QueryLoadingView from '../../components/common/QueryLoadingView'
import SectionCard from '../../components/common/SectionCard'
import { useNotification } from '../../service/NotificationProvider'
import { pageShellSx, pageStackSpacing } from '../../theme/appLayout'
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
import { dueReason, meterRemaining, timeRemaining } from './maintenanceFormat'

const categories = [
  'Vehicle',
  'Appliance',
  'HVAC',
  'Filter',
  'Equipment',
  'Other',
]

const ModalActions = ({ disabled, onClose, onSave, saveLabel, t }) => (
  <Stack direction='row' justifyContent='flex-end' spacing={1}>
    <Button variant='plain' color='neutral' onClick={onClose}>
      {t('cancel')}
    </Button>
    <Button disabled={disabled} onClick={onSave}>
      {saveLabel}
    </Button>
  </Stack>
)

const StatusLines = ({ item, t }) => (
  <Stack spacing={0.25}>
    {item.meterSchedule && (
      <Typography level='body-sm'>
        {meterRemaining(item.meterSchedule, t)}
      </Typography>
    )}
    {item.nextDueDate && (
      <Typography level='body-sm'>
        {timeRemaining(item.nextDueDate, t)}
      </Typography>
    )}
    {item.meterSchedule && item.nextDueDate && (
      <Typography level='body-xs'>{t('maintenance.whicheverFirst')}</Typography>
    )}
  </Stack>
)

const MaintenanceCard = ({ item, onComplete }) => {
  const { i18n, t } = useTranslation('common')
  const locale = i18n.resolvedLanguage || i18n.language
  return (
    <Card variant='outlined'>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={1.5}
        alignItems={{ sm: 'center' }}
      >
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography level='title-md'>{item.name}</Typography>
          <Typography level='body-sm'>{item.assetName}</Typography>
          <StatusLines item={item} t={t} />
          {item.lastService && (
            <Typography level='body-xs' sx={{ mt: 0.5 }}>
              {t('maintenance.lastServiced', {
                date: new Date(item.lastService.performedAt).toLocaleString(
                  locale,
                ),
              })}
              {item.lastService.meterReading != null
                ? t('maintenance.atReading', {
                    reading:
                      item.lastService.meterReading.toLocaleString(locale),
                    unit: item.lastService.meterUnit,
                  })
                : ''}
            </Typography>
          )}
        </Box>
        <Chip
          color={
            item.status === 'due'
              ? 'danger'
              : item.status === 'approaching'
                ? 'warning'
                : 'neutral'
          }
          variant='soft'
        >
          {item.status === 'approaching'
            ? t('maintenance.approaching')
            : dueReason(item.dueReason, t)}
        </Chip>
        {onComplete && (
          <Button onClick={() => onComplete(item)}>
            {t('maintenance.complete')}
          </Button>
        )}
      </Stack>
    </Card>
  )
}

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
      <Stack spacing={2}>
        <FormControl required>
          <FormLabel>{t('maintenance.name')}</FormLabel>
          <Input
            value={form.name}
            onChange={event => setForm({ ...form, name: event.target.value })}
          />
        </FormControl>
        <FormControl>
          <FormLabel>{t('maintenance.category')}</FormLabel>
          <Select
            value={form.category || null}
            placeholder={t('maintenance.optional')}
            onChange={(_, value) => setForm({ ...form, category: value || '' })}
          >
            {categories.map(value => (
              <Option value={value} key={value}>
                {t(`maintenance.categories.${value.toLowerCase()}`)}
              </Option>
            ))}
          </Select>
        </FormControl>
        <FormControl>
          <FormLabel>{t('maintenance.description')}</FormLabel>
          <Textarea
            minRows={3}
            value={form.description}
            onChange={event =>
              setForm({ ...form, description: event.target.value })
            }
          />
        </FormControl>
      </Stack>
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
      <Box sx={pageShellSx}>
        <EmptyState
          variant='error'
          icon={<Build />}
          title={t('maintenance.assetLoadError')}
          primaryAction={{ label: t('retry'), onClick: load }}
        />
      </Box>
    )
  }
  if (!asset) {
    return (
      <Box sx={pageShellSx}>
        <QueryLoadingView label={t('maintenance.loadingAsset')} />
      </Box>
    )
  }

  return (
    <Box sx={pageShellSx}>
      <Stack spacing={pageStackSpacing}>
        <PageHeader
          title={asset.name}
          subtitle={`${asset.category || t('maintenance.assetFallback')}${
            asset.description ? ` · ${asset.description}` : ''
          }`}
          action={
            <Stack direction='row' flexWrap='wrap' gap={1}>
              <Button
                variant='outlined'
                startDecorator={<Edit />}
                onClick={() => setEditing(true)}
              >
                {t('edit')}
              </Button>
              <Button startDecorator={<Add />} onClick={openLinks}>
                {t('maintenance.link')}
              </Button>
            </Stack>
          }
        />

        <SectionCard title={t('maintenance.meters')}>
          {asset.meters.length === 0 ? (
            <EmptyState size='sm' title={t('maintenance.noLinkedMeters')} />
          ) : (
            <Stack spacing={1}>
              {asset.meters.map(meter => (
                <Card key={meter.id} variant='soft'>
                  <Stack
                    direction={{ xs: 'column', sm: 'row' }}
                    alignItems={{ sm: 'center' }}
                    gap={1.5}
                  >
                    <Speed />
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography level='title-md'>{meter.name}</Typography>
                      <Typography level='body-xs'>
                        {t('maintenance.updated', {
                          date: new Date(meter.updatedAt).toLocaleString(
                            locale,
                          ),
                        })}
                      </Typography>
                      {meter.updateReminder && (
                        <Typography
                          level='body-xs'
                          color={
                            meter.updateReminder.updateStatus === 'overdue'
                              ? 'warning'
                              : 'neutral'
                          }
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
                        </Typography>
                      )}
                    </Box>
                    <Typography level='h3' className='daydan-metric'>
                      {meter.currentReading.toLocaleString(locale)} {meter.unit}
                    </Typography>
                    <Button
                      size='sm'
                      onClick={() => {
                        setReadingMeter(meter)
                        setReading(meter.currentReading)
                      }}
                    >
                      {t('maintenance.updateReading')}
                    </Button>
                  </Stack>
                </Card>
              ))}
            </Stack>
          )}
        </SectionCard>

        <SectionCard title={t('maintenance.maintenanceStatus')}>
          {asset.maintenance.length === 0 ? (
            <EmptyState size='sm' title={t('maintenance.noMaintenance')} />
          ) : (
            <Stack spacing={1}>
              {asset.maintenance.map(item => (
                <MaintenanceCard
                  key={item.choreId}
                  item={item}
                  onComplete={() => navigate(`/chores/${item.choreId}`)}
                />
              ))}
            </Stack>
          )}
        </SectionCard>

        <SectionCard title={t('maintenance.maintenanceHistory')}>
          {asset.history.length === 0 ? (
            <EmptyState size='sm' title={t('maintenance.noHistory')} />
          ) : (
            <Stack divider={<Divider />} spacing={1}>
              {asset.history.map(entry => (
                <Box key={entry.id}>
                  <Typography level='title-sm'>{entry.choreName}</Typography>
                  <Typography level='body-sm'>
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
                  </Typography>
                </Box>
              ))}
            </Stack>
          )}
        </SectionCard>
      </Stack>

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
        <Stack spacing={2}>
          <Select
            value={link.kind}
            onChange={(_, value) => setLink({ kind: value, id: null })}
          >
            <Option value='meter'>{t('maintenance.meterOption')}</Option>
            <Option value='chore'>{t('maintenance.choreOption')}</Option>
          </Select>
          <Select
            placeholder={t('maintenance.chooseKind', {
              kind: t(`maintenance.${link.kind}Option`),
            })}
            value={link.id}
            onChange={(_, value) => setLink({ ...link, id: value })}
          >
            {(link.kind === 'meter' ? meters : chores).map(item => (
              <Option key={item.id} value={item.id}>
                {item.name}
              </Option>
            ))}
          </Select>
        </Stack>
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
        <Input
          type='number'
          value={reading}
          endDecorator={readingMeter?.unit}
          onChange={event => setReading(event.target.value)}
        />
      </AppModal>
    </Box>
  )
}

const emptyMaintenance = {
  due: [],
  approaching: [],
  upcoming: [],
  assets: [],
}

const MaintenanceView = () => {
  const { t } = useTranslation('common')
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

  return (
    <Box sx={pageShellSx}>
      <Stack spacing={pageStackSpacing}>
        <PageHeader
          title={t('maintenance.title')}
          subtitle={t('maintenance.subtitle')}
          action={
            <Button startDecorator={<Add />} onClick={() => setCreating(true)}>
              {t('maintenance.addAsset')}
            </Button>
          }
        />

        {isLoading && <QueryLoadingView label={t('maintenance.loading')} />}
        {!isLoading && loadError && (
          <EmptyState
            variant='error'
            icon={<Build />}
            title={t('maintenance.loadError')}
            primaryAction={{ label: t('retry'), onClick: load }}
          />
        )}
        {!isLoading && !loadError && (
          <Tabs defaultValue={0}>
            <TabList sx={{ overflowX: 'auto' }}>
              <Tab>{t('maintenance.dueTab', { count: data.due.length })}</Tab>
              <Tab>
                {t('maintenance.approachingTab', {
                  count: data.approaching.length,
                })}
              </Tab>
              <Tab>{t('maintenance.upcomingTab')}</Tab>
              <Tab>{t('maintenance.assetsTab')}</Tab>
            </TabList>
            <TabPanel value={0} sx={{ px: 0 }}>
              {data.due.length ? (
                <Stack spacing={1}>
                  {data.due.map(item => (
                    <MaintenanceCard
                      key={item.choreId}
                      item={item}
                      onComplete={complete}
                    />
                  ))}
                </Stack>
              ) : (
                <EmptyState
                  size='sm'
                  icon={<Build />}
                  title={t('maintenance.onTrack')}
                />
              )}
            </TabPanel>
            <TabPanel value={1} sx={{ px: 0 }}>
              {data.approaching.length ? (
                <Stack spacing={1}>
                  {data.approaching.map(item => (
                    <MaintenanceCard key={item.choreId} item={item} />
                  ))}
                </Stack>
              ) : (
                <EmptyState
                  size='sm'
                  title={t('maintenance.noneApproaching')}
                />
              )}
            </TabPanel>
            <TabPanel value={2} sx={{ px: 0 }}>
              {data.upcoming.length ? (
                <Stack spacing={1}>
                  {data.upcoming.map(item => (
                    <MaintenanceCard key={item.choreId} item={item} />
                  ))}
                </Stack>
              ) : (
                <EmptyState size='sm' title={t('maintenance.noneUpcoming')} />
              )}
            </TabPanel>
            <TabPanel value={3} sx={{ px: 0 }}>
              {data.assets.length ? (
                <Stack spacing={1}>
                  {data.assets.map(asset => (
                    <Card key={asset.id} variant='outlined'>
                      <Stack
                        direction={{ xs: 'column', sm: 'row' }}
                        alignItems={{ sm: 'center' }}
                        gap={1.5}
                      >
                        <Build />
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography level='title-md'>{asset.name}</Typography>
                          <Typography level='body-sm'>
                            {asset.category || t('maintenance.assetFallback')}
                          </Typography>
                        </Box>
                        <Chip
                          color={
                            asset.status === 'attention'
                              ? 'danger'
                              : asset.status === 'upcoming'
                                ? 'warning'
                                : 'success'
                          }
                          variant='soft'
                        >
                          {asset.status === 'attention'
                            ? t('maintenance.attentionRequired')
                            : asset.status === 'upcoming'
                              ? t('maintenance.upcomingMaintenance')
                              : t('maintenance.allGood')}
                        </Chip>
                        <Stack direction='row' flexWrap='wrap' gap={0.5}>
                          <Button
                            variant='outlined'
                            onClick={() =>
                              navigate(`/maintenance/assets/${asset.id}`)
                            }
                            aria-label={t('maintenance.openAsset', {
                              name: asset.name,
                            })}
                          >
                            {t('maintenance.open')}
                          </Button>
                          <Button
                            variant='plain'
                            color='danger'
                            startDecorator={<Archive />}
                            onClick={() => archive(asset.id)}
                          >
                            {t('maintenance.archive')}
                          </Button>
                        </Stack>
                      </Stack>
                    </Card>
                  ))}
                </Stack>
              ) : (
                <EmptyState
                  size='sm'
                  icon={<Build />}
                  title={t('maintenance.noAssets')}
                  description={t('maintenance.noAssetsDescription')}
                  primaryAction={{
                    label: t('maintenance.addAsset'),
                    onClick: () => setCreating(true),
                  }}
                />
              )}
            </TabPanel>
          </Tabs>
        )}
      </Stack>
      {creating && (
        <AssetForm onClose={() => setCreating(false)} onSaved={load} />
      )}
    </Box>
  )
}

export default MaintenanceView
