import PropTypes from 'prop-types'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

import FigmaIcon from '../../../components/FigmaIcon'

const STREAK_PIPS_TOTAL = 20
const REWARD_CARDS = 4
const ACTIVITY_ROWS = 5

function StreakPips({ streak, total = STREAK_PIPS_TOTAL }) {
  return (
    <div className='streak-pips flex-wrap'>
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`streak-pip ${
            i < streak - 1 ? 'active' : i === streak - 1 ? 'today' : ''
          }`}
          style={i === streak - 1 ? { background: 'var(--accent)' } : {}}
        />
      ))}
    </div>
  )
}

StreakPips.propTypes = {
  streak: PropTypes.number.isRequired,
  total: PropTypes.number,
}

/**
 * Brand-gradient hero matching the QuestMode screen of the product
 * experience prototype: Quest Mode label, points + streak chips and a
 * daily progress bar for today's quests.
 */
function QuestHero({ doneQuests, pointsAvailable, questTotal, streak }) {
  const { t } = useTranslation('common')
  const progressPct =
    questTotal > 0 ? Math.round((doneQuests / questTotal) * 100) : 0
  const subtitle =
    questTotal === 0
      ? t('homeToday.questHeroNoQuests')
      : doneQuests === questTotal
        ? t('homeToday.questHeroAllDone')
        : t('homeToday.questHeroQuestsLeft', {
            count: questTotal - doneQuests,
          })
  return (
    <div
      style={{
        background:
          'linear-gradient(135deg, var(--brand) 0%, color-mix(in srgb, var(--brand) 70%, var(--accent)) 100%)',
        padding: '28px 24px 40px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Decorative circles */}
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
        className='mb-5 flex items-start justify-between'
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
            {t('homeToday.questMode')}
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
            {t('homeToday.questView')}
          </h1>
          <div
            style={{
              fontSize: 14,
              color: 'rgba(255,255,255,0.8)',
              marginTop: 4,
            }}
          >
            {subtitle}
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
              {pointsAvailable}
            </span>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)' }}>
              {t('homeToday.pts')}
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
              {t('homeToday.dayStreak', { count: streak })}
            </span>
          </div>
        </div>
      </div>

      {/* Daily progress */}
      <div>
        <div
          className='mb-2 flex justify-between'
          style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)' }}
        >
          <span>{t('homeToday.todayProgress')}</span>
          <span style={{ fontWeight: 800 }}>
            {doneQuests}/{questTotal}
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
  )
}

QuestHero.propTypes = {
  doneQuests: PropTypes.number.isRequired,
  pointsAvailable: PropTypes.number.isRequired,
  questTotal: PropTypes.number.isRequired,
  streak: PropTypes.number.isRequired,
}

