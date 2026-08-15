import {
  Add,
  Archive,
  CheckCircle,
  Edit,
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
import PropTypes from 'prop-types'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

import {
  useGoalMutation,
  useGoals,
  useReport,
  useStreak,
  useWorkload,
} from '../../queries/ProgressQueries'
import PageHeader from '../../components/common/PageHeader'
import QueryLoadingView from '../../components/common/QueryLoadingView'
import SectionCard from '../../components/common/SectionCard'
import {
  inlineErrorAlertSx,
  pageShellSx,
  pageStackSpacing,
  sectionCardSx,
} from '../../theme/appLayout'

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

Metric.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
}

const Workload = () => {
  const { t } = useTranslation()
  const [range, setRange] = useState('week')
  const [category, setCategory] = useState('')
  const { data, error, isLoading } = useWorkload(range, '', category)
  if (isLoading) return <QueryLoadingView />
  if (error)
    return (
      <Alert color='danger' variant='soft' sx={inlineErrorAlertSx}>
        {error.message}
      </Alert>
    )
  return (
    <Stack spacing={2}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
        <Select
          value={range}
          onChange={(_, value) => setRange(value)}
          aria-label='Workload range'
        >
          <Option value='today'>{t('familyProgress.today')}</Option>
          <Option value='week'>{t('familyProgress.thisWeek')}</Option>
          <Option value='30d'>{t('familyProgress.next30Days')}</Option>
        </Select>
        <Select
          value={category}
          onChange={(_, value) => setCategory(value || '')}
          placeholder={t('familyProgress.allCategories')}
          aria-label='Category filter'
        >
          <Option value=''>{t('familyProgress.allCategories')}</Option>
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
              <Metric label={t('familyProgress.today')} value={member.today} />
              <Metric
                label={t('familyProgress.overdue')}
                value={member.overdue}
              />
              <Metric
                label={t('familyProgress.upcoming')}
                value={member.upcoming}
              />
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
            <Typography level='title-md'>
              {t('familyProgress.unassigned')}
            </Typography>
            <Metric
              label={t('familyProgress.activeTasks')}
              value={data.unassigned}
            />
          </Card>
        )}
      </Box>
      <SectionCard title={t('familyProgress.workByCategory')}>
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
      </SectionCard>
    </Stack>
  )
}

const Reports = () => {
  const { t } = useTranslation()
  const [range, setRange] = useState('30d')
  const { data, error, isLoading } = useReport(range)
  if (isLoading) return <QueryLoadingView />
  if (error)
    return (
      <Alert color='danger' variant='soft' sx={inlineErrorAlertSx}>
        {error.message}
      </Alert>
    )
  return (
    <Stack spacing={2}>
      <Select
        value={range}
        onChange={(_, value) => setRange(value)}
        aria-label='Report range'
      >
        <Option value='week'>{t('familyProgress.thisWeek')}</Option>
        <Option value='7d'>{t('familyProgress.sevenDays')}</Option>
        <Option value='30d'>{t('familyProgress.thirtyDays')}</Option>
        <Option value='90d'>{t('familyProgress.ninetyDays')}</Option>
        <Option value='month'>{t('familyProgress.thisMonth')}</Option>
      </Select>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))',
          gap: 1.5,
        }}
      >
        <SectionCard title={t('familyProgress.completion')}>
          <Stack direction='row' spacing={2} flexWrap='wrap'>
            <Metric
              label={t('familyProgress.completedTasks')}
              value={data.completed}
            />
            <Metric
              label={t('familyProgress.currentlyOverdue')}
              value={data.overdue}
            />
          </Stack>
        </SectionCard>
        <SectionCard title={t('familyProgress.points')}>
          <Stack direction='row' spacing={2}>
            <Metric
              label={t('familyProgress.earned')}
              value={data.points.earned}
            />
            <Metric
              label={t('familyProgress.redeemed')}
              value={data.points.redeemed}
            />
            <Metric
              label={t('familyProgress.available')}
              value={data.points.available}
            />
          </Stack>
        </SectionCard>
        <SectionCard title={t('familyProgress.maintenance')}>
          <Stack direction='row' spacing={2}>
            <Metric
              label={t('familyProgress.completed')}
              value={data.maintenance.completed}
            />
            <Metric
              label={t('familyProgress.overdue')}
              value={data.maintenance.overdue}
            />
            <Metric
              label={t('familyProgress.approaching')}
              value={data.maintenance.approaching}
            />
          </Stack>
        </SectionCard>
      </Box>
      <SectionCard title={t('familyProgress.deterministicInsights')}>
        {data.insights.map(text => (
          <Typography key={text}>{text}</Typography>
        ))}
      </SectionCard>
      <SectionCard title={t('familyProgress.completedByCategory')}>
        {data.categories.map(row => (
          <Box
            key={row.id || 'none'}
            sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}
          >
            <Typography>{row.name}</Typography>
            <Chip>{row.count}</Chip>
          </Box>
        ))}
      </SectionCard>
      {data.canViewFamily && (
        <SectionCard title={t('familyProgress.completedByMember')}>
          {data.members.map(row => (
            <Box
              key={row.id}
              sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}
            >
              <Typography>{row.name}</Typography>
              <Chip>{row.count}</Chip>
            </Box>
          ))}
        </SectionCard>
      )}
      <SectionCard title={t('familyProgress.rewardActivity')}>
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
            {t('familyProgress.noRewardActivity')}
          </Typography>
        )}
      </SectionCard>
    </Stack>
  )
}

