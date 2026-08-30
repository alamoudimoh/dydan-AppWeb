import {
  closestCenter,
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useCallback, useRef, useState } from 'react'
import { flushSync } from 'react-dom'

import FigmaIcon from '../../components/FigmaIcon'
import { useImpersonateUser } from '../../contexts/ImpersonateUserContext'
import { useLocalization } from '../../contexts/LocalizationContext'
import { useUserProfile } from '../../queries/UserQueries'
import { CompleteSubTask } from '../../utils/Fetcher'

function getVisibleOrder(tasks, expandedIds) {
  const result = []
  const addTask = task => {
    result.push(task)
    if (expandedIds.has(task.id)) {
      tasks
        .filter(t => t.parentId === task.id)
        .sort((a, b) => a.orderId - b.orderId)
        .forEach(addTask)
    }
  }
  tasks
    .filter(t => t.parentId === null)
    .sort((a, b) => a.orderId - b.orderId)
    .forEach(addTask)
  return result
}

function nextTempId(tasks) {
  return Math.min(0, ...tasks.map(t => t.id)) - 1
}

function SortableItem({
  allTasks,
  editMode,
  expandedIds,
  handleToggle,
  inputRefs,
  level,
  onKeyDown,
  onToggleExpand,
  performers,
  setTasks,
  task,
}) {
  const { fmt } = useLocalization()
  const {
    attributes,
    listeners,
    setActivatorNodeRef,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: task.id })

  const expanded = expandedIds.has(task.id)
  const childTasks = allTasks
    .filter(t => t.parentId === task.id)
    .sort((a, b) => a.orderId - b.orderId)
  const hasChildren = childTasks.length > 0

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    display: 'flex',
    alignItems: 'center',
    touchAction: 'auto',
    paddingInlineStart: `${level * 24}px`,
  }

  return (
    <>
      <div
        ref={setNodeRef}
        className={`task-row ${task.completedAt ? 'done' : ''}`}
        role='listitem'
        style={style}
      >
        {editMode && (
          <button
            ref={setActivatorNodeRef}
            type='button'
            className='btn btn-ghost btn-icon'
            {...attributes}
            {...listeners}
            data-drag-handle='true'
            aria-label='Drag to reorder'
            style={{ cursor: 'grab', touchAction: 'none' }}
          >
            <FigmaIcon name='bars' size={18} />
          </button>
        )}

        {hasChildren ? (
          <button
            type='button'
            className='btn btn-ghost btn-icon'
            aria-label={expanded ? 'Collapse subtasks' : 'Expand subtasks'}
            aria-expanded={expanded}
            onClick={() => onToggleExpand(task.id)}
          >
            <FigmaIcon
              name={expanded ? 'chevron_down' : 'chevron_right'}
              size={18}
              className={expanded ? '' : 'rtl-flip'}
            />
          </button>
        ) : level > 0 ? (
          <span aria-hidden='true' style={{ flex: '0 0 36px' }} />
        ) : null}

        <div style={{ alignItems: 'center', display: 'flex', flex: 1, gap: 8 }}>
          {!editMode && (
            <button
              type='button'
              aria-checked={!!task.completedAt}
              aria-label={
                task.completedAt
                  ? 'Mark subtask incomplete'
                  : 'Mark subtask complete'
              }
              className={`task-check ${task.completedAt ? 'checked' : ''}`}
              onClick={() => handleToggle(task.id)}
              role='checkbox'
            >
              {task.completedAt && (
                <FigmaIcon name='check' size={11} style={{ color: 'white' }} />
              )}
            </button>
          )}

          {editMode ? (
            <input
              ref={el => {
                inputRefs.current[task.id] = el
              }}
              className='input'
              value={task.name}
              placeholder='Task name...'
              onChange={e =>
                setTasks(prev =>
                  prev.map(t =>
                    t.id === task.id ? { ...t, name: e.target.value } : t,
                  ),
                )
              }
              onKeyDown={e => onKeyDown(e, task)}
              style={{
                background: 'transparent',
                border: 'none',
                boxShadow: 'none',
                flex: 1,
                minWidth: 0,
              }}
            />
          ) : (
            <button
              type='button'
              className='btn btn-ghost'
              style={{
                alignItems: 'flex-start',
                flex: 1,
                flexDirection: 'column',
                justifyContent: 'center',
                minHeight: 50,
                minWidth: 0,
                padding: 0,
                textAlign: 'start',
                whiteSpace: 'normal',
              }}
              onClick={() => handleToggle(task.id)}
            >
              <span
                className='task-title'
                style={{
                  color: 'var(--t-primary)',
                  textDecoration: task.completedAt ? 'line-through' : 'none',
                }}
              >
                {task.name}
              </span>
              {task.completedAt && (
                <span
                  className='text-muted'
                  style={{
                    alignItems: 'center',
                    display: 'flex',
                    fontSize: 12,
                    gap: 6,
                  }}
                >
                  {fmt.dateTime(task.completedAt)}
                  {performers?.find(p => p.userId === task.completedBy) && (
                    <span className='badge'>
                      {
                        performers.find(p => p.userId === task.completedBy)
                          .displayName
                      }
                    </span>
                  )}
                </span>
              )}
            </button>
          )}
        </div>

        {editMode && (
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type='button'
              className='btn btn-danger btn-icon btn-sm'
              aria-label='Delete subtask'
              title='Delete (Shift+Backspace)'
              onClick={() =>
                onKeyDown(
                  {
                    key: 'Backspace',
                    shiftKey: true,
                    preventDefault: () => {},
                  },
                  task,
                )
              }
            >
              <FigmaIcon name='trash' size={16} />
            </button>
          </div>
        )}
      </div>

      {hasChildren && expanded && (
        <div role='group'>
          {childTasks.map(childTask => (
            <SortableItem
              key={childTask.id}
              task={childTask}
              allTasks={allTasks}
              setTasks={setTasks}
              level={level + 1}
              editMode={editMode}
              expandedIds={expandedIds}
              onToggleExpand={onToggleExpand}
              handleToggle={handleToggle}
              inputRefs={inputRefs}
              onKeyDown={onKeyDown}
              performers={performers}
            />
          ))}
        </div>
      )}
    </>
  )
}

