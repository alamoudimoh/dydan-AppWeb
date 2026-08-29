import PropTypes from 'prop-types'
import { useNavigate } from 'react-router-dom'

import FigmaIcon from '../../../components/FigmaIcon'

const EMOJI = ['🎬', '🎮', '🕹️', '🌙', '🍕', '⭐']
const QUEST_TOTAL = 14
const REWARD_CHIPS = 4

function StreakPips({ current, total }) {
  const filled = Math.min(current, total)
  return (
    <div className='flex items-center' style={{ gap: 3 }}>
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          className='streak-pips'
          style={{
            width: 7,
            height: 7,
            borderRadius: '50%',
            background: i < filled ? 'var(--accent-text)' : 'var(--surface-2)',
          }}
        />
      ))}
    </div>
  )
}

StreakPips.propTypes = {
  current: PropTypes.number.isRequired,
  total: PropTypes.number,
}
StreakPips.defaultProps = { total: QUEST_TOTAL }

function QuestHero({ currentMember, streak }) {
  return (
    <div
      className='mb-6 flex flex-col gap-4 rounded-2xl p-5 text-white'
      style={{
        background:
          'linear-gradient(135deg, #6A40E4 0%, #8B5CF6 45%, #C084FC 100%)',
        borderRadius: 'var(--r-2xl)',
      }}
    >
      <div>
        <div style={{ fontSize: 26, fontWeight: 800, lineHeight: 1.15 }}>
          {EMOJI[streak % EMOJI.length]} Keep it up, {currentMember?.name}!
        </div>
        <div style={{ fontSize: 13, opacity: 0.85, marginTop: 6 }}>
          {streak === 0
            ? 'Start your streak by finishing a quest today.'
            : `${streak}-day streak — you're doing great!`}
        </div>
      </div>
      <div
        className='flex items-center justify-between rounded-xl px-4 py-2.5'
        style={{ background: 'rgba(255,255,255,0.12)' }}
      >
        <div className='flex flex-col'>
          <span style={{ fontSize: 11, opacity: 0.8 }}>Daily streak</span>
          <span style={{ fontSize: 20, fontWeight: 800 }}>{streak} days</span>
        </div>
        <StreakPips current={streak} total={QUEST_TOTAL} />
      </div>
    </div>
  )
}

QuestHero.propTypes = {
  currentMember: PropTypes.object,
  streak: PropTypes.number.isRequired,
}
QuestHero.defaultProps = { currentMember: null }

function QuestTaskCard({ onComplete, task }) {
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
          aria-label={isDone ? 'Completed' : 'Mark complete'}
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
  const firstDone = myDone[0]
  const firstRewardClicked = rewards[0]

  return (
    <div style={{ padding: '0 0 40px' }}>
      <div style={{ padding: '20px 16px 0' }}>
        <QuestHero currentMember={currentMember} streak={streak} />

        {/* Today's quests */}
        <div
          className='section-label mb-3'
          style={{ letterSpacing: 'var(--ls-wide)' }}
        >
          Today&apos;s quests ·{questsRemaining} left
        </div>
        <div className='mb-6 flex flex-col gap-2'>
          {questTasks.length === 0 ? (
            <div className='empty-state py-10'>
              <div style={{ fontSize: 32 }}>✨</div>
              <div className='text-primary font-bold'>All quests complete!</div>
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
            ✨ New quest
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
            🎉 All done! {questTasks.length} quests completed — huge day!
          </div>
        )}

        {/* Family goal */}
        <div className='card mb-6 p-5'>
          <div className='mb-3 flex items-center justify-between'>
            <div className='text-primary font-bold' style={{ fontSize: 14 }}>
              Family goal
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
              {familyGoal.progress} of {familyGoal.target} {familyGoal.unit}
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
          Family rewards
        </div>
        <div className='mb-6 grid grid-cols-2 gap-2' style={{ gap: 8 }}>
          {(rewards.length > 0
            ? rewards
            : [
                {
                  id: 'empty',
                  name: 'No rewards yet',
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
          🛒 Shop new rewards
        </button>

        {/* Points */}
        <div className='card mb-6 flex items-center justify-between p-5'>
          <div>
            <div className='text-faint' style={{ fontSize: 11 }}>
              Available points
            </div>
            <div className='font-mono font-bold' style={{ fontSize: 22 }}>
              {pointsAvailable}
              <span className='text-accent ms-1'>✦</span>
            </div>
            {pendingRequests.length > 0 && (
              <div className='text-faint mt-1' style={{ fontSize: 11 }}>
                {pendingRequests.length} pending approval
              </div>
            )}
          </div>
          {balance && (
            <div className='text-right'>
              <div className='text-faint' style={{ fontSize: 11 }}>
                Balance
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
          My goals
        </div>
        <div className='mb-6 flex flex-col gap-3'>
          {/* streak goal */}
          <div className='card flex items-center justify-between p-5'>
            <div>
              <div
                className='text-primary font-semibold'
                style={{ fontSize: 13 }}
              >
                🔥 Streak goal
              </div>
              <div className='text-faint' style={{ fontSize: 12 }}>
                {streak} / 7 days
              </div>
            </div>
            <div
              className='badge'
              style={{ fontSize: 11, background: 'var(--surface-2)' }}
            >
              {streak >= 7 ? 'Done' : `${Math.min(streak, 7)}d`}
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
                  First done today
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
              Household workload
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
                        {member.tasksCompleted} done today
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
