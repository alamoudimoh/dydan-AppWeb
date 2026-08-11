import { Add, Edit, History, Speed } from '@mui/icons-material'
import {
  Box,
  Button,
  Card,
  Checkbox,
  Chip,
  Container,
  FormControl,
  FormLabel,
  Input,
  Modal,
  ModalClose,
  ModalDialog,
  Option,
  Select,
  Stack,
  Table,
  Typography,
} from '@mui/joy'
import { useCallback, useEffect, useState } from 'react'

import { useCircleMembers } from '../../queries/UserQueries'
import { useNotification } from '../../service/NotificationProvider'
import {
  AddMeterReading,
  CreateMeter,
  GetMeterHistory,
  GetMeters,
  SaveMeter,
} from '../../utils/Fetcher'
import RepeatPickerField from '../components/RepeatPickerField'

const units = ['km', 'miles', 'hours', 'cycles', 'count']

const MetersView = () => {
  const [meters, setMeters] = useState([])
  const [editing, setEditing] = useState(null)
  const [readingMeter, setReadingMeter] = useState(null)
  const [historyMeter, setHistoryMeter] = useState(null)
  const [history, setHistory] = useState([])
  const emptyForm = {
    name: '',
    unit: 'km',
    initialReading: 0,
    reminderEnabled: false,
    reminder: null,
    assignedTo: null,
  }
  const [form, setForm] = useState(emptyForm)
  const [reading, setReading] = useState('')
  const [isCorrection, setIsCorrection] = useState(false)
  const [correctionNote, setCorrectionNote] = useState('')
  const { showError, showNotification } = useNotification()
  const { data: circleMembers } = useCircleMembers()

  const load = useCallback(
    () =>
      GetMeters()
        .then(r => r.json())
        .then(d => setMeters(d.res || [])),
    [],
  )

  useEffect(() => {
    void load()
  }, [load])

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
        title: 'Unable to save meter',
        message: 'Check the meter details and try again.',
      })
      return
    }
    setEditing(null)
    setForm(emptyForm)
    await load()
    showNotification({
      type: 'success',
      title: 'Meter saved',
      message: 'The meter is ready to use.',
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
      showError({ title: 'Unable to update reading', message: data.error })
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

  return (
    <Container maxWidth='md' sx={{ py: 2 }}>
      <Stack
        direction='row'
        justifyContent='space-between'
        alignItems='center'
        mb={2}
      >
        <Box>
          <Typography level='h2'>Meters</Typography>
          <Typography level='body-sm'>
            Track odometers, runtime hours, cycles, and counters.
          </Typography>
        </Box>
        <Button
          startDecorator={<Add />}
          onClick={() => {
            setEditing({})
            setForm(emptyForm)
          }}
        >
          New meter
        </Button>
      </Stack>
      <Stack spacing={1}>
        {meters.map(meter => (
          <Card
            key={meter.id}
            orientation='horizontal'
            sx={{ alignItems: 'center' }}
          >
            <Speed />
            <Box sx={{ flex: 1 }}>
              <Typography level='title-md'>{meter.name}</Typography>
              <Chip size='sm'>{meter.unit}</Chip>
            </Box>
            <Typography level='h3'>
              {meter.currentReading.toLocaleString()} {meter.unit}
            </Typography>
            <Button
              size='sm'
              onClick={() => {
                setReadingMeter(meter)
                setReading(meter.currentReading)
                setIsCorrection(false)
                setCorrectionNote('')
              }}
            >
              Update
            </Button>
            <Button
              size='sm'
              variant='plain'
              startDecorator={<History />}
              onClick={() => openHistory(meter)}
            >
              History
            </Button>
            <Button
              size='sm'
              variant='plain'
              startDecorator={<Edit />}
              onClick={() => {
                setEditing(meter)
                setForm({
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
                })
              }}
            >
              Edit
            </Button>
          </Card>
        ))}
      </Stack>

      <Modal open={editing !== null} onClose={() => setEditing(null)}>
        <ModalDialog>
          <ModalClose />
          <Typography level='h4'>
            {editing?.id ? 'Edit meter' : 'Create meter'}
          </Typography>
          <FormControl>
            <FormLabel>Name</FormLabel>
            <Input
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
            />
          </FormControl>
          <FormControl>
            <FormLabel>Unit</FormLabel>
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
              <FormLabel>Initial reading</FormLabel>
              <Input
                type='number'
                value={form.initialReading}
                onChange={e =>
                  setForm({ ...form, initialReading: Number(e.target.value) })
                }
              />
            </FormControl>
          )}
          <Box sx={{ borderTop: '1px solid', borderColor: 'divider', pt: 2 }}>
            <Typography level='title-md'>Manual Reading Updates</Typography>
            <Checkbox
              label='Remind me to update this meter'
              checked={form.reminderEnabled}
              onChange={e =>
                setForm({ ...form, reminderEnabled: e.target.checked })
              }
            />
            {form.reminderEnabled && (
              <Stack spacing={1} mt={1}>
                <Stack direction='row' alignItems='center' spacing={1}>
                  <FormLabel>Update frequency</FormLabel>
                  <RepeatPickerField
                    value={form.reminder}
                    onChange={reminder => setForm({ ...form, reminder })}
                    onClear={() => setForm({ ...form, reminder: null })}
                  />
                </Stack>
                <FormControl>
                  <FormLabel>Who updates this meter?</FormLabel>
                  <Select
                    value={form.assignedTo || null}
                    placeholder='Me'
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
          <Button
            onClick={save}
            disabled={form.reminderEnabled && !form.reminder}
          >
            Save
          </Button>
        </ModalDialog>
      </Modal>

      <Modal open={!!readingMeter} onClose={() => setReadingMeter(null)}>
        <ModalDialog>
          <ModalClose />
          <Typography level='h4'>Update {readingMeter?.name}</Typography>
          <Typography level='body-sm'>
            Readings normally cannot decrease. Mark a correction when fixing a
            mistaken entry; its previous value and note remain in history.
          </Typography>
          <Input
            type='number'
            value={reading}
            onChange={e => setReading(e.target.value)}
            endDecorator={readingMeter?.unit}
          />
          <Checkbox
            label='This is a correction'
            checked={isCorrection}
            onChange={event => setIsCorrection(event.target.checked)}
          />
          {isCorrection && (
            <FormControl required>
              <FormLabel>Correction note</FormLabel>
              <Input
                value={correctionNote}
                onChange={event => setCorrectionNote(event.target.value)}
                placeholder='Why is this reading being corrected?'
              />
            </FormControl>
          )}
          <Button
            onClick={updateReading}
            disabled={isCorrection && !correctionNote.trim()}
          >
            Save reading
          </Button>
        </ModalDialog>
      </Modal>
      <Modal open={!!historyMeter} onClose={() => setHistoryMeter(null)}>
        <ModalDialog sx={{ minWidth: { sm: 560 } }}>
          <ModalClose />
          <Typography level='h4'>{historyMeter?.name} history</Typography>
          <Table>
            <thead>
              <tr>
                <th>Reading</th>
                <th>Type</th>
                <th>Recorded</th>
              </tr>
            </thead>
            <tbody>
              {history.map(item => (
                <tr key={item.id}>
                  <td>
                    {item.reading.toLocaleString()} {historyMeter?.unit}
                  </td>
                  <td>{item.kind}</td>
                  <td>{new Date(item.recordedAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </ModalDialog>
      </Modal>
    </Container>
  )
}

export default MetersView
