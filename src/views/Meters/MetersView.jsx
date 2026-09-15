import { Add, Edit, History, Speed } from '@mui/icons-material'
import {
  Box,
  Button,
  Card,
  Checkbox,
  Chip,
  FormControl,
  FormLabel,
  Input,
  Option,
  Select,
  Stack,
  Table,
  Typography,
} from '@mui/joy'
import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import AppModal from '../../components/common/AppModal'
import EmptyState from '../../components/common/EmptyState'
import PageHeader from '../../components/common/PageHeader'
import QueryLoadingView from '../../components/common/QueryLoadingView'
import { useCircleMembers } from '../../queries/UserQueries'
import { useNotification } from '../../service/NotificationProvider'
import { pageShellSx, pageStackSpacing } from '../../theme/appLayout'
import {
  AddMeterReading,
  CreateMeter,
  GetMeterHistory,
  GetMeters,
  SaveMeter,
} from '../../utils/Fetcher'
import RepeatPickerField from '../components/RepeatPickerField'

const units = ['km', 'miles', 'hours', 'cycles', 'count']
const emptyForm = {
  name: '',
  unit: 'km',
  initialReading: 0,
  reminderEnabled: false,
  reminder: null,
  assignedTo: null,
}

const ModalActions = ({ disabled, label, onClose, onSave }) => (
  <Stack direction='row' justifyContent='flex-end' spacing={1}>
    <Button variant='plain' color='neutral' onClick={onClose}>
      {label.cancel}
    </Button>
    <Button onClick={onSave} disabled={disabled}>
      {label.save}
    </Button>
  </Stack>
)

