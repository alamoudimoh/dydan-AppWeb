import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useSearchParams } from 'react-router-dom'

import EmptyState from '../../components/common/EmptyState'
import FigmaIcon from '../../components/FigmaIcon'
import { useImpersonateUser } from '../../contexts/ImpersonateUserContext.jsx'
import { useFilter } from '../../hooks/useFilter'
import { useChores } from '../../queries/ChoreQueries'
import { useCircleMembers, useUserProfile } from '../../queries/UserQueries'
import { useNotification } from '../../service/NotificationProvider'
import {
  ChoreFilters,
  ChoresGrouper,
  ChoreSorter,
  filterByProject,
} from '../../utils/Chores'
import { ENTITY_COLOR_FALLBACK } from '../../utils/Colors'
import Priorities from '../../utils/Priorities'
import TaskInput from '../components/AddTaskModal'
import LoadingComponent from '../components/Loading'
import { useLabels } from '../Labels/LabelQueries'
import AdvancedFilterBuilder from '../Modals/Inputs/AdvancedFilterBuilder'
import ConfirmationModal from '../Modals/Inputs/ConfirmationModal'
import { useProjects } from '../Projects/ProjectQueries.js'
import ChoreModals from './components/ChoreModals'
import ChoreToolbar from './components/ChoreToolbarPrototype'
import {
  conditionsToSelections,
  selectionsToConditions,
} from './components/FilterBuilderContent'
import FigmaAllTasksScreen from './FigmaAllTasksScreen'
import { useChoreActions } from './hooks/useChoreActions'
import { useChoreFilters } from './hooks/useChoreFilters'
import { useChoreModals } from './hooks/useChoreModals'
import { useCustomFilters } from './hooks/useCustomFilters'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'
import { useMultiSelect } from './hooks/useMultiSelect'
import { useProjectFilter } from './hooks/useProjectFilter'
import { INSIGHT_FILTER_DEFS } from './insightFilterDefs'
import {
  canScheduleNotification,
  scheduleChoreNotification,
} from './LocalNotificationScheduler'

