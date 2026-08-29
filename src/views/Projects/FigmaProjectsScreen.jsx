import PropTypes from 'prop-types'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import FigmaIcon from '../../components/FigmaIcon'
import { isProjectTaskDone, projectTasks } from './projectViewModel'

const statusColor = status => {
  if (status === 'active') return 'var(--sig-done)'
  if (status === 'paused') return 'var(--sig-due)'
  return 'var(--t-faint)'
}

function DetailTaskRow({ onComplete, onOpen, task }) {
  const { t } = useTranslation('projects')
  const done = task.status === 'done'
  return (
    <div
      key={task.id}
      className='task-row'
      onClick={() => onOpen(task)}
      style={{ paddingLeft: 0 }}
    >
      <div
        className={`task-check ${done ? 'checked' : ''}`}
        onClick={event => {
          event.stopPropagation()
          onComplete(task, done)
        }}
      >
        {done && (
          <FigmaIcon name='check' size={11} style={{ color: 'white' }} />
        )}
      </div>
      <div className='min-w-0 flex-1'>
        <div
          className='text-primary font-medium'
          style={{
            fontSize: 14,
            textDecoration: done ? 'line-through' : 'none',
          }}
        >
          {task.title}
        </div>
        {task.subtasks && (
          <div className='text-faint' style={{ fontSize: 11, marginTop: 2 }}>
            {task.subtasks.filter(subtask => subtask.done).length}/
            {task.subtasks.length} {t('detail.subtasks')}
          </div>
        )}
      </div>
      {task.dueDate && (
        <span className='text-faint' style={{ fontSize: 11 }}>
          {task.dueDate}
        </span>
      )}
    </div>
  )
}

