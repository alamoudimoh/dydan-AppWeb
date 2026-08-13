import {
  Add,
  CheckCircle,
  Flag,
  Groups,
  Insights,
  Work,
} from '@mui/icons-material'
import {
  Alert,
  Box,
  Button,
  Card,
  Chip,
  CircularProgress,
  FormControl,
  FormLabel,
  Input,
  LinearProgress,
  Option,
  Select,
  Stack,
  Tab,
  TabList,
  TabPanel,
  Tabs,
  Typography,
} from '@mui/joy'
import { useState } from 'react'
import { Link } from 'react-router-dom'

import {
  useGoalMutation,
  useGoals,
  useReport,
  useStreak,
  useWorkload,
} from '../../queries/ProgressQueries'

const Metric = ({ label, value }) => (
  <Box sx={{ minWidth: 72 }}>
    <Typography level='h3' sx={{ fontFamily: 'JetBrains Mono, monospace' }}>
      {value ?? 0}
    </Typography>
    <Typography level='body-xs' textColor='text.tertiary'>
      {label}
    </Typography>
  </Box>
)
const Section = ({ children, title }) => (
  <Card variant='outlined'>
    <Typography level='title-lg'>{title}</Typography>
    {children}
  </Card>
)

const Workload = () => {
  const [range, setRange] = useState('week')
  const [category, setCategory] = useState('')
  const { data, error, isLoading } = useWorkload(range, '', category)
  if (isLoading) return <CircularProgress />
  if (error) return <Alert color='danger'>{error.message}</Alert>
  return (
    <Stack spacing={2}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
        <Select
          value={range}
          onChange={(_, value) => setRange(value)}
          aria-label='Workload range'
        >
          <Option value='today'>Today</Option>
          <Option value='week'>This week</Option>
          <Option value='30d'>Next 30 days</Option>
        </Select>
        <Select
          value={category}
          onChange={(_, value) => setCategory(value || '')}
          placeholder='All categories'
          aria-label='Category filter'
        >
          <Option value=''>All categories</Option>
          {data?.categories
            ?.filter(x => x.categoryId)
            .map(x => (
              <Option key={x.categoryId} value={String(x.categoryId)}>
                {x.name}
              </Option>
            ))}
        </Select>
      </Stack>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit,minmax(230px,1fr))',
          gap: 1.5,
        }}
      >
        {data.members.map(member => (
          <Card key={member.userId} variant='soft'>
            <Typography level='title-md'>{member.name}</Typography>
            <Stack direction='row' spacing={2} flexWrap='wrap'>
              <Metric label='today' value={member.today} />
              <Metric label='overdue' value={member.overdue} />
              <Metric label='upcoming' value={member.upcoming} />
            </Stack>
            <Stack spacing={0.5}>
              {data.tasks
                .filter(t => t.assignedTo === member.userId)
                .slice(0, 6)
                .map(task => (
                  <Link key={task.id} to={`/chores/${task.id}`}>
                    {task.name}
                  </Link>
                ))}
            </Stack>
          </Card>
        ))}
        {data.canViewFamily && (
          <Card variant='soft'>
            <Typography level='title-md'>Unassigned</Typography>
            <Metric label='active tasks' value={data.unassigned} />
          </Card>
        )}
      </Box>
      <Section title='Work by category'>
        <Stack spacing={1}>
          {data.categories.map(row => (
            <Box
              key={row.categoryId || 'none'}
              sx={{ display: 'flex', justifyContent: 'space-between' }}
            >
              <Typography>{row.name}</Typography>
              <Chip>{row.count}</Chip>
            </Box>
          ))}
        </Stack>
      </Section>
    </Stack>
  )
}

const Reports = () => {
  const [range, setRange] = useState('30d')
  const { data, error, isLoading } = useReport(range)
  if (isLoading) return <CircularProgress />
  if (error) return <Alert color='danger'>{error.message}</Alert>
  return (
    <Stack spacing={2}>
      <Select
        value={range}
        onChange={(_, value) => setRange(value)}
        aria-label='Report range'
      >
        <Option value='7d'>7 days</Option>
        <Option value='30d'>30 days</Option>
        <Option value='90d'>90 days</Option>
        <Option value='month'>This month</Option>
      </Select>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))',
          gap: 1.5,
        }}
      >
        <Section title='Completion'>
          <Metric label='completed tasks' value={data.completed} />
        </Section>
        <Section title='Points'>
          <Stack direction='row' spacing={2}>
            <Metric label='earned' value={data.points.earned} />
            <Metric label='redeemed' value={data.points.redeemed} />
          </Stack>
        </Section>
        <Section title='Maintenance'>
          <Stack direction='row' spacing={2}>
            <Metric label='completed' value={data.maintenance.completed} />
            <Metric label='overdue' value={data.maintenance.overdue} />
            <Metric label='approaching' value={data.maintenance.approaching} />
          </Stack>
        </Section>
      </Box>
      <Section title='Deterministic insights'>
        {data.insights.map(text => (
          <Typography key={text}>{text}</Typography>
        ))}
      </Section>
      <Section title='Completed by category'>
        {data.categories.map(row => (
          <Box
            key={row.id || 'none'}
            sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}
          >
            <Typography>{row.name}</Typography>
            <Chip>{row.count}</Chip>
          </Box>
        ))}
      </Section>
      {data.canViewFamily && (
        <Section title='Completed by member'>
          {data.members.map(row => (
            <Box
              key={row.id}
              sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}
            >
              <Typography>{row.name}</Typography>
              <Chip>{row.count}</Chip>
            </Box>
          ))}
        </Section>
      )}
      <Section title='Reward activity'>
        {data.rewards.length ? (
          data.rewards.map(row => (
            <Box
              key={row.status}
              sx={{ display: 'flex', justifyContent: 'space-between' }}
            >
              <Typography sx={{ textTransform: 'capitalize' }}>
                {row.status}
              </Typography>
              <Chip>{row.count}</Chip>
            </Box>
          ))
        ) : (
          <Typography textColor='text.tertiary'>
            No reward activity in this period.
          </Typography>
        )}
      </Section>
    </Stack>
  )
}

