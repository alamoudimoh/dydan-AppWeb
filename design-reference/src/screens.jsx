import {
  AccessTimeRounded,
  AddRounded,
  AdminPanelSettingsRounded,
  ArchiveRounded,
  ArrowForwardRounded,
  AutorenewRounded,
  CalendarMonthRounded,
  CardGiftcardRounded,
  CheckCircleRounded,
  CheckRounded,
  ChecklistRounded,
  ChevronLeftRounded,
  ChevronRightRounded,
  CircleNotificationsRounded,
  CloudDoneRounded,
  DeleteOutlineRounded,
  DevicesRounded,
  DirectionsCarRounded,
  DragIndicatorRounded,
  EditRounded,
  ErrorOutlineRounded,
  EventNoteRounded,
  FilterAltRounded,
  FolderRounded,
  GroupsRounded,
  HomeRepairServiceRounded,
  InboxRounded,
  InfoOutlined,
  Inventory2Rounded,
  KitchenRounded,
  LanguageRounded,
  LocalFireDepartmentRounded,
  LockRounded,
  LogoutRounded,
  MailOutlineRounded,
  MenuRounded,
  MoreVertRounded,
  NotificationsNoneRounded,
  PaletteRounded,
  PersonAddRounded,
  PersonRounded,
  PlaylistAddCheckRounded,
  RadioButtonUncheckedRounded,
  RefreshRounded,
  RestaurantRounded,
  RocketLaunchRounded,
  SearchRounded,
  SecurityRounded,
  SettingsRounded,
  ShoppingBasketRounded,
  ShoppingCartRounded,
  SpeedRounded,
  StarRounded,
  TaskAltRounded,
  TimelineRounded,
  TollRounded,
  WarningAmberRounded,
  WifiRounded,
} from '@mui/icons-material'
import {
  Alert,
  AspectRatio,
  Avatar,
  AvatarGroup,
  Badge,
  Box,
  Breadcrumbs,
  Button,
  ButtonGroup,
  Card,
  CardContent,
  Checkbox,
  Chip,
  CircularProgress,
  Divider,
  Dropdown,
  FormControl,
  FormHelperText,
  FormLabel,
  IconButton,
  Input,
  LinearProgress,
  Link,
  List,
  ListDivider,
  ListItem,
  ListItemContent,
  ListItemDecorator,
  Menu,
  MenuButton,
  MenuItem,
  Option,
  Radio,
  RadioGroup,
  Select,
  Sheet,
  Skeleton,
  Stack,
  Switch,
  Tab,
  Table,
  TabList,
  TabPanel,
  Tabs,
  Textarea,
  Tooltip,
  Typography,
} from '@mui/joy'
import { useMemo, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip as ChartTooltip,
  XAxis,
  YAxis,
} from 'recharts'

import AppModal from '../../src/components/common/AppModal.jsx'
import EmptyState from '../../src/components/common/EmptyState.jsx'
import ModalActions from '../../src/components/common/ModalActions.jsx'
import PageHeader from '../../src/components/common/PageHeader.jsx'
import QueryLoadingView from '../../src/components/common/QueryLoadingView.jsx'
import SectionCard from '../../src/components/common/SectionCard.jsx'

const members = [
  {
    id: 1,
    initials: 'MA',
    name: 'Mohammed',
    role: 'Admin',
    completed: 24,
    points: 280,
  },
  {
    id: 2,
    initials: 'SA',
    name: 'Sara',
    role: 'Member',
    completed: 19,
    points: 220,
  },
  {
    id: 3,
    initials: 'YA',
    name: 'Yousef',
    role: 'Member',
    completed: 14,
    points: 160,
  },
  {
    id: 4,
    initials: 'LA',
    name: 'Lina',
    role: 'Member',
    completed: 11,
    points: 125,
  },
]

const tasks = [
  {
    title: 'Take the bins outside',
    category: 'Home',
    due: 'Today · 7:00 PM',
    points: 15,
    member: 2,
    accent: 'var(--ref-category-1)',
    urgent: true,
  },
  {
    title: 'Water the balcony plants',
    category: 'Garden',
    due: 'Today · 8:30 PM',
    points: 10,
    member: 3,
    accent: 'var(--ref-category-4)',
  },
  {
    title: 'Replace air purifier filter',
    category: 'Maintenance',
    due: 'Tomorrow · 9:00 AM',
    points: 30,
    member: 1,
    accent: 'var(--ref-category-2)',
    meter: true,
  },
  {
    title: 'Plan school lunches',
    category: 'Family',
    due: 'Friday · 4:00 PM',
    points: 20,
    member: 4,
    accent: 'var(--ref-category-3)',
  },
]

const Page = ({ children, narrow = false }) => (
  <Box className={`reference-page${narrow ? ' reference-page--narrow' : ''}`}>
    {children}
  </Box>
)

const MemberAvatar = ({ member = 1, size = 'sm' }) => {
  const item = members[(member - 1) % members.length]
  return (
    <Tooltip title={item.name}>
      <Avatar
        className='reference-member-avatar'
        data-member={member}
        size={size}
        sx={{ color: '#fff', fontWeight: 700 }}
      >
        {item.initials}
      </Avatar>
    </Tooltip>
  )
}

const PageIntro = ({ action, eyebrow, subtitle, title }) => (
  <PageHeader
    title={title}
    subtitle={subtitle}
    action={action}
    sx={{ mb: 3 }}
    icon={
      eyebrow ? (
        <Chip size='sm' variant='soft' color='primary'>
          {eyebrow}
        </Chip>
      ) : undefined
    }
  />
)

const StatCard = ({ detail, icon, label, tone = 'primary', value }) => (
  <Card variant='outlined' sx={{ minWidth: 0, height: '100%' }}>
    <Stack
      direction='row'
      justifyContent='space-between'
      alignItems='flex-start'
    >
      <Box sx={{ minWidth: 0 }}>
        <Typography level='body-sm' sx={{ color: 'text.secondary' }}>
          {label}
        </Typography>
        <Typography level='h2' className='reference-metric' sx={{ mt: 0.75 }}>
          {value}
        </Typography>
        {detail && (
          <Typography level='body-xs' sx={{ color: 'text.tertiary', mt: 0.5 }}>
            {detail}
          </Typography>
        )}
      </Box>
      <Box
        sx={{
          width: 36,
          height: 36,
          borderRadius: 'var(--daydan-radius-control)',
          display: 'grid',
          placeItems: 'center',
          bgcolor: `${tone}.softBg`,
          color: `${tone}.softColor`,
        }}
      >
        {icon}
      </Box>
    </Stack>
  </Card>
)

const TaskRow = ({ task, completed = false, compact = false }) => (
  <Stack
    className='reference-accent-line'
    direction='row'
    alignItems='center'
    spacing={1.25}
    sx={{
      '--reference-item-accent': task.accent,
      py: compact ? 1 : 1.35,
      pl: 1.25,
      minWidth: 0,
      opacity: completed ? 0.65 : 1,
    }}
  >
    <IconButton
      size={compact ? 'sm' : 'md'}
      variant='plain'
      color={task.urgent ? 'danger' : 'primary'}
      aria-label={`Complete ${task.title}`}
    >
      {completed ? <CheckCircleRounded /> : <RadioButtonUncheckedRounded />}
    </IconButton>
    <Box sx={{ flex: 1, minWidth: 0 }}>
      <Stack direction='row' spacing={0.75} alignItems='center' flexWrap='wrap'>
        <Typography
          level={compact ? 'title-sm' : 'title-md'}
          sx={{ textDecoration: completed ? 'line-through' : 'none' }}
        >
          {task.title}
        </Typography>
        {task.meter && (
          <Chip size='sm' variant='soft' color='info'>
            Meter
          </Chip>
        )}
      </Stack>
      <Stack direction='row' gap={0.75} flexWrap='wrap' alignItems='center'>
        <Typography level='body-xs' sx={{ color: 'text.secondary' }}>
          {task.category}
        </Typography>
        <Typography
          level='body-xs'
          sx={{ color: task.urgent ? 'danger.500' : 'text.tertiary' }}
        >
          {task.due}
        </Typography>
      </Stack>
    </Box>
    <MemberAvatar member={task.member} />
    <Typography
      level='body-sm'
      className='reference-metric'
      sx={{ whiteSpace: 'nowrap' }}
    >
      +{task.points}
    </Typography>
    <IconButton
      size='sm'
      variant='plain'
      color='neutral'
      aria-label='Task actions'
    >
      <MoreVertRounded />
    </IconButton>
  </Stack>
)

const MemberStack = () => (
  <AvatarGroup size='sm' sx={{ '--Avatar-ringSize': '2px' }}>
    {members.map(member => (
      <MemberAvatar key={member.id} member={member.id} />
    ))}
  </AvatarGroup>
)

