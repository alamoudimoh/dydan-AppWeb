import { AppCtx, Icon } from '../App'
import PageHeader from '../components/PageHeader'
import type { Goal } from '../data'
import { useGoalMutations } from '../hooks/useHousehold'
import { useLiveData } from '../model/liveData'

const today = () => new Date().toISOString().slice(0, 10)
const nextMonth = () => {
  const date = new Date()
  date.setMonth(date.getMonth() + 1)
  return date.toISOString().slice(0, 10)
}
export default function GoalsScreen({
  ctx,
  isChild,
}: {
  ctx: AppCtx
  isSolo: boolean
  isChild: boolean
}) {
  const { goals } = useLiveData()
  const mutations = useGoalMutations()
  const archive = (goal: Goal) =>
    ctx.showConfirm({
      title: 'Archive goal?',
      message: `Archive “${goal.name}”? Archived goals are retained by the server.`,
      confirmLabel: 'Archive',
      onConfirm: async () => {
        try {
          await mutations.updateGoal.mutateAsync({
            id: goal.id,
            name: goal.name,
            metricType: goal.metricType ?? 'TASK_COMPLETIONS',
            target: goal.target,
            startDate: goal.startDate ?? today(),
            endDate: goal.endDate ?? nextMonth(),
            status: 'archived',
          })
          ctx.showToast('Goal archived on the server')
        } catch (error) {
          ctx.showToast(
            error instanceof Error ? error.message : 'Could not archive goal',
          )
        }
      },
    })

  return (
    <div style={{ maxWidth: 1080, margin: '0 auto', padding: '0 0 40px' }}>
      <PageHeader
        title='Goals'
        subtitle='Live circle goals and measured progress'
        actions={
          !isChild ? (
            <button
              className='btn btn-primary'
              onClick={() => ctx.openCreate('goal')}
            >
              <Icon name='goals' size={14} />
              New goal
            </button>
          ) : undefined
        }
      />
      <div className='px-4 md:px-7'>
        <div
          className='grid gap-3'
          style={{
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
          }}
        >
          {goals.map(goal => {
            const percent = Math.min(
              100,
              Math.round((goal.progress / goal.target) * 100),
            )
            return (
              <div key={goal.id} className='card p-5'>
                <div className='flex items-start justify-between gap-3'>
                  <div>
                    <div className='font-bold text-primary'>{goal.name}</div>
                    <div className='text-muted mt-1' style={{ fontSize: 12 }}>
                      {goal.progress} / {goal.target} {goal.unit}
                    </div>
                  </div>
                  <strong>{percent}%</strong>
                </div>
                <div className='progress-track mt-3'>
                  <div
                    className='progress-fill'
                    style={{ width: `${percent}%`, background: goal.color }}
                  />
                </div>
                <div className='text-faint mt-2' style={{ fontSize: 11 }}>
                  {goal.startDate} – {goal.endDate}
                  {goal.status === 'archived' ? ' · Archived' : ''}
                </div>
                {!isChild && goal.status !== 'archived' && (
                  <div className='flex gap-2 mt-4'>
                    <button
                      className='btn btn-secondary btn-sm'
                      onClick={() => ctx.openCreate('goal', { goal })}
                    >
                      Modify
                    </button>
                    <button
                      className='btn btn-ghost btn-sm text-sig-over'
                      onClick={() => archive(goal)}
                    >
                      Archive
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
        {!goals.length && (
          <div className='empty-state'>
            <div className='font-bold text-primary'>No goals yet</div>
            <div className='text-muted'>
              Create a live goal to track measured progress.
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
