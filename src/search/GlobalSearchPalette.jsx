import Fuse from 'fuse.js'
import PropTypes from 'prop-types'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import AppModal from '../components/common/AppModal'
import FigmaIcon from '../components/FigmaIcon'
import { readLocalStorageJSON, writeLocalStorageJSON } from '../utils/storage'
import { STORAGE_KEYS } from '../utils/storageKeys'

const RECENTS_KEY = STORAGE_KEYS.globalSearchRecents
const GROUPS = [
  'tasks',
  'history',
  'projects',
  'labels',
  'people',
  'profile',
  'settings',
  'actions',
]
const GROUP_LABELS = {
  tasks: 'Tasks',
  history: 'Notes',
  projects: 'Projects',
  labels: 'Categories',
  people: 'People',
  profile: 'Profile',
  settings: 'Settings',
  actions: 'Quick actions',
}
const ICONS = {
  actions: 'plus',
  history: 'activity',
  labels: 'tag',
  people: 'users',
  profile: 'user',
  projects: 'projects',
  settings: 'settings',
  tasks: 'tasks',
}
const QUICK_ACTIONS = [
  {
    id: 'action:create',
    provider: 'actions',
    route: '/chores/create',
    subtitle: 'Quick action',
    title: 'Create a task',
  },
  {
    id: 'action:tasks',
    provider: 'actions',
    route: '/chores',
    subtitle: 'Navigation',
    title: 'View all tasks',
  },
  {
    id: 'action:settings',
    provider: 'actions',
    route: '/settings',
    subtitle: 'Navigation',
    title: 'Open settings',
  },
]

const readRecents = () => readLocalStorageJSON(RECENTS_KEY, [])

const saveRecent = result => {
  if (result.provider === 'actions') return
  writeLocalStorageJSON(
    RECENTS_KEY,
    [
      {
        id: result.id,
        provider: result.provider,
        route: result.route,
        subtitle: result.subtitle,
        title: result.title,
      },
      ...readRecents().filter(item => item.id !== result.id),
    ].slice(0, 6),
  )
}

const SearchContainer = ({ children, onClose, presentation }) =>
  presentation === 'page' ? (
    <main className='figma-search-page'>{children}</main>
  ) : (
    <AppModal
      contentSx={{ p: 0 }}
      disableRestoreFocus
      maxHeight='min(720px, calc(100dvh - 48px))'
      onClose={onClose}
      open
      size='lg'
      title='Search'
    >
      {children}
    </AppModal>
  )

const ResultRow = ({ onSelect, result, selected }) => (
  <button
    className={`task-row figma-search-row w-full text-start ${selected ? 'figma-search-row-selected' : ''}`}
    onClick={() => onSelect(result)}
    type='button'
  >
    <FigmaIcon
      name={ICONS[result.provider] || 'search'}
      size={18}
      style={{ color: result.color || 'var(--t-muted)', flexShrink: 0 }}
    />
    <span className='min-w-0 flex-1'>
      <span className='text-primary block font-medium' style={{ fontSize: 14 }}>
        {result.title}
      </span>
      {(result.subtitle || result.body) && (
        <span className='text-faint block' style={{ fontSize: 11 }}>
          {[result.subtitle, result.body].filter(Boolean).join(' · ')}
        </span>
      )}
    </span>
  </button>
)

