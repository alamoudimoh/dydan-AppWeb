import { useState } from 'react'

import { AppCtx, Icon } from '../App'
import IconPicker from '../components/IconPicker'
import MemberMultiPicker from '../components/MemberMultiPicker'
import MemberPicker from '../components/MemberPicker'
import ThemeSelect from '../components/ThemeSelect'
import type { Goal, Member } from '../data'
import { useLiveData } from '../model/liveData'

type GoalDraft = {
  name: string
  description: string
  emoji: string
  isFamily: boolean
  target: string
  progress: string
  unit: string
  memberIds: string[]
  color: string
}
const newDraft = (
  members: Member[],
  isSolo: boolean,
  currentUser: Member | null,
): GoalDraft => ({
  name: '',
  description: '',
  emoji: '🎯',
  isFamily: !isSolo,
  target: '10',
  progress: '0',
  unit: 'tasks',
  memberIds: isSolo
    ? [(currentUser ?? members[0])?.id ?? '']
    : members.map(m => m.id),
  color: 'var(--goal-1)',
})
const makeId = () =>
  globalThis.crypto?.randomUUID?.() ??
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`

export default function GoalsScreen({
  ctx,
  isChild,
  isSolo,
}: {
  ctx: AppCtx
  isSolo: boolean
  isChild: boolean
}) {
  const { currentUser, goals, memberById, members } = useLiveData()
  const [items, setItems] = useState<Goal[]>(goals)
  const [inactive, setInactive] = useState<Set<string>>(new Set())
  const [editorId, setEditorId] = useState<string | null | undefined>(undefined)
  const [form, setForm] = useState<GoalDraft>(() =>
    newDraft(members, isSolo, currentUser),
  )
  const myGoals = items.filter(
    g =>
      (!isChild || g.contributorIds?.includes(currentUser?.id ?? '')) &&
      (!isSolo || !g.isFamily),
  )
  const familyGoals = myGoals.filter(g => g.isFamily)
  const personalGoals = myGoals.filter(g => !g.isFamily)

  const startNew = () => {
    setForm(newDraft(members, isSolo, currentUser))
    setEditorId(null)
  }
  const startModify = (goal: Goal) => {
    setEditorId(goal.id)
    setForm({
      name: goal.name,
      description: goal.description ?? '',
      emoji: goal.emoji,
      isFamily: goal.isFamily,
      target: String(goal.target),
      progress: String(goal.progress),
      unit: goal.unit,
      memberIds: goal.contributorIds ?? [],
      color: goal.color,
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const save = () => {
    const name = form.name.trim()
    const target = Number(form.target)
    const progress = Number(form.progress)
    if (
      !name ||
      !form.unit.trim() ||
      !Number.isFinite(target) ||
      target <= 0 ||
      !Number.isFinite(progress) ||
      progress < 0 ||
      progress > target ||
      form.memberIds.length === 0
    ) {
      ctx.showToast(
        'Enter a name, unit, valid target/progress, and at least one contributor',
      )
      return
    }
    const values = {
      name,
      description: form.description.trim(),
      emoji: form.emoji.trim() || '🎯',
      isFamily: !isSolo && form.isFamily,
      target,
      progress,
      unit: form.unit.trim(),
      contributorIds: form.memberIds,
      color: form.color,
    }
    if (editorId) {
      setItems(prev =>
        prev.map(g => (g.id === editorId ? { ...g, ...values } : g)),
      )
      ctx.showToast('Goal modified')
    } else {
      setItems(prev => [...prev, { id: `goal-${makeId()}`, ...values }])
      ctx.showToast('Goal created')
    }
    setEditorId(undefined)
  }

  const toggleActive = (goal: Goal) => {
    if (inactive.has(goal.id)) {
      setInactive(prev => {
        const next = new Set(prev)
        next.delete(goal.id)
        return next
      })
      ctx.showToast('Goal activated')
    } else {
      ctx.showConfirm({
        title: 'Deactivate goal?',
        message: `"${goal.name}" will remain visible but inactive.`,
        confirmLabel: 'Deactivate',
        onConfirm: () => {
          setInactive(prev => new Set([...prev, goal.id]))
          ctx.showToast('Goal deactivated')
        },
      })
    }
  }

  const deleteGoal = (goal: Goal) =>
    ctx.showConfirm({
      title: 'Delete goal?',
      message: `Delete "${goal.name}" permanently from this preview?`,
      confirmLabel: 'Delete',
      danger: true,
      onConfirm: () => {
        setItems(prev => prev.filter(g => g.id !== goal.id))
        setInactive(prev => {
          const next = new Set(prev)
          next.delete(goal.id)
          return next
        })
        if (editorId === goal.id) setEditorId(undefined)
        ctx.showToast('Goal deleted')
      },
    })

  const renderGoal = (goal: Goal) => {
    const percent = Math.min(
      100,
      Math.round((goal.progress / goal.target) * 100),
    )
    const isInactive = inactive.has(goal.id)
    return (
      <div
        key={goal.id}
        className='card p-5 mb-3'
        style={{ opacity: isInactive ? 0.7 : 1 }}
      >
        <div className='flex items-start gap-3'>
          <span style={{ fontSize: 30, lineHeight: 1.25 }}>{goal.emoji}</span>
          <div className='flex-1 min-w-0'>
            <div className='flex items-center gap-2 flex-wrap'>
              <div className='font-bold text-primary' style={{ fontSize: 15 }}>
                {goal.name}
              </div>
              {isInactive && (
                <span
                  className='badge'
                  style={{
                    background: 'var(--surface-2)',
                    color: 'var(--t-muted)',
                  }}
                >
                  Inactive
                </span>
              )}
            </div>
            {goal.description && (
              <div className='text-muted mt-1' style={{ fontSize: 12 }}>
                {goal.description}
              </div>
            )}
            <div className='text-faint mt-2' style={{ fontSize: 12 }}>
              {goal.progress} / {goal.target} {goal.unit}
            </div>
          </div>
          <div
            className='text-end font-bold'
            style={{ fontSize: 22, color: 'var(--t-primary)' }}
          >
            {percent}%
          </div>
        </div>
        <div className='progress-track mt-3' style={{ height: 9 }}>
          <div
            className='progress-fill'
            style={{ width: `${percent}%`, background: goal.color }}
          />
        </div>
        {goal.contributorIds && (
          <div className='flex items-center gap-2 mt-3 flex-wrap'>
            <span className='text-faint' style={{ fontSize: 11 }}>
              {goal.isFamily ? 'Contributors:' : 'Assigned to:'}
            </span>
            {goal.contributorIds.map(id => {
              const member = memberById(id)
              return member ? (
                <span
                  key={id}
                  className='flex items-center gap-1 text-muted'
                  style={{ fontSize: 11 }}
                >
                  <span
                    className='avatar'
                    style={{
                      width: 20,
                      height: 20,
                      fontSize: 8,
                      background: member.avatarColor,
                    }}
                  >
                    {member.initials}
                  </span>
                  {member.name}
                </span>
              ) : null
            })}
          </div>
        )}
        {!isChild && (
          <div className='flex gap-2 mt-4 flex-wrap'>
            <button
              className='btn btn-secondary btn-sm'
              onClick={() => startModify(goal)}
            >
              Modify
            </button>
            <button
              className='btn btn-ghost btn-sm'
              onClick={() => toggleActive(goal)}
            >
              {isInactive ? 'Activate' : 'Deactivate'}
            </button>
            <button
              className='btn btn-ghost btn-sm'
              style={{ color: 'var(--sig-over)' }}
              onClick={() => deleteGoal(goal)}
            >
              Delete
            </button>
          </div>
        )}
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 1080, margin: '0 auto', padding: '0 0 40px' }}>
      <div className='page-header pb-5'>
        <div>
          <h1
            className='text-primary'
            style={{ fontSize: 24, fontWeight: 800, margin: 0 }}
          >
            Goals
          </h1>
          <div className='text-muted' style={{ fontSize: 13, marginTop: 4 }}>
            Personal goals and shared team goals
          </div>
        </div>
        {!isChild && (
          <button className='btn btn-primary' onClick={startNew}>
            <Icon name='plus' size={14} />
            New goal
          </button>
        )}
      </div>
      <div className='px-4 md:px-7'>
        {editorId !== undefined && (
          <div className='card p-5 mb-5'>
            <div className='flex items-center justify-between mb-4'>
              <div className='form-title text-primary' style={{ fontSize: 17 }}>
                {editorId ? 'Modify goal' : 'New goal'}
              </div>
              <button
                className='btn btn-ghost btn-icon'
                onClick={() => setEditorId(undefined)}
                aria-label='Close editor'
              >
                <Icon name='x' size={16} />
              </button>
            </div>
            <div
              className='grid gap-4'
              style={{
                gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
              }}
            >
              <label className='flex flex-col gap-1.5'>
                <span className='section-label' style={{ padding: 0 }}>
                  Goal name
                </span>
                <input
                  className='input'
                  autoFocus
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                />
              </label>
              <label className='flex flex-col gap-1.5'>
                <span className='section-label' style={{ padding: 0 }}>
                  Icon
                </span>
                <IconPicker
                  value={form.emoji}
                  onChange={emoji => setForm(f => ({ ...f, emoji }))}
                  label='Goal icon'
                />
              </label>
              <div className='flex flex-col gap-1.5'>
                <span className='section-label' style={{ padding: 0 }}>
                  GOAL TYPE
                </span>
                <ThemeSelect
                  label='Goal type'
                  value={form.isFamily ? 'family' : 'personal'}
                  disabled={isSolo}
                  options={[
                    ...(!isSolo
                      ? [{ value: 'family', label: 'Family goal' }]
                      : []),
                    { value: 'personal', label: 'Personal goal' },
                  ]}
                  onChange={value =>
                    setForm(f => ({
                      ...f,
                      isFamily: value === 'family',
                      memberIds:
                        value === 'family'
                          ? members.map(m => m.id)
                          : [(currentUser ?? members[0])?.id ?? ''],
                    }))
                  }
                />
              </div>
              <label className='flex flex-col gap-1.5'>
                <span className='section-label' style={{ padding: 0 }}>
                  Target
                </span>
                <input
                  className='input'
                  type='number'
                  min='1'
                  value={form.target}
                  onChange={e =>
                    setForm(f => ({ ...f, target: e.target.value }))
                  }
                />
              </label>
              <label className='flex flex-col gap-1.5'>
                <span className='section-label' style={{ padding: 0 }}>
                  Current progress
                </span>
                <input
                  className='input'
                  type='number'
                  min='0'
                  value={form.progress}
                  onChange={e =>
                    setForm(f => ({ ...f, progress: e.target.value }))
                  }
                />
              </label>
              <label className='flex flex-col gap-1.5'>
                <span className='section-label' style={{ padding: 0 }}>
                  Unit
                </span>
                <input
                  className='input'
                  value={form.unit}
                  onChange={e => setForm(f => ({ ...f, unit: e.target.value }))}
                  placeholder='tasks, days, pages...'
                />
              </label>
              <div className='flex flex-col gap-1.5'>
                <span className='section-label' style={{ padding: 0 }}>
                  COLOR
                </span>
                <ThemeSelect
                  label='Goal color'
                  value={form.color}
                  onChange={color => setForm(f => ({ ...f, color }))}
                  options={[
                    { value: 'var(--goal-1)', label: 'Color 1' },
                    { value: 'var(--goal-2)', label: 'Color 2' },
                    { value: 'var(--goal-3)', label: 'Color 3' },
                  ]}
                />
              </div>
              <label
                className='flex flex-col gap-1.5'
                style={{ gridColumn: '1 / -1' }}
              >
                <span className='section-label' style={{ padding: 0 }}>
                  Description
                </span>
                <textarea
                  className='input'
                  rows={2}
                  value={form.description}
                  onChange={e =>
                    setForm(f => ({ ...f, description: e.target.value }))
                  }
                />
              </label>
            </div>
            <div className='mt-4'>
              <div className='section-label mb-2'>
                {form.isFamily ? 'Family contributors' : 'Assigned member'}
              </div>
              {form.isFamily ? (
                <MemberMultiPicker
                  value={form.memberIds}
                  onChange={ids =>
                    setForm(previous => ({ ...previous, memberIds: ids }))
                  }
                />
              ) : (
                <MemberPicker
                  label='Goal assignee'
                  value={form.memberIds[0] ?? ''}
                  onChange={id => setForm(f => ({ ...f, memberIds: [id] }))}
                />
              )}
            </div>
            <div className='flex gap-2 mt-5'>
              <button className='btn btn-primary' onClick={save}>
                {editorId ? 'Save changes' : 'Create goal'}
              </button>
              <button
                className='btn btn-secondary'
                onClick={() => setEditorId(undefined)}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
        {!isSolo && (
          <section className='mb-6'>
            <h2
              className='text-primary font-bold mb-3'
              style={{ fontSize: 16 }}
            >
              Family goals
            </h2>
            {familyGoals.length ? (
              familyGoals.map(renderGoal)
            ) : (
              <div className='text-muted card p-5' style={{ fontSize: 13 }}>
                No family goals yet
              </div>
            )}
          </section>
        )}
        <section className='mb-6'>
          <h2 className='text-primary font-bold mb-3' style={{ fontSize: 16 }}>
            Personal goals
          </h2>
          {personalGoals.length ? (
            personalGoals.map(renderGoal)
          ) : (
            <div className='text-muted card p-5' style={{ fontSize: 13 }}>
              No personal goals yet
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
