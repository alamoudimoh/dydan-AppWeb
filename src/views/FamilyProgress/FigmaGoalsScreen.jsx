import '../../styles/screenExperience.css'

import PropTypes from 'prop-types'
import { useTranslation } from 'react-i18next'

import FigmaIcon from '../../components/FigmaIcon'

const goalEmoji = goal => {
  if (goal.metricType === 'POINTS_EARNED') return '⭐'
  if (goal.metricType === 'CATEGORY_COMPLETIONS') return '🎯'
  return '✅'
}

const goalUnit = (goal, t) => {
  if (goal.unit) return goal.unit
  if (goal.metricType === 'POINTS_EARNED') return t('familyProgress.points')
  return t('familyProgress.tasks')
}

export default function FigmaGoalsScreen({
  balance,
  canManageGoals,
  canManageRewards,
  embedded = false,
  goals,
  onArchiveGoal,
  onCreateGoal,
  onCreateReward,
  onEditGoal,
  onRequestReward,
  onViewHistory,
  rewards,
  streak,
  tasksCompleted,
}) {
  const { t } = useTranslation('common')
  const availableRewards = rewards.filter(
    reward =>
      Number(reward.costPoints) <= Number(balance.spendableBalance || 0),
  )

  return (
    <div
      style={
        embedded
          ? { maxWidth: 800, margin: '0 auto', padding: 0 }
          : { maxWidth: 800, margin: '0 auto', padding: '0 0 40px' }
      }
    >
      {!embedded && (
        <div className='screen-page-header page-header pb-5'>
          <div>
            <h1
              className='text-primary'
              style={{ fontSize: 24, fontWeight: 800, margin: 0 }}
            >
              {t('familyProgress.goalsProgressTitle')}
            </h1>
            <div className='text-muted' style={{ fontSize: 13, marginTop: 4 }}>
              {t('familyProgress.goalsProgressSubtitle')}
            </div>
          </div>
          {canManageGoals && (
            <button
              className='screen-page-action btn btn-primary'
              onClick={onCreateGoal}
              type='button'
            >
              <FigmaIcon name='plus' size={14} />
              {t('familyProgress.newGoal')}
            </button>
          )}
        </div>
      )}

      <div className={embedded ? '' : 'px-4 md:px-7'}>
        <div
          className='card mb-5 p-5'
          style={{
            background:
              'linear-gradient(135deg, var(--brand-faint) 0%, var(--accent-bg) 100%)',
            border: '1px solid var(--brand)',
          }}
        >
          <div className='flex flex-wrap items-center justify-between gap-4'>
            <div>
              <div className='text-muted' style={{ fontSize: 12 }}>
                {t('familyProgress.memberPoints')}
              </div>
              <div className='mt-1 flex items-center gap-2'>
                <FigmaIcon
                  name='star'
                  size={22}
                  style={{ color: 'var(--brand)' }}
                />
                <span
                  className='text-primary font-mono'
                  style={{ fontSize: 30, fontWeight: 800 }}
                >
                  {balance.currentBalance || 0}
                </span>
              </div>
              <div
                className='text-muted'
                style={{ fontSize: 12, marginTop: 4 }}
              >
                {t('familyProgress.streakAndTasksCompleted', {
                  streak: streak || 0,
                  tasks: tasksCompleted || 0,
                })}
              </div>
            </div>
            <div className='screen-goal-summary-actions text-end'>
              <div
                className='text-primary font-semibold'
                style={{ fontSize: 13 }}
              >
                {availableRewards.length
                  ? t('familyProgress.rewardsAvailable', {
                      count: availableRewards.length,
                    })
                  : t('familyProgress.rewardsAwait')}
              </div>
              <button
                className='btn btn-secondary btn-sm mt-2'
                onClick={onViewHistory}
                type='button'
              >
                {t('familyProgress.viewHistory')}
              </button>
            </div>
          </div>
        </div>

        <div className='screen-section-header mb-3'>
          <h2
            className='text-primary'
            style={{ fontSize: 17, fontWeight: 800, margin: 0 }}
          >
            {t('familyProgress.familyGoals')}
          </h2>
          {embedded && canManageGoals && goals.length > 0 && (
            <button
              className='btn btn-primary btn-sm'
              onClick={onCreateGoal}
              type='button'
            >
              <FigmaIcon name='plus' size={13} />
              {t('familyProgress.newGoal')}
            </button>
          )}
        </div>

        {goals.length === 0 ? (
          <div className='empty-state card'>
            <div style={{ fontSize: 40 }}>🎯</div>
            <div className='text-primary font-bold'>
              {t('familyProgress.noGoals')}
            </div>
            {canManageGoals && (
              <button
                className='btn btn-primary btn-sm'
                onClick={onCreateGoal}
                type='button'
              >
                <FigmaIcon name='plus' size={13} />
                {t('familyProgress.newGoal')}
              </button>
            )}
          </div>
        ) : (
          <div className='flex flex-col gap-3'>
            {goals.map(goal => (
              <div key={goal.id} className='card p-5'>
                <div className='flex gap-4'>
                  <div style={{ fontSize: 28, lineHeight: 1 }}>
                    {goalEmoji(goal)}
                  </div>
                  <div className='min-w-0 flex-1'>
                    <div className='flex items-start justify-between gap-3'>
                      <div className='screen-goal-copy min-w-0'>
                        <div
                          className='text-primary font-bold'
                          style={{ fontSize: 15 }}
                        >
                          {goal.name}
                        </div>
                        {goal.description && (
                          <div
                            className='text-muted'
                            style={{ fontSize: 12, marginTop: 2 }}
                          >
                            {goal.description}
                          </div>
                        )}
                      </div>
                      <span className='badge bg-brand-faint text-brand'>
                        {Math.round(goal.percent || 0)}%
                      </span>
                    </div>
                    <div className='mt-3 flex items-center justify-between gap-3'>
                      <span className='text-muted' style={{ fontSize: 12 }}>
                        {goal.progress || 0}/{goal.target} {goalUnit(goal, t)}
                      </span>
                      <span className='text-faint' style={{ fontSize: 11 }}>
                        {t('familyProgress.percentComplete', {
                          count: Math.round(goal.percent || 0),
                        })}
                      </span>
                    </div>
                    <div
                      aria-label={t('familyProgress.goalProgressLabel', {
                        name: goal.name,
                      })}
                      aria-valuemax={100}
                      aria-valuemin={0}
                      aria-valuenow={Math.round(goal.percent || 0)}
                      className='progress-track mt-2'
                      role='progressbar'
                      style={{ height: 7 }}
                    >
                      <div
                        className='progress-fill'
                        style={{
                          width: `${Math.min(100, Math.max(0, goal.percent || 0))}%`,
                        }}
                      />
                    </div>
                    {canManageGoals && goal.status === 'ACTIVE' && (
                      <div className='screen-routine-actions mt-3'>
                        <button
                          className='btn btn-ghost btn-sm'
                          onClick={() => onEditGoal(goal)}
                          type='button'
                        >
                          <FigmaIcon name='edit' size={13} />
                          {t('edit')}
                        </button>
                        <button
                          className='btn btn-ghost btn-sm text-sig-over'
                          onClick={() => onArchiveGoal(goal)}
                          type='button'
                        >
                          <FigmaIcon name='trash' size={13} />
                          {t('familyProgress.archive')}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className='screen-section-header mb-3 mt-6'>
          <h2
            className='text-primary'
            style={{ fontSize: 17, fontWeight: 800, margin: 0 }}
          >
            {t('navigation.rewards')}
          </h2>
          {canManageRewards && (
            <button
              className='btn btn-secondary btn-sm'
              onClick={onCreateReward}
              type='button'
            >
              <FigmaIcon name='plus' size={13} />
              {t('familyProgress.createNewReward')}
            </button>
          )}
        </div>

        {rewards.length === 0 ? (
          <div className='empty-state card'>
            <div style={{ fontSize: 40 }}>🎁</div>
            <div className='text-primary font-bold'>
              {t('rewards.noRewards')}
            </div>
          </div>
        ) : (
          <div
            className='grid gap-3'
            style={{
              gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
            }}
          >
            {rewards.map(reward => {
              const affordable =
                Number(reward.costPoints) <=
                Number(balance.spendableBalance || 0)
              const percent = Math.min(
                100,
                Math.round(
                  (Number(balance.spendableBalance || 0) /
                    Math.max(1, Number(reward.costPoints))) *
                    100,
                ),
              )
              return (
                <div key={reward.id} className='card p-4'>
                  <div style={{ fontSize: 25 }}>{reward.icon || '🎁'}</div>
                  <div
                    className='text-primary mt-2 font-bold'
                    style={{ fontSize: 14 }}
                  >
                    {reward.name}
                  </div>
                  {reward.description && (
                    <div className='text-muted mt-1' style={{ fontSize: 12 }}>
                      {reward.description}
                    </div>
                  )}
                  <div
                    className='text-brand mt-3 flex items-center gap-1 font-semibold'
                    style={{ fontSize: 13 }}
                  >
                    <FigmaIcon name='star' size={14} />
                    {reward.costPoints}
                  </div>
                  {affordable ? (
                    <button
                      className='btn btn-primary btn-sm mt-3 w-full'
                      onClick={() => onRequestReward(reward)}
                      type='button'
                    >
                      {t('rewards.requestReward')}
                    </button>
                  ) : (
                    <>
                      <div className='text-faint mt-3' style={{ fontSize: 11 }}>
                        {percent}%
                      </div>
                      <div
                        aria-label={reward.name}
                        aria-valuemax={100}
                        aria-valuemin={0}
                        aria-valuenow={percent}
                        className='progress-track mt-1'
                        role='progressbar'
                        style={{ height: 5 }}
                      >
                        <div
                          className='progress-fill'
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

FigmaGoalsScreen.propTypes = {
  balance: PropTypes.shape({
    currentBalance: PropTypes.number,
    spendableBalance: PropTypes.number,
  }).isRequired,
  canManageGoals: PropTypes.bool.isRequired,
  canManageRewards: PropTypes.bool.isRequired,
  embedded: PropTypes.bool,
  goals: PropTypes.array.isRequired,
  onArchiveGoal: PropTypes.func.isRequired,
  onCreateGoal: PropTypes.func.isRequired,
  onCreateReward: PropTypes.func.isRequired,
  onEditGoal: PropTypes.func.isRequired,
  onRequestReward: PropTypes.func.isRequired,
  onViewHistory: PropTypes.func.isRequired,
  rewards: PropTypes.array.isRequired,
  streak: PropTypes.number,
  tasksCompleted: PropTypes.number.isRequired,
}
