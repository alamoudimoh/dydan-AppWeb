import PropTypes from 'prop-types'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'

import EmptyState from '../../components/common/EmptyState'
import PageHeader from '../../components/common/PageHeader'
import QueryLoadingView from '../../components/common/QueryLoadingView'
import SectionCard from '../../components/common/SectionCard'
import FigmaIcon from '../../components/FigmaIcon'
import { useChores } from '../../queries/ChoreQueries'
import {
  useGoalMutation,
  useGoals,
  useReport,
  useStreak,
  useWorkload,
} from '../../queries/ProgressQueries'
import {
  useMyRewardRequests,
  useRewardMutation,
  useRewards,
} from '../../queries/RewardQueries'
import { useCircleMembers, useUserProfile } from '../../queries/UserQueries'
import { pageShellSx } from '../../theme/appLayout'
import { sxToStyle } from '../../theme/sxToStyle'
import { RewardEditor } from '../Rewards/RewardEditor'
import FigmaGoalsScreen from './FigmaGoalsScreen'

const Metric = ({ label, value }) => (
  <div style={{ minWidth: 72 }}>
    <div
      className='text-primary font-mono'
      style={{ fontSize: 22, fontWeight: 700 }}
    >
      {value ?? 0}
    </div>
    <div className='text-muted' style={{ fontSize: 12 }}>
      {label}
    </div>
  </div>
)

Metric.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
}

const Field = ({ children, label }) => (
  <label className='block'>
    <span
      className='section-label'
      style={{ display: 'block', padding: '0 0 6px' }}
    >
      {label}
    </span>
    {children}
  </label>
)

