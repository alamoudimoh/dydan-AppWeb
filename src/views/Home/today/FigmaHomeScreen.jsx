/* ─────────────────────────────────────────────
   PE2 home port. The inner FocusHome and QuestHome
   components are verbatim JS ports of
   Dydan-AppWebProductExperience02/src/screens/FocusHome.tsx
   and QuestHome.tsx, rendered with PE2 fixture data
   through the shared pe2 task-store ctx.

   PE2 maps `/` to QuestHome for the child persona and
   FocusHome otherwise (App.tsx: activeView === "quest"
   ? QuestHome : FocusHome); this wrapper keeps that
   dispatch so the route stays faithful.
───────────────────────────────────────────── */
import FigmaIcon from '../../../components/FigmaIcon'
import {
  ACTIVITY,
  formatDate,
  formatTimestamp,
  getChildTasks,
  getMemberById,
  getOverdueTasks,
  getTodayTasks,
  GOALS,
  MEMBERS,
  PROJECTS,
  REWARDS,
} from '../../../pe2/fixtures'
import {
  ConfirmDialog,
  CreateTaskModal,
  TaskDetailModal,
  ToastContainer,
  usePe2Tasks,
} from '../../../pe2/pe2Ui'

/* ─── FocusHome ─────────────────────────── */
function StatCard({ color, icon, label, sub, value }) {
  return (
    <div className='card p-5 flex flex-col gap-2'>
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
        className='font-bold text-primary'
        style={{
          fontSize: 28,
          lineHeight: 1,
          fontFamily: 'var(--font-mono)',
        }}
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

function FocusTaskRow({ onClick, onComplete, task }) {
  const assignee = task.assigneeId ? getMemberById(task.assigneeId) : null
  const statusColor =
    task.status === 'overdue'
      ? 'var(--sig-over)'
      : task.status === 'done'
        ? 'var(--sig-done)'
        : 'var(--t-faint)'
  const isDone = task.status === 'done'
  return (
    <div className={`task-row ${isDone ? 'done' : ''}`} onClick={onClick}>
      <button
        className={`task-check ${isDone ? 'checked' : ''}`}
        onClick={e => {
          e.stopPropagation()
          if (!isDone) onComplete(task.id)
        }}
        aria-label={isDone ? 'Completed' : 'Mark complete'}
      >
        {isDone && (
          <FigmaIcon name='check' size={11} style={{ color: 'white' }} />
        )}
      </button>
      <div className='flex-1 min-w-0'>
        <div
          className='task-title text-primary font-medium'
          style={{ fontSize: 14 }}
        >
          {task.title}
        </div>
        <div className='flex items-center gap-2 mt-0.5'>
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
              {formatDate(task.dueDate)}
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
      {assignee && (
        <div
          className='avatar flex-shrink-0'
          style={{
            width: 24,
            height: 24,
            background: assignee.avatarColor,
            fontSize: 9,
          }}
        >
          {assignee.initials}
        </div>
      )}
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

function WorkloadRow({ max, member }) {
  const pct = Math.round((member.tasksCompleted / max) * 100)
  return (
    <div className='flex items-center gap-3 py-2'>
      <div
        className='avatar'
        style={{
          width: 28,
          height: 28,
          background: member.avatarColor,
          fontSize: 10,
        }}
      >
        {member.initials}
      </div>
      <div className='flex-1 min-w-0'>
        <div className='flex justify-between mb-1'>
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
            style={{ width: `${pct}%`, background: member.avatarColor }}
          />
        </div>
      </div>
    </div>
  )
}

export function FocusHome({ ctx, isSolo, onComplete, tasks }) {
  const currentUser = MEMBERS.find(m => m.isCurrentUser)
  const todayTasks = getTodayTasks().map(
    t => tasks.find(x => x.id === t.id) || t,
  )
  const overdue = getOverdueTasks().map(
    t => tasks.find(x => x.id === t.id) || t,
  )
  const myTasks = todayTasks.filter(t => t.assigneeId === currentUser.id)
  const done = myTasks.filter(t => t.status === 'done')
  const upcoming = tasks.filter(t => t.status === 'upcoming').slice(0, 4)
  const maxCompleted = Math.max(...MEMBERS.map(m => m.tasksCompleted))
  const activeGoal = GOALS[0]

  return (
    <div style={{ maxWidth: 1080, margin: '0 auto', padding: '0 0 40px' }}>
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
            Friday, 15 August 2026
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
            Good morning, {currentUser.name}
          </h1>
          <p className='text-muted' style={{ fontSize: 14, margin: '6px 0 0' }}>
            {overdue.length > 0
              ? `${overdue.length} task${overdue.length > 1 ? 's' : ''} overdue — let's clear them first.`
              : `You're on track. ${done.length} of ${myTasks.length} tasks done today.`}
          </p>
        </div>
        <button
          className='btn btn-secondary hidden md:flex'
          onClick={ctx.openCreate}
        >
          <FigmaIcon name='plus' size={15} />
          New task
        </button>
      </div>

      <div className='px-4 md:px-7'>
        {/* Stats row */}
        <div
          className='grid gap-3 mb-6'
          style={{
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          }}
        >
          <StatCard
            label='Done today'
            value={`${done.length}/${myTasks.length}`}
            sub='your tasks'
            color='var(--sig-done)'
            icon='check'
          />
          <StatCard
            label='Overdue'
            value={overdue.length}
            sub='need attention'
            color='var(--sig-over)'
            icon='error'
          />
          <StatCard
            label='Upcoming'
            value={upcoming.length}
            sub='next 7 days'
            color='var(--brand)'
            icon='calendar'
          />
          {!isSolo && (
            <StatCard
              label='House streak'
              value={`${MEMBERS.find(m => m.isCurrentUser).streak}d`}
              sub='consecutive days'
              color='var(--accent-text)'
              icon='fire'
            />
          )}
        </div>

        {/* Overdue alert */}
        {overdue.length > 0 && (
          <div
            className='mb-5 rounded-lg p-4 flex items-start gap-3'
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
                {overdue.length} overdue task{overdue.length > 1 ? 's' : ''}
              </div>
              {overdue.map(t => (
                <div
                  key={t.id}
                  className='flex items-center gap-1 mt-1'
                  style={{ fontSize: 13, color: 'var(--sig-over)' }}
                >
                  <span>•</span> {t.title}
                  <span className='text-faint ms-1' style={{ fontSize: 11 }}>
                    {t.dueDate && formatDate(t.dueDate)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Two-column layout */}
        <div className='grid gap-6' style={{ gridTemplateColumns: '1fr 1fr' }}>
          {/* Left: Today's tasks */}
          <div className='flex flex-col gap-6'>
            {/* Today section */}
            <div className='card overflow-hidden'>
              <div
                className='flex items-center justify-between px-5 py-4 border-b border-line'
                style={{ borderColor: 'var(--line)' }}
              >
                <div>
                  <div
                    className='font-bold text-primary'
                    style={{ fontSize: 15 }}
                  >
                    Today
                  </div>
                  <div className='text-muted' style={{ fontSize: 12 }}>
                    {done.length} of {myTasks.length} completed
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
                    <div className='font-bold text-primary'>
                      All done for today!
                    </div>
                  </div>
                ) : (
                  myTasks.map(t => (
                    <FocusTaskRow
                      key={t.id}
                      task={t}
                      onClick={() => ctx.openTask(t)}
                      onComplete={onComplete}
                    />
                  ))
                )}
              </div>
              <div
                className='px-4 py-3 border-t border-line'
                style={{ borderColor: 'var(--line)' }}
              >
                <button
                  className='btn btn-ghost btn-sm text-brand w-full'
                  onClick={() => ctx.navigate('today')}
                >
                  View all today →
                </button>
              </div>
            </div>

            {/* Upcoming */}
            <div className='card overflow-hidden'>
              <div
                className='px-5 py-4 border-b border-line'
                style={{ borderColor: 'var(--line)' }}
              >
                <div
                  className='font-bold text-primary'
                  style={{ fontSize: 15 }}
                >
                  Coming up
                </div>
              </div>
              <div className='py-1'>
                {upcoming.map(t => (
                  <FocusTaskRow
                    key={t.id}
                    task={t}
                    onClick={() => ctx.openTask(t)}
                    onComplete={onComplete}
                  />
                ))}
              </div>
              <div
                className='px-4 py-3 border-t border-line'
                style={{ borderColor: 'var(--line)' }}
              >
                <button
                  className='btn btn-ghost btn-sm text-brand w-full'
                  onClick={() => ctx.navigate('calendar')}
                >
                  Open calendar →
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
                  label: 'New task',
                  icon: 'plus',
                  action: () => ctx.openCreate(),
                },
                {
                  label: 'Shopping',
                  icon: 'shopping',
                  action: () => ctx.navigate('shopping'),
                },
                {
                  label: 'Calendar',
                  icon: 'calendar',
                  action: () => ctx.navigate('calendar'),
                },
                {
                  label: 'Routines',
                  icon: 'routines',
                  action: () => ctx.navigate('routines'),
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
            {!isSolo && (
              <div className='card p-5'>
                <div className='flex items-center justify-between mb-3'>
                  <div
                    className='font-bold text-primary'
                    style={{ fontSize: 14 }}
                  >
                    Family goal
                  </div>
                  <span style={{ fontSize: 20 }}>{activeGoal.emoji}</span>
                </div>
                <div
                  className='text-primary font-semibold mb-1'
                  style={{ fontSize: 13 }}
                >
                  {activeGoal.name}
                </div>
                <div
                  className='flex justify-between text-faint mb-2'
                  style={{ fontSize: 12 }}
                >
                  <span>
                    {activeGoal.progress} of {activeGoal.target}{' '}
                    {activeGoal.unit}
                  </span>
                  <span className='font-bold' style={{ color: 'var(--brand)' }}>
                    {Math.round(
                      (activeGoal.progress / activeGoal.target) * 100,
                    )}
                    %
                  </span>
                </div>
                <div className='progress-track' style={{ height: 8 }}>
                  <div
                    className='progress-fill'
                    style={{
                      width: `${(activeGoal.progress / activeGoal.target) * 100}%`,
                    }}
                  />
                </div>
                {activeGoal.reward && (
                  <div
                    className='flex items-center gap-1 mt-3 text-faint'
                    style={{ fontSize: 12 }}
                  >
                    <FigmaIcon
                      name='gift'
                      size={12}
                      style={{ color: 'var(--sig-flag)' }}
                    />
                    Reward: {activeGoal.reward}
                  </div>
                )}
              </div>
            )}

            {/* Workload (family only) */}
            {!isSolo && (
              <div className='card p-5'>
                <div className='flex items-center justify-between mb-3'>
                  <div
                    className='font-bold text-primary'
                    style={{ fontSize: 14 }}
                  >
                    Household workload
                  </div>
                  <button
                    className='btn btn-ghost btn-sm text-brand'
                    style={{ fontSize: 11 }}
                    onClick={() => ctx.navigate('activity')}
                  >
                    Details
                  </button>
                </div>
                {MEMBERS.map(m => (
                  <WorkloadRow key={m.id} member={m} max={maxCompleted} />
                ))}
              </div>
            )}

            {/* Active projects */}
            <div className='card p-5'>
              <div className='flex items-center justify-between mb-3'>
                <div
                  className='font-bold text-primary'
                  style={{ fontSize: 14 }}
                >
                  Active projects
                </div>
                <button
                  className='btn btn-ghost btn-sm text-brand'
                  style={{ fontSize: 11 }}
                  onClick={() => ctx.navigate('projects')}
                >
                  All projects
                </button>
              </div>
              {PROJECTS.filter(p => p.status === 'active').map(p => (
                <div
                  key={p.id}
                  className='flex items-center gap-3 py-2.5 border-b border-line'
                  style={{ borderColor: 'var(--line)' }}
                >
                  <div
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: 'var(--r-xs)',
                      background: p.color,
                      flexShrink: 0,
                    }}
                  />
                  <div className='flex-1 min-w-0'>
                    <div
                      className='text-primary font-medium truncate'
                      style={{ fontSize: 13 }}
                    >
                      {p.name}
                    </div>
                    <div className='flex items-center gap-2 mt-0.5'>
                      <div
                        className='progress-track flex-1'
                        style={{ height: 4 }}
                      >
                        <div
                          className='progress-fill'
                          style={{
                            width: `${p.progress}%`,
                            background: p.color,
                          }}
                        />
                      </div>
                      <span
                        className='text-faint font-mono'
                        style={{ fontSize: 10 }}
                      >
                        {p.progress}%
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              <button
                className='btn btn-ghost btn-sm w-full mt-2 text-brand'
                onClick={ctx.openCreate}
              >
                <FigmaIcon name='plus' size={13} /> New project
              </button>
            </div>

            {/* Recent activity */}
            {!isSolo && (
              <div className='card p-5'>
                <div className='flex items-center justify-between mb-3'>
                  <div
                    className='font-bold text-primary'
                    style={{ fontSize: 14 }}
                  >
                    Recent activity
                  </div>
                  <button
                    className='btn btn-ghost btn-sm text-brand'
                    style={{ fontSize: 11 }}
                    onClick={() => ctx.navigate('activity')}
                  >
                    See all
                  </button>
                </div>
                {ACTIVITY.slice(0, 4).map(a => {
                  const actor = getMemberById(a.actorId)
                  return (
                    <div
                      key={a.id}
                      className='flex items-start gap-3 py-2.5 border-b border-line'
                      style={{ borderColor: 'var(--line)' }}
                    >
                      <div
                        className='avatar'
                        style={{
                          width: 26,
                          height: 26,
                          background: actor?.avatarColor || 'var(--brand)',
                          fontSize: 9,
                          flexShrink: 0,
                        }}
                      >
                        {actor?.initials}
                      </div>
                      <div className='flex-1 min-w-0'>
                        <div className='text-primary' style={{ fontSize: 12 }}>
                          {a.text}
                        </div>
                        <div className='text-faint' style={{ fontSize: 10 }}>
                          {formatTimestamp(a.timestamp)}
                        </div>
                      </div>
                      {a.points && (
                        <span
                          className='text-brand font-bold font-mono'
                          style={{ fontSize: 11 }}
                        >
                          +{a.points}
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

/* ─── QuestHome ─────────────────────────── */
function StreakPips({ streak, total = 14 }) {
  return (
    <div className='streak-pips flex-wrap'>
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`streak-pip ${i < streak - 1 ? 'active' : i === streak - 1 ? 'today' : ''}`}
          style={i === streak - 1 ? { background: 'var(--accent)' } : {}}
        />
      ))}
    </div>
  )
}

function QuestTaskCard({ onComplete, onOpen, task }) {
  const isDone = task.status === 'done'
  return (
    <div
      className='card p-4 cursor-pointer'
      style={{
        border: isDone ? '1px solid var(--sig-done)' : '1px solid var(--line)',
        background: isDone ? 'var(--sig-done-bg)' : 'var(--surface)',
        opacity: isDone ? 0.8 : 1,
      }}
      onClick={onOpen}
    >
      <div className='flex items-center gap-3'>
        <button
          className={`task-check ${isDone ? 'checked' : ''}`}
          style={{ width: 26, height: 26, borderRadius: 'var(--r-sm)' }}
          onClick={e => {
            e.stopPropagation()
            if (!isDone) onComplete(task.id)
          }}
          aria-label={isDone ? 'Done' : 'Complete'}
        >
          {isDone && (
            <FigmaIcon name='check' size={13} style={{ color: 'white' }} />
          )}
        </button>
        <div className='flex-1 min-w-0'>
          <div
            className='font-semibold'
            style={{
              fontSize: 14,
              color: isDone ? 'var(--sig-done)' : 'var(--t-primary)',
              textDecoration: isDone ? 'line-through' : 'none',
            }}
          >
            {task.title}
          </div>
          {task.subtasks && !isDone && (
            <div className='text-muted' style={{ fontSize: 11, marginTop: 2 }}>
              {task.subtasks.filter(s => s.done).length}/{task.subtasks.length}{' '}
              steps
            </div>
          )}
        </div>
        {task.points && (
          <div
            className='flex items-center gap-1 rounded-full px-2 py-1'
            style={{
              background: isDone ? 'var(--sig-done)' : 'var(--brand-faint)',
              color: isDone ? 'white' : 'var(--brand)',
              fontSize: 12,
              fontWeight: 800,
              fontFamily: 'var(--font-mono)',
            }}
          >
            <FigmaIcon name='star' size={10} />
            {task.points}
          </div>
        )}
      </div>
    </div>
  )
}

function RewardCard({ currentPoints, reward }) {
  const canRedeem = currentPoints >= reward.pointsCost
  const pct = Math.min(
    100,
    Math.round((currentPoints / reward.pointsCost) * 100),
  )
  return (
    <div className='reward-card' style={{ opacity: canRedeem ? 1 : 0.75 }}>
      <div style={{ fontSize: 28, lineHeight: 1 }}>{reward.icon}</div>
      <div className='font-bold text-primary' style={{ fontSize: 13 }}>
        {reward.name}
      </div>
      <div className='flex items-center justify-between'>
        <div
          className='flex items-center gap-1 text-brand'
          style={{
            fontSize: 12,
            fontWeight: 800,
            fontFamily: 'var(--font-mono)',
          }}
        >
          <FigmaIcon name='star' size={10} />
          {reward.pointsCost}
        </div>
        {canRedeem ? (
          <span className='badge bg-sig-done-bg text-sig-done'>Redeem!</span>
        ) : (
          <span className='text-faint' style={{ fontSize: 11 }}>
            {pct}%
          </span>
        )}
      </div>
      {!canRedeem && (
        <div className='progress-track' style={{ height: 4 }}>
          <div className='progress-fill' style={{ width: `${pct}%` }} />
        </div>
      )}
    </div>
  )
}

export function QuestHome({ ctx, isSolo, onComplete, tasks }) {
  const liam = MEMBERS.find(m => m.role === 'child')
  const persona = ctx.persona
  const currentMember =
    persona === 'child' ? liam : MEMBERS.find(m => m.isCurrentUser)
  const childTasks = getChildTasks().map(
    t => tasks.find(x => x.id === t.id) || t,
  )
  const todayTasks = childTasks.filter(
    t => t.dueDate === '2026-08-15' || t.status === 'done',
  )
  const done = todayTasks.filter(t => t.status === 'done')
  const todo = todayTasks.filter(t => t.status === 'todo')
  const progressPct = todayTasks.length
    ? Math.round((done.length / todayTasks.length) * 100)
    : 0
  const familyGoal = GOALS.find(g => g.isFamily)
  const personalGoal = GOALS.find(
    g => !g.isFamily && g.contributorIds?.includes('liam'),
  )

  return (
    <div style={{ maxWidth: 1080, margin: '0 auto', padding: '0 0 40px' }}>
      {/* Hero */}
      <div
        style={{
          background:
            'linear-gradient(135deg, var(--brand) 0%, color-mix(in srgb, var(--brand) 70%, var(--accent)) 100%)',
          padding: '28px 24px 40px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Background circles */}
        <div
          style={{
            position: 'absolute',
            width: 200,
            height: 200,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.06)',
            top: -60,
            right: -40,
          }}
        />
        <div
          style={{
            position: 'absolute',
            width: 100,
            height: 100,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.06)',
            bottom: -20,
            left: 20,
          }}
        />

        <div
          className='flex items-start justify-between mb-5'
          style={{ position: 'relative' }}
        >
          <div>
            <div
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: 'rgba(255,255,255,0.75)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                marginBottom: 6,
              }}
            >
              Quest Mode
            </div>
            <h1
              style={{
                fontSize: 24,
                fontWeight: 800,
                color: 'white',
                margin: 0,
                lineHeight: 1.2,
              }}
            >
              {persona === 'child' ? `Hey, ${liam.name}! 👋` : `Quest View`}
            </h1>
            <div
              style={{
                fontSize: 14,
                color: 'rgba(255,255,255,0.8)',
                marginTop: 4,
              }}
            >
              {done.length === todayTasks.length && todayTasks.length > 0
                ? 'All tasks done! Amazing! 🎉'
                : `${todo.length} quest${todo.length !== 1 ? 's' : ''} to complete today`}
            </div>
          </div>
          <div className='flex flex-col items-end gap-1'>
            <div
              style={{
                background: 'rgba(255,255,255,0.15)',
                borderRadius: 'var(--r-full)',
                padding: '4px 12px',
                display: 'flex',
                alignItems: 'center',
                gap: 5,
              }}
            >
              <FigmaIcon
                name='star'
                size={13}
                style={{ color: 'var(--accent)' }}
              />
              <span
                style={{
                  fontSize: 14,
                  fontWeight: 800,
                  color: 'white',
                  fontFamily: 'var(--font-mono)',
                }}
              >
                {currentMember.points}
              </span>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)' }}>
                pts
              </span>
            </div>
            <div
              style={{
                background: 'rgba(255,255,255,0.12)',
                borderRadius: 'var(--r-full)',
                padding: '4px 12px',
                display: 'flex',
                alignItems: 'center',
                gap: 5,
              }}
            >
              <FigmaIcon name='fire' size={13} style={{ color: '#FF8C42' }} />
              <span style={{ fontSize: 13, fontWeight: 800, color: 'white' }}>
                {currentMember.streak} day streak
              </span>
            </div>
          </div>
        </div>

        {/* Daily progress bar */}
        <div>
          <div
            className='flex justify-between mb-2'
            style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)' }}
          >
            <span>Today's progress</span>
            <span style={{ fontWeight: 800 }}>
              {done.length}/{todayTasks.length}
            </span>
          </div>
          <div
            style={{
              height: 12,
              background: 'rgba(255,255,255,0.2)',
              borderRadius: 99,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${progressPct}%`,
                background:
                  progressPct === 100 ? 'var(--sig-done)' : 'var(--accent)',
                borderRadius: 99,
                transition: 'width 0.5s ease',
              }}
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className='px-4 md:px-6' style={{ marginTop: -16 }}>
        {/* Streak card */}
        <div className='card p-4 mb-4 flex items-center gap-4'>
          <div style={{ fontSize: 32 }}>🔥</div>
          <div className='flex-1'>
            <div className='font-bold text-primary' style={{ fontSize: 14 }}>
              {currentMember.streak}-day streak!
            </div>
            <div
              className='text-muted'
              style={{ fontSize: 12, marginBottom: 6 }}
            >
              Keep it going — 8 more days to reach your goal
            </div>
            <StreakPips streak={currentMember.streak} total={20} />
          </div>
        </div>

        {/* Tasks for today */}
        <div className='mb-5'>
          <div className='flex items-center justify-between mb-3'>
            <h2
              className='text-primary font-bold'
              style={{ fontSize: 16, margin: 0 }}
            >
              My quests today
            </h2>
            <button
              className='btn btn-ghost btn-sm text-brand'
              onClick={() => ctx.navigate('today')}
            >
              See all
            </button>
          </div>

          {todo.length === 0 && done.length > 0 ? (
            <div className='card p-8 text-center'>
              <div style={{ fontSize: 48, marginBottom: 8 }}>🏆</div>
              <div className='font-bold text-primary' style={{ fontSize: 16 }}>
                All done! Amazing work!
              </div>
              <div
                className='text-muted'
                style={{ fontSize: 13, marginTop: 4 }}
              >
                You earned {done.reduce((acc, t) => acc + (t.points || 0), 0)}{' '}
                points today
              </div>
            </div>
          ) : (
            <div className='flex flex-col gap-2'>
              {todo.map(t => (
                <QuestTaskCard
                  key={t.id}
                  task={t}
                  onComplete={onComplete}
                  onOpen={() => ctx.openTask(t)}
                />
              ))}
              {done.length > 0 && (
                <>
                  <div className='section-label mt-2'>Completed</div>
                  {done.map(t => (
                    <QuestTaskCard
                      key={t.id}
                      task={t}
                      onComplete={onComplete}
                      onOpen={() => ctx.openTask(t)}
                    />
                  ))}
                </>
              )}
            </div>
          )}
        </div>

        {/* Goals section */}
        <div className='mb-5'>
          <div className='flex items-center justify-between mb-3'>
            <h2
              className='text-primary font-bold'
              style={{ fontSize: 16, margin: 0 }}
            >
              My goals
            </h2>
            <button
              className='btn btn-ghost btn-sm text-brand'
              onClick={() => ctx.navigate('goals')}
            >
              Details
            </button>
          </div>
          <div className='flex flex-col gap-3'>
            {personalGoal && (
              <div className='card p-4'>
                <div className='flex items-center gap-3 mb-3'>
                  <span style={{ fontSize: 24 }}>{personalGoal.emoji}</span>
                  <div>
                    <div
                      className='font-bold text-primary'
                      style={{ fontSize: 13 }}
                    >
                      {personalGoal.name}
                    </div>
                    <div className='text-muted' style={{ fontSize: 11 }}>
                      {personalGoal.progress}/{personalGoal.target}{' '}
                      {personalGoal.unit}
                    </div>
                  </div>
                  <div
                    className='ms-auto font-bold'
                    style={{
                      fontSize: 18,
                      color: 'var(--brand)',
                      fontFamily: 'var(--font-mono)',
                    }}
                  >
                    {Math.round(
                      (personalGoal.progress / personalGoal.target) * 100,
                    )}
                    %
                  </div>
                </div>
                <div className='progress-track' style={{ height: 8 }}>
                  <div
                    className='progress-fill'
                    style={{
                      width: `${(personalGoal.progress / personalGoal.target) * 100}%`,
                    }}
                  />
                </div>
                {personalGoal.reward && (
                  <div
                    className='flex items-center gap-1 mt-2 text-faint'
                    style={{ fontSize: 11 }}
                  >
                    <FigmaIcon
                      name='gift'
                      size={11}
                      style={{ color: 'var(--sig-flag)' }}
                    />
                    Reward: {personalGoal.reward}
                  </div>
                )}
              </div>
            )}
            {!isSolo && familyGoal && (
              <div
                className='card p-4'
                style={{
                  border: '1px solid var(--brand)',
                  background: 'var(--brand-faint)',
                }}
              >
                <div className='flex items-center gap-3 mb-3'>
                  <span style={{ fontSize: 24 }}>{familyGoal.emoji}</span>
                  <div>
                    <div
                      className='text-faint'
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                      }}
                    >
                      Family goal
                    </div>
                    <div
                      className='font-bold text-primary'
                      style={{ fontSize: 13 }}
                    >
                      {familyGoal.name}
                    </div>
                  </div>
                  <div
                    className='ms-auto font-bold text-brand'
                    style={{ fontSize: 18, fontFamily: 'var(--font-mono)' }}
                  >
                    {familyGoal.progress}/{familyGoal.target}
                  </div>
                </div>
                <div className='progress-track' style={{ height: 8 }}>
                  <div
                    className='progress-fill'
                    style={{
                      width: `${(familyGoal.progress / familyGoal.target) * 100}%`,
                    }}
                  />
                </div>
                <div className='flex gap-1 mt-3'>
                  {MEMBERS.map(m => (
                    <div
                      key={m.id}
                      className='avatar'
                      style={{
                        width: 22,
                        height: 22,
                        background: m.avatarColor,
                        fontSize: 8,
                      }}
                    >
                      {m.initials}
                    </div>
                  ))}
                  <span className='text-muted ms-2' style={{ fontSize: 11 }}>
                    All contributing
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Rewards */}
        <div className='mb-5'>
          <div className='flex items-center justify-between mb-3'>
            <h2
              className='text-primary font-bold'
              style={{ fontSize: 16, margin: 0 }}
            >
              Rewards
            </h2>
            <div
              className='flex items-center gap-1 text-brand font-bold'
              style={{ fontSize: 13, fontFamily: 'var(--font-mono)' }}
            >
              <FigmaIcon name='star' size={13} />
              {currentMember.points} pts
            </div>
          </div>
          <div className='grid grid-cols-2 gap-2 md:grid-cols-3'>
            {REWARDS.slice(0, 4).map(r => (
              <RewardCard
                key={r.id}
                reward={r}
                currentPoints={currentMember.points}
              />
            ))}
          </div>
        </div>

        {/* Recent activity */}
        {!isSolo && (
          <div className='card overflow-hidden mb-4'>
            <div
              className='px-4 py-3 border-b border-line font-bold text-primary'
              style={{ borderColor: 'var(--line)', fontSize: 14 }}
            >
              Recent activity
            </div>
            {ACTIVITY.slice(0, 5).map(a => {
              const actor = getMemberById(a.actorId)
              return (
                <div
                  key={a.id}
                  className='flex items-start gap-3 px-4 py-3 border-b border-line'
                  style={{ borderColor: 'var(--line)' }}
                >
                  <div
                    className='avatar'
                    style={{
                      width: 28,
                      height: 28,
                      background: actor?.avatarColor || 'var(--brand)',
                      fontSize: 10,
                      flexShrink: 0,
                    }}
                  >
                    {actor?.initials}
                  </div>
                  <div className='flex-1 min-w-0'>
                    <div className='text-primary' style={{ fontSize: 12 }}>
                      {a.text}
                    </div>
                    <div className='text-faint' style={{ fontSize: 10 }}>
                      {formatTimestamp(a.timestamp)}
                    </div>
                  </div>
                  <span style={{ fontSize: 16 }}>{a.icon}</span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

/* ─── Route wrapper ─────────────────────── */
const FigmaHomeScreen = () => {
  const {
    closeConfirm,
    completeTask,
    confirmDialog,
    createTask,
    ctx,
    deleteTask,
    openEditTask,
    reopenTask,
    showCreateTask,
    taskDetail,
    taskToEdit,
    tasks,
    toasts,
    updateTask,
  } = usePe2Tasks()

  // PE2 renders QuestHome for the child persona and FocusHome otherwise.
  const HomeScreen = ctx.persona === 'child' ? QuestHome : FocusHome

  return (
    <>
      <HomeScreen
        ctx={ctx}
        tasks={tasks}
        isSolo={ctx.persona === 'solo'}
        onComplete={completeTask}
      />
      {taskDetail && (
        <TaskDetailModal
          task={taskDetail}
          ctx={ctx}
          onComplete={completeTask}
          onDelete={deleteTask}
          onEdit={openEditTask}
          onReopen={reopenTask}
        />
      )}
      {showCreateTask && (
        <CreateTaskModal
          ctx={ctx}
          onCreated={(title, details) => createTask(title, details)}
        />
      )}
      {taskToEdit && (
        <CreateTaskModal
          ctx={ctx}
          taskToEdit={taskToEdit}
          onCreated={(title, details) =>
            updateTask(taskToEdit.id, title, details)
          }
        />
      )}
      {confirmDialog && (
        <ConfirmDialog config={confirmDialog} onClose={closeConfirm} />
      )}
      {toasts.length > 0 && <ToastContainer toasts={toasts} />}
    </>
  )
}

export default FigmaHomeScreen
