import PropTypes from 'prop-types'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

import FigmaIcon from '../../../components/FigmaIcon'
import { formatDate } from '../homeModel'

const navTarget = name => {
  switch (name) {
    case 'today':
      return '/today'
    case 'calendar':
      return '/calendar'
    case 'shopping':
      return '/shopping'
    case 'routines':
      return '/routines'
    case 'activity':
      return '/activities'
    case 'projects':
      return '/projects'
    case 'all-tasks':
      return '/chores'
    default:
      return '/'
  }
}

function StatCard({ color, icon, label, sub, value }) {
  return (
    <div className='card flex flex-col gap-2 p-5'>
      <div className='flex items-center justify-between'>
        <span
          className='text-muted'
          style={{
            fontSize: 12,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.07em',
          }}
        >
          {label}
        </span>
        <div
          className='flex items-center justify-center'
          style={{
            width: 32,
            height: 32,
            borderRadius: 'var(--r-md)',
            background: `color-mix(in srgb, ${color} 10%, transparent)`,
            color,
          }}
        >
          <FigmaIcon name={icon} size={15} />
        </div>
      </div>
      <div
        className='text-primary font-bold'
        style={{ fontSize: 28, lineHeight: 1, fontFamily: 'var(--font-mono)' }}
      >
        {value}
      </div>
      {sub && (
        <div className='text-muted' style={{ fontSize: 12 }}>
          {sub}
        </div>
      )}
    </div>
  )
}

StatCard.propTypes = {
  color: PropTypes.string.isRequired,
  icon: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  sub: PropTypes.string,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
}
StatCard.defaultProps = { sub: null }

function TaskRow({ onComplete, task }) {
  const { i18n, t } = useTranslation('common')
  const navigate = useNavigate()
  const statusColor =
    task.status === 'overdue'
      ? 'var(--sig-over)'
      : task.status === 'done'
        ? 'var(--sig-done)'
        : 'var(--t-faint)'
  const isDone = task.status === 'done'
  return (
    <div
      className={`task-row ${isDone ? 'done' : ''}`}
      onClick={() => navigate(`/chores/${task.choreId}`)}
    >
      <button
        className={`task-check ${isDone ? 'checked' : ''}`}
        onClick={e => {
          e.stopPropagation()
          if (!isDone) onComplete(task)
        }}
        aria-label={
          isDone ? t('homeToday.completed') : t('homeToday.markComplete')
        }
      >
        {isDone && (
          <FigmaIcon name='check' size={11} style={{ color: 'white' }} />
        )}
      </button>
      <div className='min-w-0 flex-1'>
        <div
          className='task-title text-primary font-medium'
          style={{ fontSize: 14 }}
        >
          {task.title}
        </div>
        <div className='mt-0.5 flex flex-wrap items-center gap-2'>
          {task.category && (
            <span
              className='badge'
              style={{
                background: `color-mix(in srgb, ${task.categoryColor} 10%, transparent)`,
                color: task.categoryColor,
              }}
            >
              {task.category}
            </span>
          )}
          {task.dueDate && (
            <span style={{ fontSize: 11, color: statusColor, fontWeight: 600 }}>
              {formatDate(task.dueDate, {
                locale: i18n.resolvedLanguage || 'en',
                t,
              })}
            </span>
          )}
          {task.isRecurring && (
            <FigmaIcon
              name='repeat'
              size={11}
              style={{ color: 'var(--t-faint)' }}
            />
          )}
        </div>
      </div>
      {task.priority === 'high' && !isDone && (
        <FigmaIcon
          name='flag'
          size={13}
          style={{ color: 'var(--sig-over)', flexShrink: 0 }}
        />
      )}
    </div>
  )
}

TaskRow.propTypes = {
  onComplete: PropTypes.func.isRequired,
  task: PropTypes.object.isRequired,
}

function WorkloadRow({ max, member }) {
  const pct = max > 0 ? Math.round((member.tasksCompleted / max) * 100) : 0
  return (
    <div className='flex items-center gap-3 py-2'>
      <div
        className='avatar'
        style={{
          width: 28,
          height: 28,
          background: member.color,
          fontSize: 10,
        }}
      >
        {member.initials}
      </div>
      <div className='min-w-0 flex-1'>
        <div className='mb-1 flex justify-between'>
          <span className='text-primary font-medium' style={{ fontSize: 13 }}>
            {member.name}
          </span>
          <span className='text-faint font-mono' style={{ fontSize: 11 }}>
            {member.tasksCompleted}/
            {member.tasksAssigned + member.tasksCompleted}
          </span>
        </div>
        <div className='progress-track' style={{ height: 5 }}>
          <div
            className='progress-fill'
            style={{ width: `${pct}%`, background: member.color }}
          />
        </div>
      </div>
    </div>
  )
}