function QuestTaskCard({ onComplete, onOpen, task }) {
  const { t } = useTranslation('common')
  const isDone = task.status === 'done'
  const subtasks =
    task.subtasks && task.subtasks.length > 0 ? task.subtasks : null
  const subtasksDone = subtasks
    ? subtasks.filter(subtask => subtask.done).length
    : 0
  return (
    <div
      className='card cursor-pointer p-4'
      style={{
        border: isDone ? '1px solid var(--sig-done)' : '1px solid var(--line)',
        background: isDone ? 'var(--sig-done-bg)' : 'var(--surface)',
        opacity: isDone ? 0.8 : 1,
      }}
      onClick={onOpen}
    >
      <div className='flex items-center gap-3'>
        <button
          type='button'
          className={`task-check ${isDone ? 'checked' : ''}`}
          style={{ width: 26, height: 26, borderRadius: 'var(--r-sm)' }}
          onClick={e => {
            e.stopPropagation()
            if (!isDone) onComplete(task)
          }}
          aria-label={
            isDone ? t('homeToday.completed') : t('homeToday.markComplete')
          }
        >
          {isDone && (
            <FigmaIcon name='check' size={13} style={{ color: 'white' }} />
          )}
        </button>
        <div className='min-w-0 flex-1'>
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
          {subtasks && !isDone && (
            <div className='text-muted' style={{ fontSize: 11, marginTop: 2 }}>
              {t('homeToday.stepsOf', {
                done: subtasksDone,
                total: subtasks.length,
              })}
            </div>
          )}
        </div>
        {task.points > 0 && (
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

QuestTaskCard.propTypes = {
  onComplete: PropTypes.func.isRequired,
  onOpen: PropTypes.func.isRequired,
  task: PropTypes.object.isRequired,
}

function RewardCard({ currentPoints, reward }) {
  const { t } = useTranslation('common')
  const canRedeem = currentPoints >= reward.pointsCost
  const pct = Math.min(
    100,
    Math.round((currentPoints / reward.pointsCost) * 100),
  )
  return (
    <div className='reward-card' style={{ opacity: canRedeem ? 1 : 0.75 }}>
      <div style={{ fontSize: 28, lineHeight: 1 }}>{reward.icon}</div>
      <div className='text-primary font-bold' style={{ fontSize: 13 }}>
        {reward.name}
      </div>
      <div className='flex items-center justify-between'>
        <div
          className='flex items-center gap-1'
          style={{
            color: 'var(--brand)',
            fontSize: 12,
            fontWeight: 800,
            fontFamily: 'var(--font-mono)',
          }}
        >
          <FigmaIcon name='star' size={10} />
          {reward.pointsCost}
        </div>
        {canRedeem ? (
          <span className='badge bg-sig-done-bg text-sig-done'>
            {t('homeToday.redeem')}
          </span>
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

RewardCard.propTypes = {
  currentPoints: PropTypes.number.isRequired,
  reward: PropTypes.object.isRequired,
}

export default function QuestHome({
  activityFeed,
  familyGoal,
  isSolo,
  makeTaskDone,
  members,
  myTasks,
  personalGoal,
  pointsAvailable,
  rewards,
  streak,
  todayKey,
}) {
  const { t } = useTranslation('common')
  const navigate = useNavigate()
  const openTask = task => navigate(`/chores/${task.choreId}`)

  // Tasks due today PLUS anything completed today (its dueDate already
  // advanced to the next occurrence), so the prototype's pending +
  // "Completed" sections both render.
  const questTasks = myTasks.filter(
    task => task.dueDate === todayKey || task.status === 'done',
  )
  const done = questTasks.filter(task => task.status === 'done')
  const todo = questTasks.filter(task => task.status !== 'done')
  const questTotal = questTasks.length
  const doneQuests = done.length
  const earnedToday = done.reduce(
    (total, task) => total + (task.points || 0),
    0,
  )

  return (
    <div style={{ padding: '0 0 40px' }}>
      <QuestHero
        doneQuests={doneQuests}
        pointsAvailable={pointsAvailable}
        questTotal={questTotal}
        streak={streak}
      />

      <div className='px-4 md:px-6' style={{ marginTop: -16 }}>
        {/* Streak card */}
        <div className='card mb-4 flex items-center gap-4 p-4'>
          <div style={{ fontSize: 32 }}>🔥</div>
          <div className='flex-1'>
            <div className='text-primary font-bold' style={{ fontSize: 14 }}>
              {t('homeToday.questStreakTitle', { count: streak })}
            </div>
            <div
              className='text-muted'
              style={{ fontSize: 12, marginBottom: 6 }}
            >
              {t('homeToday.questStreakGoalHint')}
            </div>
            <StreakPips streak={streak} />
          </div>
        </div>

        {/* My quests today */}
        <div className='mb-5'>
          <div className='mb-3 flex items-center justify-between'>
            <h2
              className='text-primary font-bold'
              style={{ fontSize: 16, margin: 0 }}
            >
              {t('homeToday.myQuestsToday')}
            </h2>
            <button
              className='btn btn-ghost btn-sm text-brand'
              onClick={() => navigate('/today')}
            >
              {t('homeToday.seeAll')}
            </button>
          </div>

          {todo.length === 0 && done.length > 0 ? (
            <div className='card p-8 text-center'>
              <div style={{ fontSize: 48, marginBottom: 8 }}>🏆</div>
              <div className='text-primary font-bold' style={{ fontSize: 16 }}>
                {t('homeToday.allDoneAmazing')}
              </div>
              <div
                className='text-muted'
                style={{ fontSize: 13, marginTop: 4 }}
              >
                {t('homeToday.earnedPointsToday', { count: earnedToday })}
              </div>
            </div>
          ) : (
            <div className='flex flex-col gap-2'>
              {todo.map(task => (
                <QuestTaskCard
                  key={task.id}
                  task={task}
                  onComplete={makeTaskDone}
                  onOpen={() => openTask(task)}
                />
              ))}
              {done.length > 0 && (
                <>
                  <div className='section-label mt-2'>
                    {t('homeToday.completed')}
                  </div>
                  {done.map(task => (
                    <QuestTaskCard
                      key={task.id}
                      task={task}
                      onComplete={makeTaskDone}
                      onOpen={() => openTask(task)}
                    />
                  ))}
                </>
              )}
            </div>
          )}
        </div>

        {/* My goals */}
        <div className='mb-5'>
          <div className='mb-3 flex items-center justify-between'>
            <h2
              className='text-primary font-bold'
              style={{ fontSize: 16, margin: 0 }}
            >
              {t('homeToday.myGoals')}
            </h2>
            <button
              className='btn btn-ghost btn-sm text-brand'
              onClick={() => navigate('/family')}
            >
              {t('homeToday.details')}
            </button>
          </div>
          <div className='flex flex-col gap-3'>
            {personalGoal && (
              <div className='card p-4'>
                <div className='mb-3 flex items-center gap-3'>
                  <span style={{ fontSize: 24 }}>{personalGoal.emoji}</span>
                  <div>
                    <div
                      className='text-primary font-bold'
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
                    {personalGoal.percent}%
                  </div>
                </div>
                <div className='progress-track' style={{ height: 8 }}>
                  <div
                    className='progress-fill'
                    style={{ width: `${personalGoal.percent}%` }}
                  />
                </div>
                {personalGoal.reward && (
                  <div
                    className='text-faint mt-2 flex items-center gap-1'
                    style={{ fontSize: 11 }}
                  >
                    <FigmaIcon
                      name='gift'
                      size={11}
                      style={{ color: 'var(--sig-flag)' }}
                    />
                    {t('homeToday.rewardLabel')}: {personalGoal.reward}
                  </div>
                )}
              </div>
            )}
            {!isSolo && familyGoal.id !== null && (
              <div
                className='card p-4'
                style={{
                  border: '1px solid var(--brand)',
                  background: 'var(--brand-faint)',
                }}
              >
                <div className='mb-3 flex items-center gap-3'>
                  <span style={{ fontSize: 24 }}>
                    {familyGoal.emoji || '🚀'}
                  </span>
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
                      {t('homeToday.familyGoal')}
                    </div>
                    <div
                      className='text-primary font-bold'
                      style={{ fontSize: 13 }}
                    >
                      {familyGoal.name}
                    </div>
                  </div>
                  <div
                    className='ms-auto text-brand font-bold'
                    style={{ fontSize: 18, fontFamily: 'var(--font-mono)' }}
                  >
                    {familyGoal.progress}/{familyGoal.target}
                  </div>
                </div>
                <div className='progress-track' style={{ height: 8 }}>
                  <div
                    className='progress-fill'
                    style={{ width: `${familyGoal.percent}%` }}
                  />
                </div>
                <div className='mt-3 flex gap-1'>
                  {members.slice(0, 6).map(member => (
                    <div
                      key={member.id}
                      className='avatar'
                      style={{
                        width: 22,
                        height: 22,
                        background: member.color,
                        fontSize: 8,
                      }}
                    >
                      {member.initials}
                    </div>
                  ))}
                  <span className='text-muted ms-2' style={{ fontSize: 11 }}>
                    {t('homeToday.allContributing')}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Rewards */}
        <div className='mb-5'>
          <div className='mb-3 flex items-center justify-between'>
            <h2
              className='text-primary font-bold'
              style={{ fontSize: 16, margin: 0 }}
            >
              {t('homeToday.rewards')}
            </h2>
            <div
              className='flex items-center gap-1 font-bold'
              style={{
                color: 'var(--brand)',
                fontSize: 13,
                fontFamily: 'var(--font-mono)',
              }}
            >
              <FigmaIcon name='star' size={13} />
              {pointsAvailable} {t('homeToday.pts')}
            </div>
          </div>
          {rewards.length > 0 && (
            <div className='grid grid-cols-2 gap-2 md:grid-cols-3'>
              {rewards.slice(0, REWARD_CARDS).map(reward => (
                <RewardCard
                  key={reward.id}
                  reward={reward}
                  currentPoints={pointsAvailable}
                />
              ))}
            </div>
          )}
        </div>

        {/* Recent activity */}
        {!isSolo && activityFeed.events.length > 0 && (
          <div className='card mb-4 overflow-hidden'>
            <div
              className='border-line border-b px-4 py-3 font-bold'
              style={{ borderColor: 'var(--line)', fontSize: 14 }}
            >
              {t('homeToday.recentActivity')}
            </div>
            {activityFeed.events.slice(0, ACTIVITY_ROWS).map(event => {
              const actor = event.actor
              return (
                <div
                  key={event.id}
                  className='flex items-start gap-3 border-b border-line px-4 py-3'
                  style={{ borderColor: 'var(--line)' }}
                >
                  <div
                    className='avatar'
                    style={{
                      width: 28,
                      height: 28,
                      background: actor?.color || 'var(--brand)',
                      fontSize: 10,
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
                  <span style={{ fontSize: 16 }}>✅</span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

QuestHome.propTypes = {
  activityFeed: PropTypes.object.isRequired,
  familyGoal: PropTypes.object.isRequired,
  isSolo: PropTypes.bool.isRequired,
  makeTaskDone: PropTypes.func.isRequired,
  members: PropTypes.array.isRequired,
  myTasks: PropTypes.array.isRequired,
  personalGoal: PropTypes.object,
  pointsAvailable: PropTypes.number.isRequired,
  rewards: PropTypes.array.isRequired,
  streak: PropTypes.number.isRequired,
  todayKey: PropTypes.string.isRequired,
}
QuestHome.defaultProps = { personalGoal: null }
