import { useState } from 'react'

import type { AppCtx } from '../App'
import IconPicker from '../components/IconPicker'
import ThemeSelect from '../components/ThemeSelect'
import type { Project } from '../data'
import { useProjectMutations } from '../hooks/useHousehold'
import { useLiveData } from '../model/liveData'
import { ModulePageHeader, PageLayout } from '../ui/GlobalUI'
import { Icon } from '../ui/Icon'

type EditorMode = 'new' | 'modify' | null

export default function ProjectsScreen({ ctx }: { ctx: AppCtx }) {
  const {
    currentUser,
    memberById,
    projects: liveProjects,
    tasks,
  } = useLiveData()
  const projectMutations = useProjectMutations()
  const [selected, setSelected] = useState<string | null>(null)
  const [editorMode, setEditorMode] = useState<EditorMode>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draftName, setDraftName] = useState('')
  const [draftDescription, setDraftDescription] = useState('')
  const [draftColor, setDraftColor] = useState('var(--project-1)')
  const [draftIcon, setDraftIcon] = useState('📁')

  const isChild = ctx.persona === 'child'
  const projects = isChild
    ? liveProjects.filter(p => p.owner === (currentUser?.id ?? 'none'))
    : liveProjects
  const selectedProject = selected
    ? projects.find(p => p.id === selected)
    : null
  const projectTasks = selectedProject
    ? tasks.filter(t => t.projectId === selectedProject.id)
    : []

  const statusColor = (status: string) => {
    if (status === 'active') return 'var(--sig-done)'
    if (status === 'paused') return 'var(--sig-due)'
    return 'var(--t-faint)'
  }

  const startNew = () => {
    setEditorMode('new')
    setEditingId(null)
    setDraftName('')
    setDraftDescription('')
    setDraftColor('var(--project-1)')
    setDraftIcon('📁')
  }

  const startModify = (project: Project) => {
    setEditorMode('modify')
    setEditingId(project.id)
    setDraftName(project.name)
    setDraftDescription(project.description)
    setDraftColor(project.color)
    setDraftIcon(project.icon ?? '📁')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const saveProject = () => {
    if (!draftName.trim()) {
      ctx.showToast('Project name is required')
      return
    }

    if (editorMode === 'new') {
      projectMutations.createProject.mutate(
        {
          name: draftName.trim(),
          description: draftDescription.trim(),
          color: draftColor,
          icon: draftIcon,
        },
        {
          onError: error => ctx.showToast(error.message),
          onSuccess: project => {
            setSelected(String(project.id))
            ctx.showToast('Project created')
          },
        },
      )
    } else if (editorMode === 'modify' && editingId) {
      projectMutations.updateProject.mutate(
        {
          id: Number(editingId),
          name: draftName.trim(),
          description: draftDescription.trim(),
          color: draftColor,
          icon: draftIcon,
        },
        {
          onError: error => ctx.showToast(error.message),
          onSuccess: () => ctx.showToast('Project modified'),
        },
      )
    }

    setEditorMode(null)
    setEditingId(null)
  }

  const deleteProject = (project: Project) => {
    ctx.showConfirm({
      title: 'Delete project?',
      message: `"${project.name}" will be permanently deleted. Existing tasks are not deleted.`,
      confirmLabel: 'Delete',
      danger: true,
      onConfirm: () => {
        projectMutations.deleteProject.mutate(Number(project.id), {
          onError: error => ctx.showToast(error.message),
          onSuccess: () => {
            setSelected(null)
            ctx.showToast('Project deleted')
          },
        })
      },
    })
  }

  return (
    <PageLayout>
      <ModulePageHeader
        module='projects'
        className='pb-5'
        description='Organized work with multiple tasks'
        actions={
          !isChild ? (
            <button className='btn btn-primary' onClick={startNew}>
              <Icon name='plus' size={14} />
              New project
            </button>
          ) : undefined
        }
      />

      <div className='px-4 md:px-7'>
        {editorMode && (
          <div className='card p-5 mb-5'>
            <div className='flex items-center justify-between mb-4'>
              <div className='form-title text-primary' style={{ fontSize: 16 }}>
                {editorMode === 'new' ? 'New project' : 'Modify project'}
              </div>
              <button
                className='btn btn-ghost btn-icon'
                onClick={() => setEditorMode(null)}
              >
                <Icon name='x' size={16} />
              </button>
            </div>
            <div className='grid gap-4'>
              <div>
                <label
                  className='section-label'
                  style={{ padding: '0 0 6px', display: 'block' }}
                >
                  Project name
                </label>
                <input
                  className='input'
                  value={draftName}
                  onChange={e => setDraftName(e.target.value)}
                  placeholder='Project name'
                  autoFocus
                />
              </div>
              <div>
                <label
                  className='section-label'
                  style={{ padding: '0 0 6px', display: 'block' }}
                >
                  Description
                </label>
                <input
                  className='input'
                  value={draftDescription}
                  onChange={e => setDraftDescription(e.target.value)}
                  placeholder='Project description'
                />
              </div>
              <div
                className='grid gap-4'
                style={{
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                }}
              >
                <div className='flex flex-col gap-1.5'>
                  <span className='section-label' style={{ padding: 0 }}>
                    ICON
                  </span>
                  <IconPicker
                    value={draftIcon}
                    onChange={setDraftIcon}
                    label='Project icon'
                  />
                </div>
                <div className='flex flex-col gap-1.5'>
                  <span className='section-label' style={{ padding: 0 }}>
                    COLOR
                  </span>
                  <ThemeSelect
                    label='Project color'
                    value={draftColor}
                    onChange={setDraftColor}
                    options={[
                      { value: 'var(--project-1)', label: 'Color 1' },
                      { value: 'var(--project-2)', label: 'Color 2' },
                      { value: 'var(--project-3)', label: 'Color 3' },
                    ]}
                  />
                </div>
              </div>
              <div className='flex gap-2'>
                <button className='btn btn-primary' onClick={saveProject}>
                  {editorMode === 'new' ? 'Create project' : 'Save changes'}
                </button>
                <button
                  className='btn btn-secondary'
                  onClick={() => setEditorMode(null)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        <div
          className='grid gap-4'
          style={{
            gridTemplateColumns:
              'repeat(auto-fit, minmax(min(100%, 250px), 1fr))',
          }}
        >
          {projects.map(p => {
            const owner = memberById(p.owner)
            const taskCount = tasks.filter(t => t.projectId === p.id).length
            const isSelected = selected === p.id
            return (
              <div
                key={p.id}
                className='card p-5 cursor-pointer'
                style={{
                  border: isSelected
                    ? '1px solid var(--selected-border)'
                    : '1px solid var(--line)',
                  opacity: p.status === 'paused' ? 0.72 : 1,
                }}
                onClick={() => setSelected(isSelected ? null : p.id)}
              >
                <div className='flex items-start justify-between mb-3'>
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 'var(--r-md)',
                      background: `color-mix(in srgb, ${p.color} 13%, transparent)`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <span
                      role='img'
                      aria-label='Project icon'
                      style={{ fontSize: 23, lineHeight: 1 }}
                    >
                      {p.icon ?? '📁'}
                    </span>
                  </div>
                  <span
                    className='badge'
                    style={{
                      background: `color-mix(in srgb, ${statusColor(p.status)} 10%, transparent)`,
                      color: statusColor(p.status),
                      fontSize: 10,
                    }}
                  >
                    {p.status === 'paused' ? 'inactive' : p.status}
                  </span>
                </div>
                <div
                  className='font-bold text-primary mb-1'
                  style={{ fontSize: 14 }}
                >
                  {p.name}
                </div>
                <div className='text-muted mb-4' style={{ fontSize: 12 }}>
                  {p.description}
                </div>
                <div
                  className='flex justify-between text-faint mb-2'
                  style={{ fontSize: 11 }}
                >
                  <span>
                    {taskCount} task{taskCount !== 1 ? 's' : ''}
                  </span>
                  <span className='font-bold' style={{ color: p.color }}>
                    {p.progress}%
                  </span>
                </div>
                <div className='progress-track' style={{ height: 6 }}>
                  <div
                    className='progress-fill'
                    style={{ width: `${p.progress}%`, background: p.color }}
                  />
                </div>
                {p.dueDate && (
                  <div
                    className='flex items-center gap-1 mt-3 text-faint'
                    style={{ fontSize: 11 }}
                  >
                    <Icon name='calendar' size={11} />
                    Due {p.dueDate}
                  </div>
                )}
                {owner && (
                  <div className='flex items-center gap-1 mt-2'>
                    <div
                      className='avatar'
                      style={{
                        width: 18,
                        height: 18,
                        background: owner.avatarColor,
                        fontSize: 7,
                      }}
                    >
                      {owner.initials}
                    </div>
                    <span className='text-faint' style={{ fontSize: 11 }}>
                      {owner.name}
                    </span>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {selectedProject && (
          <div className='card mt-5 overflow-hidden'>
            <div
              className='flex items-center justify-between px-5 py-4 border-b border-line'
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
                <div>
                  <div
                    className='font-bold text-primary'
                    style={{ fontSize: 16 }}
                  >
                    {selectedProject.name}
                  </div>
                  <div className='text-faint' style={{ fontSize: 11 }}>
                    {selectedProject.status === 'paused'
                      ? 'Inactive'
                      : 'Active'}
                  </div>
                </div>
              </div>
              <button
                className='btn btn-ghost btn-icon'
                onClick={() => setSelected(null)}
              >
                <Icon name='x' size={16} />
              </button>
            </div>

            {!isChild && (
              <div
                className='flex flex-wrap gap-2 px-5 py-3 border-b border-line'
                style={{ borderColor: 'var(--line)' }}
              >
                <button
                  className='btn btn-secondary btn-sm'
                  onClick={() => startModify(selectedProject)}
                >
                  Modify
                </button>
                <button
                  className='btn btn-ghost btn-sm'
                  style={{ color: 'var(--sig-over)' }}
                  onClick={() => deleteProject(selectedProject)}
                >
                  Delete
                </button>
              </div>
            )}

            <div className='py-1'>
              {projectTasks.length === 0 ? (
                <div className='empty-state py-10'>
                  <div style={{ fontSize: 32 }}>📋</div>
                  <div className='font-bold text-primary'>No tasks yet</div>
                  <span className='text-muted' style={{ fontSize: 12 }}>
                    Use + beside notifications to create a task.
                  </span>
                </div>
              ) : (
                projectTasks.map(t => (
                  <div
                    key={t.id}
                    className='task-row'
                    onClick={() => ctx.openTask(t)}
                  >
                    <div
                      className={`task-check ${t.status === 'done' ? 'checked' : ''}`}
                    >
                      {t.status === 'done' && (
                        <Icon
                          name='check'
                          size={11}
                          style={{ color: 'white' }}
                        />
                      )}
                    </div>
                    <div className='flex-1 min-w-0'>
                      <div
                        className='text-primary font-medium'
                        style={{
                          fontSize: 14,
                          textDecoration:
                            t.status === 'done' ? 'line-through' : 'none',
                        }}
                      >
                        {t.title}
                      </div>
                      {t.subtasks && (
                        <div
                          className='text-faint'
                          style={{ fontSize: 11, marginTop: 2 }}
                        >
                          {t.subtasks.filter(s => s.done).length}/
                          {t.subtasks.length} subtasks
                        </div>
                      )}
                    </div>
                    {t.dueDate && (
                      <span className='text-faint' style={{ fontSize: 11 }}>
                        {t.dueDate}
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </PageLayout>
  )
}