const StreakPips = ({ done = 5, total = 7, label }) => (
  <Stack direction='row' spacing={1} alignItems='center'>
    <Box
      className='reference-streak-pips'
      role='img'
      aria-label={`${done} of ${total} days completed`}
    >
      {Array.from({ length: total }, (_, index) => (
        <Box
          key={index}
          className='reference-streak-pip'
          data-filled={index < done ? 'true' : undefined}
          data-today={index === done ? 'true' : undefined}
        />
      ))}
    </Box>
    {label && (
      <Typography level='body-xs' sx={{ color: 'text.secondary' }}>
        {label}
      </Typography>
    )}
  </Stack>
)

function DashboardScreen({ brand, onNavigate }) {
  return (
    <Page>
      <PageIntro
        eyebrow={`${brand.name} home`}
        title='Good afternoon, Mohammed'
        subtitle='Tuesday, August 25 · Your family has 6 tasks left today.'
        action={
          <Stack direction='row' spacing={1} alignItems='center'>
            <MemberStack />
            <Button startDecorator={<AddRounded />}>Add task</Button>
          </Stack>
        }
      />

      <Box className='reference-grid reference-grid--stats' sx={{ mb: 3 }}>
        <StatCard
          label='Due today'
          value='6'
          detail='2 need attention'
          icon={<ChecklistRounded />}
        />
        <StatCard
          label='Completed'
          value='12'
          detail='+18% this week'
          icon={<TaskAltRounded />}
          tone='success'
        />
        <StatCard
          label='Family points'
          value='785'
          detail='125 this week'
          icon={<TollRounded />}
          tone='warning'
        />
        <StatCard
          label='Current streak'
          value='9d'
          detail='Best: 14 days'
          icon={<LocalFireDepartmentRounded />}
          tone='danger'
        />
      </Box>

      <Box className='reference-grid reference-grid--split' sx={{ mb: 3 }}>
        <Stack spacing={2.5}>
          <SectionCard
            title='Today'
            action={
              <Button
                variant='plain'
                size='sm'
                onClick={() => onNavigate('tasks')}
                endDecorator={<ArrowForwardRounded />}
              >
                All tasks
              </Button>
            }
          >
            <Stack divider={<Divider />}>
              {tasks.slice(0, 3).map(task => (
                <TaskRow key={task.title} task={task} compact />
              ))}
            </Stack>
          </SectionCard>

          <SectionCard
            title='Upcoming'
            action={<Chip size='sm'>Next 7 days</Chip>}
          >
            <Stack divider={<Divider />}>
              {tasks.slice(2).map(task => (
                <TaskRow key={task.title} task={task} compact />
              ))}
            </Stack>
          </SectionCard>
        </Stack>

        <Stack spacing={2.5}>
          <SectionCard title='Today’s progress'>
            <Stack spacing={2}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <CircularProgress
                  determinate
                  value={67}
                  size='lg'
                  sx={{
                    '--CircularProgress-size': '86px',
                    '--CircularProgress-trackThickness': '7px',
                    '--CircularProgress-progressThickness': '7px',
                  }}
                >
                  <Typography level='title-md' className='reference-metric'>
                    67%
                  </Typography>
                </CircularProgress>
                <Box>
                  <Typography level='title-md'>12 of 18 complete</Typography>
                  <Typography level='body-sm' sx={{ color: 'text.secondary' }}>
                    Strong pace — 6 tasks remain.
                  </Typography>
                </Box>
              </Box>
              <LinearProgress
                determinate
                value={67}
                aria-label='Today progress'
              />
              <Stack direction='row' justifyContent='space-between'>
                <Typography level='body-xs'>On time · 10</Typography>
                <Typography level='body-xs' color='danger'>
                  Overdue · 2
                </Typography>
              </Stack>
              <Divider />
              <StreakPips done={5} total={7} label='5-day completion streak' />
            </Stack>
          </SectionCard>

          <SectionCard
            title='Family activity'
            action={
              <Button size='sm' variant='plain'>
                View all
              </Button>
            }
          >
            <Box className='reference-timeline'>
              {[
                [2, 'task', 'Sara completed “Empty dishwasher”', '12 min ago'],
                [3, 'points', 'Yousef earned 20 points', '48 min ago'],
                [4, 'request', 'Lina requested “Movie night”', '1 hr ago'],
              ].map(([member, kind, label, time]) => (
                <Box key={label} className='reference-timeline-item'>
                  <Box
                    className='reference-timeline-node'
                    sx={{
                      bgcolor: `${kind === 'task' ? 'success' : kind === 'points' ? 'warning' : 'primary'}.softBg`,
                      color: `${kind === 'task' ? 'success' : kind === 'points' ? 'warning' : 'primary'}.softColor`,
                    }}
                  >
                    {kind === 'task' ? (
                      <TaskAltRounded fontSize='small' />
                    ) : kind === 'points' ? (
                      <TollRounded fontSize='small' />
                    ) : (
                      <CardGiftcardRounded fontSize='small' />
                    )}
                  </Box>
                  <Stack
                    direction='row'
                    alignItems='center'
                    spacing={0.75}
                    sx={{ minWidth: 0 }}
                  >
                    <MemberAvatar member={member} size='sm' />
                    <Typography level='body-sm' sx={{ minWidth: 0 }}>
                      {label}
                    </Typography>
                    <Typography
                      level='body-xs'
                      sx={{
                        color: 'text.tertiary',
                        ml: 'auto',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {time}
                    </Typography>
                  </Stack>
                </Box>
              ))}
            </Box>
          </SectionCard>
        </Stack>
      </Box>

      <Alert color='info' variant='soft' startDecorator={<CloudDoneRounded />}>
        Everything is synced. Last successful sync was less than a minute ago.
      </Alert>
    </Page>
  )
}

function TasksScreen() {
  const [tab, setTab] = useState(0)
  const [scope, setScope] = useState('all')
  const scopes = [
    ['all', 'All'],
    ['mine', 'Mine'],
    ['household', 'Household'],
  ]
  return (
    <Page>
      <PageIntro
        title='Chores & tasks'
        subtitle='One consistent list pattern for personal, family, recurring, and maintenance work.'
        action={<Button startDecorator={<AddRounded />}>New task</Button>}
      />
      <Stack
        direction='row'
        spacing={0.75}
        flexWrap='wrap'
        sx={{ mb: 2 }}
        role='group'
        aria-label='Filter tasks by scope'
      >
        {scopes.map(([id, labelText]) => (
          <Chip
            key={id}
            size='md'
            variant={scope === id ? 'solid' : 'outlined'}
            color={scope === id ? 'primary' : 'neutral'}
            onClick={() => setScope(id)}
            sx={{
              cursor: 'pointer',
              minHeight: 36,
              px: 1.5,
              fontWeight: scope === id ? 700 : 500,
            }}
          >
            {labelText}
          </Chip>
        ))}
      </Stack>
      <SectionCard sx={{ mb: 2 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.25}>
          <Input
            placeholder='Search tasks…'
            startDecorator={<SearchRounded />}
            sx={{ flex: 1 }}
          />
          <Select
            defaultValue='all'
            startDecorator={<FilterAltRounded />}
            sx={{ minWidth: 150 }}
          >
            <Option value='all'>All assignees</Option>
            <Option value='mine'>Assigned to me</Option>
            <Option value='unassigned'>Unassigned</Option>
          </Select>
          <Button variant='outlined' color='neutral'>
            Sort: Due date
          </Button>
        </Stack>
      </SectionCard>
      <Tabs
        value={tab}
        onChange={(_, value) => setTab(value)}
        sx={{ bgcolor: 'transparent' }}
      >
        <TabList variant='plain' sx={{ mb: 2, overflowX: 'auto' }}>
          <Tab>
            Today{' '}
            <Chip size='sm' sx={{ ml: 0.75 }}>
              6
            </Chip>
          </Tab>
          <Tab>Upcoming</Tab>
          <Tab>All tasks</Tab>
          <Tab>Completed</Tab>
        </TabList>
        <TabPanel value={0} sx={{ p: 0 }}>
          <SectionCard>
            <Stack divider={<Divider />}>
              {tasks.map(task => (
                <TaskRow key={task.title} task={task} />
              ))}
            </Stack>
          </SectionCard>
        </TabPanel>
        <TabPanel value={1} sx={{ p: 0 }}>
          <SectionCard>
            <TaskRow task={{ ...tasks[3], due: 'Saturday · 10:00 AM' }} />
          </SectionCard>
        </TabPanel>
        <TabPanel value={2} sx={{ p: 0 }}>
          <SectionCard>
            <Typography>
              All active work uses the same row anatomy and filters.
            </Typography>
          </SectionCard>
        </TabPanel>
        <TabPanel value={3} sx={{ p: 0 }}>
          <SectionCard>
            <TaskRow task={tasks[0]} completed />
          </SectionCard>
        </TabPanel>
      </Tabs>
      <Stack direction='row' flexWrap='wrap' gap={1} sx={{ mt: 2 }}>
        <Chip variant='soft' color='danger'>
          Overdue
        </Chip>
        <Chip variant='outlined'>Approval required</Chip>
        <Chip variant='soft' color='info'>
          Meter reading
        </Chip>
        <Chip variant='soft' color='warning'>
          High priority
        </Chip>
        <Chip variant='soft' color='success'>
          Recurring
        </Chip>
      </Stack>
    </Page>
  )
}

const routineData = [
  {
    title: 'School morning',
    detail: 'Weekdays · 6:30 AM',
    done: 4,
    total: 6,
    icon: <RestaurantRounded />,
    color: 'var(--ref-category-1)',
  },
  {
    title: 'Evening reset',
    detail: 'Daily · 8:00 PM',
    done: 2,
    total: 5,
    icon: <AutorenewRounded />,
    color: 'var(--ref-category-2)',
  },
  {
    title: 'Weekend home care',
    detail: 'Saturday · 10:00 AM',
    done: 1,
    total: 4,
    icon: <HomeRepairServiceRounded />,
    color: 'var(--ref-category-4)',
  },
]

function RoutinesScreen() {
  return (
    <Page>
      <PageIntro
        title='Routines'
        subtitle='Repeatable packs keep related steps together without turning the page into unrelated card sizes.'
        action={<Button startDecorator={<AddRounded />}>Create routine</Button>}
      />
      <Box className='reference-grid reference-grid--cards'>
        {routineData.map(routine => (
          <Card
            key={routine.title}
            variant='outlined'
            sx={{ height: '100%', '--routine-color': routine.color }}
          >
            <Stack spacing={2} sx={{ height: '100%' }}>
              <Stack
                direction='row'
                justifyContent='space-between'
                alignItems='flex-start'
              >
                <Box
                  sx={{
                    width: 42,
                    height: 42,
                    display: 'grid',
                    placeItems: 'center',
                    borderRadius: 'var(--daydan-radius-control)',
                    bgcolor: 'background.level1',
                    color: 'var(--routine-color)',
                  }}
                >
                  {routine.icon}
                </Box>
                <Dropdown>
                  <MenuButton
                    slots={{ root: IconButton }}
                    slotProps={{ root: { size: 'sm', variant: 'plain' } }}
                  >
                    <MoreVertRounded />
                  </MenuButton>
                  <Menu placement='bottom-end'>
                    <MenuItem>
                      <EditRounded /> Edit routine
                    </MenuItem>
                    <MenuItem>
                      <ArchiveRounded /> Archive
                    </MenuItem>
                  </Menu>
                </Dropdown>
              </Stack>
              <Box>
                <Typography level='title-lg'>{routine.title}</Typography>
                <Typography level='body-sm' sx={{ color: 'text.secondary' }}>
                  {routine.detail}
                </Typography>
              </Box>
              <Box sx={{ mt: 'auto' }}>
                <Stack
                  direction='row'
                  justifyContent='space-between'
                  sx={{ mb: 0.75 }}
                >
                  <Typography level='body-xs'>Today’s steps</Typography>
                  <Typography level='body-xs' className='reference-metric'>
                    {routine.done}/{routine.total}
                  </Typography>
                </Stack>
                <LinearProgress
                  determinate
                  value={(routine.done / routine.total) * 100}
                  sx={{ color: 'var(--routine-color)' }}
                />
              </Box>
              <Button variant='outlined'>Open routine</Button>
            </Stack>
          </Card>
        ))}
      </Box>
      <SectionCard title='School morning · steps' sx={{ mt: 3 }}>
        <List sx={{ p: 0 }}>
          {[
            'Make beds',
            'Pack lunches',
            'Fill water bottles',
            'Check school bags',
          ].map((step, index) => (
            <ListItem
              key={step}
              endAction={
                <DragIndicatorRounded sx={{ color: 'text.tertiary' }} />
              }
            >
              <ListItemDecorator>
                <Checkbox checked={index < 2} />
              </ListItemDecorator>
              <ListItemContent>
                <Typography
                  sx={{ textDecoration: index < 2 ? 'line-through' : 'none' }}
                >
                  {step}
                </Typography>
              </ListItemContent>
            </ListItem>
          ))}
        </List>
      </SectionCard>
    </Page>
  )
}

const projects = [
  {
    title: 'Kitchen refresh',
    tasks: 8,
    done: 5,
    icon: <KitchenRounded />,
    accent: 'var(--ref-category-1)',
  },
  {
    title: 'Summer travel',
    tasks: 12,
    done: 8,
    icon: <RocketLaunchRounded />,
    accent: 'var(--ref-category-2)',
  },
  {
    title: 'Car maintenance',
    tasks: 5,
    done: 2,
    icon: <DirectionsCarRounded />,
    accent: 'var(--ref-category-3)',
  },
  {
    title: 'Family documents',
    tasks: 7,
    done: 6,
    icon: <Inventory2Rounded />,
    accent: 'var(--ref-category-4)',
  },
]

function ProjectsScreen() {
  return (
    <Page>
      <PageIntro
        title='Projects'
        subtitle='Project cards share one minimum width, equal height, and predictable 14 px grid gap.'
        action={<Button startDecorator={<AddRounded />}>New project</Button>}
      />
      <Box className='reference-grid reference-grid--cards'>
        {projects.map(project => (
          <Card
            key={project.title}
            variant='outlined'
            className='reference-accent-line'
            sx={{
              '--reference-item-accent': project.accent,
              height: '100%',
              cursor: 'pointer',
              '&:hover': {
                borderColor: 'primary.outlinedBorder',
                boxShadow: 'var(--joy-shadow-sm)',
              },
            }}
          >
            <Stack spacing={2} sx={{ height: '100%', pl: 0.5 }}>
              <Stack direction='row' justifyContent='space-between'>
                <Box sx={{ color: project.accent }}>{project.icon}</Box>
                <Chip size='sm' variant='outlined'>
                  {project.tasks} tasks
                </Chip>
              </Stack>
              <Box sx={{ flex: 1 }}>
                <Typography level='title-lg'>{project.title}</Typography>
                <Typography level='body-sm' sx={{ color: 'text.secondary' }}>
                  Shared with the family circle
                </Typography>
              </Box>
              <Box>
                <Stack
                  direction='row'
                  justifyContent='space-between'
                  sx={{ mb: 0.75 }}
                >
                  <Typography level='body-xs'>Progress</Typography>
                  <Typography level='body-xs' className='reference-metric'>
                    {project.done}/{project.tasks}
                  </Typography>
                </Stack>
                <LinearProgress
                  determinate
                  value={(project.done / project.tasks) * 100}
                  sx={{ color: project.accent }}
                />
              </Box>
            </Stack>
          </Card>
        ))}
      </Box>
    </Page>
  )
}

function ShoppingScreen() {
  const [checked, setChecked] = useState(['Olive oil'])
  const items = [
    ['Milk', '2 cartons'],
    ['Bananas', '1 bunch'],
    ['Olive oil', '1 bottle'],
    ['Coffee beans', '500 g'],
  ]
  return (
    <Page narrow>
      <Breadcrumbs sx={{ px: 0, mb: 1 }}>
        <Link>Shopping lists</Link>
        <Typography>Weekly groceries</Typography>
      </Breadcrumbs>
      <PageIntro
        title='Weekly groceries'
        subtitle='Family list · 3 of 4 items remaining'
        action={
          <Dropdown>
            <MenuButton
              slots={{ root: IconButton }}
              slotProps={{ root: { variant: 'outlined' } }}
            >
              <MoreVertRounded />
            </MenuButton>
            <Menu>
              <MenuItem>
                <EditRounded /> Rename
              </MenuItem>
              <MenuItem color='danger'>
                <DeleteOutlineRounded /> Delete
              </MenuItem>
            </Menu>
          </Dropdown>
        }
      />
      <SectionCard sx={{ mb: 2 }}>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1}
          component='form'
        >
          <Input
            placeholder='Add an item…'
            startDecorator={<ShoppingBasketRounded />}
            sx={{ flex: 1 }}
          />
          <Input
            placeholder='Quantity'
            sx={{ width: { xs: '100%', sm: 120 } }}
          />
          <Button startDecorator={<AddRounded />}>Add</Button>
        </Stack>
      </SectionCard>
      <SectionCard
        title='Items'
        action={
          <Chip size='sm' variant='soft'>
            4 total
          </Chip>
        }
      >
        <List sx={{ p: 0 }}>
          {items.map(([name, amount], index) => {
            const isChecked = checked.includes(name)
            return (
              <ListItem key={name} sx={{ py: 1.25 }}>
                <ListItemDecorator>
                  <Checkbox
                    checked={isChecked}
                    onChange={() =>
                      setChecked(current =>
                        isChecked
                          ? current.filter(item => item !== name)
                          : [...current, name],
                      )
                    }
                  />
                </ListItemDecorator>
                <ListItemContent>
                  <Typography
                    sx={{
                      textDecoration: isChecked ? 'line-through' : 'none',
                      color: isChecked ? 'text.secondary' : 'text.primary',
                    }}
                  >
                    {name}
                  </Typography>
                  <Typography level='body-xs' sx={{ color: 'text.tertiary' }}>
                    {amount}
                  </Typography>
                </ListItemContent>
                <MemberAvatar member={(index % 4) + 1} />
                <IconButton size='sm' variant='plain' color='danger'>
                  <DeleteOutlineRounded />
                </IconButton>
              </ListItem>
            )
          })}
        </List>
      </SectionCard>
    </Page>
  )
}

const calendarDays = Array.from({ length: 35 }, (_, index) => {
  const number = index < 5 ? 27 + index : index - 4
  return {
    number,
    muted: index < 5 || index > 34,
    today: number === 25 && index > 4,
    event: [7, 11, 15, 18, 25, 28].includes(number),
  }
})

function CalendarScreen() {
  return (
    <Page>
      <PageIntro
        title='Calendar'
        subtitle='Agenda and month views use the same task row, category, member, and status language.'
        action={
          <ButtonGroup>
            <Button variant='outlined' startDecorator={<EventNoteRounded />}>
              Agenda
            </Button>
            <Button startDecorator={<CalendarMonthRounded />}>Month</Button>
          </ButtonGroup>
        }
      />
      <SectionCard sx={{ mb: 2 }}>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          justifyContent='space-between'
          alignItems={{ xs: 'stretch', sm: 'center' }}
          gap={1.5}
        >
          <Stack direction='row' alignItems='center' gap={1}>
            <IconButton
              variant='outlined'
              aria-label='Previous month'
              className='reference-flip-rtl'
            >
              <ChevronLeftRounded />
            </IconButton>
            <Typography
              level='title-lg'
              sx={{ minWidth: 150, textAlign: 'center' }}
            >
              August 2026
            </Typography>
            <IconButton
              variant='outlined'
              aria-label='Next month'
              className='reference-flip-rtl'
            >
              <ChevronRightRounded />
            </IconButton>
            <Button variant='plain'>Today</Button>
          </Stack>
          <Stack direction='row' gap={1}>
            <Select defaultValue='all' size='sm'>
              <Option value='all'>All categories</Option>
              <Option value='home'>Home</Option>
            </Select>
            <MemberStack />
          </Stack>
        </Stack>
      </SectionCard>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          px: 0.5,
          mb: 0.75,
        }}
      >
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <Typography
            key={day}
            level='body-xs'
            textAlign='center'
            sx={{ color: 'text.secondary' }}
          >
            {day}
          </Typography>
        ))}
      </Box>
      <Box className='reference-calendar-grid'>
        {calendarDays.map((day, index) => (
          <Box
            key={`${day.number}-${index}`}
            className='reference-calendar-day'
            data-today={day.today || undefined}
            sx={{ opacity: day.muted ? 0.45 : 1 }}
          >
            <Typography
              level='body-sm'
              className='reference-metric'
              sx={{
                fontWeight: day.today ? 700 : 400,
                ...(day.today
                  ? {
                      display: 'inline-grid',
                      placeItems: 'center',
                      width: 26,
                      height: 26,
                      borderRadius: '50%',
                      bgcolor: 'primary.solidBg',
                      color: 'primary.solidColor',
                      fontFamily: 'var(--daydan-font-data)',
                    }
                  : {}),
              }}
            >
              {day.number}
            </Typography>
            {day.event && (
              <Box
                sx={{
                  mt: 0.75,
                  p: 0.5,
                  borderRadius: 'sm',
                  bgcolor: 'primary.softBg',
                  color: 'primary.softColor',
                  overflow: 'hidden',
                }}
              >
                <span
                  className='reference-calendar-dot'
                  style={{
                    '--reference-dot':
                      index % 2 ? 'var(--ref-member-2)' : 'var(--ref-member-1)',
                  }}
                />
                <Typography
                  component='span'
                  level='body-xs'
                  className='reference-calendar-event-label'
                  sx={{
                    textTransform: 'none',
                    letterSpacing: 0,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {day.number === 25 ? 'Bins · 7 PM' : 'Family task'}
                </Typography>
              </Box>
            )}
          </Box>
        ))}
      </Box>
      <SectionCard title='Tuesday, August 25' sx={{ mt: 3 }}>
        <TaskRow task={tasks[0]} compact />
        <Divider />
        <TaskRow task={tasks[1]} compact />
      </SectionCard>
    </Page>
  )
}

