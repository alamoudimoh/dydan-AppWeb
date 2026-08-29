import PropTypes from 'prop-types'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

import FigmaIcon from '../../../components/FigmaIcon'
import { formatDate } from '../homeModel'

function CompactTaskRow({ onComplete, onOpen, task }) {
  const { i18n, t } = useTranslation('common')
  const isDone = task.status === 'done'
  return (
    <div
      className='task-row'
      style={{ padding: '8px 12px' }}
      onClick={() => onOpen(task)}
      role='button'
      tabIndex={0}
    >
      <button
        type='button'
        className={`task-check ${isDone ? 'checked' : ''}`}
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
      <div className='min-w-0 flex-1'>
        <div
          className={`text-primary font-medium ${isDone ? 'text-faint line-through' : ''}`}
          style={{ fontSize: 13 }}
        >
          {task.title}
        </div>
        <div className='mt-0.5 flex items-center gap-2'>
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
          {task.dueDate && (
            <span className='text-faint' style={{ fontSize: 10 }}>
              {formatDate(task.dueDate, {
                locale: i18n.resolvedLanguage || 'en',
                t,
              })}
            </span>
          )}
        </div>
      </div>
      {task.points > 0 && (
        <span className='text-faint font-mono' style={{ fontSize: 11 }}>
          +{task.points}
        </span>
      )}
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
      className='card flex flex-col gap-2 p-4 text-left'
      onClick={onClick}
    >
      <div className='flex items-center gap-2'>
        <div
          className='avatar'
          style={{
            width: 30,
            height: 30,
            background: member.color,
            fontSize: 11,
          }}
        >
          {member.initials}
        </div>
        <div
          className='text-primary truncate font-semibold'
          style={{ fontSize: 13 }}
        >
          {member.name}
        </div>
      </div>
      <div className='flex items-baseline justify-between'>
        <span className='text-faint' style={{ fontSize: 11 }}>
          {t('homeToday.todayLower')}
        </span>
        <span className='font-mono font-bold' style={{ fontSize: 16 }}>
          {doneToday}
          <span className='text-faint ms-1' style={{ fontSize: 11 }}>
            / {assignedToday}
          </span>
        </span>
      </div>
      <div className='progress-track' style={{ height: 6 }}>
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
  todayKey,
  todo,
}) {
  const { i18n, t } = useTranslation('common')
  const navigate = useNavigate()
  const openChore = task => navigate(`/chores/${task.choreId}`)
  const [view, setView] = useState('mine')
  const [showDone, setShowDone] = useState(false)
  const maxDone = Math.max(1, ...household.map(item => item.done))

  return (
    <div style={{ padding: '0 0 40px' }}>
      <div className='px-4 md:px-7'>
        <div className='page-header pb-6'>
          <div>
            <h1
              className='text-primary'
              style={{ fontSize: 26, fontWeight: 800, margin: 0 }}
            >
              {t('homeToday.today')}
            </h1>
            <p
              className='text-muted'
              style={{ fontSize: 14, margin: '6px 0 0' }}
            >
              {formatDate(todayKey, {
                locale: i18n.resolvedLanguage || 'en',
                t,
              })}{' '}
              · {t('homeToday.tasksToGo', { count: todo.length })}
            </p>
          </div>
          <button
            className='btn btn-secondary hidden md:flex'
            onClick={() => navigate('/chores/create')}
          >
            <FigmaIcon name='plus' size={15} />
            {t('homeToday.newTask')}
          </button>
        </div>

        <div className='view-toggle mb-5'>
          <button
            type='button'
            className={view === 'mine' ? 'active' : ''}
            onClick={() => setView('mine')}
          >
            {t('homeToday.forMe')}
          </button>
          <button
            type='button'
            className={view === 'family' ? 'active' : ''}
            onClick={() => setView('family')}
          >
            {t('homeToday.family')}
          </button>
        </div>

        {view === 'mine' && (
          <div className='flex flex-col gap-4'>
            <div className='card overflow-hidden'>
              <div
                className='border-line border-b px-4 py-3'
                style={{ borderColor: 'var(--line)' }}
              >
                <div className='flex items-center gap-2'>
                  <FigmaIcon
                    name='check'
                    size={14}
                    style={{ color: 'var(--brand)' }}
                  />
                  <span
                    className='text-primary font-bold'
                    style={{ fontSize: 13 }}
                  >
                    {t('homeToday.assignedToMe')}
                  </span>
                  <span className='badge ms-auto' style={{ fontSize: 11 }}>
                    {todo.length}
                  </span>
                </div>
              </div>
              <div className='py-1'>
                {todo.length === 0 ? (
                  <div className='empty-state py-10'>
                    <div style={{ fontSize: 32 }}>🎉</div>
                    <div className='text-primary font-bold'>
                      {t('homeToday.nothingLeft')}
                    </div>
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
              <div className='card overflow-hidden'>
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
              <div
                className='grid gap-3'
                style={{
                  gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                }}
              >
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
  todayKey: PropTypes.string.isRequired,
  todo: PropTypes.array.isRequired,
}