const Goals = () => {
  const { data, isLoading } = useGoals()
  const { data: workload } = useWorkload('week', '', '')
  const mutation = useGoalMutation()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({
    name: '',
    metricType: 'TASK_COMPLETIONS',
    target: 10,
    startDate: new Date().toISOString().slice(0, 10),
    endDate: new Date().toISOString().slice(0, 10),
  })
  if (isLoading) return <CircularProgress />
  const submit = e => {
    e.preventDefault()
    mutation.mutate({ data: form }, { onSuccess: () => setOpen(false) })
  }
  return (
    <Stack spacing={2}>
      <Button
        startDecorator={<Add />}
        onClick={() => setOpen(!open)}
        sx={{ alignSelf: 'flex-start' }}
      >
        Create family goal
      </Button>
      {open && (
        <Card component='form' onSubmit={submit}>
          <Stack spacing={1.5}>
            <FormControl>
              <FormLabel>Name</FormLabel>
              <Input
                required
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
              />
            </FormControl>
            <FormControl>
              <FormLabel>Metric</FormLabel>
              <Select
                value={form.metricType}
                onChange={(_, v) => setForm({ ...form, metricType: v })}
              >
                <Option value='TASK_COMPLETIONS'>Task completions</Option>
                <Option value='CATEGORY_COMPLETIONS'>
                  Category completions
                </Option>
                <Option value='POINTS_EARNED'>Points earned</Option>
              </Select>
            </FormControl>
            {form.metricType === 'CATEGORY_COMPLETIONS' && (
              <FormControl>
                <FormLabel>Category</FormLabel>
                <Select
                  required
                  value={form.categoryId || ''}
                  onChange={(_, value) =>
                    setForm({ ...form, categoryId: Number(value) })
                  }
                >
                  {workload?.categories
                    ?.filter(row => row.categoryId)
                    .map(row => (
                      <Option
                        key={row.categoryId}
                        value={String(row.categoryId)}
                      >
                        {row.name}
                      </Option>
                    ))}
                </Select>
              </FormControl>
            )}
            <FormControl>
              <FormLabel>Target</FormLabel>
              <Input
                type='number'
                min='1'
                required
                value={form.target}
                onChange={e =>
                  setForm({ ...form, target: Number(e.target.value) })
                }
              />
            </FormControl>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
              <FormControl>
                <FormLabel>Start</FormLabel>
                <Input
                  type='date'
                  value={form.startDate}
                  onChange={e =>
                    setForm({ ...form, startDate: e.target.value })
                  }
                />
              </FormControl>
              <FormControl>
                <FormLabel>End</FormLabel>
                <Input
                  type='date'
                  value={form.endDate}
                  onChange={e => setForm({ ...form, endDate: e.target.value })}
                />
              </FormControl>
            </Stack>
            {mutation.error && (
              <Alert color='danger'>{mutation.error.message}</Alert>
            )}
            <Button type='submit' loading={mutation.isPending}>
              Save goal
            </Button>
          </Stack>
        </Card>
      )}
      {!data.goals.length && <Alert variant='soft'>No family goals yet.</Alert>}
      {data.goals.map(goal => (
        <Card key={goal.id}>
          <Stack direction='row' justifyContent='space-between'>
            <Typography level='title-md'>{goal.name}</Typography>
            <Chip
              color={goal.status === 'COMPLETED' ? 'success' : 'neutral'}
              startDecorator={
                goal.status === 'COMPLETED' ? <CheckCircle /> : null
              }
            >
              {goal.status.toLowerCase()}
            </Chip>
          </Stack>
          <Typography>
            {goal.progress} / {goal.target}
          </Typography>
          <LinearProgress
            determinate
            value={goal.percent}
            aria-label={`${goal.name} progress`}
          />
          <Typography level='body-xs'>
            {goal.metricType.replaceAll('_', ' ')}
          </Typography>
        </Card>
      ))}
    </Stack>
  )
}

export default function FamilyProgress() {
  const { data: streak } = useStreak()
  return (
    <Box sx={{ maxWidth: 1100, mx: 'auto', p: { xs: 1.5, sm: 3 } }}>
      <Stack spacing={2}>
        <Stack direction='row' spacing={1} alignItems='center'>
          <Groups />
          <Box>
            <Typography level='h2'>Family Progress</Typography>
            <Typography textColor='text.tertiary'>
              Visibility, balance, consistency, and shared progress.
            </Typography>
          </Box>
        </Stack>
        <Card variant='soft' color='primary'>
          <Stack direction='row' spacing={3}>
            <Metric
              label='current streak'
              value={`${streak?.current || 0} days`}
            />
            <Metric label='best streak' value={`${streak?.best || 0} days`} />
          </Stack>
          <Typography level='body-xs'>{streak?.rule}</Typography>
        </Card>
        <Tabs defaultValue={0}>
          <TabList sx={{ overflowX: 'auto' }}>
            <Tab>
              <Work /> Workload
            </Tab>
            <Tab>
              <Insights /> Insights
            </Tab>
            <Tab>
              <Flag /> Goals
            </Tab>
          </TabList>
          <TabPanel value={0}>
            <Workload />
          </TabPanel>
          <TabPanel value={1}>
            <Reports />
          </TabPanel>
          <TabPanel value={2}>
            <Goals />
          </TabPanel>
        </Tabs>
      </Stack>
    </Box>
  )
}