const familyChart = members.map(member => ({
  name: member.name,
  completed: member.completed,
  points: member.points,
}))

function ProgressScreen() {
  return (
    <Page>
      <PageIntro
        title='Family progress'
        subtitle='Member identity colors come from the active product theme and carry through avatars, bars, and charts.'
        action={
          <Select defaultValue='30d' size='sm'>
            <Option value='7d'>Last 7 days</Option>
            <Option value='30d'>Last 30 days</Option>
            <Option value='90d'>Last 90 days</Option>
          </Select>
        }
      />
      <Box className='reference-grid reference-grid--cards' sx={{ mb: 3 }}>
        {members.map(member => (
          <Card key={member.id} variant='outlined' sx={{ height: '100%' }}>
            <Stack direction='row' spacing={1.5} alignItems='center'>
              <MemberAvatar member={member.id} size='lg' />
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography level='title-md'>{member.name}</Typography>
                <Typography level='body-xs' sx={{ color: 'text.secondary' }}>
                  {member.role}
                </Typography>
              </Box>
              <Chip size='sm' variant='soft' color='success'>
                On track
              </Chip>
            </Stack>
            <Divider sx={{ my: 2 }} />
            <Stack direction='row' justifyContent='space-between'>
              <Box>
                <Typography level='h2' className='reference-metric'>
                  {member.completed}
                </Typography>
                <Typography level='body-xs'>Completed</Typography>
              </Box>
              <Box sx={{ textAlign: 'end' }}>
                <Typography level='h2' className='reference-metric'>
                  {member.points}
                </Typography>
                <Typography level='body-xs'>Points</Typography>
              </Box>
            </Stack>
            <LinearProgress
              determinate
              value={Math.min(100, member.completed * 3.4)}
              sx={{ mt: 1.5, color: `var(--ref-member-${member.id})` }}
            />
          </Card>
        ))}
      </Box>

      <Box className='reference-grid reference-grid--split'>
        <SectionCard
          title='Tasks completed'
          action={
            <Chip size='sm' variant='outlined'>
              30 days
            </Chip>
          }
        >
          <Box sx={{ width: '100%', height: 280 }}>
            <ResponsiveContainer width='100%' height='100%'>
              <BarChart
                data={familyChart}
                margin={{ top: 16, right: 8, left: -24, bottom: 0 }}
              >
                <CartesianGrid
                  stroke='var(--ref-chart-grid)'
                  strokeDasharray='3 3'
                  vertical={false}
                />
                <XAxis
                  dataKey='name'
                  tick={{
                    fill: 'var(--joy-palette-text-secondary)',
                    fontSize: 11,
                  }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{
                    fill: 'var(--joy-palette-text-secondary)',
                    fontSize: 11,
                  }}
                  axisLine={false}
                  tickLine={false}
                />
                <ChartTooltip
                  contentStyle={{
                    background: 'var(--joy-palette-background-popup)',
                    border: '1px solid var(--joy-palette-divider)',
                    borderRadius: 'var(--daydan-radius-control)',
                    color: 'var(--joy-palette-text-primary)',
                  }}
                />
                <Bar dataKey='completed' radius={[6, 6, 0, 0]}>
                  {familyChart.map((entry, index) => (
                    <Cell
                      key={entry.name}
                      fill={`var(--ref-chart-${index + 1})`}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Box>
        </SectionCard>
        <Stack spacing={2.5}>
          <SectionCard title='Family goal'>
            <Stack spacing={1.25}>
              <Stack direction='row' justifyContent='space-between'>
                <Typography level='body-sm'>60 tasks this month</Typography>
                <Typography level='body-sm' className='reference-metric'>
                  48 / 60
                </Typography>
              </Stack>
              <LinearProgress determinate value={80} />
              <Alert variant='soft' color='success' size='sm'>
                12 more tasks to unlock the family bonus.
              </Alert>
            </Stack>
          </SectionCard>
          <SectionCard title='Work by category'>
            {[
              ['Home', 42, 'var(--ref-category-1)'],
              ['Errands', 26, 'var(--ref-category-2)'],
              ['Maintenance', 19, 'var(--ref-category-3)'],
              ['Family', 13, 'var(--ref-category-4)'],
            ].map(([name, value, color]) => (
              <Stack
                key={name}
                direction='row'
                alignItems='center'
                spacing={1.25}
              >
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    bgcolor: color,
                  }}
                />
                <Typography level='body-sm' sx={{ flex: 1 }}>
                  {name}
                </Typography>
                <Typography level='body-sm' className='reference-metric'>
                  {value}%
                </Typography>
              </Stack>
            ))}
          </SectionCard>
        </Stack>
      </Box>
    </Page>
  )
}

const meterData = [
  {
    name: 'Family car',
    value: '74,680 km',
    next: 'Oil service in 1,320 km',
    progress: 66,
    icon: <DirectionsCarRounded />,
    color: 'var(--ref-category-1)',
  },
  {
    name: 'Water filter',
    value: '184 days',
    next: 'Replace in 26 days',
    progress: 88,
    icon: <HomeRepairServiceRounded />,
    color: 'var(--ref-category-2)',
  },
  {
    name: 'Air purifier',
    value: '612 hr',
    next: 'Clean in 108 hours',
    progress: 57,
    icon: <SpeedRounded />,
    color: 'var(--ref-category-4)',
  },
]

function MetersScreen() {
  return (
    <Page>
      <PageIntro
        title='Meters & maintenance'
        subtitle='Readings use mono typography; reminder state stays semantic while each meter accent follows the active theme.'
        action={<Button startDecorator={<AddRounded />}>New meter</Button>}
      />
      <Box className='reference-grid reference-grid--cards' sx={{ mb: 3 }}>
        {meterData.map(meter => (
          <Card key={meter.name} variant='outlined' sx={{ height: '100%' }}>
            <Stack spacing={2} sx={{ height: '100%' }}>
              <Stack
                direction='row'
                justifyContent='space-between'
                alignItems='center'
              >
                <Box
                  sx={{
                    width: 42,
                    height: 42,
                    display: 'grid',
                    placeItems: 'center',
                    borderRadius: 'var(--daydan-radius-control)',
                    bgcolor: 'background.level1',
                    color: meter.color,
                  }}
                >
                  {meter.icon}
                </Box>
                <IconButton variant='plain' size='sm'>
                  <MoreVertRounded />
                </IconButton>
              </Stack>
              <Box>
                <Typography level='title-md'>{meter.name}</Typography>
                <Typography
                  level='h2'
                  className='reference-metric'
                  sx={{ mt: 0.5 }}
                >
                  {meter.value}
                </Typography>
              </Box>
              <Box sx={{ mt: 'auto' }}>
                <Typography
                  level='body-xs'
                  sx={{ color: 'text.secondary', mb: 0.75 }}
                >
                  {meter.next}
                </Typography>
                <LinearProgress
                  determinate
                  value={meter.progress}
                  sx={{ color: meter.color }}
                />
              </Box>
              <Button variant='outlined'>Update reading</Button>
            </Stack>
          </Card>
        ))}
      </Box>
      <SectionCard
        title='Reading history'
        action={
          <Button size='sm' variant='plain'>
            Export CSV
          </Button>
        }
      >
        <Box sx={{ overflowX: 'auto' }}>
          <Table hoverRow stickyHeader sx={{ minWidth: 640 }}>
            <thead>
              <tr>
                <th>Meter</th>
                <th>Reading</th>
                <th>Recorded by</th>
                <th>Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['Family car', '74,680 km', 1, 'Aug 25, 2026', 'Current'],
                ['Family car', '73,210 km', 2, 'Jul 14, 2026', 'Previous'],
                ['Air purifier', '612 hr', 3, 'Aug 23, 2026', 'Current'],
              ].map(([name, reading, member, date, status]) => (
                <tr key={`${name}-${date}`}>
                  <td>{name}</td>
                  <td className='reference-metric'>{reading}</td>
                  <td>
                    <Stack direction='row' alignItems='center' spacing={1}>
                      <MemberAvatar member={member} />
                      <Typography level='body-sm'>
                        {members[member - 1].name}
                      </Typography>
                    </Stack>
                  </td>
                  <td>{date}</td>
                  <td>
                    <Chip
                      size='sm'
                      color={status === 'Current' ? 'success' : 'neutral'}
                    >
                      {status}
                    </Chip>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Box>
      </SectionCard>
    </Page>
  )
}

const rewards = [
  [
    'Movie night pick',
    'Choose the next family movie.',
    180,
    'var(--ref-category-1)',
  ],
  [
    'Favorite dessert',
    'Pick dessert after Friday dinner.',
    120,
    'var(--ref-category-2)',
  ],
  [
    'One chore pass',
    'Skip one standard chore this week.',
    250,
    'var(--ref-category-3)',
  ],
]

function RewardsScreen() {
  return (
    <Page>
      <PageIntro
        title='Rewards'
        subtitle='Balances, reward cards, approval states, and point values share a consistent hierarchy.'
        action={<Button startDecorator={<AddRounded />}>Create reward</Button>}
      />
      <Box className='reference-grid reference-grid--stats' sx={{ mb: 3 }}>
        <StatCard
          label='Available'
          value='785'
          detail='All family points'
          icon={<TollRounded />}
        />
        <StatCard
          label='Reserved'
          value='180'
          detail='1 pending request'
          icon={<AccessTimeRounded />}
          tone='warning'
        />
        <StatCard
          label='Spendable'
          value='605'
          detail='After reservations'
          icon={<CardGiftcardRounded />}
          tone='success'
        />
        <StatCard
          label='Earned this week'
          value='+125'
          detail='Across 18 tasks'
          icon={<StarRounded />}
          tone='info'
        />
      </Box>
      <Typography level='h2' sx={{ mb: 1.5 }}>
        Available rewards
      </Typography>
      <Box className='reference-grid reference-grid--cards' sx={{ mb: 3 }}>
        {rewards.map(([name, description, cost, color]) => (
          <Card key={name} variant='outlined' sx={{ height: '100%' }}>
            <Stack spacing={1.5} sx={{ height: '100%' }}>
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  display: 'grid',
                  placeItems: 'center',
                  bgcolor: 'background.level1',
                  color,
                  borderRadius: 'var(--daydan-radius-control)',
                }}
              >
                <CardGiftcardRounded />
              </Box>
              <Typography level='title-lg'>{name}</Typography>
              <Typography
                level='body-sm'
                sx={{ color: 'text.secondary', flex: 1 }}
              >
                {description}
              </Typography>
              <Typography level='h2' className='reference-metric'>
                {cost} pts
              </Typography>
              <Button disabled={cost > 605}>Request reward</Button>
            </Stack>
          </Card>
        ))}
      </Box>
      <SectionCard title='Pending approvals'>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          alignItems={{ xs: 'stretch', sm: 'center' }}
          spacing={1.5}
        >
          <MemberAvatar member={4} />
          <Box sx={{ flex: 1 }}>
            <Typography level='title-sm'>
              Lina requested “Movie night pick”
            </Typography>
            <Typography level='body-xs' sx={{ color: 'text.secondary' }}>
              180 points · 1 hour ago
            </Typography>
          </Box>
          <Button size='sm' variant='outlined' color='danger'>
            Decline
          </Button>
          <Button size='sm' color='success'>
            Approve
          </Button>
        </Stack>
      </SectionCard>
    </Page>
  )
}

