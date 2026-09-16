import '../../styles/screenExperience.css'

import PropTypes from 'prop-types'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import FigmaIcon from '../../components/FigmaIcon'
import { taskGroups, taskStatus, taskStatusCounts } from './taskViewModel'

const statusLabels = (t, key) => {
  const labels = {
    overdue: t('list.overdue'),
    todo: t('filters.active'),
    upcoming: t('list.dueLater'),
    done: t('toolbar.done'),
    high: t('filters.priority'),
    unassigned: t('toolbar.everyone'),
    uncategorized: t('list.uncategorized'),
  }
  return labels[key] || key
}

const statusTone = status => {
  if (status === 'overdue') return 'bg-sig-over-bg text-sig-over'
  if (status === 'upcoming') return 'bg-brand-faint text-brand'
  return 'bg-surface-2 text-muted'
}

function TaskRow({ chore, members, onComplete, onOpen }) {
  const { i18n, t } = useTranslation('chores')
  const status = taskStatus(chore)
  const isDone = status === 'done'
  const isOverdue = status === 'overdue'
  const assignee = members.find(
    member => String(member.userId) === String(chore.assignedTo),
  )
  const dueDate = chore.nextDueDate || chore.dueDate
  const date = dueDate
    ? new Intl.DateTimeFormat(i18n.resolvedLanguage || 'en', {
        day: 'numeric',
        month: 'short',
      }).format(new Date(dueDate))
    : null
  const category = chore.category?.name || chore.categoryName
  const categoryColor = chore.category?.color || 'var(--brand)'

  return (
    <div className={`task-row ${isDone ? 'done' : ''}`}>
      <button
        aria-label={`${t('swipe.complete')}: ${chore.name}`}
        className={`task-check ${isDone ? 'checked' : ''}`}
        disabled={isDone}
        onClick={event => {
          event.stopPropagation()
          if (!isDone) onComplete(chore)
        }}
        type='button'
      >
        {isDone && (
          <FigmaIcon name='check' size={11} style={{ color: 'white' }} />
        )}
      </button>
      <button
        aria-label={chore.name}
        className='screen-task-open flex-1'
        onClick={() => onOpen(chore)}
        type='button'
      >
        <div
          className='task-title text-primary font-medium'
          style={{ fontSize: 14 }}
        >
          {chore.name}
        </div>
        <div className='mt-0.5 flex flex-wrap items-center gap-2'>
          {category && (
            <span
              className='badge'
              style={{
                background: `color-mix(in srgb, ${categoryColor} 10%, transparent)`,
                color: categoryColor,
              }}
            >
              {category}
            </span>
          )}
          {date && (
            <span
              style={{
                color: isOverdue
                  ? 'var(--sig-over)'
                  : isDone
                    ? 'var(--sig-done)'
                    : status === 'upcoming'
                      ? 'var(--brand)'
                      : 'var(--t-faint)',
                fontSize: 11,
                fontWeight: 600,
              }}
            >
              {date}
            </span>
          )}
          {!['once', 'no_repeat'].includes(chore.frequencyType) && (
            <FigmaIcon
              name='repeat'
              size={11}
              style={{ color: 'var(--t-faint)' }}
            />
          )}
          {chore.projectId && (
            <FigmaIcon
              name='projects'
              size={11}
              style={{ color: 'var(--brand)' }}
            />
          )}
        </div>
      </button>
      {assignee && (
        <div
          aria-label={assignee.displayName || assignee.name}
          className='avatar flex-shrink-0'
          style={{
            background: 'var(--product-member-1)',
            fontSize: 9,
            height: 22,
            width: 22,
          }}
          title={assignee.displayName || assignee.name}
        >
          {(assignee.displayName || assignee.name || '?')
            .slice(0, 2)
            .toUpperCase()}
        </div>
      )}
      {Number(chore.priority) === 1 && !isDone && (
        <FigmaIcon
          name='flag'
          size={12}
          style={{ color: 'var(--sig-over)', flexShrink: 0 }}
        />
      )}
    </div>
  )
}