export default function FigmaProjectsScreen({
  canCreate,
  canManageProject,
  chores,
  members,
  onCompleteTask,
  onDeleteProject,
  onEditProject,
  onNewProject,
  onOpenTask,
  profile,
  projects,
}) {
  const { t } = useTranslation('projects')
  const [selected, setSelected] = useState(null)
  const selectedProject = selected
    ? projects.find(project => project.id === selected)
    : null
  const now = new Date()
  const tasks = selectedProject
    ? projectTasks(chores, selectedProject.id, now)
    : []

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 0 40px' }}>
      <div className='page-header pb-5'>
        <div>
          <h1
            className='text-primary'
            style={{ fontSize: 24, fontWeight: 800, margin: 0 }}
          >
            {t('title')}
          </h1>
          <div className='text-muted' style={{ fontSize: 13, marginTop: 4 }}>
            {t('subtitle')}
          </div>
        </div>
        {canCreate && (
          <button className='btn btn-primary' onClick={onNewProject}>
            <FigmaIcon name='plus' size={14} />
            {t('newProject')}
          </button>
        )}
      </div>

      <div className='px-4 md:px-7'>
        <div
          className='grid gap-4'
          style={{
            gridTemplateColumns: selected ? '1fr 1fr' : '1fr 1fr 1fr',
          }}
        >
          {projects.map(project => {
            const isSelected = selected === project.id
            return (
              <div
                key={project.id}
                className='card cursor-pointer p-5'
                style={{
                  border: isSelected
                    ? `2px solid ${project.color}`
                    : '1px solid var(--line)',
                }}
                onClick={() => setSelected(isSelected ? null : project.id)}
              >
                <div className='mb-3 flex items-start justify-between'>
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 'var(--r-md)',
                      background: `color-mix(in srgb, ${project.color} 13%, transparent)`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <FigmaIcon
                      name='projects'
                      size={18}
                      style={{ color: project.color }}
                    />
                  </div>
                  <span
                    className='badge'
                    style={{
                      background: `color-mix(in srgb, ${statusColor(project.status)} 10%, transparent)`,
                      color: statusColor(project.status),
                      fontSize: 10,
                    }}
                  >
                    {project.status}
                  </span>
                </div>
                <div
                  className='text-primary mb-1 font-bold'
                  style={{ fontSize: 14 }}
                >
                  {project.name}
                </div>
                <div className='text-muted mb-4' style={{ fontSize: 12 }}>
                  {project.description}
                </div>
                <div
                  className='text-faint mb-2 flex justify-between'
                  style={{ fontSize: 11 }}
                >
                  <span>
                    {project.taskCount} task{project.taskCount !== 1 ? 's' : ''}
                  </span>
                  <span className='font-bold' style={{ color: project.color }}>
                    {project.progress}%
                  </span>
                </div>
                <div className='progress-track' style={{ height: 6 }}>
                  <div
                    className='progress-fill'
                    style={{
                      width: `${project.progress}%`,
                      background: project.color,
                    }}
                  />
                </div>
                {project.dueDate && (
                  <div
                    className='text-faint mt-3 flex items-center gap-1'
                    style={{ fontSize: 11 }}
                  >
                    <FigmaIcon name='calendar' size={11} />
                    {t('card.due')} {project.dueDate}
                  </div>
                )}
                {project.owner && (
                  <div className='mt-2 flex items-center gap-1'>
                    <div
                      className='avatar'
                      style={{
                        width: 18,
                        height: 18,
                        background: project.owner.avatarColor,
                        fontSize: 7,
                      }}
                    >
                      {project.owner.initials}
                    </div>
                    <span className='text-faint' style={{ fontSize: 11 }}>
                      {project.owner.name}
                    </span>
                  </div>
                )}
              </div>
            )
          })}
          {canCreate && (
            <button
              className='card hover:border-brand flex cursor-pointer flex-col items-center justify-center gap-3 border-2 border-dashed p-5'
              style={{
                borderColor: 'var(--line)',
                minHeight: 160,
                borderStyle: 'dashed',
              }}
              onClick={onNewProject}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: '50%',
                  background: 'var(--brand-faint)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <FigmaIcon
                  name='plus'
                  size={22}
                  style={{ color: 'var(--brand)' }}
                />
              </div>
              <span
                className='text-brand font-semibold'
                style={{ fontSize: 13 }}
              >
                {t('newProject')}
              </span>
            </button>
          )}
        </div>

        {selectedProject && (
          <div className='card mt-5 overflow-hidden'>
            <div
              className='border-line flex items-center justify-between border-b px-5 py-4'
              style={{ borderColor: 'var(--line)' }}
            >
              <div className='flex items-center gap-3'>
                <div
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 'var(--r-xs)',
                    background: selectedProject.color,
                  }}
                />
                <div
                  className='text-primary font-bold'
                  style={{ fontSize: 16 }}
                >
                  {selectedProject.name}
                </div>
              </div>
              <div className='flex items-center gap-2'>
                {canManageProject(selectedProject) && (
                  <>
                    <button
                      className='btn btn-ghost btn-icon'
                      aria-label={t('detail.edit')}
                      onClick={() => onEditProject(selectedProject)}
                    >
                      <FigmaIcon name='edit' size={16} />
                    </button>
                    <button
                      className='btn btn-ghost btn-icon'
                      aria-label={t('detail.delete')}
                      onClick={() => onDeleteProject(selectedProject)}
                    >
                      <FigmaIcon name='trash' size={16} />
                    </button>
                  </>
                )}
                <button
                  className='btn btn-ghost btn-icon'
                  onClick={() => setSelected(null)}
                >
                  <FigmaIcon name='x' size={16} />
                </button>
              </div>
            </div>
            <div className='py-1'>
              {tasks.length === 0 ? (
                <div className='empty-state py-10'>
                  <div style={{ fontSize: 32 }}>📋</div>
                  <div className='text-primary font-bold'>
                    {t('empty.title')}
                  </div>
                  <button
                    className='btn btn-primary mt-3'
                    onClick={onNewProject}
                  >
                    <FigmaIcon name='plus' size={14} />
                    {t('empty.addTask')}
                  </button>
                </div>
              ) : (
                tasks.map(task => (
                  <DetailTaskRow
                    key={task.id}
                    task={task}
                    onComplete={onCompleteTask}
                    onOpen={onOpenTask}
                  />
                ))
              )}
            </div>
            <div
              className='border-line border-t px-4 py-3'
              style={{ borderColor: 'var(--line)' }}
            >
              <button
                className='btn btn-secondary btn-sm'
                onClick={onNewProject}
              >
                <FigmaIcon name='plus' size={13} />
                {t('empty.addTask')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

FigmaProjectsScreen.propTypes = {
  canCreate: PropTypes.bool.isRequired,
  canManageProject: PropTypes.func.isRequired,
  chores: PropTypes.array,
  members: PropTypes.array,
  onCompleteTask: PropTypes.func.isRequired,
  onDeleteProject: PropTypes.func.isRequired,
  onEditProject: PropTypes.func.isRequired,
  onNewProject: PropTypes.func.isRequired,
  onOpenTask: PropTypes.func.isRequired,
  profile: PropTypes.object,
  projects: PropTypes.array.isRequired,
}

FigmaProjectsScreen.defaultProps = {
  chores: [],
  members: [],
  profile: null,
}
