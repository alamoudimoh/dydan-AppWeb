import PropTypes from 'prop-types'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

import FigmaIcon from '../../../components/FigmaIcon'

const EMOJI = ['🎬', '🎮', '🕹️', '🌙', '🍕', '⭐']
const REWARD_CHIPS = 4

/**
 * Brand-gradient hero matching the QuestMode screen of the product
 * experience prototype: Quest Mode label, points + streak chips and a
 * daily progress bar for today's quests.
 */
function QuestHero({
  currentMember,
  doneQuests,
  pointsAvailable,
  questTotal,
  streak,
}) {
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
  currentMember: PropTypes.object,
  doneQuests: PropTypes.number.isRequired,
  pointsAvailable: PropTypes.number.isRequired,
  questTotal: PropTypes.number.isRequired,
  streak: PropTypes.number.isRequired,
}
QuestHero.defaultProps = { currentMember: null }

function QuestTaskCard({ onComplete, task }) {
  const { t } = useTranslation('common')
  const navigate = useNavigate()
  const isDone = task.status === 'done'
  return (
    <button
      type='button'
      className='w-full'
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--line)',
        borderRadius: 'var(--r-lg)',
        boxShadow: 'var(--shadow-sm)',
        overflow: 'hidden',
      }}
      onClick={() => navigate(`/chores/${task.choreId}`)}
    >
      <div
        className='flex items-center gap-3'
        style={{ alignItems: 'center', padding: 16 }}
      >
        <button
          type='button'
          className={`task-check flex-shrink-0 ${isDone ? 'checked' : ''}`}
          style={{
            width: 20,
            height: 20,
            borderWidth: 2,
            borderRadius: 'var(--r-sm)',
          }}
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
        <div className='min-w-0 flex-1 text-left'>
          <div
            className='text-primary truncate font-semibold'
            style={{ fontSize: 13 }}
          >
            {task.title}
          </div>
          {task.category && (
            <div
              className='text-faint mt-0.5 flex items-center gap-1.5'
              style={{ fontSize: 11 }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: task.categoryColor,
                }}
              />
              {task.category}
            </div>
          )}
        </div>
        <div
          className='flex flex-shrink-0 items-center gap-1'
          style={{ gap: 2 }}
        >
          {task.points > 0 && (
            <span
              className='text-accent font-mono font-bold'
              style={{ fontSize: 12 }}
            >
              +{task.points} ✦
            </span>
          )}
          <FigmaIcon
            name='chevron_right'
            size={16}
            style={{ color: 'var(--t-faint)' }}
          />
        </div>
      </div>
    </button>
  )
}

QuestTaskCard.propTypes = {
  onComplete: PropTypes.func.isRequired,
  task: PropTypes.object.isRequired,
}

const RewardCard = ({ openTask, reward }) => (
  <button
    type='button'
    className='reward-card'
    onClick={() => {
      if (reward.choreId) openTask(reward)
    }}
    aria-label={reward.name}
  >
    <div
      className='flex items-center justify-center'
      style={{
        width: 36,
        height: 36,
        fontSize: 18,
        borderRadius: 'var(--r-md)',
      }}
    >
      {reward.icon}
    </div>
    <div
      className='text-primary w-full truncate font-semibold'
      style={{ fontSize: 11 }}
    >
      {reward.name}
    </div>
    <div className='badge' style={{ padding: '1px 7px', fontSize: 10 }}>
      {reward.pointsCost}
    </div>
  </button>
)

RewardCard.propTypes = {
  openTask: PropTypes.func.isRequired,
  reward: PropTypes.object.isRequired,
}