const SubTasks = ({
  choreId = 0,
  editMode = true,
  performers,
  setTasks,
  shouldFocus = false,
  tasks = [],
}) => {
  const [newTask, setNewTask] = useState('')
  const [expandedIds, setExpandedIds] = useState(new Set())
  const { data: userProfile } = useUserProfile()
  const { impersonatedUser } = useImpersonateUser()
  const inputRefs = useRef({})

  const focusId = id => {
    setTimeout(() => {
      inputRefs.current[id]?.focus()
    }, 50)
  }

  const topLevelTasks = tasks.filter(task => task.parentId === null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { delay: 100, tolerance: 8 },
    }),
  )

  const handleToggle = taskId => {
    const updatedTask = tasks.find(task => task.id === taskId)
    const newCompletedAt = updatedTask.completedAt
      ? null
      : new Date().toISOString()

    const updatedTasks = tasks.map(task =>
      task.id === taskId
        ? {
            ...task,
            completedAt: newCompletedAt,
            completedBy: impersonatedUser?.userId || userProfile?.id,
          }
        : task,
    )

    if (newCompletedAt) {
      const completeChildren = parentId => {
        const children = updatedTasks.filter(t => t.parentId === parentId)
        children.forEach(child => {
          const index = updatedTasks.findIndex(t => t.id === child.id)
          if (index !== -1) {
            updatedTasks[index] = {
              ...updatedTasks[index],
              completedAt: newCompletedAt,
            }
            completeChildren(child.id)
          }
        })
      }
      completeChildren(taskId)
    }

    CompleteSubTask(taskId, Number(choreId), newCompletedAt).then(res => {
      if (res.status !== 200) console.log('Error updating task')
    })

    setTasks(updatedTasks)
  }

  const handleDelete = useCallback(
    taskId => {
      const findDescendants = id => {
        const descendants = []
        tasks
          .filter(t => t.parentId === id)
          .forEach(child => {
            descendants.push(child.id)
            descendants.push(...findDescendants(child.id))
          })
        return descendants
      }
      const idsToDelete = [taskId, ...findDescendants(taskId)]
      setTasks(
        tasks
          .filter(task => !idsToDelete.includes(task.id))
          .map((task, index) => ({
            ...task,
            orderId: task.parentId === null ? index : task.orderId,
          })),
      )
    },
    [tasks, setTasks],
  )

  const handleToggleExpand = useCallback(taskId => {
    setExpandedIds(prev => {
      const next = new Set(prev)
      next.has(taskId) ? next.delete(taskId) : next.add(taskId)
      return next
    })
  }, [])

  const handleKeyDown = useCallback(
    (e, task) => {
      const input = inputRefs.current[task.id]
      const selStart = input?.selectionStart ?? 0
      const selEnd = input?.selectionEnd ?? 0
      const valLen = input?.value?.length ?? 0
      const cursorAtStart = selStart === 0 && selEnd === 0
      const cursorAtEnd = selStart === valLen && selEnd === valLen

      // Enter → add sibling after current task at same level
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        const newId = nextTempId(tasks)
        const newTaskObj = {
          id: newId,
          name: '',
          completedAt: null,
          parentId: task.parentId,
          orderId: task.orderId + 1,
        }
        setTasks(prev => [
          ...prev.map(t =>
            t.parentId === task.parentId && t.orderId > task.orderId
              ? { ...t, orderId: t.orderId + 1 }
              : t,
          ),
          newTaskObj,
        ])
        focusId(newId)
        return
      }

      // Shift+Enter → add child subtask nested under current
      if (e.key === 'Enter' && e.shiftKey) {
        e.preventDefault()
        const newId = nextTempId(tasks)
        const childCount = tasks.filter(t => t.parentId === task.id).length
        const newTaskObj = {
          id: newId,
          name: '',
          completedAt: null,
          parentId: task.id,
          orderId: childCount,
        }
        setExpandedIds(prev => new Set([...prev, task.id]))
        setTasks(prev => [...prev, newTaskObj])
        focusId(newId)
        return
      }

      // ArrowUp → focus previous visible task
      if (e.key === 'ArrowUp' && !e.shiftKey) {
        e.preventDefault()
        const visible = getVisibleOrder(tasks, expandedIds)
        const idx = visible.findIndex(t => t.id === task.id)
        if (idx > 0) inputRefs.current[visible[idx - 1].id]?.focus()
        return
      }

      // ArrowDown → focus next visible task
      if (e.key === 'ArrowDown' && !e.shiftKey) {
        e.preventDefault()
        const visible = getVisibleOrder(tasks, expandedIds)
        const idx = visible.findIndex(t => t.id === task.id)
        if (idx < visible.length - 1)
          inputRefs.current[visible[idx + 1].id]?.focus()
        return
      }

      // Shift+ArrowUp → move task up among siblings; at top, promote before parent
      if (e.key === 'ArrowUp' && e.shiftKey) {
        e.preventDefault()
        const siblings = tasks
          .filter(t => t.parentId === task.parentId)
          .sort((a, b) => a.orderId - b.orderId)
        const idx = siblings.findIndex(t => t.id === task.id)
        if (idx <= 0) {
          // Already first sibling — promote to parent level, insert before parent
          if (task.parentId === null) return
          const parent = tasks.find(t => t.id === task.parentId)
          if (!parent) return
          setTasks(prev =>
            prev.map(t => {
              // Shift items at parent's orderId and above to make room
              if (t.id === task.id)
                return {
                  ...t,
                  parentId: parent.parentId,
                  orderId: parent.orderId,
                }
              if (
                t.parentId === parent.parentId &&
                t.orderId >= parent.orderId &&
                t.id !== task.id
              )
                return { ...t, orderId: t.orderId + 1 }
              return t
            }),
          )
          focusId(task.id)
          return
        }
        const prev = siblings[idx - 1]
        setTasks(all =>
          all.map(t => {
            if (t.id === task.id) return { ...t, orderId: prev.orderId }
            if (t.id === prev.id) return { ...t, orderId: task.orderId }
            return t
          }),
        )
        focusId(task.id)
        return
      }

      // Shift+ArrowDown → move task down among siblings; at bottom, promote after parent
      if (e.key === 'ArrowDown' && e.shiftKey) {
        e.preventDefault()
        const siblings = tasks
          .filter(t => t.parentId === task.parentId)
          .sort((a, b) => a.orderId - b.orderId)
        const idx = siblings.findIndex(t => t.id === task.id)
        if (idx >= siblings.length - 1) {
          // Already last sibling — promote to parent level, insert after parent
          if (task.parentId === null) return
          const parent = tasks.find(t => t.id === task.parentId)
          if (!parent) return
          setTasks(prev =>
            prev.map(t => {
              if (t.id === task.id)
                return {
                  ...t,
                  parentId: parent.parentId,
                  orderId: parent.orderId + 1,
                }
              if (
                t.parentId === parent.parentId &&
                t.orderId > parent.orderId &&
                t.id !== task.id
              )
                return { ...t, orderId: t.orderId + 1 }
              return t
            }),
          )
          focusId(task.id)
          return
        }
        const next = siblings[idx + 1]
        setTasks(all =>
          all.map(t => {
            if (t.id === task.id) return { ...t, orderId: next.orderId }
            if (t.id === next.id) return { ...t, orderId: task.orderId }
            return t
          }),
        )
        focusId(task.id)
        return
      }

      // Shift+ArrowLeft (at cursor start) or Shift+Tab → outdent one level
      const shouldOutdent =
        (e.key === 'ArrowLeft' && e.shiftKey && cursorAtStart) ||
        (e.key === 'Tab' && e.shiftKey)

      if (shouldOutdent) {
        e.preventDefault()
        if (task.parentId === null) return
        const parent = tasks.find(t => t.id === task.parentId)
        if (!parent) return
        const newOrderId = parent.orderId + 1
        setTasks(prev =>
          prev.map(t => {
            if (t.id === task.id)
              return { ...t, parentId: parent.parentId, orderId: newOrderId }
            if (
              t.parentId === parent.parentId &&
              t.orderId >= newOrderId &&
              t.id !== task.id
            )
              return { ...t, orderId: t.orderId + 1 }
            return t
          }),
        )
        focusId(task.id)
        return
      }

      // Shift+ArrowRight (at cursor end) or Tab → indent under previous sibling
      const shouldIndent =
        (e.key === 'ArrowRight' && e.shiftKey && cursorAtEnd) ||
        (e.key === 'Tab' && !e.shiftKey)

      if (shouldIndent) {
        e.preventDefault()
        const siblings = tasks
          .filter(t => t.parentId === task.parentId)
          .sort((a, b) => a.orderId - b.orderId)
        const idx = siblings.findIndex(t => t.id === task.id)
        if (idx <= 0) return
        const newParent = siblings[idx - 1]
        const newChildCount = tasks.filter(
          t => t.parentId === newParent.id,
        ).length
        setExpandedIds(prev => new Set([...prev, newParent.id]))
        setTasks(prev =>
          prev.map(t =>
            t.id === task.id
              ? { ...t, parentId: newParent.id, orderId: newChildCount }
              : t,
          ),
        )
        focusId(task.id)
        return
      }

      // Backspace on empty task → delete and focus previous
      if (e.key === 'Backspace' && !e.shiftKey && task.name === '') {
        e.preventDefault()
        const visible = getVisibleOrder(tasks, expandedIds)
        const idx = visible.findIndex(t => t.id === task.id)
        if (idx > 0) focusId(visible[idx - 1].id)
        handleDelete(task.id)
        return
      }

      // Shift+Backspace or Shift+Delete → delete task and focus nearest
      if ((e.key === 'Backspace' || e.key === 'Delete') && e.shiftKey) {
        e.preventDefault()
        const visible = getVisibleOrder(tasks, expandedIds)
        const idx = visible.findIndex(t => t.id === task.id)
        if (idx > 0) focusId(visible[idx - 1].id)
        else if (idx < visible.length - 1) focusId(visible[idx + 1].id)
        handleDelete(task.id)
        return
      }

      // Escape → blur current input
      if (e.key === 'Escape') {
        input?.blur()
      }
    },
    [tasks, expandedIds, setTasks, handleDelete],
  )

  const addInputRef = useRef(null)

  const handleAdd = () => {
    if (!newTask.trim()) return
    const id1 = nextTempId(tasks)
    const id2 = id1 - 1
    flushSync(() => {
      setTasks([
        ...tasks,
        {
          id: id1,
          name: newTask,
          completedAt: null,
          orderId: 0,
          parentId: null,
        },
        { id: id2, name: '', completedAt: null, orderId: 1, parentId: null },
      ])
      setNewTask('')
    })
    inputRefs.current[id2]?.focus()
  }

  const onDragEnd = event => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    setTasks(items => {
      const oldIndex = items.findIndex(item => item.id === active.id)
      const newIndex = items.findIndex(item => item.id === over.id)
      if (oldIndex === -1 || newIndex === -1) return items

      const activeItem = items[oldIndex]
      const overItem = items[newIndex]

      const reordered = [...items]
      reordered.splice(oldIndex, 1)
      reordered.splice(newIndex, 0, activeItem)

      const parentId = overItem.parentId
      const siblings = reordered.filter(item => item.parentId === parentId)

      return reordered.map(item => {
        if (item.id === activeItem.id)
          return { ...item, parentId, orderId: siblings.indexOf(item) }
        return item.parentId === parentId
          ? { ...item, orderId: siblings.indexOf(item) }
          : item
      })
    })
  }

  return (
    <DndContext
      collisionDetection={closestCenter}
      onDragEnd={onDragEnd}
      sensors={sensors}
    >
      <SortableContext items={tasks} strategy={verticalListSortingStrategy}>
        <div
          role='list'
          style={{
            maxHeight: 'inherit',
            overflow: 'visible',
            padding: 0,
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {topLevelTasks
            .sort((a, b) => a.orderId - b.orderId)
            .map(task => (
              <SortableItem
                key={task.id}
                task={task}
                allTasks={tasks}
                setTasks={setTasks}
                level={0}
                editMode={editMode}
                expandedIds={expandedIds}
                onToggleExpand={handleToggleExpand}
                handleToggle={handleToggle}
                inputRefs={inputRefs}
                onKeyDown={handleKeyDown}
                performers={performers}
              />
            ))}

          {editMode && tasks.length === 0 && (
            <div
              role='listitem'
              style={{ alignItems: 'center', display: 'flex', gap: 8 }}
            >
              <input
                autoFocus={shouldFocus}
                className='input'
                placeholder='Add new task... (Enter to add)'
                value={newTask}
                ref={addInputRef}
                onChange={e => setNewTask(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleAdd()
                  }
                }}
                style={{ flex: 1 }}
              />
              <button
                type='button'
                className='btn btn-primary btn-icon'
                onClick={handleAdd}
                aria-label='Add subtask'
              >
                <FigmaIcon name='plus' size={18} />
              </button>
            </div>
          )}
        </div>
      </SortableContext>
    </DndContext>
  )
}

export default SubTasks
