import { useState } from 'react'

import { AppCtx, Icon } from '../App'
import DateField from '../components/DateField'
import IconPicker from '../components/IconPicker'
import MemberPicker from '../components/MemberPicker'
import ThemeSelect from '../components/ThemeSelect'
import type { Project } from '../data'
import { useLiveData } from '../model/liveData'

type EditorMode = 'new' | 'modify' | null
const makeId = () =>
  globalThis.crypto?.randomUUID?.() ??
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`

export default function ProjectsScreen({ ctx }: { ctx: AppCtx }) {
  const {
    currentUser,
    memberById,
    projects: liveProjects,
    tasks,
  } = useLiveData()
  const [projectItems, setProjectItems] = useState<Project[]>(liveProjects)
  const [selected, setSelected] = useState<string | null>(null)
  const [editorMode, setEditorMode] = useState<EditorMode>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draftName, setDraftName] = useState('')
  const [draftDescription, setDraftDescription] = useState('')
  const [draftOwner, setDraftOwner] = useState(currentUser?.id ?? '')
  const [draftDueDate, setDraftDueDate] = useState('')
  const [draftColor, setDraftColor] = useState('var(--project-1)')
  const [draftIcon, setDraftIcon] = useState('📁')

  const isChild = ctx.persona === 'child'
  const projects = isChild
    ? projectItems.filter(p => p.owner === (currentUser?.id ?? 'none'))
    : projectItems
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
    setDraftOwner(currentUser?.id ?? '')
    setDraftDueDate('')
    setDraftColor('var(--project-1)')
    setDraftIcon('📁')
  }

  const startModify = (project: Project) => {
    setEditorMode('modify')
    setEditingId(project.id)
    setDraftName(project.name)
    setDraftDescription(project.description)
    setDraftOwner(project.owner)
    setDraftDueDate(project.dueDate ?? '')
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
      const id = `proj-${makeId()}`
      setProjectItems(prev => [
        ...prev,
        {
          id,
          name: draftName.trim(),
          description: draftDescription.trim(),
          color: draftColor,
          icon: draftIcon,
          progress: 0,
          taskIds: [],
          owner: draftOwner,
          dueDate: draftDueDate || undefined,
          status: 'active',
        },
      ])
      setSelected(id)
      ctx.showToast('Project created')
    } else if (editorMode === 'modify' && editingId) {
      setProjectItems(prev =>
        prev.map(p =>
          p.id === editingId
            ? {
                ...p,
                name: draftName.trim(),
                description: draftDescription.trim(),
                owner: draftOwner,
                dueDate: draftDueDate || undefined,
                color: draftColor,
                icon: draftIcon,
              }
            : p,
        ),
      )
      ctx.showToast('Project modified')
    }

    setEditorMode(null)
    setEditingId(null)
  }

  const deactivateProject = (project: Project) => {
    setProjectItems(prev =>
      prev.map(p => (p.id === project.id ? { ...p, status: 'paused' } : p)),
    )
    ctx.showToast('Project deactivated')
  }

  const reactivateProject = (project: Project) => {
    setProjectItems(prev =>
      prev.map(p => (p.id === project.id ? { ...p, status: 'active' } : p)),
    )
    ctx.showToast('Project activated')
  }

  const deleteProject = (project: Project) => {
    ctx.showConfirm({
      title: 'Delete project?',
      message: `"${project.name}" will be permanently deleted. Existing tasks are not deleted.`,
      confirmLabel: 'Delete',
      danger: true,
      onConfirm: () => {
        setProjectItems(prev => prev.filter(p => p.id !== project.id))
        setSelected(null)
        ctx.showToast('Project deleted')
      },
    })
  }

  return (
    <div style={{ maxWidth: 1080, margin: '0 auto', padding: '0 0 40px' }}>
      <div className='page-header pb-5'>
        <div>
          <h1
            className='text-primary'
            style={{ fontSize: 24, fontWeight: 800, margin: 0 }}
          >
            Projects
          </h1>
          <div className='text-muted' style={{ fontSize: 13, marginTop: 4 }}>
            Organized work with multiple tasks
          </div>
        </div>
        {!isChild && (
          <button className='btn btn-primary' onClick={startNew}>
            <Icon name='plus' size={14} />
            New project
          </button>
        )}
      </div>

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
                    OWNER
                  </span>
                  <MemberPicker
                    value={draftOwner}
                    onChange={setDraftOwner}
                    label='Project owner'
                  />
                </div>
                <div className='flex flex-col gap-1.5'>
                  <span className='section-label' style={{ padding: 0 }}>
                    DUE DATE (OPTIONAL)
                  </span>
                  <DateField
                    value={draftDueDate}
                    onChange={setDraftDueDate}
                    label='Project due date'
                    allowClear
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
                {selectedProject.status === 'paused' ? (
                  <button
                    className='btn btn-secondary btn-sm'
                    onClick={() => reactivateProject(selectedProject)}
                  >
                    Activate
                  </button>
                ) : (
                  <button
                    className='btn btn-secondary btn-sm'
                    onClick={() => deactivateProject(selectedProject)}
                  >
                    Deactivate
                  </button>
                )}
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
    </div>
  )
}