const Goals = () => {
  const { t } = useTranslation()
  const { data, error, isError, isLoading, refetch } = useGoals()
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
  if (isLoading) return <QueryLoadingView />
  if (isError) {
    return (
      <Alert
        color='danger'
        variant='soft'
        sx={inlineErrorAlertSx}
        endDecorator={
          <Button size='sm' variant='soft' onClick={() => refetch()}>
            {t('familyProgress.retry')}
          </Button>
        }
      >
        {error?.message || t('familyProgress.goalsLoadError')}
      </Alert>
    )
  }
  if (!data) {
    return (
      <Alert color='danger' variant='soft' sx={inlineErrorAlertSx}>
        {t('familyProgress.goalsLoadError')}
      </Alert>
    )
  }
  const submit = e => {
    e.preventDefault()
    mutation.mutate(
      { data: form, id: form.id },
      { onSuccess: () => setOpen(false) },
    )
  }

  const editGoal = goal => {
    setForm({
      id: goal.id,
      name: goal.name,
      metricType: goal.metricType,
      categoryId: goal.categoryId,
      target: goal.target,
      startDate: goal.startDate.slice(0, 10),
      endDate: new Date(new Date(goal.endDate).getTime() - 86400000)
        .toISOString()
        .slice(0, 10),
    })
    setOpen(true)
  }

  const archiveGoal = goal =>
    mutation.mutate({
      id: goal.id,
      data: {
        ...goal,
        startDate: goal.startDate.slice(0, 10),
        endDate: new Date(new Date(goal.endDate).getTime() - 86400000)
          .toISOString()
          .slice(0, 10),
        status: 'ARCHIVED',
      },
    })
  return (
    <Stack spacing={2}>
      {data.canManage && (
        <Button
          startDecorator={<Add />}
          onClick={() => {
            setForm({
              name: '',
              metricType: 'TASK_COMPLETIONS',
              target: 10,
              startDate: new Date().toISOString().slice(0, 10),
              endDate: new Date().toISOString().slice(0, 10),
            })
            setOpen(!open)
          }}
          sx={{ alignSelf: 'flex-start' }}
        >
          {t('familyProgress.createGoal')}
        </Button>
      )}
      {open && (
        <Card component='form' onSubmit={submit}>
          <Stack spacing={1.5}>
            <FormControl>
              <FormLabel>{t('familyProgress.name')}</FormLabel>
              <Input
                required
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
              />
            </FormControl>
            <FormControl>
              <FormLabel>{t('familyProgress.metric')}</FormLabel>
              <Select
                value={form.metricType}
                onChange={(_, v) => setForm({ ...form, metricType: v })}
              >
                <Option value='TASK_COMPLETIONS'>
                  {t('familyProgress.taskCompletions')}
                </Option>
                <Option value='CATEGORY_COMPLETIONS'>
                  {t('familyProgress.categoryCompletions')}
                </Option>
                <Option value='POINTS_EARNED'>
                  {t('familyProgress.pointsEarned')}
                </Option>
              </Select>
            </FormControl>
            {form.metricType === 'CATEGORY_COMPLETIONS' && (
              <FormControl>
                <FormLabel>{t('familyProgress.category')}</FormLabel>
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
              <FormLabel>{t('familyProgress.target')}</FormLabel>
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
                <FormLabel>{t('familyProgress.start')}</FormLabel>
                <Input
                  type='date'
                  value={form.startDate}
                  onChange={e =>
                    setForm({ ...form, startDate: e.target.value })
                  }
                />
              </FormControl>
              <FormControl>
                <FormLabel>{t('familyProgress.end')}</FormLabel>
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
              {form.id
                ? t('familyProgress.updateGoal')
                : t('familyProgress.saveGoal')}
            </Button>
          </Stack>
        </Card>
      )}
      {!data.goals.length && (
        <Alert variant='soft'>{t('familyProgress.noGoals')}</Alert>
      )}
      {data.goals.map(goal => (
        <Card key={goal.id} variant='outlined' sx={sectionCardSx}>
          <Stack direction='row' justifyContent='space-between'>
            <Typography level='title-md'>{goal.name}</Typography>
            <Chip
              color={goal.status === 'COMPLETED' ? 'success' : 'neutral'}
              startDecorator={
                goal.status === 'COMPLETED' ? <CheckCircle /> : null
              }
            >
              {t(
                `familyProgress.${
                  goal.status === 'COMPLETED'
                    ? 'completedStatus'
                    : goal.status.toLowerCase()
                }`,
              )}
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
            {t(
              `familyProgress.${
                goal.metricType === 'TASK_COMPLETIONS'
                  ? 'taskCompletions'
                  : goal.metricType === 'CATEGORY_COMPLETIONS'
                    ? 'categoryCompletions'
                    : 'pointsEarned'
              }`,
            )}
          </Typography>
          {data.canManage && goal.status === 'ACTIVE' && (
            <Stack direction='row' spacing={1}>
              <Button
                size='sm'
                variant='outlined'
                startDecorator={<Edit />}
                onClick={() => editGoal(goal)}
              >
                {t('edit')}
              </Button>
              <Button
                size='sm'
                variant='plain'
                color='neutral'
                startDecorator={<Archive />}
                onClick={() => archiveGoal(goal)}
                loading={mutation.isPending}
              >
                {t('familyProgress.archive')}
              </Button>
            </Stack>
          )}
        </Card>
      ))}
    </Stack>
  )
}

export default function FamilyProgress() {
  const { t } = useTranslation()
  const { data: streak } = useStreak()
  return (
    <Box sx={pageShellSx}>
      <Stack spacing={pageStackSpacing}>
        <PageHeader
          icon={<Groups />}
          title={t('familyProgress.title')}
          subtitle={t('familyProgress.subtitle')}
        />
        <Card variant='soft' color='primary' sx={sectionCardSx}>
          <Stack direction='row' spacing={3}>
            <Metric
              label={t('familyProgress.currentStreak')}
              value={t('familyProgress.days', { count: streak?.current || 0 })}
            />
            <Metric
              label={t('familyProgress.bestStreak')}
              value={t('familyProgress.days', { count: streak?.best || 0 })}
            />
          </Stack>
          <Typography level='body-xs'>{streak?.rule}</Typography>
        </Card>
        <Tabs defaultValue={0}>
          <TabList sx={{ overflowX: 'auto' }}>
            <Tab>
              <Work /> {t('familyProgress.workload')}
            </Tab>
            <Tab>
              <Insights /> {t('familyProgress.insights')}
            </Tab>
            <Tab>
              <Flag /> {t('familyProgress.goals')}
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