export default function QuestHome({
  balance,
  currentMember,
  familyGoal,
  makeTaskDone,
  myDone,
  myTasks,
  pendingRequests,
  pointsAvailable,
  rewards,
  streak,
  todayKey,
  workload,
}) {
  const { t } = useTranslation('common')
  const navigate = useNavigate()
  const openCreate = () => navigate('/chores/create')
  const openTask = task => navigate(`/chores/${task.choreId}`)
  const gotoName = name =>
    navigate(
      name === 'all-tasks'
        ? '/chores'
        : name === 'calendar'
          ? '/calendar'
          : name === 'shopping'
            ? '/shopping'
            : '/',
    )

  const questTasks = myTasks.filter(task => task.dueDate === todayKey)
  const questsRemaining = questTasks.filter(
    task => task.status !== 'done',
  ).length
  const questTotal = questTasks.length
  const doneQuests = questTotal - questsRemaining
  const firstDone = myDone[0]
  const firstRewardClicked = rewards[0]

  return (
    <div style={{ padding: '0 0 40px' }}>
      <QuestHero
        currentMember={currentMember}
        doneQuests={doneQuests}
        pointsAvailable={pointsAvailable}
        questTotal={questTotal}
        streak={streak}
      />
      <div style={{ padding: '20px 16px 0', marginTop: -16 }}>
        {/* Today's quests */}
        <div
          className='section-label mb-3'
          style={{ letterSpacing: 'var(--ls-wide)' }}
        >
          {t('homeToday.todaysQuests', { count: questsRemaining })}
        </div>
        <div className='mb-6 flex flex-col gap-2'>
          {questTasks.length === 0 ? (
            <div className='empty-state py-10'>
              <div style={{ fontSize: 32 }}>✨</div>
              <div className='text-primary font-bold'>
                {t('homeToday.allQuestsComplete')}
              </div>
            </div>
          ) : (
            questTasks
              .slice(0, 8)
              .map(task => (
                <QuestTaskCard
                  key={task.id}
                  task={task}
                  onComplete={makeTaskDone}
                />
              ))
          )}
        </div>

        {questsRemaining > 0 && (
          <button
            className='btn btn-lg mb-6 w-full text-white'
            style={{ background: 'var(--brand)', borderRadius: 'var(--r-lg)' }}
            onClick={openCreate}
          >
            ✨ {t('homeToday.newQuest')}
          </button>
        )}
        {questsRemaining === 0 && questTasks.length > 0 && (
          <div
            className='mb-6 flex w-full items-center justify-center gap-2 rounded-lg p-3 text-center font-semibold'
            style={{
              background: 'var(--surface-2)',
              fontSize: 13,
              borderRadius: 'var(--r-lg)',
            }}
          >
            🎉 {t('homeToday.questsCompleted', { count: questTasks.length })}
          </div>
        )}

        {/* Family goal */}
        <div className='card mb-6 p-5'>
          <div className='mb-3 flex items-center justify-between'>
            <div className='text-primary font-bold' style={{ fontSize: 14 }}>
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

        {/* Family rewards */}
        <div
          className='section-label mb-3'
          style={{ letterSpacing: 'var(--ls-wide)' }}
        >
          {t('homeToday.familyRewards')}
        </div>
        <div className='mb-6 grid grid-cols-2 gap-2' style={{ gap: 8 }}>
          {(rewards.length > 0
            ? rewards
            : [
                {
                  id: 'empty',
                  name: t('homeToday.noRewardsYet'),
                  icon: '🎁',
                  pointsCost: '',
                },
              ]
          )
            .slice(0, REWARD_CHIPS)
            .map((reward, i) => (
              <RewardCard
                key={reward.id}
                reward={{
                  ...reward,
                  icon: reward.icon || EMOJI[i % EMOJI.length],
                }}
              />
            ))}
        </div>

        <button
          type='button'
          className='btn btn-secondary btn-lg mb-6 w-full'
          onClick={() => gotoName('shopping')}
        >
          🛒 {t('homeToday.shopNewRewards')}
        </button>

        {/* Points */}
        <div className='card mb-6 flex items-center justify-between p-5'>
          <div>
            <div className='text-faint' style={{ fontSize: 11 }}>
              {t('homeToday.availablePoints')}
            </div>
            <div className='font-mono font-bold' style={{ fontSize: 22 }}>
              {pointsAvailable}
              <span className='text-accent ms-1'>✦</span>
            </div>
            {pendingRequests.length > 0 && (
              <div className='text-faint mt-1' style={{ fontSize: 11 }}>
                {t('homeToday.pendingApproval', {
                  count: pendingRequests.length,
                })}
              </div>
            )}
          </div>
          {balance && (
            <div className='text-right'>
              <div className='text-faint' style={{ fontSize: 11 }}>
                {t('homeToday.balance')}
              </div>
              <div className='font-mono font-bold' style={{ fontSize: 18 }}>
                {balance.spendableBalance ?? balance.currentBalance ?? 0}
              </div>
            </div>
          )}
        </div>

        {/* Your goals */}
        <div
          className='section-label mb-3'
          style={{ letterSpacing: 'var(--ls-wide)' }}
        >
          {t('homeToday.myGoals')}
        </div>
        <div className='mb-6 flex flex-col gap-3'>
          {/* streak goal */}
          <div className='card flex items-center justify-between p-5'>
            <div>
              <div
                className='text-primary font-semibold'
                style={{ fontSize: 13 }}
              >
                🔥 {t('homeToday.streakGoal')}
              </div>
              <div className='text-faint' style={{ fontSize: 12 }}>
                {t('homeToday.streakProgress', { count: streak, target: 7 })}
              </div>
            </div>
            <div
              className='badge'
              style={{ fontSize: 11, background: 'var(--surface-2)' }}
            >
              {streak >= 7
                ? t('homeToday.done')
                : t('homeToday.daysShort', { count: Math.min(streak, 7) })}
            </div>
          </div>
          {/* parent-assigned goal */}
          {familyGoal.id !== null && (
            <div className='card flex items-center justify-between p-5'>
              <div>
                <div
                  className='text-primary font-semibold'
                  style={{ fontSize: 13 }}
                >
                  🎯 {familyGoal.name}
                </div>
                <div className='text-faint' style={{ fontSize: 12 }}>
                  {familyGoal.progress} / {familyGoal.target} {familyGoal.unit}
                </div>
              </div>
              <div
                className='badge'
                style={{ fontSize: 11, background: 'var(--surface-2)' }}
              >
                {familyGoal.percent}%
              </div>
            </div>
          )}
        </div>

        {/* First done / reward */}
        {(firstDone || firstRewardClicked) && (
          <div className='card mb-6 flex flex-col gap-4 p-5'>
            {firstDone && (
              <div>
                <div className='text-faint' style={{ fontSize: 11 }}>
                  {t('homeToday.firstDoneToday')}
                </div>
                <div
                  className='text-primary font-semibold'
                  style={{ fontSize: 13 }}
                >
                  {firstDone.title}
                </div>
              </div>
            )}
            {firstRewardClicked && (
              <div>
                <button
                  type='button'
                  className='flex items-center gap-2'
                  onClick={() => openTask(firstRewardClicked)}
                >
                  <span className='text-xl'>{firstRewardClicked.icon}</span>
                  {firstRewardClicked.name}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Workload */}
        {workload.rows.length > 0 && (
          <div className='card p-5'>
            <div
              className='text-primary mb-2 font-bold'
              style={{ fontSize: 14 }}
            >
              {t('homeToday.householdWorkload')}
            </div>
            {workload.rows
              .filter(
                member => member.tasksCompleted > 0 || member.tasksAssigned > 0,
              )
              .slice(0, 3)
              .map(member => (
                <div key={member.id} className='flex items-center gap-3 py-2'>
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
                  <div className='flex-1'>
                    <div
                      className='text-primary flex justify-between'
                      style={{ fontSize: 12 }}
                    >
                      <span>{member.name}</span>
                      <span
                        className='text-faint font-mono'
                        style={{ fontSize: 10 }}
                      >
                        {t('homeToday.doneTodayCount', {
                          count: member.tasksCompleted,
                        })}
                      </span>
                    </div>
                    <div className='progress-track mt-1' style={{ height: 4 }}>
                      <div
                        className='progress-fill'
                        style={{
                          width: `${Math.min(
                            100,
                            (member.tasksCompleted /
                              Math.max(1, workload.maxCompleted)) *
                              100,
                          )}%`,
                          background: member.color,
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  )
}

QuestHome.propTypes = {
  balance: PropTypes.object,
  currentMember: PropTypes.object,
  familyGoal: PropTypes.object.isRequired,
  makeTaskDone: PropTypes.func.isRequired,
  myDone: PropTypes.array.isRequired,
  myTasks: PropTypes.array.isRequired,
  pendingRequests: PropTypes.array.isRequired,
  pointsAvailable: PropTypes.number.isRequired,
  rewards: PropTypes.array.isRequired,
  streak: PropTypes.number.isRequired,
  todayKey: PropTypes.string.isRequired,
  workload: PropTypes.object.isRequired,
}
QuestHome.defaultProps = {
  balance: null,
  currentMember: null,
}