const MyChores = () => {
  const { data: userProfile, isLoading: isUserProfileLoading } =
    useUserProfile()
  const { showError, showSuccess, showUndo, showWarning } = useNotification()
  const { t } = useTranslation('chores')

  const sectionName = name => {
    const map = {
      Started: t('list.groupStarted'),
      'Pending Approval': t('list.groupPendingApproval'),
      Overdue: t('list.groupOverdue'),
      Today: t('list.groupToday'),
      Tomorrow: t('list.groupTomorrow'),
      'Next 7 Days': t('list.groupNext7Days'),
      'Later This Month': t('list.groupLaterThisMonth'),
      Future: t('list.groupFuture'),
      Anytime: t('list.groupAnytime'),
      'No Priority': t('list.groupNoPriority'),
    }
    if (map[name]) return map[name]
    const priorityMatch = String(name).match(/^Priority (\d)$/)
    if (priorityMatch) {
      return t('list.groupPriority', { value: priorityMatch[1] })
    }
    return name
  }
  const queryClient = useQueryClient()
  const { impersonatedUser } = useImpersonateUser()
  const Navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { data: userLabels, isLoading: userLabelsLoading } = useLabels()
  const { data: projects = [], isLoading: projectsLoading } = useProjects()
  const {
    data: choresData,
    error: choresErrorDetails,
    isError: choresError,
    isLoading: choresLoading,
    refetch: refetchChores,
  } = useChores(false)
  const {
    data: membersData,
    isError: membersError,
    isLoading: membersLoading,
  } = useCircleMembers()

  const [chores, setChores] = useState([])
  const [filteredChores, setFilteredChores] = useState([])
  const [addTaskModalOpen, setAddTaskModalOpen] = useState(false)
  // 'voice' | 'scan' | null — set by the quick-capture widget deep links
  const [addTaskInitialMode, setAddTaskInitialMode] = useState(null)
  const [taskInputFocus, setTaskInputFocus] = useState(0)
  const searchInputRef = useRef(null)
  const [searchInputFocus, setSearchInputFocus] = useState(0)
  const [selectedChoreSection, setSelectedChoreSection] = useState(
    localStorage.getItem('selectedChoreSection') || 'default',
  )
  const [openChoreSections, setOpenChoreSections] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('openChoreSections')) || {}
    } catch {
      return {}
    }
  })
  const openSectionsInitializedRef = useRef(
    localStorage.getItem('openChoreSections') !== null,
  )
  const [anchorEl, setAnchorEl] = useState(null)
  const [viewMode, setViewMode] = useState(
    localStorage.getItem('choreCardViewMode') || 'default',
  )
  const [selectedCalendarDate, setSelectedCalendarDate] = useState(new Date())
  const menuRef = useRef(null)
  const [confirmModelConfig, setConfirmModelConfig] = useState({})

  const { projectsWithDefault, selectedProject, setSelectedProjectWithCache } =
    useProjectFilter(projects, !projectsLoading)

  const {
    nonProjectFilteredChores,
    projectFilteredChores,
    searchFilteredChores,
    searchTerm,
    selectedChoreFilter,
    setSearchTerm,
    setSelectedChoreFilterWithCache,
  } = useChoreFilters({
    chores,
    selectedProject,
    impersonatedUser,
    userProfile,
  })

  const {
    clearSelection,
    enterMultiSelectWithChore,
    getSelectedChoresData,
    isMultiSelectMode,
    selectAllVisibleChores,
    selectedChores,
    toggleChoreSelection,
    toggleMultiSelectMode,
  } = useMultiSelect()

  const { activeModal, closeModal, modalChore, modalData, openModal } =
    useChoreModals()

  const {
    activeFilter,
    activeFilterId,
    applyCustomFilter,
    applyTempFilter,
    clearActiveFilter,
    clearTempFilter,
    createFilterFromCurrentState,
    deleteFilter,
    filteredChores: customFilteredChores,
    hasFilterApplied,
    hasProjectConditions,
    pinFilter,
    saveFilter,
    savedFilters,
    tempFilter,
    tempFilterMeta,
    updateFilter,
  } = useCustomFilters(
    nonProjectFilteredChores,
    membersData?.res,
    userLabels,
    projectsWithDefault,
  )

  const [showAdvancedFilterBuilder, setShowAdvancedFilterBuilder] =
    useState(false)
  const [editingFilter, setEditingFilter] = useState(null)

  const quickFilterDefs = useMemo(
    () => [
      {
        id: 'status',
        label: t('list.dueDate'),
        type: 'single-select',
        icon: <FigmaIcon name='calendar' size={16} />,
        options: [
          { value: 'Overdue', label: t('list.overdue'), color: 'danger' },
          { value: 'Due today', label: t('list.dueToday'), color: 'warning' },
          { value: 'Due in week', label: t('list.dueThisWeek') },
          { value: 'Due Later', label: t('list.dueLater') },
          { value: 'No Due Date', label: t('list.noDueDate') },
          { value: 'Pending Approval', label: t('list.pendingApproval') },
        ],
        filterFn: (item, value) => {
          const now = new Date()
          const d = item.nextDueDate ? new Date(item.nextDueDate) : null
          switch (value) {
            case 'Overdue':
              return d !== null && d < now
            case 'Due today':
              return d !== null && d.toDateString() === now.toDateString()
            case 'Due in week':
              return (
                d !== null &&
                d < new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) &&
                d > now
              )
            case 'Due Later':
              return (
                d !== null && d > new Date(now.getTime() + 24 * 60 * 60 * 1000)
              )
            case 'No Due Date':
              return item.nextDueDate === null
            case 'Pending Approval':
              return item.status === 3
            default:
              return true
          }
        },
      },
      {
        id: 'priority',
        label: t('priority'),
        type: 'multi-select',
        icon: <FigmaIcon name='flag' size={16} />,
        options: Priorities.map(p => ({
          value: p.value,
          label: p.name,
          color: p.color || 'neutral',
          icon: p.icon,
        })),
        filterFn: (item, values) => values.includes(item.priority ?? 0),
      },
      ...(userLabels?.length > 0
        ? [
            {
              id: 'label',
              label: t('list.labels'),
              type: 'multi-select',
              icon: <FigmaIcon name='tag' size={16} />,
              options: userLabels.map(l => ({
                value: l.id,
                label: l.name,
                icon: (
                  <span
                    style={{
                      display: 'inline-block',
                      width: 10,
                      height: 10,
                      borderRadius: '50%',
                      background: l.color || ENTITY_COLOR_FALLBACK,
                      flexShrink: 0,
                    }}
                  />
                ),
              })),
              filterFn: (item, values) =>
                item.labelsV2?.some(l => values.includes(l.id)) ?? false,
            },
          ]
        : []),
    ],
    [userLabels],
  )

  const {
    clearAll: clearQuickFilters,
    filteredData: quickFilteredChores,
    hasActiveFilters: hasQuickFilters,
    setFilter: setQuickFilter,
  } = useFilter(projectFilteredChores, quickFilterDefs)

  const processedChores = useMemo(() => {
    if (!choresData?.res) {
      return []
    }

    let sortedChores = [...choresData.res].sort(ChoreSorter)

    if (impersonatedUser) {
      sortedChores = sortedChores.filter(
        chore =>
          chore.assignedTo === impersonatedUser.userId ||
          chore.assignees?.some(a => a.userId === impersonatedUser.userId) ||
          chore.isPrivate === false,
      )
    }

    return sortedChores
  }, [choresData?.res, impersonatedUser])

  const choreSections = useMemo(() => {
    if (!chores.length || !userProfile?.id) {
      return []
    }

    // Determine which chores to group based on active filter type
    let choresToGroup = chores
    if (tempFilter || activeFilterId) {
      // Advanced/custom filter active
      choresToGroup = customFilteredChores
    } else if (hasQuickFilters) {
      // Quick filter active (Due date, Priority, Labels)
      choresToGroup = quickFilteredChores
    } else if (!selectedProject || selectedProject.id === 'default') {
      // No project selected or default project: only show tasks without a projectId
      choresToGroup = chores.filter(chore => !chore.projectId)
    } else {
      // Specific project: use the existing filter function
      choresToGroup = filterByProject(chores, selectedProject.id)
    }

    const sections = ChoresGrouper(
      selectedChoreSection,
      choresToGroup,
      ChoreFilters(impersonatedUser?.userId || userProfile?.id)[
        selectedChoreFilter
      ],
    )

    return sections
  }, [
    chores,
    quickFilteredChores,
    customFilteredChores,
    tempFilter,
    activeFilterId,
    hasQuickFilters,
    selectedChoreSection,
    selectedChoreFilter,
    selectedProject,
    impersonatedUser?.userId,
    userProfile?.id,
  ])

  useEffect(() => {
    if (
      !choresLoading &&
      !membersLoading &&
      userProfile?.id &&
      membersData?.res &&
      choresData?.res
    ) {
      const processEffectAsync = async () => {
        // Sync local state with query data to ensure updates are reflected
        setChores(processedChores)
        setFilteredChores(processedChores)

        // Don't set choreSections here - let the dedicated effect handle it
        // This prevents caching issues when switching between projects

        if (await canScheduleNotification()) {
          console.log('Scheduling chore notifications...')
          scheduleChoreNotification(
            choresData.res,
            userProfile,
            membersData.res,
          )
        }
      }

      processEffectAsync()
    }
  }, [
    membersLoading,
    choresLoading,
    isUserProfileLoading,
    choresData?.res,
    membersData?.res,
    processedChores, // Added to ensure local state syncs when query data updates
    userProfile,
    impersonatedUser?.userId,
  ])

  useEffect(() => {
    if (openSectionsInitializedRef.current || choreSections.length === 0) return

    openSectionsInitializedRef.current = true
    const openSections = choreSections.reduce((acc, _section, index) => {
      acc[index] = true
      return acc
    }, {})
    setOpenChoreSections(openSections)
  }, [choreSections])

  useEffect(() => {
    document.addEventListener('mousedown', handleMenuOutsideClick)
    return () => {
      document.removeEventListener('mousedown', handleMenuOutsideClick)
    }
  }, [anchorEl])

  useEffect(() => {
    if (searchInputFocus > 0 && searchInputRef.current) {
      searchInputRef.current.focus()
      searchInputRef.current.selectionStart =
        searchInputRef.current.value?.length
      searchInputRef.current.selectionEnd = searchInputRef.current.value?.length
    }
  }, [searchInputFocus])

  // A global-search result can hand a query back to the task list as a scoped filter.
  useEffect(() => {
    const query = searchParams.get('search')
    if (query !== null) {
      setSearchTerm(query.toLowerCase())
      setSelectedCalendarDate(null)
      clearActiveFilter()
      clearQuickFilters()
    }
    // The setters above are intentionally applied only when URL search params change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  // Read and apply project from URL parameters
  useEffect(() => {
    if (!projects.length) return

    const projectIdFromUrl = searchParams.get('project')

    if (projectIdFromUrl && projectIdFromUrl !== String(selectedProject?.id)) {
      const project = projectsWithDefault.find(
        p => String(p.id) === projectIdFromUrl,
      )
      if (project) {
        setSelectedProjectWithCache(project)
      }
    }
  }, [
    searchParams,
    projects,
    projectsWithDefault,
    selectedProject,
    setSelectedProjectWithCache,

    searchParams,
    projects,
    projectsWithDefault,
    selectedProject,
    setSelectedProjectWithCache,
  ])

  // Widget deep links (donetick://chores/add[?mode=scan|voice] →
  // /chores?add_task=1[&mode=…]): open the quick-add modal once, in the
  // requested capture mode, and strip the params so back/refresh doesn't
  // re-trigger it.
  useEffect(() => {
    if (searchParams.get('add_task') === '1') {
      const mode = searchParams.get('mode')
      setAddTaskInitialMode(mode === 'voice' || mode === 'scan' ? mode : null)
      setAddTaskModalOpen(true)
      const params = new URLSearchParams(searchParams)
      params.delete('add_task')
      params.delete('mode')
      setSearchParams(params, { replace: true })
    }
  }, [searchParams, setSearchParams])

  // Read and apply filters from URL parameters
  useEffect(() => {
    // Check for filterId (camelCase) or filter_id (snake_case) for advanced filters
    const rawFilterId =
      searchParams.get('filterId') || searchParams.get('filter_id')
    // Parse as number since filter IDs from the API are numeric
    const filterId = rawFilterId ? Number(rawFilterId) || rawFilterId : null

    const oldFilter = searchParams.get('filter')

    // Restore smart insight temp filter from URL (e.g. on page reload)
    // Insight IDs are strings (e.g. 'overdue'), saved filter IDs are numeric
    if (
      filterId &&
      INSIGHT_FILTER_DEFS[filterId] &&
      tempFilterMeta?.id !== filterId
    ) {
      const def = INSIGHT_FILTER_DEFS[filterId]
      applyTempFilter(def.filter, {
        id: filterId,
        name: t(def.translationKey),
      })
      return
    }

    // If filterId is no longer in URL but filter is still active in state, clear it
    if (!filterId && !oldFilter && activeFilterId) {
      clearActiveFilter()
      return
    }

    if (!chores.length || !savedFilters.length) return

    // Handle advanced filter parameter
    if (filterId && !activeFilterId) {
      const filter = savedFilters.find(f => f.id === filterId)
      if (filter) {
        applyCustomFilter(filterId)
        return
      }
    }

    // Handle legacy filter parameter (e.g., filter=unplanned)
    if (oldFilter && !hasQuickFilters && !activeFilterId) {
      const filterMap = {
        unplanned: 'No Due Date',
        overdue: 'Overdue',
        today: 'Due today',
        week: 'Due in week',
        later: 'Due Later',
        pending: 'Pending Approval',
      }

      const filterName = filterMap[oldFilter.toLowerCase()]
      if (filterName) {
        setQuickFilter('status', filterName)
        setViewMode('default')
        setSelectedCalendarDate(null)
      }
    }
  }, [
    searchParams,
    chores,
    hasQuickFilters,
    activeFilterId,
    savedFilters,
    applyCustomFilter,
    applyTempFilter,
    clearActiveFilter,
    selectedProject,
    projectFilteredChores,
    setQuickFilter,
    setViewMode,
    setSelectedCalendarDate,
    t,
  ])

  // Sync tempFilterMeta (smart insight) → URL using filterId param
  // Insight IDs are strings (e.g. 'overdue') so they don't conflict with numeric saved filter IDs
  useEffect(() => {
    const insightId = tempFilterMeta?.id
    const params = new URLSearchParams(searchParams)
    const currentFilterId = params.get('filterId')

    if (insightId && currentFilterId !== insightId) {
      params.delete('filter_id')
      params.delete('filter')
      params.set('filterId', insightId)
      Navigate(
        { pathname: '/chores', search: params.toString() },
        { replace: true },
      )
    } else if (
      !insightId &&
      currentFilterId &&
      INSIGHT_FILTER_DEFS[currentFilterId]
    ) {
      // Only clear filterId if it was set by an insight (not a numeric saved filter)
      params.delete('filterId')
      Navigate(
        { pathname: '/chores', search: params.toString() },
        { replace: true },
      )
    }
  }, [tempFilterMeta?.id, searchParams])

  const {
    handleAssigneeChange,
    handleBulkArchive,
    handleBulkComplete,
    handleBulkDelete,
    handleBulkMoveToProject,
    handleBulkSkip,
    handleChangeDueDate,
    handleChoreAction,
    handleCompleteWithNote,
    handleCompleteWithPastDate,
    handleNudge,
  } = useChoreActions({
    chores,
    filteredChores,
    setChores,
    setFilteredChores,
    userProfile,
    impersonatedUser,
    showSuccess,
    showError,
    showWarning,
    showUndo,
    refetchChores,
    setConfirmModelConfig,
    openModal,
    closeModal,
    modalChore,
    getSelectedChoresData,
    clearSelection,
  })

  const getFilteredChores = useMemo(() => {
    if (activeFilterId || tempFilter) {
      return customFilteredChores
    }

    if (searchTerm?.length > 0) {
      return searchFilteredChores
    }

    const baseChores = hasQuickFilters
      ? quickFilteredChores
      : projectFilteredChores

    return baseChores
  }, [
    activeFilterId,
    tempFilter,
    customFilteredChores,
    hasQuickFilters,
    quickFilteredChores,
    projectFilteredChores,
    searchFilteredChores,
    searchTerm,
  ])

  const { showKeyboardShortcuts } = useKeyboardShortcuts({
    isMultiSelectMode,
    selectedChores,
    addTaskModalOpen,
    searchTerm,
    searchFilter:
      hasQuickFilters || searchTerm?.length > 0 ? 'filtered' : 'All',
    filteredChores: getFilteredChores,
    choreSections,
    openChoreSections,
    handlers: {
      onOpenTaskModal: () => setAddTaskModalOpen(true),
      onNavigateToCreate: () => Navigate('/chores/create'),
      onFocusSearch: () => searchInputRef.current?.focus(),
      onCloseSearch: () => {
        setSearchTerm('')
        setFilteredChores(chores)
        setSearchInputFocus(0)
      },
      onToggleMultiSelect: toggleMultiSelectMode,
      onEnableMultiSelectAndSelectAll: () => {
        toggleMultiSelectMode()
        setTimeout(() => {
          selectAllVisibleChores(null, choreSections, openChoreSections)
        }, 0)
      },
      onSelectAll: () =>
        selectAllVisibleChores(null, choreSections, openChoreSections),
      onClearSelection: clearSelection,
      onBulkComplete: handleBulkComplete,
      onBulkSkip: handleBulkSkip,
      onBulkArchive: handleBulkArchive,
      onBulkDelete: handleBulkDelete,
      onNavigateToArchived: () => Navigate('/archived'),
      onShowMessage: showSuccess,
    },
  })

  const figmaTaskChores = useMemo(() => {
    if (activeFilterId || tempFilter) return customFilteredChores
    if (searchTerm?.length > 0) return searchFilteredChores
    if (hasQuickFilters) return quickFilteredChores
    if (selectedProject && selectedProject.id !== 'default') {
      return projectFilteredChores
    }
    return nonProjectFilteredChores
  }, [
    activeFilterId,
    customFilteredChores,
    hasQuickFilters,
    nonProjectFilteredChores,
    projectFilteredChores,
    quickFilteredChores,
    searchFilteredChores,
    searchTerm,
    selectedProject,
    tempFilter,
  ])

  const figmaToolbar = (
    <ChoreToolbar
      activeFilterId={activeFilterId}
      applyTempFilter={applyTempFilter}
      clearTempFilter={() => clearTempFilterAndUrl()}
      hideSearch
      isMultiSelectMode={isMultiSelectMode}
      labels={userLabels || []}
      members={membersData?.res || []}
      onAssigneeFilterChange={setSelectedChoreFilterWithCache}
      onClearAllFilters={() => {
        clearQuickFilters()
        clearActiveFilter()
        setSelectedChoreFilterWithCache('anyone')
        setSelectedProjectWithCache(null)
        updateFilterUrl(null, null)
      }}
      onFilterSaved={name =>
        showSuccess({
          title: t('list.filterSaved'),
          message: t('list.filterSavedMessage', { name }),
        })
      }
      onGroupBySelect={value => setSelectedChoreSectionWithCache(value)}
      onProjectSelect={project => {
        setSelectedProjectWithCache(project)
        clearActiveFilter()
      }}
      onSavedFilterClick={filterId => {
        if (activeFilterId === filterId) {
          clearActiveFilter()
          updateFilterUrl(null, null)
          return
        }
        clearQuickFilters()
        setSearchTerm('')
        setFilteredChores([])
        applyCustomFilter(filterId)
        updateFilterUrl('filterId', filterId)
      }}
      onSavedFilterDelete={deleteFilter}
      onSavedFilterEdit={filter => {
        setEditingFilter(filter)
        setShowAdvancedFilterBuilder(true)
      }}
      onSavedFilterPin={pinFilter}
      onSearchChange={event => handleSearchChange(event)}
      onSearchClose={() => handleSearchClose()}
      onToggleMultiSelect={toggleMultiSelectMode}
      onToggleViewMode={value =>
        value === 'calendar' ? Navigate('/calendar') : toggleViewMode(value)
      }
      projects={projectsWithDefault}
      resultCount={figmaTaskChores.length}
      saveFilter={saveFilter}
      savedFilters={savedFilters}
      searchInputRef={searchInputRef}
      searchTerm={searchTerm}
      selectedAssigneeFilter={selectedChoreFilter}
      selectedGroupBy={selectedChoreSection}
      selectedProject={selectedProject}
      showKeyboardShortcuts={showKeyboardShortcuts}
      tempFilter={tempFilter}
      tempFilterMeta={tempFilterMeta}
      totalCount={nonProjectFilteredChores.length}
      updateFilter={updateFilter}
      viewMode={viewMode}
    />
  )

  const handleMenuOutsideClick = event => {
    if (
      anchorEl &&
      !anchorEl.contains(event.target) &&
      !menuRef.current.contains(event.target)
    ) {
      handleFilterMenuClose()
    }
  }
  const handleFilterMenuOpen = event => {
    event.preventDefault()
    setAnchorEl(event.currentTarget)
  }

  const handleFilterMenuClose = () => {
    setAnchorEl(null)
  }

  // Clicking a label / priority chip on a task card feeds the advanced filter
  // (as a temp filter) rather than the legacy quick filters. Clicking the same
  // chip again removes that value, so chips toggle.
  const handleLabelFiltering = chipClicked => {
    const type = chipClicked.label ? 'label' : 'priority'
    const value = chipClicked.label
      ? chipClicked.label.id
      : chipClicked.priority
    if (value === undefined || value === null) return

    const selections = conditionsToSelections(tempFilter?.conditions)
    const currentValues = selections[type].values || []
    const isActive = currentValues.some(v => String(v) === String(value))
    selections[type] = {
      operator: selections[type].operator || 'is',
      values: isActive
        ? currentValues.filter(v => String(v) !== String(value))
        : [...currentValues, value],
    }

    const conditions = selectionsToConditions(selections)

    clearQuickFilters()
    setSelectedCalendarDate(null)

    if (conditions.length === 0) {
      clearTempFilter()
      clearActiveFilter()
      return
    }

    const chipName = chipClicked.label
      ? chipClicked.label.name
      : `P${chipClicked.priority}`
    applyTempFilter(
      { conditions, operator: 'AND' },
      // Keep whatever the temp filter was already labelled as (e.g. an
      // in-progress saved-filter edit); only name it when starting fresh.
      tempFilterMeta ?? { name: chipName },
    )
  }

  // Helper to update URL with filter parameters
  function updateFilterUrl(filterType, filterValue) {
    const params = new URLSearchParams(searchParams)

    // Clear existing filter params
    params.delete('filter')
    params.delete('filterId')
    params.delete('filter_id')

    // Set new filter param (use filterId for advanced filters)
    if (filterType && filterValue) {
      params.set(filterType, filterValue)
    }

    // Always navigate with params (preserves project param)
    Navigate(
      { pathname: '/chores', search: params.toString() },
      { replace: true },
    )
  }

  function clearTempFilterAndUrl() {
    clearTempFilter()
    updateFilterUrl(null, null)
  }

  function handleSearchChange(e) {
    clearActiveFilter()
    if (hasQuickFilters) {
      clearQuickFilters()
    }
    const search = e.target.value
    if (search === '') {
      setFilteredChores(selectedProject ? projectFilteredChores : chores)
      setSearchTerm('')
      setSelectedCalendarDate(null)
      return
    }

    const term = search.toLowerCase()
    setSearchTerm(term)
    // Clear selected calendar date when search changes
    setSelectedCalendarDate(null)
  }
  function handleSearchClose() {
    setSearchTerm('')
    setFilteredChores(selectedProject ? projectFilteredChores : chores)
    setSearchInputFocus(0)
    setSelectedCalendarDate(null)
    if (searchParams.has('search')) {
      const params = new URLSearchParams(searchParams)
      params.delete('search')
      setSearchParams(params, { replace: true })
    }
  }

  function setSelectedChoreSectionWithCache(value) {
    setSelectedChoreSection(value)
    localStorage.setItem('selectedChoreSection', value)
  }

  const setOpenChoreSectionsWithCache = value => {
    setOpenChoreSections(value)
    localStorage.setItem('openChoreSections', JSON.stringify(value))
  }

  function toggleViewMode(value) {
    const newMode =
      value ??
      (() => {
        const modes = ['default', 'compact', 'calendar']
        return modes[(modes.indexOf(viewMode) + 1) % modes.length]
      })()
    setViewMode(newMode)
    localStorage.setItem('choreCardViewMode', newMode)
    if (newMode !== 'calendar') {
      setSelectedCalendarDate(null)
    }
  }

  // const renderChoreCard = (chore, key) => {
  //   const CardComponent = viewMode === 'compact' ? CompactChoreCard : ChoreCard
  //   return (
  //     <CardComponent
  //       key={key || chore.id}
  //       chore={chore}
  //       performers={membersData?.res}
  //       userLabels={userLabels}
  //       onChipClick={handleLabelFiltering}
  //       onAction={handleChoreAction}
  //       isMultiSelectMode={isMultiSelectMode}
  //       isSelected={selectedChores.has(chore.id)}
  //       onSelectionToggle={() => toggleChoreSelection(chore.id)}
  //     />
  //   )
  // }
  // const renderChores = chores => {
  //   return (
  //     <SwipeableList>
  //       {chores.map(chore => (
  //         <SwipeableListItem
  //           key={chore.id}
  //           trailingActions={
  //             <TrailingActions>
  //               <SwipeAction>
  //                 <Button
  //                   variant='solid'
  //                   color='primary'
  //                   size='sm'
  //                   startIcon={<Add />}
  //                   onClick={() => setAddTaskModalOpen(true)}
  //                 >
  //                   Add Task
  //                 </Button>
  //               </SwipeAction>
  //             </TrailingActions>
  //           }
  //         >
  //           {/* <Button
  //             variant='outlined'
  //             color='neutral'
  //             size='sm'
  //             startIcon={<EditCalendar />}
  //             onClick={() => setViewMode('calendar')}
  //           >
  //             View Calendar
  //           </Button> */}
  //           {renderChoreCard(chore)}
  //           {/* {chores.map(chore => renderChoreCard(chore))} */}
  //         </SwipeableListItem>
  //       ))}
  //     </SwipeableList>
  //   )
  // }

  const selectedDateChores = useMemo(() => {
    if (!selectedCalendarDate) return []

    const selectedDate = selectedCalendarDate.toLocaleDateString()
    return getFilteredChores.filter(chore => {
      if (!chore.nextDueDate) return false
      return new Date(chore.nextDueDate).toLocaleDateString() === selectedDate
    })
  }, [getFilteredChores, selectedCalendarDate])

  // "Narrowed" means the user actively cut the list down (search, quick
  // filters, a saved filter). Picking a project is not narrowing: an empty
  // project is an empty place, not a filtered-away result.
  const isNarrowed = Boolean(
    searchTerm?.length > 0 || hasQuickFilters || activeFilterId,
  )
  const isCustomProjectSelected = Boolean(
    selectedProject && selectedProject.id !== 'default',
  )

  const clearNarrowing = () => {
    clearQuickFilters()
    setSearchTerm('')
    clearActiveFilter()
    updateFilterUrl(null, null)
  }

  const appendChore = (prev, newChore) => {
    let newChores = [...prev, newChore]

    if (impersonatedUser) {
      newChores = newChores.filter(
        chore => chore.assignedTo === impersonatedUser.userId,
      )
    }

    return newChores
  }

  // Uses functional setState so back-to-back calls (e.g. creating several
  // voice-captured tasks in a row) each build on the latest state instead of
  // a closure snapshot taken before earlier calls landed.
  const updateChores = newChore => {
    setChores(prev => appendChore(prev, newChore))
    setFilteredChores(prev => appendChore(prev, newChore))
    clearQuickFilters()
  }

  // Show error state when API is unreachable
  if (choresError || membersError) {
    return (
      <div style={{ maxWidth: 900, margin: '0 auto', width: '100%' }}>
        <EmptyState
          variant='error'
          fullHeight
          icon={<FigmaIcon name='error' size={22} />}
          title={t('list.cantReachDayDan')}
          description={
            choresErrorDetails?.message || t('list.loadErrorDescription')
          }
          primaryAction={{
            label: t('list.tryAgain'),
            onClick: () => {
              refetchChores()
              queryClient.invalidateQueries(['circleMembers'])
            },
          }}
        />
      </div>
    )
  }

  if (
    isUserProfileLoading ||
    userProfile === null ||
    userLabelsLoading ||
    membersLoading ||
    choresLoading ||
    projectsLoading
  ) {
    return (
      <>
        <LoadingComponent />
      </>
    )
  }

  return (
    <>
      <FigmaAllTasksScreen
        chores={figmaTaskChores}
        members={membersData?.res || []}
        onComplete={chore => handleChoreAction('complete', chore)}
        onCreate={() => setAddTaskModalOpen(true)}
        onOpen={chore => Navigate(`/chores/${chore.id}`)}
        toolbar={figmaToolbar}
      />
      {addTaskModalOpen && (
        <TaskInput
          autoFocus={taskInputFocus}
          onChoreUpdate={updateChores}
          isModalOpen={addTaskModalOpen}
          initialMode={addTaskInitialMode}
          onClose={forceRefresh => {
            setAddTaskModalOpen(false)
            setAddTaskInitialMode(null)
            if (forceRefresh) refetchChores()
          }}
        />
      )}
      {confirmModelConfig?.isOpen && (
        <ConfirmationModal config={confirmModelConfig} />
      )}
      {activeModal && (
        <ChoreModals
          activeModal={activeModal}
          modalChore={modalChore}
          membersData={membersData}
          onChangeDueDate={handleChangeDueDate}
          onCompleteWithPastDate={handleCompleteWithPastDate}
          onAssigneeChange={handleAssigneeChange}
          onCompleteWithNote={handleCompleteWithNote}
          onNudge={handleNudge}
          onClose={closeModal}
        />
      )}
      {showAdvancedFilterBuilder && (
        <AdvancedFilterBuilder
          isOpen
          onClose={() => {
            setShowAdvancedFilterBuilder(false)
            setEditingFilter(null)
          }}
          onSave={filter => {
            if (filter.id) {
              updateFilter(filter.id, {
                name: filter.name,
                description: filter.description,
                color: filter.color,
                conditions: filter.conditions,
                operator: filter.operator,
              })
              showSuccess({
                title: t('list.filterUpdated'),
                message: t('list.filterUpdatedMessage', { name: filter.name }),
              })
            } else {
              saveFilter(filter)
              showSuccess({
                title: t('list.filterCreated'),
                message: t('list.filterCreatedMessage', { name: filter.name }),
              })
            }
            setShowAdvancedFilterBuilder(false)
            setEditingFilter(null)
          }}
          members={membersData?.res || []}
          labels={userLabels || []}
          projects={projectsWithDefault}
          allChores={searchFilteredChores}
          userProfile={userProfile}
          editingFilter={editingFilter}
        />
      )}
      {/* The Figma screen supersedes this legacy tree. A dormant view mode keeps
          Joy's layout observers out of the active task screen in WebKit. */}
    </>
  )
}

export default MyChores
