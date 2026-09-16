import '../../../styles/screenExperience.css'

import PropTypes from 'prop-types'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

import FigmaIcon from '../../../components/FigmaIcon'

function CompactTaskRow({ onComplete, onOpen, task }) {
  const { t } = useTranslation('common')
  const isDone = task.status === 'done'
  const isOverdue = task.status === 'overdue'

  return (
    <div
      className={`task-row ${isDone ? 'done' : ''}`}
      style={{ padding: '8px 12px' }}
    >
      <button
        type='button'
        className={`task-check ${isDone ? 'checked' : ''}`}
        disabled={isDone}
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
      <button
        type='button'
        className='screen-task-open min-w-0 flex-1'
        aria-label={task.title}
        onClick={() => onOpen(task)}
      >
        <div
          className={`font-medium ${isDone ? 'text-faint line-through' : 'text-primary'}`}
          style={{ fontSize: 13 }}
        >
          {task.title}
        </div>
        <div className='mt-0.5 flex flex-wrap items-center gap-2'>
          {task.category && (
            <span
              className='badge'
              style={{
                background: `color-mix(in srgb, ${task.categoryColor} 12%, transparent)`,
                color: task.categoryColor,
              }}
            >
              {task.category}
            </span>
          )}
          {task.dueTime && (
            <span className='text-faint' style={{ fontSize: 11 }}>
              {task.dueTime}
            </span>
          )}
          {isOverdue && (
            <span className='text-sig-over font-bold' style={{ fontSize: 11 }}>
              {t('homeToday.overdue')}
            </span>
          )}
          {task.isRecurring && (
            <FigmaIcon
              name='repeat'
              size={11}
              style={{ color: 'var(--t-faint)' }}
            />
          )}
          {task.points > 0 && !isDone && (
            <span
              className='text-brand font-bold font-mono'
              style={{ fontSize: 11 }}
            >
              +{task.points}pts
            </span>
          )}
        </div>
      </button>
    </div>
  )
}

CompactTaskRow.propTypes = {
  onComplete: PropTypes.func.isRequired,
  onOpen: PropTypes.func.isRequired,
  task: PropTypes.object.isRequired,
}

const MemberCard = ({ assignedToday, doneToday, member, onClick }) => {
  const { t } = useTranslation('common')
  return (
    <button
      type='button'
      className='card flex flex-col gap-2 p-3 text-left'
      onClick={onClick}
    >
      <div className='flex items-center gap-2'>
        <div
          className='avatar'
          style={{
            width: 32,
            height: 32,
            background: member.color,
            fontSize: 12,
          }}
        >
          {member.initials}
        </div>
        <div
          className='text-primary truncate font-semibold'
          style={{ fontSize: 12 }}
        >
          {member.name}
        </div>
      </div>
      <div className='text-faint' style={{ fontSize: 11 }}>
        {doneToday}/{assignedToday} {t('homeToday.done').toLowerCase()}
      </div>
      <div className='progress-track' style={{ height: 4 }}>
        <div
          className='progress-fill'
          style={{
            width:
              assignedToday > 0
                ? `${Math.round((doneToday / assignedToday) * 100)}%`
                : '0%',
          }}
        />
      </div>
    </button>
  )
}

MemberCard.propTypes = {
  assignedToday: PropTypes.number.isRequired,
  doneToday: PropTypes.number.isRequired,
  member: PropTypes.object.isRequired,
  onClick: PropTypes.func.isRequired,
}