TaskRow.propTypes = {
  chore: PropTypes.object.isRequired,
  members: PropTypes.array.isRequired,
  onComplete: PropTypes.func.isRequired,
  onOpen: PropTypes.func.isRequired,
}

export default function FigmaAllTasksScreen({
  chores,
  members,
  onComplete,
  onCreate,
  onOpen,
  toolbar,
}) {
  const { t } = useTranslation('chores')
  const [filter, setFilter] = useState('all')
  const [groupBy, setGroupBy] = useState('status')
  const [search, setSearch] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const filtered = useMemo(
    () =>
      chores.filter(chore => {
        const status = taskStatus(chore)
        return (
          (filter === 'all' || status === filter) &&
          (!search || chore.name?.toLowerCase().includes(search.toLowerCase()))
        )
      }),
    [chores, filter, search],
  )
  const groups = useMemo(
    () => taskGroups(filtered, groupBy, members),
    [filtered, groupBy, members],
  )
  const counts = useMemo(() => taskStatusCounts(chores), [chores])
  const isNarrowed = filter !== 'all' || Boolean(search.trim())
  const clearNarrowing = () => {
    setFilter('all')
    setSearch('')
  }

  return (
    <div style={{ margin: '0 auto', maxWidth: 800, padding: '0 0 40px' }}>
      <div className='screen-page-header page-header pb-5'>
        <div>
          <h1
            className='text-primary'
            style={{ fontSize: 24, fontWeight: 800, margin: 0 }}
          >
            {t('list.allTasks')}
          </h1>
          <div className='text-muted' style={{ fontSize: 13, marginTop: 4 }}>
            {t('filters.filterTasksCount', { count: filtered.length })}
          </div>
        </div>
        <button
          className='screen-page-action btn btn-primary'
          onClick={onCreate}
          type='button'
        >
          <FigmaIcon name='plus' size={14} />
          {t('list.createTask')}
        </button>
      </div>

      <div className='px-4 md:px-7'>
        <div className='mb-4 flex flex-wrap gap-2'>
          {['overdue', 'todo', 'upcoming', 'done'].map(status => (
            <button
              aria-pressed={status === filter}
              className={`screen-filter-chip badge ${status === filter ? 'is-selected' : ''} ${statusTone(status)}`}
              key={status}
              onClick={() =>
                setFilter(current => (current === status ? 'all' : status))
              }
              style={{ cursor: 'pointer', fontSize: 12, padding: '5px 11px' }}
              type='button'
            >
              {counts[status]} {statusLabels(t, status)}
            </button>
          ))}
        </div>

        <div className='screen-task-toolbar mb-4'>
          <div className='screen-task-search'>
            <FigmaIcon
              name='search'
              size={15}
              style={{
                color: 'var(--t-faint)',
                left: 11,
                position: 'absolute',
                top: '50%',
                transform: 'translateY(-50%)',
              }}
            />
            <input
              aria-label={t('list.searchTasks')}
              className='input'
              onChange={event => setSearch(event.target.value)}
              placeholder={t('list.searchTasks')}
              style={{
                fontSize: 14,
                paddingInlineEnd: search ? 42 : 12,
                paddingInlineStart: 34,
              }}
              value={search}
            />
            {search && (
              <button
                aria-label={t('list.clearTaskSearch')}
                className='screen-task-search-clear btn btn-ghost btn-icon'
                onClick={() => setSearch('')}
                type='button'
              >
                <FigmaIcon name='x' size={14} />
              </button>
            )}
          </div>
          <button
            aria-controls='task-filter-panel'
            aria-expanded={showFilters}
            className={`btn btn-secondary ${showFilters ? 'border-brand text-brand' : ''}`}
            onClick={() => setShowFilters(value => !value)}
            type='button'
          >
            <FigmaIcon name='bars' size={15} />
            {t('toolbar.filters')}
          </button>
        </div>

        {showFilters && (
          <div className='card mb-4 p-4' id='task-filter-panel'>
            <div className='flex flex-wrap gap-4'>
              <div>
                <div className='section-label mb-2' style={{ padding: 0 }}>
                  {t('filters.status')}
                </div>
                <div className='flex flex-wrap gap-1'>
                  {['all', 'todo', 'overdue', 'upcoming', 'done'].map(value => (
                    <button
                      aria-pressed={filter === value}
                      className='btn btn-sm capitalize'
                      key={value}
                      onClick={() => setFilter(value)}
                      style={{
                        background:
                          filter === value
                            ? 'var(--brand)'
                            : 'var(--surface-2)',
                        border: 'none',
                        color:
                          filter === value
                            ? 'var(--brand-contrast)'
                            : 'var(--t-muted)',
                      }}
                      type='button'
                    >
                      {value === 'all'
                        ? t('multiselect.all')
                        : statusLabels(t, value)}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div className='section-label mb-2' style={{ padding: 0 }}>
                  {t('toolbar.groupBy')}
                </div>
                <div className='flex flex-wrap gap-1'>
                  {['status', 'assignee', 'category', 'priority'].map(value => (
                    <button
                      aria-pressed={groupBy === value}
                      className='btn btn-sm capitalize'
                      key={value}
                      onClick={() => setGroupBy(value)}
                      style={{
                        background:
                          groupBy === value
                            ? 'var(--brand)'
                            : 'var(--surface-2)',
                        border: 'none',
                        color:
                          groupBy === value
                            ? 'var(--brand-contrast)'
                            : 'var(--t-muted)',
                      }}
                      type='button'
                    >
                      {value === 'category'
                        ? t('filters.labels')
                        : t(`toolbar.${value}`)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            {toolbar && (
              <div className='border-line mt-4 border-t pt-4'>{toolbar}</div>
            )}
          </div>
        )}

        {groups.length === 0 ? (
          <div className='empty-state'>
            <FigmaIcon
              name='search'
              size={40}
              style={{ color: 'var(--t-faint)' }}
            />
            <div className='text-primary font-bold' style={{ fontSize: 16 }}>
              {t('list.noTasksMatchView')}
            </div>
            <div className='text-muted' style={{ fontSize: 13 }}>
              {search
                ? t('list.nothingMatchesTerm', { term: search })
                : t('list.noTasksYetDescription')}
            </div>
            <button
              className={`btn mt-2 ${isNarrowed ? 'btn-secondary' : 'btn-primary'}`}
              onClick={isNarrowed ? clearNarrowing : onCreate}
              type='button'
            >
              <FigmaIcon name={isNarrowed ? 'x' : 'plus'} size={15} />
              {isNarrowed
                ? search
                  ? t('list.clearSearch')
                  : t('list.clearFilters')
                : t('list.addTask')}
            </button>
          </div>
        ) : (
          groups.map(group => (
            <div className='mb-5' key={group.key}>
              <div className='mb-2 flex items-center gap-2 px-1'>
                <span
                  className='text-primary font-bold'
                  style={{ fontSize: 13 }}
                >
                  {statusLabels(t, group.label)}
                </span>
                <span
                  className='badge bg-surface-2 text-muted'
                  style={{ fontSize: 11 }}
                >
                  {group.chores.length}
                </span>
              </div>
              <div className='card overflow-hidden'>
                {group.chores.map((chore, index) => (
                  <div
                    key={chore.id}
                    style={{
                      borderBlockEnd:
                        index < group.chores.length - 1
                          ? '1px solid var(--line)'
                          : 'none',
                    }}
                  >
                    <TaskRow
                      chore={chore}
                      members={members}
                      onComplete={onComplete}
                      onOpen={onOpen}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

FigmaAllTasksScreen.propTypes = {
  chores: PropTypes.array.isRequired,
  members: PropTypes.array.isRequired,
  onComplete: PropTypes.func.isRequired,
  onCreate: PropTypes.func.isRequired,
  onOpen: PropTypes.func.isRequired,
  toolbar: PropTypes.node,
}