WorkloadRow.propTypes = {
  max: PropTypes.number.isRequired,
  member: PropTypes.object.isRequired,
}

export default function FocusHome({
  activeProjects,
  activityFeed,
  currentMember,
  familyGoal,
  hasGoal,
  isSolo,
  makeTaskDone,
  myTasks,
  now,
  overdue,
  streak,
  upcoming,
  workload,
}) {
  const { i18n, t } = useTranslation('common')
  const navigate = useNavigate()
  const openCreate = () => navigate('/chores/create')
  const goto = name => navigate(navTarget(name))

  const done = myTasks.filter(task => task.status === 'done')
  const upcomingList = upcoming.slice(0, 4)
  const maxCompleted = workload.maxCompleted
  const hour = now.getHours()
  const greeting = t(
    hour < 12
      ? 'homeToday.goodMorning'
      : hour < 17
        ? 'homeToday.goodAfternoon'
        : 'homeToday.goodEvening',
  )
  const memberName = currentMember?.name || t('homeToday.there')
  const locale = i18n.resolvedLanguage || document.documentElement.lang || 'en'
  return (
    <div style={{ padding: '0 0 40px' }}>
      {/* Hero greeting */}
      <div className='page-header pb-6'>
        <div>
          <div
            className='text-faint'
            style={{
              fontSize: 12,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: 4,
            }}
          >
            {new Intl.DateTimeFormat(locale, {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            }).format(now)}
          </div>
          <h1
            className='text-primary'
            style={{
              fontSize: 26,
              fontWeight: 800,
              margin: 0,
              lineHeight: 1.2,
            }}
          >
            {greeting}, {memberName}!
          </h1>
          <p className='text-muted' style={{ fontSize: 14, margin: '6px 0 0' }}>
            {overdue.length > 0
              ? t('homeToday.overdueIntro', { count: overdue.length })
              : t('homeToday.onTrack', {
                  completed: done.length,
                  total: myTasks.length,
                })}
          </p>
        </div>
        <button
          className='btn btn-secondary hidden md:flex'
          onClick={openCreate}
        >
          <FigmaIcon name='plus' size={15} />
          {t('homeToday.newTask')}
        </button>
      </div>

      <div className='px-4 md:px-7'>
        {/* Stats row */}
        <div
          className='mb-6 grid gap-3'
          style={{
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          }}
        >
          <StatCard
            label={t('homeToday.doneToday')}
            value={`${done.length}/${myTasks.length}`}
            sub={t('homeToday.yourTasks')}
            color='var(--sig-done)'
            icon='check'
          />
          <StatCard
            label={t('homeToday.overdue')}
            value={overdue.length}
            sub={t('homeToday.needAttention')}
            color='var(--sig-over)'
            icon='error'
          />
          <StatCard
            label={t('homeToday.upcoming')}
            value={upcomingList.length}
            sub={t('homeToday.nextDays', { count: 7 })}
            color='var(--brand)'
            icon='calendar'
          />
          {!isSolo && (
            <StatCard
              label={t('homeToday.houseStreak')}
              value={t('homeToday.daysShort', { count: streak })}
              sub={t('homeToday.consecutiveDays')}
              color='var(--accent-text)'
              icon='fire'
            />
          )}
        </div>

        {/* Overdue alert */}
        {overdue.length > 0 && (
          <div
            className='mb-5 flex items-start gap-3 rounded-lg p-4'
            style={{
              background: 'var(--sig-over-bg)',
              border: '1px solid var(--sig-over)',
              borderRadius: 'var(--r-lg)',
            }}
          >
            <FigmaIcon
              name='error'
              size={18}
              style={{ color: 'var(--sig-over)', flexShrink: 0, marginTop: 1 }}
            />
            <div>
              <div
                className='font-bold'
                style={{ fontSize: 14, color: 'var(--sig-over)' }}
              >
                {t('homeToday.overdueTasks', { count: overdue.length })}
              </div>
              {overdue.map(task => (
                <div
                  key={task.id}
                  className='mt-1 flex items-center gap-1'
                  style={{ fontSize: 13, color: 'var(--sig-over)' }}
                >
                  <span>•</span> {task.title}
                  {task.dueDate && (
                    <span className='text-faint ms-1' style={{ fontSize: 11 }}>
                      {formatDate(task.dueDate, { locale, t })}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Two-column layout */}
        <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
          {/* Left: Today's tasks */}
          <div className='flex flex-col gap-6'>
            {/* Today section */}
            <div className='card overflow-hidden'>
              <div
                className='border-line flex items-center justify-between border-b px-5 py-4'
                style={{ borderColor: 'var(--line)' }}
              >
                <div>
                  <h2
                    className='text-primary font-bold'
                    style={{ fontSize: 15, margin: 0 }}
                  >
                    {t('homeToday.today')}
                  </h2>
                  <div className='text-muted' style={{ fontSize: 12 }}>
                    {t('homeToday.completedOf', {
                      completed: done.length,
                      total: myTasks.length,
                    })}
                  </div>
                </div>
                <div
                  className='progress-track'
                  style={{ height: 6, width: 80 }}
                >
                  <div
                    className='progress-fill done'
                    style={{
                      width: myTasks.length
                        ? `${Math.round((done.length / myTasks.length) * 100)}%`
                        : '0%',
                    }}
                  />
                </div>
              </div>
              <div className='py-1'>
                {myTasks.length === 0 ? (
                  <div className='empty-state py-10'>
                    <div style={{ fontSize: 32 }}>🎉</div>
                    <div className='text-primary font-bold'>
                      {t('homeToday.allDoneForToday')}
                    </div>
                  </div>
                ) : (
                  myTasks.map(task => (
                    <TaskRow
                      key={task.id}
                      task={task}
                      onComplete={makeTaskDone}
                    />
                  ))
                )}
              </div>
              <div
                className='border-line border-t px-4 py-3'
                style={{ borderColor: 'var(--line)' }}
              >
                <button
                  className='btn btn-ghost btn-sm text-brand w-full'
                  onClick={() => goto('today')}
                >
                  {t('homeToday.viewAllToday')} →
                </button>
              </div>
            </div>

            {/* Upcoming */}
            <div className='card overflow-hidden'>
              <div
                className='border-line border-b px-5 py-4'
                style={{ borderColor: 'var(--line)' }}
              >
                <div
                  className='text-primary font-bold'
                  style={{ fontSize: 15 }}
                >
                  {t('homeToday.comingUp')}
                </div>
              </div>
              <div className='py-1'>
                {upcomingList.map(task => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    onComplete={makeTaskDone}
                  />
                ))}
              </div>
              <div
                className='border-line border-t px-4 py-3'
                style={{ borderColor: 'var(--line)' }}
              >
                <button
                  className='btn btn-ghost btn-sm text-brand w-full'
                  onClick={() => goto('calendar')}
                >
                  {t('homeToday.openCalendar')} →
                </button>
              </div>
            </div>
          </div>

          {/* Right: Household + goals */}
          <div className='flex flex-col gap-6'>
            {/* Quick actions */}
            <div className='grid grid-cols-2 gap-2'>
              {[
                {
                  label: t('homeToday.newTask'),
                  icon: 'plus',
                  action: openCreate,
                },
                {
                  label: t('homeToday.shopping'),
                  icon: 'shopping',
                  action: () => goto('shopping'),
                },
                {
                  label: t('homeToday.calendar'),
                  icon: 'calendar',
                  action: () => goto('calendar'),
                },
                {
                  label: t('homeToday.routines'),
                  icon: 'routines',
                  action: () => goto('routines'),
                },
              ].map(a => (
                <button
                  key={a.label}
                  className='btn btn-secondary flex flex-col gap-1'
                  style={{
                    height: 64,
                    borderRadius: 'var(--r-lg)',
                    fontSize: 12,
                  }}
                  onClick={a.action}
                >
                  <FigmaIcon
                    name={a.icon}
                    size={18}
                    style={{ color: 'var(--brand)' }}
                  />
                  {a.label}
                </button>
              ))}
            </div>

            {/* Family goal */}
            {!isSolo && hasGoal && (
              <div className='card p-5'>
                <div className='mb-3 flex items-center justify-between'>
                  <div
                    className='text-primary font-bold'
                    style={{ fontSize: 14 }}
                  >
                    {t('homeToday.familyGoal')}
                  </div>
                  <span style={{ fontSize: 20 }}>🚀</span>
                </div>
                <div
                  className='text-primary mb-1 font-semibold'
                  style={{ fontSize: 13 }}
                >
                  {familyGoal.name}
                </div>
                <div
                  className='text-faint mb-2 flex justify-between'
                  style={{ fontSize: 12 }}
                >
                  <span>
                    {t('homeToday.goalProgress', {
                      progress: familyGoal.progress,
                      target: familyGoal.target,
                      unit: familyGoal.unit,
                    })}
                  </span>
                  <span className='font-bold' style={{ color: 'var(--brand)' }}>
                    {familyGoal.percent}%
                  </span>
                </div>
                <div className='progress-track' style={{ height: 8 }}>
                  <div
                    className='progress-fill'
                    style={{ width: `${familyGoal.percent}%` }}
                  />
                </div>
              </div>
            )}

            {/* Workload (family only) */}
            {!isSolo && workload.rows.length > 0 && (
              <div className='card p-5'>
                <div className='mb-3 flex items-center justify-between'>
                  <div
                    className='text-primary font-bold'
                    style={{ fontSize: 14 }}
                  >
                    {t('homeToday.householdWorkload')}
                  </div>
                  <button
                    className='btn btn-ghost btn-sm text-brand'
                    style={{ fontSize: 11 }}
                    onClick={() => goto('activity')}
                  >
                    {t('homeToday.details')}
                  </button>
                </div>
                {workload.rows.map(member => (
                  <WorkloadRow
                    key={member.id}
                    member={member}
                    max={maxCompleted}
                  />
                ))}
              </div>
            )}

            {/* Active projects */}
            {activeProjects.length > 0 && (
              <div className='card p-5'>
                <div className='mb-3 flex items-center justify-between'>
                  <div
                    className='text-primary font-bold'
                    style={{ fontSize: 14 }}
                  >
                    {t('homeToday.activeProjects')}
                  </div>
                  <button
                    className='btn btn-ghost btn-sm text-brand'
                    style={{ fontSize: 11 }}
                    onClick={() => goto('projects')}
                  >
                    {t('homeToday.allProjects')}
                  </button>
                </div>
                {activeProjects.map(project => (
                  <div
                    key={project.id}
                    className='border-line flex items-center gap-3 border-b py-2.5'
                    style={{ borderColor: 'var(--line)' }}
                  >
                    <div
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: 'var(--r-xs)',
                        background: project.color,
                        flexShrink: 0,
                      }}
                    />
                    <div className='min-w-0 flex-1'>
                      <div
                        className='text-primary truncate font-medium'
                        style={{ fontSize: 13 }}
                      >
                        {project.name}
                      </div>
                      {Number.isFinite(Number(project.progress)) && (
                        <div className='mt-0.5 flex items-center gap-2'>
                          <div
                            className='progress-track flex-1'
                            style={{ height: 4 }}
                          >
                            <div
                              className='progress-fill'
                              style={{
                                width: `${Number(project.progress)}%`,
                                background: project.color,
                              }}
                            />
                          </div>
                          <span
                            className='text-faint font-mono'
                            style={{ fontSize: 10 }}
                          >
                            {Number(project.progress)}%
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                <button
                  className='btn btn-ghost btn-sm text-brand mt-2 w-full'
                  onClick={openCreate}
                >
                  <FigmaIcon name='plus' size={13} />{' '}
                  {t('homeToday.newProject')}
                </button>
              </div>
            )}

            {/* Recent activity */}
            {!isSolo && activityFeed.events.length > 0 && (
              <div className='card p-5'>
                <div className='mb-3 flex items-center justify-between'>
                  <div
                    className='text-primary font-bold'
                    style={{ fontSize: 14 }}
                  >
                    {t('homeToday.recentActivity')}
                  </div>
                  <button
                    className='btn btn-ghost btn-sm text-brand'
                    style={{ fontSize: 11 }}
                    onClick={() => goto('activity')}
                  >
                    {t('homeToday.seeAll')}
                  </button>
                </div>
                {activityFeed.events.slice(0, 4).map(event => {
                  const actor = event.actor || currentMember
                  return (
                    <div
                      key={event.id}
                      className='border-line flex items-start gap-3 border-b py-2.5'
                      style={{ borderColor: 'var(--line)' }}
                    >
                      <div
                        className='avatar'
                        style={{
                          width: 26,
                          height: 26,
                          background: actor?.color || 'var(--brand)',
                          fontSize: 9,
                          flexShrink: 0,
                        }}
                      >
                        {actor?.initials}
                      </div>
                      <div className='min-w-0 flex-1'>
                        <div className='text-primary' style={{ fontSize: 12 }}>
                          {event.text}
                        </div>
                        <div className='text-faint' style={{ fontSize: 10 }}>
                          {activityFeed.relative(event)}
                        </div>
                      </div>
                      {event.points && (
                        <span
                          className='text-brand font-mono font-bold'
                          style={{ fontSize: 11 }}
                        >
                          +{event.points}
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

FocusHome.propTypes = {
  activeProjects: PropTypes.array,
  activityFeed: PropTypes.object.isRequired,
  currentMember: PropTypes.object,
  familyGoal: PropTypes.object.isRequired,
  hasGoal: PropTypes.bool.isRequired,
  isSolo: PropTypes.bool.isRequired,
  makeTaskDone: PropTypes.func.isRequired,
  myTasks: PropTypes.array.isRequired,
  now: PropTypes.instanceOf(Date).isRequired,
  overdue: PropTypes.array.isRequired,
  streak: PropTypes.number.isRequired,
  upcoming: PropTypes.array.isRequired,
  workload: PropTypes.object.isRequired,
}
FocusHome.defaultProps = {
  activeProjects: [],
  currentMember: null,
}