export default function TodayScreen({
  done,
  household,
  makeTaskDone,
  members,
  overdue = [],
  todayKey,
  todo,
}) {
  const { i18n, t } = useTranslation('common')
  const navigate = useNavigate()
  const openChore = task => navigate(`/chores/${task.choreId}`)
  const [view, setView] = useState('mine')
  const [showDone, setShowDone] = useState(false)

  const total = done.length + todo.length
  const percent = total > 0 ? Math.round((done.length / total) * 100) : 0
  const totalPoints = done.reduce((sum, task) => sum + (task.points || 0), 0)
  const maxDone = Math.max(1, ...household.map(item => item.done))

  const fullDate = new Intl.DateTimeFormat(i18n.resolvedLanguage || 'en', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(`${todayKey}T00:00:00`))

  return (
    <div style={{ padding: '0 0 40px' }}>
      <div className='px-4 md:px-7'>
        <div className='screen-page-header page-header pb-5'>
          <div>
            <div
              className='text-faint'
              style={{
                fontSize: 11,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                marginBottom: 4,
              }}
            >
              {fullDate}
            </div>
            <h1
              className='text-primary'
              style={{ fontSize: 24, fontWeight: 800, margin: 0 }}
            >
              {t('homeToday.today')}
            </h1>
            <div className='text-muted' style={{ fontSize: 13, marginTop: 4 }}>
              {t('homeToday.tasksComplete', {
                done: done.length,
                total,
              })}
              {totalPoints > 0 && (
                <span className='text-brand font-bold ms-2'>
                  +{totalPoints} pts
                </span>
              )}
            </div>
          </div>
          <button
            className='screen-page-action btn btn-primary'
            onClick={() => navigate('/chores/create')}
            type='button'
          >
            <FigmaIcon name='plus' size={14} />
            {t('homeToday.newTask')}
          </button>
        </div>

        {/* Daily progress */}
        <div className='mb-4'>
          <div
            className='text-faint mb-1.5 flex justify-between'
            style={{ fontSize: 11 }}
          >
            <span>{t('homeToday.dailyProgress')}</span>
            <span className='font-bold' style={{ color: 'var(--brand)' }}>
              {percent}%
            </span>
          </div>
          <div
            aria-label={t('homeToday.dailyProgressLabel')}
            aria-valuemax={100}
            aria-valuemin={0}
            aria-valuenow={percent}
            className='progress-track'
            role='progressbar'
            style={{ height: 8 }}
          >
            <div
              className='progress-fill done'
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>

        {/* View toggle */}
        <div className='view-toggle mb-5' role='tablist'>
          <button
            aria-selected={view === 'mine'}
            className={view === 'mine' ? 'active' : ''}
            onClick={() => setView('mine')}
            role='tab'
            type='button'
          >
            {t('homeToday.forMe')}
          </button>
          <button
            aria-selected={view === 'family'}
            className={view === 'family' ? 'active' : ''}
            onClick={() => setView('family')}
            role='tab'
            type='button'
          >
            {t('homeToday.family')}
          </button>
        </div>

        {view === 'mine' && (
          <div className='flex flex-col gap-4'>
            {/* Overdue banner */}
            {overdue.length > 0 && (
              <div
                className='mb-2 p-4'
                style={{
                  background: 'var(--sig-over-bg)',
                  border: '1px solid var(--sig-over)',
                  borderRadius: 'var(--r-lg)',
                }}
              >
                <div className='mb-2 flex items-center gap-2'>
                  <FigmaIcon
                    name='error'
                    size={15}
                    style={{ color: 'var(--sig-over)' }}
                  />
                  <span
                    className='text-sig-over font-bold'
                    style={{ fontSize: 13 }}
                  >
                    {t('homeToday.overdue')}
                  </span>
                  <span className='badge bg-sig-over-bg text-sig-over ms-auto'>
                    {overdue.length}
                  </span>
                </div>
                <div className='flex flex-col gap-1'>
                  {overdue.map(task => (
                    <CompactTaskRow
                      key={task.id}
                      task={task}
                      onComplete={makeTaskDone}
                      onOpen={openChore}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* To do */}
            <div className='card overflow-hidden'>
              <div
                className='border-line border-b px-4 py-3'
                style={{ borderColor: 'var(--line)' }}
              >
                <div className='flex items-center gap-2'>
                  <span
                    className='text-primary font-bold'
                    style={{ fontSize: 14 }}
                  >
                    {t('homeToday.toDo')}
                  </span>
                  <span className='badge ms-auto' style={{ fontSize: 11 }}>
                    {todo.length}
                  </span>
                </div>
              </div>
              <div className='py-1'>
                {todo.length === 0 ? (
                  <div className='empty-state py-10'>
                    <div style={{ fontSize: 40 }}>🎉</div>
                    <div
                      className='text-primary font-bold'
                      style={{ fontSize: 18 }}
                    >
                      {t('homeToday.nothingDueHeading')}
                    </div>
                    <div className='text-muted' style={{ fontSize: 14 }}>
                      {t('homeToday.nothingDueSubtitle')}
                    </div>
                    <button
                      className='btn btn-primary mt-2'
                      onClick={() => navigate('/chores/create')}
                      type='button'
                    >
                      <FigmaIcon name='plus' size={15} />
                      {t('homeToday.addTask')}
                    </button>
                  </div>
                ) : (
                  todo.map(task => (
                    <CompactTaskRow
                      key={task.id}
                      task={task}
                      onComplete={makeTaskDone}
                      onOpen={openChore}
                    />
                  ))
                )}
              </div>
            </div>

            {/* Completed toggle */}
            <button
              type='button'
              className='btn btn-ghost btn-sm w-full justify-between'
              onClick={() => setShowDone(prev => !prev)}
            >
              <span>{t('homeToday.todaysDone', { count: done.length })}</span>
              <FigmaIcon
                name={showDone ? 'chevron_down' : 'chevron_right'}
                size={16}
              />
            </button>
            {showDone && done.length > 0 && (
              <div className='card overflow-hidden' style={{ opacity: 0.9 }}>
                <div
                  className='border-line border-b px-4 py-3'
                  style={{ borderColor: 'var(--line)' }}
                >
                  <div className='flex items-center gap-2'>
                    <FigmaIcon
                      name='check'
                      size={14}
                      style={{ color: 'var(--sig-done)' }}
                    />
                    <span
                      className='text-primary font-bold'
                      style={{ fontSize: 14 }}
                    >
                      {t('homeToday.completed')}
                    </span>
                    <span className='badge bg-sig-done-bg text-sig-done ms-auto'>
                      {done.length}
                    </span>
                  </div>
                </div>
                <div className='py-1'>
                  {done.map(task => (
                    <CompactTaskRow
                      key={task.id}
                      task={task}
                      onComplete={makeTaskDone}
                      onOpen={openChore}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {view === 'family' && (
          <div className='flex flex-col gap-5'>
            <div>
              <div className='section-label mb-3'>
                {t('homeToday.familyProgressToday')}
              </div>
              <div className='grid grid-cols-2 gap-3 md:grid-cols-3'>
                {household.map(card => (
                  <MemberCard
                    key={card.id}
                    member={card}
                    doneToday={card.done}
                    assignedToday={card.tasks}
                    onClick={() => navigate('/activities')}
                  />
                ))}
              </div>
            </div>
            <div className='card p-5'>
              <div
                className='text-primary mb-1 font-bold'
                style={{ fontSize: 14 }}
              >
                {t('homeToday.householdWorkload')}
              </div>
              <div className='text-faint mb-3' style={{ fontSize: 12 }}>
                {t('homeToday.acrossAllMembers')}
              </div>
              {members.map(member => {
                const stats = household.find(item => item.id === member.id)
                const doneCount = stats?.done ?? 0
                return (
                  <div key={member.id} className='flex items-center gap-3 py-2'>
                    <div
                      className='avatar'
                      style={{
                        width: 26,
                        height: 26,
                        background: member.color,
                        fontSize: 9,
                      }}
                    >
                      {member.initials}
                    </div>
                    <div className='min-w-0 flex-1'>
                      <div
                        className='flex justify-between'
                        style={{ fontSize: 12 }}
                      >
                        <span className='text-primary'>{member.name}</span>
                        <span className='text-faint font-mono'>
                          {t('homeToday.doneCount', { count: doneCount })}
                        </span>
                      </div>
                      <div
                        className='progress-track mt-1'
                        style={{ height: 5 }}
                      >
                        <div
                          className='progress-fill'
                          style={{
                            width: `${Math.min(
                              100,
                              (doneCount / Math.max(1, maxDone)) * 100,
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

TodayScreen.propTypes = {
  done: PropTypes.array.isRequired,
  household: PropTypes.array.isRequired,
  makeTaskDone: PropTypes.func.isRequired,
  members: PropTypes.array.isRequired,
  overdue: PropTypes.array,
  todayKey: PropTypes.string.isRequired,
  todo: PropTypes.array.isRequired,
}