const notificationRows = [
  {
    icon: <TaskAltRounded />,
    tone: 'success',
    title: 'Sara completed “Empty dishwasher”',
    detail: 'The task is ready for your approval.',
    time: '12 min ago',
    unread: true,
  },
  {
    icon: <CardGiftcardRounded />,
    tone: 'warning',
    title: 'New reward request',
    detail: 'Lina requested “Movie night pick” for 180 points.',
    time: '1 hr ago',
    unread: true,
  },
  {
    icon: <CalendarMonthRounded />,
    tone: 'primary',
    title: 'Air filter replacement is due tomorrow',
    detail: 'The reminder is assigned to Mohammed.',
    time: '3 hr ago',
    unread: true,
  },
  {
    icon: <GroupsRounded />,
    tone: 'neutral',
    title: 'Weekly family summary is ready',
    detail: 'Your family completed 48 tasks this month.',
    time: 'Yesterday',
    unread: false,
  },
]

function NotificationsScreen() {
  return (
    <Page narrow>
      <PageIntro
        title='Notifications'
        subtitle='Actionable events are concise, scannable, and distinguish read state without depending on color alone.'
        action={<Button variant='plain'>Mark all read</Button>}
      />
      <SectionCard sx={{ p: 0, overflow: 'hidden' }}>
        <List sx={{ p: 0 }}>
          {notificationRows.map((item, index) => (
            <Box key={item.title}>
              <ListItem
                sx={{
                  px: 2,
                  py: 1.75,
                  alignItems: 'flex-start',
                  bgcolor: item.unread ? 'primary.softBg' : 'transparent',
                  '&:hover': {
                    bgcolor: item.unread
                      ? 'primary.softHoverBg'
                      : 'neutral.softHoverBg',
                  },
                }}
                endAction={
                  <IconButton size='sm' variant='plain'>
                    <MoreVertRounded />
                  </IconButton>
                }
              >
                <ListItemDecorator>
                  <Badge
                    color='primary'
                    invisible={!item.unread}
                    variant='solid'
                    size='sm'
                  >
                    <Box
                      sx={{
                        width: 38,
                        height: 38,
                        display: 'grid',
                        placeItems: 'center',
                        borderRadius: '50%',
                        bgcolor: `${item.tone}.softBg`,
                        color: `${item.tone}.softColor`,
                      }}
                    >
                      {item.icon}
                    </Box>
                  </Badge>
                </ListItemDecorator>
                <ListItemContent>
                  <Typography
                    level='title-sm'
                    sx={{ fontWeight: item.unread ? 700 : 500 }}
                  >
                    {item.title}
                  </Typography>
                  <Typography level='body-sm' sx={{ color: 'text.secondary' }}>
                    {item.detail}
                  </Typography>
                  <Typography
                    level='body-xs'
                    sx={{ color: 'text.tertiary', mt: 0.5 }}
                  >
                    {item.time}
                  </Typography>
                </ListItemContent>
              </ListItem>
              {index < notificationRows.length - 1 && <Divider />}
            </Box>
          ))}
        </List>
      </SectionCard>
    </Page>
  )
}

