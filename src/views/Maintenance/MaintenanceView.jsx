import { Add, Archive, Build, Edit, Speed } from '@mui/icons-material'
import {
  Box,
  Button,
  Card,
  Chip,
  Container,
  Divider,
  FormControl,
  FormLabel,
  Input,
  Modal,
  ModalClose,
  ModalDialog,
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
import { useNavigate, useParams } from 'react-router-dom'

import { useNotification } from '../../service/NotificationProvider'
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

const StatusLines = ({ item }) => (
  <Stack spacing={0.25}>
    {item.meterSchedule && (
      <Typography level='body-sm'>
        {meterRemaining(item.meterSchedule)}
      </Typography>
    )}
    {item.nextDueDate && (
      <Typography level='body-sm'>{timeRemaining(item.nextDueDate)}</Typography>
    )}
    {item.meterSchedule && item.nextDueDate && (
      <Typography level='body-xs'>Whichever comes first</Typography>
    )}
  </Stack>
)

const MaintenanceCard = ({ item, onComplete }) => (
  <Card variant='outlined'>
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      spacing={1}
      alignItems={{ sm: 'center' }}
    >
      <Box sx={{ flex: 1 }}>
        <Typography level='title-md'>{item.name}</Typography>
        <Typography level='body-sm'>{item.assetName}</Typography>
        <StatusLines item={item} />
        {item.lastService && (
          <Typography level='body-xs' sx={{ mt: 0.5 }}>
            Last serviced{' '}
            {new Date(item.lastService.performedAt).toLocaleString()}
            {item.lastService.meterReading != null
              ? ` at ${item.lastService.meterReading.toLocaleString()} ${item.lastService.meterUnit}`
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
          ? 'Approaching'
          : dueReason(item.dueReason)}
      </Chip>
      {onComplete && <Button onClick={() => onComplete(item)}>Complete</Button>}
    </Stack>
  </Card>
)

const AssetForm = ({ asset, onClose, onSaved }) => {
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
      onSaved()
      onClose()
    }
  }
  return (
    <Modal open onClose={onClose}>
      <ModalDialog sx={{ width: { xs: 'calc(100% - 24px)', sm: 440 } }}>
        <ModalClose />
        <Typography level='h4'>
          {asset?.id ? 'Edit asset' : 'Create asset'}
        </Typography>
        <FormControl required>
          <FormLabel>Name</FormLabel>
          <Input
            value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
          />
        </FormControl>
        <FormControl>
          <FormLabel>Category</FormLabel>
          <Select
            value={form.category || null}
            placeholder='Optional'
            onChange={(_, value) => setForm({ ...form, category: value || '' })}
          >
            {categories.map(value => (
              <Option value={value} key={value}>
                {value}
              </Option>
            ))}
          </Select>
        </FormControl>
        <FormControl>
          <FormLabel>Description</FormLabel>
          <Textarea
            minRows={3}
            value={form.description}
            onChange={e => setForm({ ...form, description: e.target.value })}
          />
        </FormControl>
        <Button disabled={!form.name.trim()} onClick={save}>
          Save asset
        </Button>
      </ModalDialog>
    </Modal>
  )
}

export const AssetDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { showError } = useNotification()
  const [asset, setAsset] = useState(null)
  const [editing, setEditing] = useState(false)
  const [linking, setLinking] = useState(false)
  const [meters, setMeters] = useState([])
  const [chores, setChores] = useState([])
  const [link, setLink] = useState({ kind: 'meter', id: null })
  const [readingMeter, setReadingMeter] = useState(null)
  const [reading, setReading] = useState('')
  const load = useCallback(async () => {
    const response = await GetAsset(id)
    if (response.ok) setAsset((await response.json()).res)
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
    if (!response.ok)
      showError({
        title: 'Unable to link',
        message: (await response.json()).error,
      })
    else {
      setLinking(false)
      await load()
    }
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
  if (!asset)
    return (
      <Container sx={{ py: 2 }}>
        <Typography>Loading asset…</Typography>
      </Container>
    )
  return (
    <Container maxWidth='md' sx={{ py: 2 }}>
      <Stack spacing={2}>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          justifyContent='space-between'
          gap={1}
        >
          <Box>
            <Typography level='h2'>{asset.name}</Typography>
            <Typography>
              {asset.category || 'Asset'}
              {asset.description ? ` · ${asset.description}` : ''}
            </Typography>
          </Box>
          <Stack direction='row'>
            <Button
              variant='outlined'
              startDecorator={<Edit />}
              onClick={() => setEditing(true)}
            >
              Edit
            </Button>
            <Button startDecorator={<Add />} onClick={openLinks}>
              Link
            </Button>
          </Stack>
        </Stack>
        <Box>
          <Typography level='h3' mb={1}>
            Meters
          </Typography>
          <Stack spacing={1}>
            {asset.meters.map(meter => (
              <Card
                key={meter.id}
                orientation='horizontal'
                sx={{ alignItems: 'center', flexWrap: 'wrap' }}
              >
                <Speed />
                <Box sx={{ flex: 1 }}>
                  <Typography level='title-md'>{meter.name}</Typography>
                  <Typography level='body-xs'>
                    Updated {new Date(meter.updatedAt).toLocaleString()}
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
                      Update reminder:{' '}
                      {getRecurrentChipText(meter.updateReminder)}
                      {meter.updateReminder.nextUpdateDue
                        ? ` · Next ${new Date(meter.updateReminder.nextUpdateDue).toLocaleString()}`
                        : ''}
                      {meter.updateReminder.updateStatus === 'overdue'
                        ? ' · Reading may be outdated'
                        : ''}
                    </Typography>
                  )}
                </Box>
                <Typography level='h3' className='taskier-metric'>
                  {meter.currentReading.toLocaleString()} {meter.unit}
                </Typography>
                <Button
                  size='sm'
                  onClick={() => {
                    setReadingMeter(meter)
                    setReading(meter.currentReading)
                  }}
                >
                  Update reading
                </Button>
              </Card>
            ))}
          </Stack>
        </Box>
        <Box>
          <Typography level='h3' mb={1}>
            Maintenance status
          </Typography>
          <Stack spacing={1}>
            {asset.maintenance.map(item => (
              <MaintenanceCard
                key={item.choreId}
                item={item}
                onComplete={() => navigate(`/chores/${item.choreId}`)}
              />
            ))}
          </Stack>
        </Box>
        <Box>
          <Typography level='h3' mb={1}>
            Maintenance history
          </Typography>
          <Stack divider={<Divider />} spacing={1}>
            {asset.history.map(entry => (
              <Box key={entry.id}>
                <Typography level='title-sm'>{entry.choreName}</Typography>
                <Typography level='body-sm'>
                  {new Date(entry.performedAt).toLocaleString()} · Completed by{' '}
                  {entry.completedByName || 'Unknown'}
                  {entry.meterReading != null
                    ? ` · ${entry.meterReading.toLocaleString()} ${entry.meterUnit}`
                    : ''}
                </Typography>
              </Box>
            ))}
          </Stack>
        </Box>
      </Stack>
      {editing && (
        <AssetForm
          asset={asset}
          onClose={() => setEditing(false)}
          onSaved={load}
        />
      )}
      <Modal open={linking} onClose={() => setLinking(false)}>
        <ModalDialog>
          <ModalClose />
          <Typography level='h4'>Link maintenance data</Typography>
          <Select
            value={link.kind}
            onChange={(_, value) => setLink({ kind: value, id: null })}
          >
            <Option value='meter'>Meter</Option>
            <Option value='chore'>Maintenance chore</Option>
          </Select>
          <Select
            placeholder={`Choose ${link.kind}`}
            value={link.id}
            onChange={(_, value) => setLink({ ...link, id: value })}
          >
            {(link.kind === 'meter' ? meters : chores).map(item => (
              <Option key={item.id} value={item.id}>
                {item.name}
              </Option>
            ))}
          </Select>
          <Button disabled={!link.id} onClick={saveLink}>
            Link to asset
          </Button>
        </ModalDialog>
      </Modal>
      <Modal open={!!readingMeter} onClose={() => setReadingMeter(null)}>
        <ModalDialog>
          <ModalClose />
          <Typography level='h4'>Update {readingMeter?.name}</Typography>
          <Input
            type='number'
            value={reading}
            endDecorator={readingMeter?.unit}
            onChange={e => setReading(e.target.value)}
          />
          <Button onClick={updateReading}>Save reading</Button>
        </ModalDialog>
      </Modal>
    </Container>
  )
}