const Workload = () => {
  const { t } = useTranslation()
  const [range, setRange] = useState('week')
  const [category, setCategory] = useState('')
  const { data, error, isLoading } = useWorkload(range, '', category)
  if (isLoading) return <QueryLoadingView />
  if (error) return <EmptyState variant='error' title={error.message} />
  return (
    <div className='flex flex-col gap-4'>
      <div className='flex flex-wrap gap-2'>
        <select
          aria-label={t('familyProgress.workloadRange')}
          className='input'
          value={range}
          onChange={event => setRange(event.target.value)}
        >
          <option value='today'>{t('familyProgress.today')}</option>
          <option value='week'>{t('familyProgress.thisWeek')}</option>
          <option value='30d'>{t('familyProgress.next30Days')}</option>
        </select>
        <select
          aria-label={t('familyProgress.categoryFilter')}
          className='input'
          value={category}
          onChange={event => setCategory(event.target.value)}
        >
          <option value=''>{t('familyProgress.allCategories')}</option>
          {data?.categories
            ?.filter(x => x.categoryId)
            .map(x => (
              <option key={x.categoryId} value={String(x.categoryId)}>
                {x.name}
              </option>
            ))}
        </select>
      </div>
      <div
        className='grid gap-2'
        style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(230px,1fr))' }}
      >
        {data.members.map(member => (
          <div key={member.userId} className='card p-4'>
            <div className='text-primary font-bold' style={{ fontSize: 14 }}>
              {member.name}
            </div>
            <div className='flex flex-wrap gap-4'>
              <Metric label={t('familyProgress.today')} value={member.today} />
              <Metric
                label={t('familyProgress.overdue')}
                value={member.overdue}
              />
              <Metric
                label={t('familyProgress.upcoming')}
                value={member.upcoming}
              />
            </div>
            <div className='mt-2 flex flex-col gap-1'>
              {data.tasks
                .filter(task => task.assignedTo === member.userId)
                .slice(0, 6)
                .map(task => (
                  <Link
                    key={task.id}
                    style={{ color: 'var(--brand)', fontSize: 13 }}
                    to={`/chores/${task.id}`}
                  >
                    {task.name}
                  </Link>
                ))}
            </div>
          </div>
        ))}
        {data.canViewFamily && (
          <div className='card p-4'>
            <div className='text-primary font-bold' style={{ fontSize: 14 }}>
              {t('familyProgress.unassigned')}
            </div>
            <Metric
              label={t('familyProgress.activeTasks')}
              value={data.unassigned}
            />
          </div>
        )}
      </div>
      <SectionCard title={t('familyProgress.workByCategory')}>
        <div className='flex flex-col gap-1'>
          {data.categories.map(row => (
            <div
              className='flex items-center justify-between'
              key={row.categoryId || 'none'}
            >
              <span className='text-primary' style={{ fontSize: 13 }}>
                {row.name}
              </span>
              <span className='badge'>{row.count}</span>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  )
}

const Reports = () => {
  const { t } = useTranslation()
  const [range, setRange] = useState('30d')
  const { data, error, isLoading } = useReport(range)
  if (isLoading) return <QueryLoadingView />
  if (error) return <EmptyState variant='error' title={error.message} />
  return (
    <div className='flex flex-col gap-4'>
      <select
        aria-label={t('familyProgress.reportRange')}
        className='input'
        style={{ alignSelf: 'flex-start' }}
        value={range}
        onChange={event => setRange(event.target.value)}
      >
        <option value='week'>{t('familyProgress.thisWeek')}</option>
        <option value='7d'>{t('familyProgress.sevenDays')}</option>
        <option value='30d'>{t('familyProgress.thirtyDays')}</option>
        <option value='90d'>{t('familyProgress.ninetyDays')}</option>
        <option value='month'>{t('familyProgress.thisMonth')}</option>
      </select>
      <div
        className='grid gap-2'
        style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))' }}
      >
        <SectionCard title={t('familyProgress.completion')}>
          <div className='flex flex-wrap gap-4'>
            <Metric
              label={t('familyProgress.completedTasks')}
              value={data.completed}
            />
            <Metric
              label={t('familyProgress.currentlyOverdue')}
              value={data.overdue}
            />
          </div>
        </SectionCard>
        <SectionCard title={t('familyProgress.points')}>
          <div className='flex flex-wrap gap-4'>
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
          </div>
        </SectionCard>
        <SectionCard title={t('familyProgress.maintenance')}>
          <div className='flex flex-wrap gap-4'>
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
          </div>
        </SectionCard>
      </div>
      <SectionCard title={t('familyProgress.deterministicInsights')}>
        <div className='flex flex-col gap-1'>
          {data.insights.map(text => (
            <span className='text-primary' key={text} style={{ fontSize: 13 }}>
              {text}
            </span>
          ))}
        </div>
      </SectionCard>
      <SectionCard title={t('familyProgress.completedByCategory')}>
        <div className='flex flex-col gap-1'>
          {data.categories.map(row => (
            <div
              className='flex items-center justify-between'
              key={row.id || 'none'}
            >
              <span className='text-primary' style={{ fontSize: 13 }}>
                {row.name}
              </span>
              <span className='badge'>{row.count}</span>
            </div>
          ))}
        </div>
      </SectionCard>
      {data.canViewFamily && (
        <SectionCard title={t('familyProgress.completedByMember')}>
          <div className='flex flex-col gap-1'>
            {data.members.map(row => (
              <div className='flex items-center justify-between' key={row.id}>
                <span className='text-primary' style={{ fontSize: 13 }}>
                  {row.name}
                </span>
                <span className='badge'>{row.count}</span>
              </div>
            ))}
          </div>
        </SectionCard>
      )}
      <SectionCard title={t('familyProgress.rewardActivity')}>
        {data.rewards.length ? (
          <div className='flex flex-col gap-1'>
            {data.rewards.map(row => (
              <div
                className='flex items-center justify-between'
                key={row.status}
              >
                <span className='text-primary' style={{ fontSize: 13 }}>
                  {t(`rewards.status_${row.status}`)}
                </span>
                <span className='badge'>{row.count}</span>
              </div>
            ))}
          </div>
        ) : (
          <span className='text-muted' style={{ fontSize: 13 }}>
            {t('familyProgress.noRewardActivity')}
          </span>
        )}
      </SectionCard>
    </div>
  )
}