function SettingsScreen({ brand }) {
  return (
    <Page>
      <PageIntro
        title='Settings'
        subtitle='Grouped settings use a wide shell; form cards keep a 480 px readable measure.'
      />
      <Box className='reference-grid reference-grid--split'>
        <SectionCard title='Profile'>
          <Stack spacing={2} sx={{ maxWidth: 480 }}>
            <Stack direction='row' alignItems='center' spacing={2}>
              <MemberAvatar member={1} size='lg' />
              <Box sx={{ flex: 1 }}>
                <Typography level='title-md'>Mohammed Al-Amoudi</Typography>
                <Typography level='body-sm' sx={{ color: 'text.secondary' }}>
                  mohammed@example.com
                </Typography>
              </Box>
              <Button size='sm' variant='outlined'>
                Change photo
              </Button>
            </Stack>
            <FormControl>
              <FormLabel>Display name</FormLabel>
              <Input defaultValue='Mohammed Al-Amoudi' />
            </FormControl>
            <FormControl>
              <FormLabel>Email address</FormLabel>
              <Input defaultValue='mohammed@example.com' type='email' />
            </FormControl>
            <Button sx={{ alignSelf: 'flex-start' }}>Save changes</Button>
          </Stack>
        </SectionCard>
        <Stack spacing={2.5}>
          <SectionCard title='Appearance'>
            <Stack spacing={1.5}>
              <Stack
                direction='row'
                justifyContent='space-between'
                alignItems='center'
              >
                <Box>
                  <Typography level='title-sm'>Product theme</Typography>
                  <Typography level='body-xs' sx={{ color: 'text.secondary' }}>
                    Currently previewing {brand.name}
                  </Typography>
                </Box>
                <PaletteRounded color='primary' />
              </Stack>
              <RadioGroup defaultValue='system'>
                <Radio value='light' label='Light' />
                <Radio value='dark' label='Dark' />
                <Radio value='system' label='Use device setting' />
              </RadioGroup>
            </Stack>
          </SectionCard>
          <SectionCard title='Localization'>
            <FormControl>
              <FormLabel>Language</FormLabel>
              <Select defaultValue='en' startDecorator={<LanguageRounded />}>
                <Option value='en'>English</Option>
                <Option value='ar'>العربية (السعودية)</Option>
              </Select>
            </FormControl>
            <FormControl>
              <FormLabel>Time format</FormLabel>
              <Select defaultValue='12'>
                <Option value='12'>12-hour</Option>
                <Option value='24'>24-hour</Option>
              </Select>
            </FormControl>
          </SectionCard>
        </Stack>
      </Box>
      <SectionCard title='Notification preferences' sx={{ mt: 2.5 }}>
        {[
          ['Task reminders', 'Get a reminder before a task is due.', true],
          [
            'Family activity',
            'Completions, approvals, and reward requests.',
            true,
          ],
          ['Weekly summary', 'A concise family progress summary.', false],
        ].map(([title, detail, checked]) => (
          <Stack
            key={title}
            direction='row'
            alignItems='center'
            spacing={2}
            sx={{ py: 0.5 }}
          >
            <Box sx={{ flex: 1 }}>
              <Typography level='title-sm'>{title}</Typography>
              <Typography level='body-xs' sx={{ color: 'text.secondary' }}>
                {detail}
              </Typography>
            </Box>
            <Switch defaultChecked={checked} />
          </Stack>
        ))}
      </SectionCard>
    </Page>
  )
}