const GlobalSearchPalette = ({
  documents,
  initialQuery,
  isLoading,
  onClose,
  presentation = 'modal',
}) => {
  const navigate = useNavigate()
  const [query, setQuery] = useState(initialQuery || '')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef(null)
  const recents = useMemo(() => readRecents(), [])

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const indexes = useMemo(
    () =>
      new Map(
        GROUPS.filter(group => group !== 'actions').map(group => [
          group,
          new Fuse(
            documents.filter(item => item.provider === group),
            {
              distance: 120,
              ignoreLocation: true,
              includeScore: true,
              keys:
                group === 'history'
                  ? [{ name: 'body', weight: 1 }]
                  : [
                      { name: 'title', weight: 0.5 },
                      { name: 'keywords', weight: 0.25 },
                      { name: 'body', weight: 0.17 },
                      { name: 'subtitle', weight: 0.08 },
                    ],
              threshold: 0.38,
            },
          ),
        ]),
      ),
    [documents],
  )

  const results = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase()
    if (!normalized) return []
    const matches = GROUPS.filter(group => group !== 'actions').flatMap(group =>
      (indexes.get(group)?.search(normalized, { limit: 7 }) || []).map(
        match => ({
          ...match.item,
          score: match.score ?? 1,
        }),
      ),
    )
    matches.push({
      id: 'action:filter-tasks',
      provider: 'actions',
      route: `/chores?search=${encodeURIComponent(query.trim())}`,
      subtitle: 'Filter the task list',
      title: `Show tasks matching “${query.trim()}”`,
    })
    return matches.sort((a, b) => a.score - b.score)
  }, [indexes, query])

  const selectResult = useCallback(
    result => {
      saveRecent(result)
      navigate(result.route)
      if (presentation === 'modal') onClose()
    },
    [navigate, onClose, presentation],
  )

  const onInputKeyDown = event => {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setSelectedIndex(index => Math.min(index + 1, results.length - 1))
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setSelectedIndex(index => Math.max(index - 1, 0))
    } else if (event.key === 'Enter' && results[selectedIndex]) {
      event.preventDefault()
      selectResult(results[selectedIndex])
    } else if (event.key === 'Escape') {
      event.preventDefault()
      onClose()
    }
  }

  const byProvider = GROUPS.map(provider => ({
    provider,
    results: results.filter(result => result.provider === provider),
  })).filter(group => group.results.length)
  return (
    <SearchContainer onClose={onClose} presentation={presentation}>
      <div className='figma-search-wrap'>
        <div className='px-4 pb-4 pt-2 md:px-7'>
          <div className='card figma-search-input flex items-center gap-3 px-4'>
            <FigmaIcon
              name='search'
              size={18}
              style={{ color: 'var(--t-muted)' }}
            />
            <input
              aria-label='Search tasks, history, projects, labels and settings'
              className='text-primary flex-1 bg-transparent py-4 outline-none'
              onChange={event => {
                setQuery(event.target.value)
                setSelectedIndex(0)
              }}
              onKeyDown={onInputKeyDown}
              placeholder='Search tasks, projects, routines, shopping...'
              ref={inputRef}
              value={query}
            />
            {isLoading && (
              <span className='figma-search-loading' aria-label='Loading' />
            )}
            {query && (
              <button
                aria-label='Clear search'
                className='btn btn-ghost btn-icon'
                onClick={() => {
                  setQuery('')
                  setSelectedIndex(0)
                }}
                type='button'
              >
                <FigmaIcon name='x' size={15} />
              </button>
            )}
          </div>
        </div>
        <div className='px-4 md:px-7'>
          {!query.trim() && (
            <div className='empty-state py-16'>
              <div style={{ fontSize: 48 }}>🔍</div>
              <div className='text-primary font-bold' style={{ fontSize: 16 }}>
                Search everything
              </div>
              <div className='text-muted' style={{ fontSize: 13 }}>
                Tasks, projects, routines, shopping items
              </div>
              {recents.length > 0 && (
                <div className='text-faint' style={{ fontSize: 11 }}>
                  Recent searches are available when you start typing.
                </div>
              )}
            </div>
          )}
          {query.trim() && results.length === 1 && (
            <div className='empty-state py-16'>
              <div style={{ fontSize: 48 }}>🤷</div>
              <div className='text-primary font-bold'>
                Nothing found for &quot;{query}&quot;
              </div>
              <div className='text-muted' style={{ fontSize: 13 }}>
                Try a different search term
              </div>
              <button
                className='btn btn-primary mt-4'
                onClick={() => navigate('/chores/create')}
                type='button'
              >
                <FigmaIcon name='plus' size={14} />
                Create a task
              </button>
            </div>
          )}
          {byProvider.map(group => (
            <div className='mb-5' key={group.provider}>
              <div className='section-label' style={{ padding: '0 0 8px' }}>
                {GROUP_LABELS[group.provider]} ({group.results.length})
              </div>
              <div className='card overflow-hidden'>
                {group.results.map(result => (
                  <ResultRow
                    key={result.id}
                    onSelect={selectResult}
                    result={result}
                    selected={results.indexOf(result) === selectedIndex}
                  />
                ))}
              </div>
            </div>
          ))}
          {query.trim() && results.length > 1 && (
            <span className='sr-only' aria-live='polite'>
              {results.length - 1} results
            </span>
          )}
        </div>
      </div>
    </SearchContainer>
  )
}

SearchContainer.propTypes = {
  children: PropTypes.node.isRequired,
  onClose: PropTypes.func.isRequired,
  presentation: PropTypes.oneOf(['modal', 'page']).isRequired,
}
ResultRow.propTypes = {
  onSelect: PropTypes.func.isRequired,
  result: PropTypes.object.isRequired,
  selected: PropTypes.bool.isRequired,
}
GlobalSearchPalette.propTypes = {
  documents: PropTypes.arrayOf(PropTypes.object).isRequired,
  initialQuery: PropTypes.string,
  isLoading: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  presentation: PropTypes.oneOf(['modal', 'page']),
}

export default GlobalSearchPalette