const Goals = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { data, error, isError, isLoading, refetch } = useGoals()
  const { data: workload } = useWorkload('week', '', '')
  const { data: profile } = useUserProfile()
  const { data: membersData } = useCircleMembers()
  const { data: choresData } = useChores(false)
  const { data: goalStreak } = useStreak()
  const rewards = useRewards(false)
  const myRewardRequests = useMyRewardRequests()
  const mutation = useGoalMutation()
  const rewardMutation = useRewardMutation()
  const [open, setOpen] = useState(false)
  const [creatingReward, setCreatingReward] = useState(false)
  const [form, setForm] = useState({
    name: '',
    metricType: 'TASK_COMPLETIONS',
    target: 10,
    startDate: new Date().toISOString().slice(0, 10),
    endDate: new Date().toISOString().slice(0, 10),
  })
  const activeRewards = useMemo(
    () => rewards.data?.res?.filter(reward => reward.isActive) || [],
    [rewards.data],
  )
  const balance = myRewardRequests.data?.balance || {
    currentBalance: 0,
    spendableBalance: 0,
  }
  const member = membersData?.res?.find(
    candidate => String(candidate.userId) === String(profile?.id),
  )
  const isAdmin = member?.role === 'admin'
  const tasksCompleted = useMemo(
    () =>
      (choresData?.res || []).filter(
        chore =>
          String(chore.assignedTo) === String(profile?.id) &&
          (chore.isCompleted || chore.status === 4),
      ).length,
    [choresData?.res, profile?.id],
  )
  if (isLoading) return <QueryLoadingView />
  if (isError) {
    return (
      <EmptyState
        variant='error'
        title={error?.message || t('familyProgress.goalsLoadError')}
        primaryAction={{ label: t('familyProgress.retry'), onClick: refetch }}
      />
    )
  }
  if (!data) {
    return (
      <EmptyState variant='error' title={t('familyProgress.goalsLoadError')} />
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

  const requestReward = reward => {
    if (
      window.confirm(
        t('rewards.requestConfirm', {
          name: reward.name,
          count: reward.costPoints,
        }),
      )
    ) {
      rewardMutation.mutate({
        path: '/rewards/requests',
        data: { rewardId: reward.id },
      })
    }
  }

  if (!open) {
    return (
      <>
        <FigmaGoalsScreen
          balance={balance}
          canManageGoals={data.canManage}
          canManageRewards={isAdmin}
          goals={data.goals}
          onArchiveGoal={archiveGoal}
          onCreateGoal={() => {
            setForm({
              name: '',
              metricType: 'TASK_COMPLETIONS',
              target: 10,
              startDate: new Date().toISOString().slice(0, 10),
              endDate: new Date().toISOString().slice(0, 10),
            })
            setOpen(true)
          }}
          onCreateReward={() => setCreatingReward(true)}
          onEditGoal={editGoal}
          onRequestReward={requestReward}
          onViewHistory={() => navigate('/activities')}
          rewards={activeRewards}
          streak={goalStreak?.current || 0}
          tasksCompleted={tasksCompleted}
        />
        {creatingReward && (
          <RewardEditor
            mutation={rewardMutation}
            onClose={() => setCreatingReward(false)}
          />
        )}
      </>
    )
  }

  return (
    <div className='flex flex-col gap-3'>
      {data.canManage && (
        <button
          className='btn btn-ghost'
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
          style={{ alignSelf: 'flex-start' }}
          type='button'
        >
          <FigmaIcon name='plus' size={14} />
          {t('familyProgress.createGoal')}
        </button>
      )}
      {open && (
        <div className='card' style={{ padding: 16 }}>
          <form className='flex flex-col gap-3' onSubmit={submit}>
            <Field label={t('familyProgress.name')}>
              <input
                className='input'
                required
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
              />
            </Field>
            <Field label={t('familyProgress.metric')}>
              <select
                className='input'
                value={form.metricType}
                onChange={e => setForm({ ...form, metricType: e.target.value })}
              >
                <option value='TASK_COMPLETIONS'>
                  {t('familyProgress.taskCompletions')}
                </option>
                <option value='CATEGORY_COMPLETIONS'>
                  {t('familyProgress.categoryCompletions')}
                </option>
                <option value='POINTS_EARNED'>
                  {t('familyProgress.pointsEarned')}
                </option>
              </select>
            </Field>
            {form.metricType === 'CATEGORY_COMPLETIONS' && (
              <Field label={t('familyProgress.category')}>
                <select
                  className='input'
                  required
                  value={form.categoryId || ''}
                  onChange={e =>
                    setForm({ ...form, categoryId: Number(e.target.value) })
                  }
                >
                  <option value='' disabled>
                    —
                  </option>
                  {workload?.categories
                    ?.filter(row => row.categoryId)
                    .map(row => (
                      <option
                        key={row.categoryId}
                        value={String(row.categoryId)}
                      >
                        {row.name}
                      </option>
                    ))}
                </select>
              </Field>
            )}
            <Field label={t('familyProgress.target')}>
              <input
                className='input'
                min='1'
                required
                type='number'
                value={form.target}
                onChange={e =>
                  setForm({ ...form, target: Number(e.target.value) })
                }
              />
            </Field>
            <div className='flex flex-col gap-3 sm:flex-row'>
              <Field label={t('familyProgress.start')}>
                <input
                  className='input'
                  type='date'
                  value={form.startDate}
                  onChange={e =>
                    setForm({ ...form, startDate: e.target.value })
                  }
                />
              </Field>
              <Field label={t('familyProgress.end')}>
                <input
                  className='input'
                  type='date'
                  value={form.endDate}
                  onChange={e => setForm({ ...form, endDate: e.target.value })}
                />
              </Field>
            </div>
            {mutation.error && (
              <div
                className='text-sig-over'
                role='alert'
                style={{ fontSize: 13 }}
              >
                {mutation.error.message}
              </div>
            )}
            <button
              className='btn btn-primary'
              disabled={mutation.isPending}
              type='submit'
            >
              {form.id
                ? t('familyProgress.updateGoal')
                : t('familyProgress.saveGoal')}
            </button>
          </form>
        </div>
      )}
      {!data.goals.length && (
        <div className='card text-muted' style={{ fontSize: 13, padding: 16 }}>
          {t('familyProgress.noGoals')}
        </div>
      )}
      {data.goals.map(goal => (
        <div key={goal.id} className='card' style={{ padding: 16 }}>
          <div className='flex items-center justify-between gap-2'>
            <div className='text-primary font-bold' style={{ fontSize: 15 }}>
              {goal.name}
            </div>
            <span
              className='badge'
              style={{
                background:
                  goal.status === 'COMPLETED'
                    ? 'var(--sig-done-bg)'
                    : 'var(--surface-2)',
                color:
                  goal.status === 'COMPLETED'
                    ? 'var(--sig-done)'
                    : 'var(--t-muted)',
              }}
            >
              {goal.status === 'COMPLETED' && (
                <FigmaIcon name='check' size={12} />
              )}
              {t(
                `familyProgress.${
                  goal.status === 'COMPLETED'
                    ? 'completedStatus'
                    : goal.status.toLowerCase()
                }`,
              )}
            </span>
          </div>
          <div className='text-muted mt-1' style={{ fontSize: 13 }}>
            {t('familyProgress.goalProgress', {
              progress: goal.progress,
              target: goal.target,
            })}
          </div>
          <div
            aria-label={t('familyProgress.goalProgressLabel', {
              name: goal.name,
            })}
            role='progressbar'
            style={{
              background: 'var(--surface-2)',
              borderRadius: 'var(--r-sm)',
              height: 8,
              marginTop: 8,
              overflow: 'hidden',
              width: '100%',
            }}
          >
            <div
              style={{
                background:
                  goal.status === 'COMPLETED'
                    ? 'var(--sig-done)'
                    : 'var(--brand)',
                borderRadius: 'var(--r-sm)',
                height: '100%',
                transition: 'width 0.3s ease',
                width: `${Math.min(100, Math.max(0, goal.percent))}%`,
              }}
            />
          </div>
          <div className='text-muted mt-1' style={{ fontSize: 12 }}>
            {t(
              `familyProgress.${
                goal.metricType === 'TASK_COMPLETIONS'
                  ? 'taskCompletions'
                  : goal.metricType === 'CATEGORY_COMPLETIONS'
                    ? 'categoryCompletions'
                    : 'pointsEarned'
              }`,
            )}
          </div>
          {data.canManage && goal.status === 'ACTIVE' && (
            <div className='mt-2 flex gap-2'>
              <button
                className='btn btn-sm btn-ghost'
                onClick={() => editGoal(goal)}
                type='button'
              >
                <FigmaIcon name='edit' size={13} />
                {t('edit')}
              </button>
              <button
                className='btn btn-sm btn-ghost'
                disabled={mutation.isPending}
                onClick={() => archiveGoal(goal)}
                type='button'
              >
                <FigmaIcon name='archive' size={13} />
                {t('familyProgress.archive')}
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

export default function FamilyProgress() {
  const { t } = useTranslation()
  const { data: streak } = useStreak()
  const [tab, setTab] = useState(0)
  return (
    <div style={sxToStyle(pageShellSx)}>
      <PageHeader
        icon={<FigmaIcon name='flag' size={28} />}
        title={t('familyProgress.title')}
        subtitle={t('familyProgress.subtitle')}
      />
      <div className='card' style={{ marginTop: 16 }}>
        <div className='flex flex-wrap gap-6 p-4'>
          <Metric
            label={t('familyProgress.currentStreak')}
            value={t('familyProgress.days', {
              count: streak?.current || 0,
            })}
          />
          <Metric
            label={t('familyProgress.bestStreak')}
            value={t('familyProgress.days', { count: streak?.best || 0 })}
          />
        </div>
        <div
          className='border-line text-muted border-t px-4 py-3'
          style={{ fontSize: 12 }}
        >
          {streak?.rule}
        </div>
      </div>
      <div
        className='view-toggle'
        role='tablist'
        style={{ margin: '16px 0', maxWidth: '100%', width: 'fit-content' }}
      >
        <button
          aria-selected={tab === 0}
          className={`view-toggle-btn ${tab === 0 ? 'active' : ''}`}
          onClick={() => setTab(0)}
          role='tab'
          type='button'
        >
          <FigmaIcon name='users' size={14} />
          {t('familyProgress.workload')}
        </button>
        <button
          aria-selected={tab === 1}
          className={`view-toggle-btn ${tab === 1 ? 'active' : ''}`}
          onClick={() => setTab(1)}
          role='tab'
          type='button'
        >
          <FigmaIcon name='activity' size={14} />
          {t('familyProgress.insights')}
        </button>
        <button
          aria-selected={tab === 2}
          className={`view-toggle-btn ${tab === 2 ? 'active' : ''}`}
          onClick={() => setTab(2)}
          role='tab'
          type='button'
        >
          <FigmaIcon name='flag' size={14} />
          {t('familyProgress.goals')}
        </button>
      </div>
      {tab === 0 && <Workload />}
      {tab === 1 && <Reports />}
      {tab === 2 && <Goals />}
    </div>
  )
}