function SessionsScreen() {
  const [confirmOpen, setConfirmOpen] = useState(false)
  return (
    <Page>
      <PageIntro
        title='Account & sessions'
        subtitle='Identity, MFA, connected providers, and active devices stay separate from general preferences.'
      />
      <Box className='reference-grid reference-grid--split'>
        <Stack spacing={2.5}>
          <SectionCard title='Account identity'>
            <Stack direction='row' spacing={1.5} alignItems='center'>
              <Box
                sx={{
                  width: 42,
                  height: 42,
                  display: 'grid',
                  placeItems: 'center',
                  bgcolor: 'primary.softBg',
                  color: 'primary.softColor',
                  borderRadius: 'var(--daydan-radius-control)',
                }}
              >
                <MailOutlineRounded />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography level='title-sm'>Password account</Typography>
                <Typography level='body-xs' sx={{ color: 'text.secondary' }}>
                  mohammed@example.com
                </Typography>
              </Box>
              <Chip size='sm' color='success'>
                Verified
              </Chip>
            </Stack>
            <Divider />
            <Stack direction='row' spacing={1.5} alignItems='center'>
              <Box
                sx={{
                  width: 42,
                  height: 42,
                  display: 'grid',
                  placeItems: 'center',
                  bgcolor: 'background.level1',
                  borderRadius: 'var(--daydan-radius-control)',
                }}
              >
                <SecurityRounded />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography level='title-sm'>
                  Multi-factor authentication
                </Typography>
                <Typography level='body-xs' sx={{ color: 'text.secondary' }}>
                  Authenticator app · 8 recovery codes
                </Typography>
              </Box>
              <Button size='sm' variant='outlined'>
                Manage
              </Button>
            </Stack>
          </SectionCard>
          <SectionCard
            title='Active sessions'
            action={
              <Chip size='sm' variant='outlined'>
                3 devices
              </Chip>
            }
          >
            <Box sx={{ overflowX: 'auto' }}>
              <Table hoverRow sx={{ minWidth: 620 }}>
                <thead>
                  <tr>
                    <th>Device</th>
                    <th>Location</th>
                    <th>Last active</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>
                      <Stack direction='row' spacing={1} alignItems='center'>
                        <DevicesRounded />
                        <Box>
                          <Typography level='title-sm'>
                            Chrome on Linux
                          </Typography>
                          <Chip size='sm' color='success'>
                            This device
                          </Chip>
                        </Box>
                      </Stack>
                    </td>
                    <td>Riyadh, SA</td>
                    <td>Now</td>
                    <td />
                  </tr>
                  <tr>
                    <td>
                      <Stack direction='row' spacing={1} alignItems='center'>
                        <DevicesRounded />
                        <Typography level='title-sm'>
                          DayDan on iPhone
                        </Typography>
                      </Stack>
                    </td>
                    <td>Riyadh, SA</td>
                    <td>2 hours ago</td>
                    <td>
                      <Button
                        size='sm'
                        variant='plain'
                        color='danger'
                        onClick={() => setConfirmOpen(true)}
                      >
                        Revoke
                      </Button>
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <Stack direction='row' spacing={1} alignItems='center'>
                        <DevicesRounded />
                        <Typography level='title-sm'>Safari on iPad</Typography>
                      </Stack>
                    </td>
                    <td>Jeddah, SA</td>
                    <td>3 days ago</td>
                    <td>
                      <Button
                        size='sm'
                        variant='plain'
                        color='danger'
                        onClick={() => setConfirmOpen(true)}
                      >
                        Revoke
                      </Button>
                    </td>
                  </tr>
                </tbody>
              </Table>
            </Box>
          </SectionCard>
        </Stack>
        <Stack spacing={2.5}>
          <SectionCard title='Security actions'>
            <Button variant='outlined' startDecorator={<LockRounded />}>
              Change password
            </Button>
            <Button
              variant='outlined'
              color='danger'
              startDecorator={<LogoutRounded />}
              onClick={() => setConfirmOpen(true)}
            >
              Sign out other devices
            </Button>
          </SectionCard>
          <SectionCard
            title='Danger zone'
            sx={{ borderColor: 'danger.outlinedBorder' }}
          >
            <Typography level='body-sm' sx={{ color: 'text.secondary' }}>
              Deleting the account permanently removes personal data and circle
              ownership.
            </Typography>
            <Button
              color='danger'
              variant='outlined'
              startDecorator={<DeleteOutlineRounded />}
              onClick={() => setConfirmOpen(true)}
            >
              Delete account
            </Button>
          </SectionCard>
        </Stack>
      </Box>
      <AppModal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title='Revoke this session?'
        description='The device will be signed out and must authenticate again.'
        icon={<WarningAmberRounded color='danger' />}
        footer={
          <ModalActions
            secondary={{
              label: 'Cancel',
              onClick: () => setConfirmOpen(false),
            }}
            primary={{
              label: 'Revoke session',
              color: 'danger',
              onClick: () => setConfirmOpen(false),
            }}
          />
        }
      >
        <Alert color='warning' variant='soft'>
          Any unsynced changes on that device may be lost.
        </Alert>
      </AppModal>
    </Page>
  )
}