const MetersView = () => {
  const { i18n, t } = useTranslation('common')
  const locale = i18n.resolvedLanguage || i18n.language
  const [meters, setMeters] = useState([])
  const [editing, setEditing] = useState(null)
  const [readingMeter, setReadingMeter] = useState(null)
  const [historyMeter, setHistoryMeter] = useState(null)
  const [history, setHistory] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [reading, setReading] = useState('')
  const [isCorrection, setIsCorrection] = useState(false)
  const [correctionNote, setCorrectionNote] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const { showError, showNotification } = useNotification()
  const { data: circleMembers } = useCircleMembers()

  const load = useCallback(async () => {
    setLoadError(false)
    try {
      const response = await GetMeters()
      if (!response.ok) throw new Error('meters')
      const data = await response.json()
      setMeters(data.res || [])
    } catch {
      setLoadError(true)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const closeEditor = () => setEditing(null)
  const save = async () => {
    const payload = {
      ...form,
      reminder: form.reminderEnabled
        ? { enabled: true, ...form.reminder, assignedTo: form.assignedTo }
        : { enabled: false },
    }
    const response = editing?.id
      ? await SaveMeter({ ...payload, id: editing.id })
      : await CreateMeter(payload)
    if (!response.ok) {
      showError({
        title: t('meters.saveErrorTitle'),
        message: t('meters.saveErrorMessage'),
      })
      return
    }
    closeEditor()
    setForm(emptyForm)
    await load()
    showNotification({
      type: 'success',
      title: t('meters.savedTitle'),
      message: t('meters.savedMessage'),
    })
  }

  const updateReading = async () => {
    const response = await AddMeterReading(readingMeter.id, {
      reading: Number(reading),
      correction: isCorrection,
      note: isCorrection ? correctionNote : null,
    })
    const data = await response.json()
    if (!response.ok) {
      showError({ title: t('meters.readingErrorTitle'), message: data.error })
      return
    }
    setReadingMeter(null)
    setReading('')
    setIsCorrection(false)
    setCorrectionNote('')
    await load()
  }

  const openHistory = async meter => {
    const response = await GetMeterHistory(meter.id)
    const data = await response.json()
    setHistory(data.res || [])
    setHistoryMeter(meter)
  }

  const openEditor = meter => {
    setEditing(meter || {})
    setForm(
      meter
        ? {
            name: meter.name,
            unit: meter.unit,
            initialReading: meter.currentReading,
            reminderEnabled: !!meter.updateReminder,
            reminder: meter.updateReminder
              ? {
                  frequencyType: meter.updateReminder.frequencyType,
                  frequency: meter.updateReminder.frequency,
                  frequencyMetadata:
                    meter.updateReminder.frequencyMetadata || {},
                }
              : null,
            assignedTo: meter.updateReminder?.assignedTo || null,
          }
        : emptyForm,
    )
  }

  return (
    <Box sx={pageShellSx}>
      <Stack spacing={pageStackSpacing}>
        <PageHeader
          title={t('meters.title')}
          subtitle={t('meters.subtitle')}
          action={
            <Button startDecorator={<Add />} onClick={() => openEditor()}>
              {t('meters.addMeter')}
            </Button>
          }
        />

        {isLoading && <QueryLoadingView label={t('meters.loading')} />}
        {!isLoading && loadError && (
          <EmptyState
            variant='error'
            icon={<Speed />}
            title={t('meters.loadError')}
            primaryAction={{ label: t('retry'), onClick: load }}
          />
        )}
        {!isLoading && !loadError && meters.length === 0 && (
          <EmptyState
            icon={<Speed />}
            title={t('meters.emptyTitle')}
            description={t('meters.emptyMessage')}
            primaryAction={{
              label: t('meters.addMeter'),
              onClick: () => openEditor(),
              startDecorator: <Add />,
            }}
          />
        )}
        {!isLoading && !loadError && meters.length > 0 && (
          <Stack spacing={1.5}>
            {meters.map(meter => (
              <Card key={meter.id} variant='outlined'>
                <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  alignItems={{ sm: 'center' }}
                  gap={1.5}
                >
                  <Speed color='primary' />
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography level='title-md'>{meter.name}</Typography>
                    <Chip size='sm' variant='soft'>
                      {meter.unit}
                    </Chip>
                  </Box>
                  <Box>
                    <Typography level='body-xs' color='neutral'>
                      {t('meters.currentReading')}
                    </Typography>
                    <Typography level='h3' className='dydan-metric'>
                      {meter.currentReading.toLocaleString(locale)} {meter.unit}
                    </Typography>
                  </Box>
                  <Stack direction='row' flexWrap='wrap' gap={0.5}>
                    <Button
                      size='sm'
                      onClick={() => {
                        setReadingMeter(meter)
                        setReading(meter.currentReading)
                        setIsCorrection(false)
                        setCorrectionNote('')
                      }}
                    >
                      {t('meters.update')}
                    </Button>
                    <Button
                      size='sm'
                      variant='plain'
                      startDecorator={<History />}
                      onClick={() => openHistory(meter)}
                    >
                      {t('meters.history')}
                    </Button>
                    <Button
                      size='sm'
                      variant='plain'
                      startDecorator={<Edit />}
                      onClick={() => openEditor(meter)}
                    >
                      {t('edit')}
                    </Button>
                  </Stack>
                </Stack>
              </Card>
            ))}
          </Stack>
        )}
      </Stack>

      <AppModal
        open={editing !== null}
        onClose={closeEditor}
        title={editing?.id ? t('meters.editTitle') : t('meters.createTitle')}
        description={t('meters.formDescription')}
        footer={
          <ModalActions
            label={{ cancel: t('cancel'), save: t('meters.saveMeter') }}
            onClose={closeEditor}
            onSave={save}
            disabled={
              !form.name.trim() || (form.reminderEnabled && !form.reminder)
            }
          />
        }
      >
        <Stack spacing={2}>
          <FormControl required>
            <FormLabel>{t('meters.name')}</FormLabel>
            <Input
              value={form.name}
              onChange={event => setForm({ ...form, name: event.target.value })}
            />
          </FormControl>
          <FormControl>
            <FormLabel>{t('meters.unit')}</FormLabel>
            <Select
              value={form.unit}
              onChange={(_, value) => setForm({ ...form, unit: value })}
            >
              {units.map(unit => (
                <Option key={unit} value={unit}>
                  {unit}
                </Option>
              ))}
            </Select>
          </FormControl>
          {!editing?.id && (
            <FormControl>
              <FormLabel>{t('meters.initialReading')}</FormLabel>
              <Input
                type='number'
                value={form.initialReading}
                onChange={event =>
                  setForm({
                    ...form,
                    initialReading: Number(event.target.value),
                  })
                }
              />
            </FormControl>
          )}
          <Box sx={{ borderTop: '1px solid', borderColor: 'divider', pt: 2 }}>
            <Typography level='title-md'>
              {t('meters.manualUpdates')}
            </Typography>
            <Checkbox
              label={t('meters.reminderLabel')}
              checked={form.reminderEnabled}
              onChange={event =>
                setForm({ ...form, reminderEnabled: event.target.checked })
              }
            />
            {form.reminderEnabled && (
              <Stack spacing={1.5} sx={{ mt: 1 }}>
                <Stack direction='row' alignItems='center' spacing={1}>
                  <FormLabel>{t('meters.updateFrequency')}</FormLabel>
                  <RepeatPickerField
                    value={form.reminder}
                    onChange={reminder => setForm({ ...form, reminder })}
                    onClear={() => setForm({ ...form, reminder: null })}
                  />
                </Stack>
                <FormControl>
                  <FormLabel>{t('meters.updateAssignee')}</FormLabel>
                  <Select
                    value={form.assignedTo || null}
                    placeholder={t('meters.me')}
                    onChange={(_, assignedTo) =>
                      setForm({ ...form, assignedTo })
                    }
                  >
                    {(circleMembers?.res || []).map(member => (
                      <Option key={member.userId} value={member.userId}>
                        {member.displayName || member.username}
                      </Option>
                    ))}
                  </Select>
                </FormControl>
              </Stack>
            )}
          </Box>
        </Stack>
      </AppModal>

      <AppModal
        open={!!readingMeter}
        onClose={() => setReadingMeter(null)}
        title={t('meters.updateTitle', { name: readingMeter?.name })}
        description={t('meters.correctionDescription')}
        footer={
          <ModalActions
            label={{ cancel: t('cancel'), save: t('meters.saveReading') }}
            onClose={() => setReadingMeter(null)}
            onSave={updateReading}
            disabled={isCorrection && !correctionNote.trim()}
          />
        }
      >
        <Stack spacing={2}>
          <Input
            type='number'
            value={reading}
            onChange={event => setReading(event.target.value)}
            endDecorator={readingMeter?.unit}
          />
          <Checkbox
            label={t('meters.correction')}
            checked={isCorrection}
            onChange={event => setIsCorrection(event.target.checked)}
          />
          {isCorrection && (
            <FormControl required>
              <FormLabel>{t('meters.correctionNote')}</FormLabel>
              <Input
                value={correctionNote}
                onChange={event => setCorrectionNote(event.target.value)}
                placeholder={t('meters.correctionPlaceholder')}
              />
            </FormControl>
          )}
        </Stack>
      </AppModal>

      <AppModal
        open={!!historyMeter}
        onClose={() => setHistoryMeter(null)}
        title={t('meters.historyTitle', { name: historyMeter?.name })}
        size='lg'
      >
        {history.length === 0 ? (
          <EmptyState size='sm' title={t('meters.noHistory')} />
        ) : (
          <Box sx={{ overflowX: 'auto' }}>
            <Table>
              <thead>
                <tr>
                  <th>{t('meters.reading')}</th>
                  <th>{t('meters.type')}</th>
                  <th>{t('meters.recorded')}</th>
                </tr>
              </thead>
              <tbody>
                {history.map(item => (
                  <tr key={item.id}>
                    <td>
                      {item.reading.toLocaleString(locale)} {historyMeter?.unit}
                    </td>
                    <td>{item.kind}</td>
                    <td>{new Date(item.recordedAt).toLocaleString(locale)}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Box>
        )}
      </AppModal>
    </Box>
  )
}

export default MetersView