const MaintenanceView = () => {
  const navigate = useNavigate()
  const [data, setData] = useState({
    due: [],
    approaching: [],
    upcoming: [],
    assets: [],
  })
  const [creating, setCreating] = useState(false)
  const load = useCallback(async () => {
    const response = await GetMaintenance()
    if (response.ok) setData((await response.json()).res)
  }, [])
  useEffect(() => {
    void load()
  }, [load])
  const complete = async item => {
    const response = await MarkChoreComplete(item.choreId, {})
    if (response.ok) await load()
    else navigate(`/chores/${item.choreId}`)
  }
  const archive = async (event, id) => {
    event.stopPropagation()
    if ((await ArchiveAsset(id)).ok) await load()
  }
  return (
    <Container maxWidth='lg' sx={{ py: 2 }}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent='space-between'
        gap={1}
        mb={2}
      >
        <Box>
          <Typography level='h2'>Maintenance</Typography>
          <Typography level='body-sm'>
            Assets, meter readings, and service schedules for your circle.
          </Typography>
        </Box>
        <Button startDecorator={<Add />} onClick={() => setCreating(true)}>
          New asset
        </Button>
      </Stack>
      <Tabs defaultValue={0}>
        <TabList>
          <Tab>Due now ({data.due.length})</Tab>
          <Tab>Approaching ({data.approaching.length})</Tab>
          <Tab>Upcoming</Tab>
          <Tab>Assets</Tab>
        </TabList>
        <TabPanel value={0}>
          <Stack spacing={1}>
            {data.due.length ? (
              data.due.map(item => (
                <MaintenanceCard
                  key={item.choreId}
                  item={item}
                  onComplete={complete}
                />
              ))
            ) : (
              <Card>
                <Typography>
                  Nothing is due. Your maintenance is on track.
                </Typography>
              </Card>
            )}
          </Stack>
        </TabPanel>
        <TabPanel value={1}>
          <Stack spacing={1}>
            {data.approaching.map(item => (
              <MaintenanceCard key={item.choreId} item={item} />
            ))}
          </Stack>
        </TabPanel>
        <TabPanel value={2}>
          <Stack spacing={1}>
            {data.upcoming.map(item => (
              <MaintenanceCard key={item.choreId} item={item} />
            ))}
          </Stack>
        </TabPanel>
        <TabPanel value={3}>
          <Stack spacing={1}>
            {data.assets.map(asset => (
              <Card
                key={asset.id}
                onClick={() => navigate(`/maintenance/assets/${asset.id}`)}
                sx={{ cursor: 'pointer' }}
              >
                <Stack direction='row' alignItems='center'>
                  <Build />
                  <Box sx={{ flex: 1, ml: 1 }}>
                    <Typography level='title-md'>{asset.name}</Typography>
                    <Typography level='body-sm'>
                      {asset.category || 'Asset'}
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
                      ? 'Attention required'
                      : asset.status === 'upcoming'
                        ? 'Upcoming maintenance'
                        : 'All good'}
                  </Chip>
                  <Button
                    variant='plain'
                    color='danger'
                    startDecorator={<Archive />}
                    onClick={event => archive(event, asset.id)}
                  >
                    Archive
                  </Button>
                </Stack>
              </Card>
            ))}
          </Stack>
        </TabPanel>
      </Tabs>
      {creating && (
        <AssetForm onClose={() => setCreating(false)} onSaved={load} />
      )}
    </Container>
  )
}

export default MaintenanceView