function ComponentsScreen() {
  const [modal, setModal] = useState(null)
  const [menuChoice, setMenuChoice] = useState('No action selected')
  return (
    <Page>
      <PageIntro
        title='Component reference'
        subtitle='Joy UI primitives plus the repository’s shared SectionCard, PageHeader, AppModal, ModalActions, EmptyState, and loading components.'
      />
      <Box className='reference-grid reference-grid--split'>
        <Stack spacing={2.5}>
          <SectionCard
            title='Buttons'
            action={<Chip size='sm'>44 px mobile target</Chip>}
          >
            <Stack direction='row' flexWrap='wrap' gap={1}>
              <Button>Primary action</Button>
              <Button variant='outlined'>Secondary</Button>
              <Button variant='soft'>Soft</Button>
              <Button variant='plain'>Plain</Button>
              <Button color='danger'>Delete</Button>
              <Button loading>Saving</Button>
              <Button disabled>Disabled</Button>
              <IconButton variant='outlined' aria-label='Add'>
                <AddRounded />
              </IconButton>
            </Stack>
            <Divider />
            <Typography level='body-xs' sx={{ color: 'text.secondary' }}>
              Persistent state specimens
            </Typography>
            <Stack
              direction='row'
              flexWrap='wrap'
              gap={2}
              alignItems='flex-start'
            >
              <Stack spacing={0.75} alignItems='center'>
                <Button variant='soft' className='reference-static-hover'>
                  Hover
                </Button>
                <Typography level='body-xs'>soft hover</Typography>
              </Stack>
              <Stack spacing={0.75} alignItems='center'>
                <Button className='reference-static-focus'>Focus</Button>
                <Typography level='body-xs'>2 px outer ring</Typography>
              </Stack>
              <Stack spacing={0.75} alignItems='center'>
                <Button className='reference-static-active'>Active</Button>
                <Typography level='body-xs'>pressed</Typography>
              </Stack>
              <Stack spacing={0.75} alignItems='center'>
                <Button disabled>Disabled</Button>
                <Typography level='body-xs'>unavailable</Typography>
              </Stack>
            </Stack>
          </SectionCard>

          <SectionCard title='Forms'>
            <Box
              className='reference-grid'
              sx={{ gridTemplateColumns: { sm: 'repeat(2, minmax(0, 1fr))' } }}
            >
              <FormControl required>
                <FormLabel>Task name</FormLabel>
                <Input
                  placeholder='e.g. Water the plants'
                  startDecorator={<ChecklistRounded />}
                />
                <FormHelperText>Use a short action phrase.</FormHelperText>
              </FormControl>
              <FormControl>
                <FormLabel>Assignee</FormLabel>
                <Select defaultValue='sara'>
                  <Option value='sara'>Sara</Option>
                  <Option value='yousef'>Yousef</Option>
                </Select>
              </FormControl>
              <FormControl error>
                <FormLabel>Due date</FormLabel>
                <Input defaultValue='Not a valid date' />
                <FormHelperText>Enter a valid date.</FormHelperText>
              </FormControl>
              <FormControl disabled>
                <FormLabel>Managed field</FormLabel>
                <Input value='Controlled by admin' readOnly />
              </FormControl>
            </Box>
            <FormControl>
              <FormLabel>Notes</FormLabel>
              <Textarea
                minRows={3}
                placeholder='Add details, links, or completion instructions…'
              />
            </FormControl>
            <Stack
              direction='row'
              flexWrap='wrap'
              gap={2}
              alignItems='flex-start'
            >
              <Checkbox label='Requires approval' defaultChecked />
              <Checkbox label='Repeat task' />
              <Switch defaultChecked />
              <RadioGroup orientation='horizontal' defaultValue='normal'>
                <Radio value='low' label='Low' />
                <Radio value='normal' label='Normal' />
                <Radio value='high' label='High' />
              </RadioGroup>
            </Stack>
          </SectionCard>

          <SectionCard title='Alerts, chips & badges'>
            <Stack spacing={1}>
              <Alert color='success' startDecorator={<CheckCircleRounded />}>
                Task completed and 15 points were awarded.
              </Alert>
              <Alert color='info' startDecorator={<InfoOutlined />}>
                A newer app version is ready to install.
              </Alert>
              <Alert color='warning' startDecorator={<WarningAmberRounded />}>
                This task requires admin approval.
              </Alert>
              <Alert color='danger' startDecorator={<ErrorOutlineRounded />}>
                The update could not be saved.
              </Alert>
            </Stack>
            <Stack direction='row' flexWrap='wrap' gap={1} alignItems='center'>
              <Chip color='primary'>Family</Chip>
              <Chip color='success'>Completed</Chip>
              <Chip color='warning'>Pending</Chip>
              <Chip color='danger'>Overdue</Chip>
              <Chip color='info'>Maintenance</Chip>
              <Chip variant='outlined'>Category</Chip>
              <Badge badgeContent={4} color='danger'>
                <NotificationsNoneRounded />
              </Badge>
            </Stack>
          </SectionCard>
        </Stack>

        <Stack spacing={2.5}>
          <SectionCard title='Typography'>
            <Typography level='h1'>Display · h1 · 700</Typography>
            <Typography level='h2'>Section title · h2 · 700</Typography>
            <Typography level='title-lg'>
              Card title · title-lg · 700
            </Typography>
            <Typography level='title-md'>Row title · title-md · 600</Typography>
            <Typography level='body-md'>
              Body text uses the active product UI face.
            </Typography>
            <Typography level='body-sm' sx={{ color: 'text.secondary' }}>
              Small supporting copy at 13 px.
            </Typography>
            <Typography level='body-xs'>Metadata label</Typography>
            <Typography className='reference-metric' level='h2'>
              12,480.25
            </Typography>
            <Typography
              className='reference-wordmark'
              sx={{ fontSize: '1.75rem', color: 'primary.500' }}
            >
              Product wordmark
            </Typography>
          </SectionCard>

          <SectionCard title='Menus & tabs'>
            <Stack direction='row' alignItems='center' gap={1}>
              <Dropdown>
                <MenuButton startDecorator={<MenuRounded />}>
                  Open menu
                </MenuButton>
                <Menu placement='bottom-start'>
                  <MenuItem onClick={() => setMenuChoice('Edit selected')}>
                    <EditRounded /> Edit
                  </MenuItem>
                  <MenuItem onClick={() => setMenuChoice('Archive selected')}>
                    <ArchiveRounded /> Archive
                  </MenuItem>
                  <ListDivider />
                  <MenuItem
                    color='danger'
                    onClick={() => setMenuChoice('Delete selected')}
                  >
                    <DeleteOutlineRounded /> Delete
                  </MenuItem>
                </Menu>
              </Dropdown>
              <Typography level='body-xs' sx={{ color: 'text.secondary' }}>
                {menuChoice}
              </Typography>
            </Stack>
            <Tabs defaultValue={0}>
              <TabList>
                <Tab>Overview</Tab>
                <Tab>Activity</Tab>
                <Tab disabled>Disabled</Tab>
              </TabList>
              <TabPanel value={0} sx={{ px: 0, pb: 0 }}>
                <Typography level='body-sm'>
                  Tabs keep related views in one page context.
                </Typography>
              </TabPanel>
              <TabPanel value={1}>Activity panel</TabPanel>
            </Tabs>
          </SectionCard>

          <SectionCard title='Dialogs'>
            <Button onClick={() => setModal('form')}>Open form dialog</Button>
            <Button
              color='danger'
              variant='outlined'
              onClick={() => setModal('destructive')}
            >
              Open destructive dialog
            </Button>
          </SectionCard>

          <SectionCard title='Avatars & theme-linked identity'>
            <Stack direction='row' flexWrap='wrap' gap={1.25}>
              {[1, 2, 3, 4, 5, 6].map(member => (
                <MemberAvatar key={member} member={member} size='lg' />
              ))}
            </Stack>
            <Stack
              direction='row'
              flexWrap='wrap'
              gap={1}
              aria-label='Chart series colors'
            >
              {[1, 2, 3, 4, 5, 6].map(series => (
                <Box
                  key={series}
                  sx={{
                    width: 20,
                    height: 20,
                    borderRadius: '6px',
                    bgcolor: `var(--ref-chart-${series})`,
                  }}
                />
              ))}
            </Stack>
            <Typography level='body-sm' sx={{ color: 'text.secondary' }}>
              Switch brands above: every member swatch, chart series, category
              accent, and progress indicator changes through semantic CSS
              variables.
            </Typography>
          </SectionCard>
        </Stack>
      </Box>
      <AppModal
        open={modal === 'form'}
        onClose={() => setModal(null)}
        title='Create project'
        description='Group related tasks into a shared project.'
        icon={<FolderRounded color='primary' />}
        footer={
          <ModalActions
            secondary={{ label: 'Cancel', onClick: () => setModal(null) }}
            primary={{ label: 'Create project', onClick: () => setModal(null) }}
          />
        }
      >
        <Stack spacing={2}>
          <FormControl required>
            <FormLabel>Project name</FormLabel>
            <Input autoFocus placeholder='e.g. Kitchen refresh' />
          </FormControl>
          <FormControl>
            <FormLabel>Description</FormLabel>
            <Textarea minRows={3} />
          </FormControl>
        </Stack>
      </AppModal>
      <AppModal
        open={modal === 'destructive'}
        onClose={() => setModal(null)}
        title='Delete this project?'
        description='Its tasks will remain, but the project grouping cannot be restored.'
        icon={<WarningAmberRounded color='danger' />}
        footer={
          <ModalActions
            secondary={{ label: 'Cancel', onClick: () => setModal(null) }}
            primary={{
              label: 'Delete project',
              color: 'danger',
              onClick: () => setModal(null),
            }}
          />
        }
      >
        <Alert color='danger' variant='soft'>
          This action is permanent.
        </Alert>
      </AppModal>
    </Page>
  )
}

