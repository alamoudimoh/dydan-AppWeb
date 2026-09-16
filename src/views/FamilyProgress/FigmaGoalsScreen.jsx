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
        {/* Points summary */}
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
              <div
                className='text-muted'
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.07em',
                }}
              >
                {t('familyProgress.memberPoints')}
              </div>
              <div className='mt-1 flex items-center gap-2'>
                <FigmaIcon
                  name='star'
                  size={24}
                  style={{ color: 'var(--brand)' }}
                />
                <span
                  className='text-primary font-mono'
                  style={{ fontSize: 36, fontWeight: 800, lineHeight: 1 }}
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
            <div className='screen-goal-summary-actions flex flex-col items-end gap-2'>
              {availableRewards.length > 0 ? (
                <div
                  className='badge bg-sig-done-bg text-sig-done'
                  style={{ padding: '8px 16px', fontSize: 13 }}
                >
                  🎉{' '}
                  {t('familyProgress.rewardsAvailable', {
                    count: availableRewards.length,
                  })}
                </div>
              ) : (
                <div className='text-muted' style={{ fontSize: 12 }}>
                  {t('familyProgress.rewardsAwait')}
                </div>
              )}
              <button
                className='btn btn-secondary btn-sm'
                onClick={onViewHistory}
                type='button'
              >
                {t('familyProgress.viewHistory')}
              </button>
            </div>
          </div>
        </div>

        {/* Family goals */}
        <div className='screen-section-header mb-3'>
          <h2
            className='text-primary'
            style={{ fontSize: 16, fontWeight: 800, margin: 0 }}
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
                <div className='mb-4 flex items-start justify-between gap-3'>
                  <div className='flex items-center gap-3'>
                    <span style={{ fontSize: 32, lineHeight: 1 }}>
                      {goalEmoji(goal)}
                    </span>
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
                  </div>
                  <div className='flex-shrink-0 text-end'>
                    <div
                      className='text-primary font-bold'
                      style={{
                        fontSize: 22,
                        fontFamily: 'var(--font-mono)',
                      }}
                    >
                      {Math.round(goal.percent || 0)}%
                    </div>
                    <div className='text-faint' style={{ fontSize: 11 }}>
                      {goal.progress || 0}/{goal.target} {goalUnit(goal, t)}
                    </div>
                  </div>
                </div>
                <div
                  aria-label={t('familyProgress.goalProgressLabel', {
                    name: goal.name,
                  })}
                  aria-valuemax={100}
                  aria-valuemin={0}
                  aria-valuenow={Math.round(goal.percent || 0)}
                  className='progress-track mb-3'
                  role='progressbar'
                  style={{ height: 10 }}
                >
                  <div
                    className='progress-fill'
                    style={{
                      width: `${Math.min(100, Math.max(0, goal.percent || 0))}%`,
                    }}
                  />
                </div>
                {canManageGoals && goal.status === 'ACTIVE' && (
                  <div className='screen-routine-actions'>
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
            ))}
          </div>
        )}

        {/* Rewards */}
        <div className='screen-section-header mb-3 mt-6'>
          <h2
            className='text-primary'
            style={{ fontSize: 16, fontWeight: 800, margin: 0 }}
          >
            {t('navigation.rewards')}
          </h2>
        </div>

        {rewards.length === 0 ? (
          <div className='empty-state card'>
            <div style={{ fontSize: 40 }}>🎁</div>
            <div className='text-primary font-bold'>
              {t('rewards.noRewards')}
            </div>
          </div>
        ) : (
          <>
            <div className='grid grid-cols-2 gap-3 md:grid-cols-3'>
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
                  <div
                    key={reward.id}
                    className='card flex flex-col gap-3 p-4'
                    style={{ opacity: affordable ? 1 : 0.8 }}
                  >
                    <div style={{ fontSize: 32, lineHeight: 1 }}>
                      {reward.icon || '🎁'}
                    </div>
                    <div>
                      <div
                        className='text-primary font-bold'
                        style={{ fontSize: 13 }}
                      >
                        {reward.name}
                      </div>
                      {reward.description && (
                        <div
                          className='text-muted'
                          style={{ fontSize: 11, marginTop: 2 }}
                        >
                          {reward.description}
                        </div>
                      )}
                    </div>
                    <div className='flex items-center justify-between'>
                      <div
                        className='text-brand flex items-center gap-1 font-bold'
                        style={{
                          fontSize: 14,
                          fontFamily: 'var(--font-mono)',
                        }}
                      >
                        <FigmaIcon name='star' size={12} />
                        {reward.costPoints}
                      </div>
                      {affordable ? (
                        <button
                          className='btn btn-primary btn-sm'
                          onClick={() => onRequestReward(reward)}
                          type='button'
                        >
                          {t('rewards.requestReward')}
                        </button>
                      ) : (
                        <span className='text-faint' style={{ fontSize: 11 }}>
                          {percent}%
                        </span>
                      )}
                    </div>
                    {!affordable && (
                      <div
                        aria-label={reward.name}
                        aria-valuemax={100}
                        aria-valuemin={0}
                        aria-valuenow={percent}
                        className='progress-track'
                        role='progressbar'
                        style={{ height: 4 }}
                      >
                        <div
                          className='progress-fill'
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
            {canManageRewards && (
              <button
                className='btn btn-secondary mt-3 w-full'
                onClick={onCreateReward}
                type='button'
              >
                <FigmaIcon name='plus' size={14} />
                {t('familyProgress.createNewReward')}
              </button>
            )}
          </>
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
