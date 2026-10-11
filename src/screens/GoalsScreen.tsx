import { AppCtx } from '../App'
import { PageFlow } from '../components/page'
import {
  EntityCard,
  EntityGrid,
  PageEmptyState,
  PageSection,
  PageShell,
} from '../components/page'
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
    <PageShell
      testId='goals-page'
      header={
        <PageHeader
          title='Goals'
          subtitle='Live circle goals and measured progress'
          primaryAction={
            !isChild
              ? {
                  label: 'New goal',
                  icon: 'goals',
                  onClick: () => ctx.openCreate('goal'),
                }
              : undefined
          }
        />
      }
    >
      <PageFlow>
        {goals.length === 0 ? (
          <PageEmptyState
            icon='goals'
            testId='goals-zero'
            title='No goals yet'
            description='Create a live goal to track measured progress.'
          />
        ) : (
          <PageSection>
            <EntityGrid variant='standard' testId='goals-grid'>
              {goals.map(goal => {
                const percent = Math.min(
                  100,
                  Math.round((goal.progress / goal.target) * 100),
                )
                return (
                  <EntityCard key={goal.id}>
                    <div className='flex items-start justify-between gap-3'>
                      <div>
                        <div className='font-bold text-primary'>
                          {goal.name}
                        </div>
                        <div
                          className='text-muted mt-1'
                          style={{ fontSize: 12 }}
                        >
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
                      <div className='entity-card__actions'>
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
                  </EntityCard>
                )
              })}
            </EntityGrid>
          </PageSection>
        )}
      </PageFlow>
    </PageShell>
  )
}