function StatesScreen() {
  return (
    <Page>
      <PageIntro
        title='System states'
        subtitle='Loading, empty, no-results, error, disabled, offline, and success states use one reusable visual grammar.'
      />
      <Box className='reference-grid reference-grid--cards'>
        <SectionCard title='Loading'>
          <Stack spacing={1.25}>
            <Skeleton variant='text' level='h2' width='48%' />
            <Skeleton variant='rectangular' height={92} />
            <Skeleton variant='text' width='72%' />
            <LinearProgress />
          </Stack>
        </SectionCard>
        <SectionCard title='Inline loading'>
          <QueryLoadingView label='Loading family progress…' sx={{ py: 2 }} />
        </SectionCard>
        <SectionCard title='Empty state'>
          <EmptyState
            size='sm'
            icon={<InboxRounded />}
            title='No tasks yet'
            description='Create the first task for your family circle.'
            primaryAction={{ label: 'Create task' }}
          />
        </SectionCard>
        <SectionCard title='No results'>
          <EmptyState
            variant='no-results'
            size='sm'
            icon={<SearchRounded />}
            title='No matching tasks'
            description='Try removing a filter or using a broader search.'
            secondaryAction={{ label: 'Clear filters' }}
          />
        </SectionCard>
        <SectionCard title='Error state'>
          <EmptyState
            variant='error'
            size='sm'
            icon={<ErrorOutlineRounded />}
            title='Couldn’t load this section'
            description='Check your connection and try again.'
            primaryAction={{
              label: 'Retry',
              startDecorator: <RefreshRounded />,
            }}
          />
        </SectionCard>
        <SectionCard title='Disabled & permission'>
          <Stack spacing={1.5}>
            <Alert color='neutral' startDecorator={<LockRounded />}>
              Only family admins can change this setting.
            </Alert>
            <Button disabled>Save restricted setting</Button>
            <Input disabled value='Managed by family admin' />
          </Stack>
        </SectionCard>
        <SectionCard title='Offline'>
          <Alert
            color='warning'
            startDecorator={<WifiRounded />}
            endDecorator={
              <Button size='sm' variant='plain'>
                Retry
              </Button>
            }
          >
            You’re offline. Recent data remains available.
          </Alert>
          <Typography level='body-sm' sx={{ color: 'text.secondary' }}>
            Pending actions are marked until sync succeeds.
          </Typography>
          <Chip
            color='warning'
            variant='soft'
            startDecorator={<CloudDoneRounded />}
          >
            2 changes pending
          </Chip>
        </SectionCard>
        <SectionCard title='Success confirmation'>
          <Box
            sx={{
              width: 54,
              height: 54,
              display: 'grid',
              placeItems: 'center',
              borderRadius: '50%',
              bgcolor: 'success.softBg',
              color: 'success.softColor',
            }}
          >
            <CheckCircleRounded fontSize='large' />
          </Box>
          <Typography level='title-lg'>All caught up</Typography>
          <Typography level='body-sm' sx={{ color: 'text.secondary' }}>
            Everything due today has been completed.
          </Typography>
        </SectionCard>
      </Box>
    </Page>
  )
}

function ArabicScreen({ brand }) {
  const arabicTasks = [
    ['إخراج حاويات النفايات', 'اليوم · ٧:٠٠ م', 2, 15],
    ['سقي نباتات الشرفة', 'اليوم · ٨:٣٠ م', 3, 10],
    ['تغيير فلتر تنقية الهواء', 'غدًا · ٩:٠٠ ص', 1, 30],
  ]
  return (
    <Page>
      <PageIntro
        title='Arabic / RTL reference'
        subtitle='A nested RTL specimen remains visible even when the global reference is switched back to English.'
        action={
          <Chip startDecorator={<LanguageRounded />} color='primary'>
            العربية (السعودية)
          </Chip>
        }
      />
      <Box className='reference-rtl-preview'>
        <SectionCard
          title={`الرئيسية · ${brand.name}`}
          action={<Button startDecorator={<AddRounded />}>إضافة مهمة</Button>}
          sx={{ mb: 2.5 }}
        >
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            justifyContent='space-between'
            gap={2}
          >
            <Box>
              <Typography level='h1'>مساء الخير، محمد</Typography>
              <Typography level='body-sm' sx={{ color: 'text.secondary' }}>
                الثلاثاء، ٢٥ أغسطس · تبقّت ٦ مهام اليوم.
              </Typography>
            </Box>
            <AvatarGroup>
              {members
                .slice()
                .reverse()
                .map(member => (
                  <MemberAvatar key={member.id} member={member.id} />
                ))}
            </AvatarGroup>
          </Stack>
        </SectionCard>
        <Box className='reference-grid reference-grid--stats' sx={{ mb: 2.5 }}>
          <StatCard
            label='مهام اليوم'
            value='٦'
            detail='مهمتان تحتاجان الانتباه'
            icon={<ChecklistRounded />}
          />
          <StatCard
            label='المهام المكتملة'
            value='١٢'
            detail='هذا الأسبوع'
            icon={<TaskAltRounded />}
            tone='success'
          />
          <StatCard
            label='نقاط العائلة'
            value='٧٨٥'
            detail='١٢٥ هذا الأسبوع'
            icon={<TollRounded />}
            tone='warning'
          />
          <StatCard
            label='سلسلة الإنجاز'
            value='٩ أيام'
            detail='الأفضل: ١٤ يومًا'
            icon={<LocalFireDepartmentRounded />}
            tone='danger'
          />
        </Box>
        <SectionCard
          title='مهام اليوم'
          action={<Button variant='plain'>عرض الكل</Button>}
        >
          <Stack divider={<Divider />}>
            {arabicTasks.map(([title, due, member, points], index) => (
              <Stack
                key={title}
                direction='row'
                alignItems='center'
                spacing={1.25}
                sx={{ py: 1.25 }}
              >
                <IconButton color={index === 0 ? 'danger' : 'primary'}>
                  <RadioButtonUncheckedRounded />
                </IconButton>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography level='title-md'>{title}</Typography>
                  <Typography level='body-xs' sx={{ color: 'text.secondary' }}>
                    {due}
                  </Typography>
                </Box>
                <MemberAvatar member={member} />
                <Typography level='body-sm' className='reference-metric'>
                  +{points}
                </Typography>
                <IconButton variant='plain' size='sm'>
                  <MoreVertRounded />
                </IconButton>
              </Stack>
            ))}
          </Stack>
        </SectionCard>
        <Alert
          color='info'
          variant='soft'
          startDecorator={<InfoOutlined />}
          sx={{ mt: 2.5 }}
        >
          تُعكس الأسهم واتجاهات التنقل فقط، بينما تبقى الأرقام والمقاييس من
          اليسار إلى اليمين.
        </Alert>
      </Box>
    </Page>
  )
}

export function ReferenceScreen({ brand, onNavigate, page }) {
  const screens = useMemo(
    () => ({
      dashboard: <DashboardScreen brand={brand} onNavigate={onNavigate} />,
      tasks: <TasksScreen />,
      routines: <RoutinesScreen />,
      projects: <ProjectsScreen />,
      shopping: <ShoppingScreen />,
      calendar: <CalendarScreen />,
      progress: <ProgressScreen />,
      meters: <MetersScreen />,
      rewards: <RewardsScreen />,
      notifications: <NotificationsScreen />,
      settings: <SettingsScreen brand={brand} />,
      sessions: <SessionsScreen />,
      components: <ComponentsScreen />,
      states: <StatesScreen />,
      arabic: <ArabicScreen brand={brand} />,
    }),
    [brand, onNavigate],
  )
  return screens[page] || screens.dashboard
}
