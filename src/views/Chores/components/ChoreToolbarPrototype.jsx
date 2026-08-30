/**
 * PROTOTYPE – Unified Chore Toolbar
 *
 * Proposed design to replace the current 3-surface layout:
 *   OLD: [Search] [Sort+Group+AssigneeFilter+CreateFilter] [ProjectSelector] [View] [Multiselect]
 *        + FilterBar (Due Date / Priority / Labels chips row)
 *        + FilterSection (saved/pinned filter chips row)
 *
 *   NEW: [Search] [Filter(n)] [Group ▾] [View] [Multiselect]
 *        + active filter chips appear inline next to Filter button
 *        + Filter button opens ONE unified bottom sheet containing:
 *            Assignee · Created By · Status · Priority · Due Date · Labels · Projects · Points
 *            + Saved Filters section
 *
 * How to try it: in MyChores.jsx, replace the <Box sx={{display:'flex'...}}> toolbar block
 * and the two rows below it (FilterBar + FilterSection) with:
 *   <ChoreToolbar ... />
 */

import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import AppModal from '../../../components/common/AppModal'
import ActiveFilterChips from '../../../components/common/filter/ActiveFilterChips'
import KeyboardShortcutHint from '../../../components/common/KeyboardShortcutHint'
import FigmaIcon from '../../../components/FigmaIcon'
import { Z_INDEX } from '../../../constants/zIndex'
import { FILTER_COLORS } from '../../../utils/Colors'
import Priorities from '../../../utils/Priorities'
import ProjectSelector from '../../components/ProjectSelector'
import CustomFilterChips from './CustomFilterChips'
import FilterBuilderContent, {
  CHORE_STATUSES,
  conditionsToSelections,
  defaultSelections,
  DUE_DATE_OPTIONS,
  POINTS_OPERATORS,
  selectionsToConditions,
} from './FilterBuilderContent'
import SearchBar from './SearchBar'

// ─── sub-components for the Display sheet ────────────────────────────────────

const CHIP_COLORS = {
  danger: { soft: 'var(--sig-over-bg)', solid: 'var(--sig-over)' },
  neutral: { soft: 'var(--surface-2)', solid: 'var(--surface-3)' },
  primary: { soft: 'var(--brand-faint)', solid: 'var(--brand)' },
  warning: { soft: 'var(--sig-due-bg)', solid: 'var(--sig-due)' },
}

const chipStyle = (color, selected) => {
  const tokens = CHIP_COLORS[color] || CHIP_COLORS.primary
  return {
    background: selected ? tokens.solid : tokens.soft,
    border: `1px solid ${selected ? tokens.solid : 'var(--line)'}`,
    color: selected ? 'var(--brand-contrast)' : tokens.solid,
  }
}

const ToolbarChip = ({
  children,
  color = 'neutral',
  selected = false,
  startDecorator,
  style,
  ...props
}) => (
  <button
    type='button'
    className='badge'
    aria-pressed={props['aria-pressed'] ?? selected}
    style={{
      ...chipStyle(color, selected),
      cursor: 'pointer',
      font: '700 12px var(--font-ui)',
      minHeight: 28,
      padding: '5px 10px',
      transition: 'all 0.15s ease',
      userSelect: 'none',
      ...style,
    }}
    {...props}
  >
    {startDecorator}
    {children}
  </button>
)

const ToolbarIconButton = ({ active = false, children, style, ...props }) => (
  <button
    type='button'
    className={`btn btn-icon ${active ? 'btn-primary' : 'btn-secondary'}`}
    style={{
      borderRadius: '50%',
      height: 32,
      minHeight: 32,
      padding: 6,
      width: 32,
      ...style,
    }}
    {...props}
  >
    {children}
  </button>
)

const SectionHeader = ({ badge, icon, label }) => (
  <div className='flex items-center gap-2' style={{ marginBottom: 12 }}>
    {icon && (
      <span className='text-muted flex' aria-hidden='true'>
        {icon}
      </span>
    )}
    <span className='text-primary' style={{ fontSize: 14, fontWeight: 600 }}>
      {label}
    </span>
    {badge != null && (
      <span
        className='badge bg-brand'
        style={{ color: 'var(--brand-contrast)', marginInlineStart: 'auto' }}
      >
        {badge}
      </span>
    )}
  </div>
)

const OptionChips = ({ multi, onToggle, options, selected }) => (
  <div className='flex flex-wrap gap-2'>
    {options.map(opt => {
      const isSelected = multi
        ? (selected || []).includes(opt.value)
        : selected === opt.value
      return (
        <ToolbarChip
          key={opt.value}
          selected={isSelected}
          color={isSelected ? (opt.color ?? 'primary') : 'neutral'}
          startDecorator={
            opt.icon != null ? (
              isSelected ? (
                <FigmaIcon name='check' size={14} />
              ) : (
                opt.icon
              )
            ) : undefined
          }
          onClick={() => onToggle(opt.value)}
        >
          {opt.label}
        </ToolbarChip>
      )
    })}
  </div>
)

// ─── main component ───────────────────────────────────────────────────────────

/**
 * Props:
 *  -- Advanced filter (filter sheet) --
 *  members           – circle members for Assignee / Created By sections
 *  labels            – user labels for Labels section
 *  projects          – projects list (projectsWithDefault) for Projects section + Display sheet
 *  tempFilter        – current temp filter object { conditions, operator } or null
 *  tempFilterMeta    – metadata for temp filter, including saved-filter edit source when applicable
 *  applyTempFilter   – (filter) => void  — called immediately as selections change
 *  clearTempFilter   – () => void
 *  saveFilter        – (filterData) => Promise  — saves as a named filter
 *  updateFilter      – (filterId, filterData) => Promise  — updates an existing saved filter
 *  onFilterSaved     – (name) => void  — called after successful save (for notifications)
 *
 *  -- Result counts --
 *  resultCount / totalCount
 *
 *  -- Clear all --
 *  onClearAllFilters – () => void
 *
 *  -- Saved filters --
 *  savedFilters      – [{ id, name, color, count, isPinned }]
 *  activeFilterId    – number | null
 *  onSavedFilterClick – (id) => void
 *  onSavedFilterEdit  – (filter) => void
 *  onSavedFilterDelete– (id) => void
 *  onSavedFilterPin   – (id) => void
 *
 *  -- Display sheet --
 *  selectedProject   – current project object (for Display sheet section)
 *  onProjectSelect   – (project) => void
 *  selectedAssigneeFilter – 'anyone' | 'assigned_to_me' | 'available_for_me' | 'assigned_to_others'
 *  onAssigneeFilterChange – (key) => void
 *  selectedGroupBy   – 'default' | 'due_date' | 'priority' | 'labels'
 *  onGroupBySelect   – (value) => void
 *  viewMode          – 'default' | 'compact' | 'calendar'
 *  onToggleViewMode  – (value?) => void
 *
 *  -- Multi-select --
 *  isMultiSelectMode – bool
 *  onToggleMultiSelect – () => void
 *
 *  -- Search --
 *  searchTerm / onSearchChange / onSearchClose / searchInputRef
 *  showKeyboardShortcuts
 */
const ChoreToolbar = ({
  // advanced filter
  activeFilterId,
  applyTempFilter,
  clearTempFilter,
  hideSearch = false,
  isMultiSelectMode,
  labels = [],
  members = [],
  onAssigneeFilterChange,
  onClearAllFilters,
  onFilterSaved,
  onGroupBySelect,
  // result counts
  onProjectSelect,
  onSavedFilterClick,
  // clear all
  onSavedFilterDelete,
  // project (for Display sheet)
  onSavedFilterEdit,
  onSavedFilterPin,
  // assignee (for Display sheet)
  onSearchChange,
  onSearchClose,
  // saved / custom
  onToggleMultiSelect,
  onToggleViewMode,
  projects = [],
  resultCount,
  saveFilter,
  savedFilters = [],
  // grouping
  searchInputRef,
  searchTerm,
  // view + multiselect
  selectedAssigneeFilter = 'anyone',
  selectedGroupBy = 'default',
  selectedProject,
  showKeyboardShortcuts,
  // search
  tempFilter,
  tempFilterMeta,
  totalCount,
  updateFilter,
  viewMode = 'default',
}) => {
  const { t } = useTranslation('chores')
  const [filterSheetOpen, setFilterSheetOpen] = useState(false)
  const [displaySheetOpen, setDisplaySheetOpen] = useState(false)
  const [localSelections, setLocalSelections] = useState(defaultSelections())
  const [savingFilter, setSavingFilter] = useState(false)
  const [saveFilterName, setSaveFilterName] = useState('')
  const [saveMenuAnchorEl, setSaveMenuAnchorEl] = useState(null)
  const [editingSavedFilter, setEditingSavedFilter] = useState(null)
  const saveMenuRef = useRef(null)
  const saveMenuContainerRef = useRef(null)
  const saveMenuFirstItemRef = useRef(null)
  const activeConditions = selectionsToConditions(localSelections)

  useEffect(() => {
    if (!saveMenuAnchorEl) return undefined

    saveMenuFirstItemRef.current?.focus()
    const closeMenu = event => {
      if (!saveMenuContainerRef.current?.contains(event.target)) {
        setSaveMenuAnchorEl(null)
      }
    }
    const handleKeyDown = event => {
      if (event.key === 'Escape') {
        event.preventDefault()
        setSaveMenuAnchorEl(null)
        saveMenuRef.current?.focus()
        return
      }

      if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
        const menuItems = Array.from(
          saveMenuContainerRef.current?.querySelectorAll(
            '[role="menuitem"]:not(:disabled)',
          ) || [],
        )
        const currentIndex = menuItems.indexOf(document.activeElement)
        const nextIndex =
          event.key === 'Home'
            ? 0
            : event.key === 'End'
              ? menuItems.length - 1
              : (currentIndex +
                  (event.key === 'ArrowDown' ? 1 : -1) +
                  menuItems.length) %
                menuItems.length
        event.preventDefault()
        menuItems[nextIndex]?.focus()
      }
    }

    document.addEventListener('mousedown', closeMenu)
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', closeMenu)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [saveMenuAnchorEl])

  // ── badge counts ─────────────────────────────────────────────────────────────

  const tempConditionCount = tempFilter?.conditions?.length || 0
  const savedFilterActive = activeFilterId != null ? 1 : 0
  const totalActiveCount = tempConditionCount + savedFilterActive
  const hasAnyActive = totalActiveCount > 0

  // ── inline chip strip ────────────────────────────────────────────────────────

  const inlineChips = []

  const getConditionChipLabel = condition => {
    if (!condition?.type) return t('toolbar.filter')

    const typeLabels = {
      assignee: t('toolbar.assignee'),
      createdBy: t('toolbar.createdBy'),
      status: t('toolbar.status'),
      priority: t('toolbar.priority'),
      label: t('filters.labels'),
      project: t('toolbar.project'),
      dueDate: t('toolbar.dueDate'),
      points: t('toolbar.points'),
    }

    const typeLabel = typeLabels[condition.type] || t('toolbar.filter')
    const typeChip =
      condition.operator === 'isNot'
        ? t('toolbar.chipNot', { type: typeLabel })
        : typeLabel

    if (condition.type === 'dueDate') {
      const dueDateOption = DUE_DATE_OPTIONS.find(
        o => o.value === condition.operator,
      )
      const dueDateLabel = dueDateOption
        ? dueDateOption.labelKey
          ? t(`filters.${dueDateOption.labelKey}`)
          : dueDateOption.label
        : t('toolbar.custom')
      return t('toolbar.chipValue', { type: typeChip, value: dueDateLabel })
    }

    if (condition.type === 'points') {
      const pointsOp =
        POINTS_OPERATORS.find(o => o.value === condition.operator)?.label ||
        condition.operator ||
        ''
      return t('toolbar.chipPoints', {
        type: typeChip,
        op: pointsOp,
        value: condition.value ?? 0,
      })
    }

    const rawValues = Array.isArray(condition.value)
      ? condition.value
      : condition.value != null
        ? [condition.value]
        : []

    const resolveLabel = value => {
      if (condition.type === 'assignee' || condition.type === 'createdBy') {
        const member = members.find(m => m.userId === value)
        return member?.displayName || member?.username || String(value)
      }
      if (condition.type === 'status') {
        const status = CHORE_STATUSES.find(s => s.value === value)
        return status
          ? status.labelKey
            ? t(`filters.${status.labelKey}`)
            : status.label
          : String(value)
      }
      if (condition.type === 'priority') {
        return Priorities.find(p => p.value === value)?.name || String(value)
      }
      if (condition.type === 'label') {
        return labels.find(l => l.id === value)?.name || String(value)
      }
      if (condition.type === 'project') {
        if (value === 'default') return t('toolbar.defaultProject')
        return projects.find(p => p.id === value)?.name || String(value)
      }
      return String(value)
    }

    if (rawValues.length === 0) {
      return typeChip
    }

    if (rawValues.length === 1) {
      return t('toolbar.chipValue', {
        type: typeChip,
        value: resolveLabel(rawValues[0]),
      })
    }

    return t('toolbar.chipCount', {
      type: typeChip,
      count: rawValues.length,
    })
  }

  const activeSavedFilter = savedFilterActive
    ? savedFilters.find(f => f.id === activeFilterId)
    : null

  const activeChipConditions = savedFilterActive
    ? activeSavedFilter?.conditions || []
    : tempFilter?.conditions || []

  const savedFilterEditMeta = activeSavedFilter
    ? {
        name: activeSavedFilter.name,
        description: activeSavedFilter.description,
        sourceFilterId: activeSavedFilter.id,
        sourceFilterName: activeSavedFilter.name,
        sourceFilterDescription: activeSavedFilter.description,
        sourceFilterColor: activeSavedFilter.color,
        isEditingSavedFilter: true,
      }
    : null

  const clearConditionAtIndex = index => {
    const nextConditions = activeChipConditions.filter(
      (_condition, conditionIndex) => conditionIndex !== index,
    )

    if (nextConditions.length === 0) {
      setLocalSelections(defaultSelections())
      clearTempFilter?.()
      // A saved filter still owns the view until it's toggled back off.
      if (savedFilterActive) onSavedFilterClick?.(activeFilterId)
      return
    }

    setLocalSelections(conditionsToSelections(nextConditions))

    // Dropping a condition from a saved filter detaches it into a temp filter
    // that remembers its source, rather than editing the saved filter itself.
    if (savedFilterActive) {
      applyTempFilter?.(
        {
          conditions: nextConditions,
          operator: activeSavedFilter?.operator || 'AND',
        },
        savedFilterEditMeta,
      )
      return
    }

    applyTempFilter?.(
      {
        ...tempFilter,
        operator: tempFilter?.operator || 'AND',
        conditions: nextConditions,
      },
      tempFilterMeta,
    )
  }

  activeChipConditions.forEach((condition, index) => {
    inlineChips.push({
      key: `${savedFilterActive ? '__saved' : '__temp'}_${index}`,
      label: getConditionChipLabel(condition),
      onClear: () => clearConditionAtIndex(index),
    })
  })

  // ── open filter sheet ────────────────────────────────────────────────────────

  const openFilterSheet = () => {
    if (tempFilter?.conditions?.length > 0) {
      setLocalSelections(conditionsToSelections(tempFilter.conditions))
      if (tempFilterMeta?.sourceFilterId) {
        const sourceFilter =
          savedFilters.find(f => f.id === tempFilterMeta.sourceFilterId) || null
        setEditingSavedFilter(
          sourceFilter ||
            (tempFilterMeta.sourceFilterId
              ? {
                  id: tempFilterMeta.sourceFilterId,
                  name: tempFilterMeta.sourceFilterName,
                  description: tempFilterMeta.sourceFilterDescription,
                  color: tempFilterMeta.sourceFilterColor,
                }
              : null),
        )
      } else {
        setEditingSavedFilter(null)
      }
    } else if (activeFilterId) {
      const sf = savedFilters.find(f => f.id === activeFilterId)
      setEditingSavedFilter(sf || null)
      setLocalSelections(
        sf?.conditions
          ? conditionsToSelections(sf.conditions)
          : defaultSelections(),
      )
    } else {
      setEditingSavedFilter(null)
      setLocalSelections(defaultSelections())
    }
    setSavingFilter(false)
    setSaveFilterName('')
    setSaveMenuAnchorEl(null)
    setFilterSheetOpen(true)
  }

  // ── selection changes → apply temp filter immediately ────────────────────────

  const handleSelectionsChange = updater => {
    setLocalSelections(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater
      const conditions = selectionsToConditions(next)
      if (conditions.length > 0) {
        applyTempFilter?.(
          { conditions, operator: 'AND' },
          editingSavedFilter
            ? {
                name: editingSavedFilter.name,
                description: editingSavedFilter.description,
                sourceFilterId: editingSavedFilter.id,
                sourceFilterName: editingSavedFilter.name,
                sourceFilterDescription: editingSavedFilter.description,
                sourceFilterColor: editingSavedFilter.color,
                isEditingSavedFilter: true,
              }
            : null,
        )
      } else {
        clearTempFilter?.()
      }
      return next
    })
  }

  // ── save filter ───────────────────────────────────────────────────────────────

  const handleSaveFilter = () => {
    const name = saveFilterName.trim()
    if (!name) return
    const conditions = selectionsToConditions(localSelections)
    if (conditions.length === 0) return

    const usedColors = savedFilters.map(f => f.color)
    const color =
      FILTER_COLORS.find(c => !usedColors.includes(c.value))?.value ??
      FILTER_COLORS[0].value

    saveFilter?.({
      name,
      description: '',
      color,
      conditions,
      operator: 'AND',
    })?.then?.(() => {
      applyTempFilter?.({ conditions, operator: 'AND' }, { name })
      onFilterSaved?.(name)
    })

    setSavingFilter(false)
    setSaveFilterName('')
    setFilterSheetOpen(false)
  }

  const handleUpdateFilter = () => {
    if (!editingSavedFilter?.id || !updateFilter) return

    const conditions = selectionsToConditions(localSelections)
    if (conditions.length === 0) return

    updateFilter(editingSavedFilter.id, {
      name: editingSavedFilter.name,
      description: editingSavedFilter.description || '',
      color: editingSavedFilter.color,
      conditions,
      operator: 'AND',
    })?.then?.(() => {
      clearTempFilter?.()
      onSavedFilterClick?.(editingSavedFilter.id)
      onFilterSaved?.(editingSavedFilter.name)
    })

    setSaveMenuAnchorEl(null)
    setFilterSheetOpen(false)
  }

  // ── display sheet helpers ────────────────────────────────────────────────────

  const filterActive = activeFilterId != null || tempConditionCount > 0

  const groupByOptions = [
    { value: 'default', label: t('toolbar.smart') },
    { value: 'due_date', label: t('toolbar.dueDate') },
    { value: 'priority', label: t('toolbar.priority') },
    { value: 'labels', label: t('filters.labels') },
  ]

  const assigneeOptions = [
    { value: 'anyone', label: t('toolbar.everyone') },
    { value: 'assigned_to_me', label: t('toolbar.mine') },
    { value: 'available_for_me', label: t('toolbar.availableToMe') },
    { value: 'assigned_to_others', label: t('toolbar.others') },
  ]

  const viewOptions = [
    {
      value: 'default',
      label: t('toolbar.cards'),
      icon: <FigmaIcon name='tasks' size={16} />,
    },
    {
      value: 'compact',
      label: t('toolbar.compact'),
      icon: <FigmaIcon name='bars' size={16} />,
    },
    {
      value: 'calendar',
      label: t('toolbar.calendar'),
      icon: <FigmaIcon name='calendar' size={16} />,
    },
  ]

  return (
    <>
      {/* ── Row 1: main toolbar ─────────────────────────────────────────────── */}
      <div
        className='flex items-center gap-1'
        style={{ justifyContent: 'space-between' }}
      >
        {/* Search takes available space */}
        {!hideSearch && (
          <SearchBar
            value={searchTerm}
            onChange={onSearchChange}
            onClose={onSearchClose}
            showKeyboardShortcuts={showKeyboardShortcuts}
            inputRef={searchInputRef}
          />
        )}

        {/* Filter button */}
        <span className='relative inline-flex'>
          <ToolbarIconButton
            active={hasAnyActive}
            onClick={openFilterSheet}
            aria-label={t('toolbar.filters')}
            title={t('toolbar.filters')}
          >
            <FigmaIcon name='bars' size={17} />
          </ToolbarIconButton>
          {totalActiveCount > 0 && (
            <span
              className='badge bg-brand'
              aria-label={String(totalActiveCount)}
              style={{
                color: 'var(--brand-contrast)',
                minWidth: 18,
                padding: '2px 5px',
                position: 'absolute',
                top: -6,
                insetInlineEnd: -6,
              }}
            >
              {totalActiveCount}
            </span>
          )}
        </span>

        {/* Project selector */}
        {!filterActive &&
          projects.filter(p => p.id !== 'default').length > 0 && (
            <ProjectSelector
              selectedProject={
                selectedProject?.name || t('toolbar.defaultProject')
              }
              onProjectSelect={onProjectSelect}
              showKeyboardShortcuts={showKeyboardShortcuts}
            />
          )}

        {/* Display button — View + Group combined */}
        <ToolbarIconButton
          onClick={() => setDisplaySheetOpen(true)}
          aria-label={t('toolbar.viewAndGroupOptions')}
          title={t('toolbar.viewAndGroup')}
        >
          {viewMode === 'calendar' ? (
            <FigmaIcon name='calendar' size={17} />
          ) : viewMode === 'compact' ? (
            <FigmaIcon name='bars' size={17} />
          ) : (
            <FigmaIcon name='tasks' size={17} />
          )}
        </ToolbarIconButton>

        {/* Multiselect */}
        <span className='relative inline-flex'>
          <ToolbarIconButton
            active={isMultiSelectMode}
            onClick={onToggleMultiSelect}
            aria-label={
              isMultiSelectMode
                ? t('toolbar.exitMultiSelect')
                : t('toolbar.enterMultiSelect')
            }
            title={
              isMultiSelectMode
                ? t('toolbar.exitMultiSelectShortcut')
                : t('toolbar.multiSelectShortcut')
            }
          >
            {isMultiSelectMode ? (
              <FigmaIcon name='check' size={17} />
            ) : (
              <span
                aria-hidden='true'
                style={{
                  border: '2px solid currentColor',
                  borderRadius: 3,
                  display: 'block',
                  height: 15,
                  width: 15,
                }}
              />
            )}
          </ToolbarIconButton>
          <KeyboardShortcutHint
            shortcut='S'
            show={showKeyboardShortcuts}
            sx={{ position: 'absolute', top: -8, right: -8, zIndex: 1000 }}
          />
        </span>
      </div>

      {/* ── Row 2: pinned filters quick access ──────────────────────────────── */}
      {/* Stays visible even while a saved filter is active (it self-highlights)
          so switching between pinned filters never requires clearing first.
          Only steps aside for an ad-hoc/temp condition set, which has no
          matching pinned identity to show. */}
      {tempConditionCount === 0 && (
        <CustomFilterChips
          filters={savedFilters}
          activeFilterId={activeFilterId}
          onFilterClick={onSavedFilterClick}
          onFilterDelete={onSavedFilterDelete}
          onFilterPin={onSavedFilterPin}
          onFilterEdit={onSavedFilterEdit}
        />
      )}

      {/* ── Row 3: active (temp/ad-hoc) filter chips ──────────────────────────── */}
      {tempConditionCount > 0 && (
        <ActiveFilterChips
          chips={inlineChips}
          onOpen={openFilterSheet}
          showAddChip
          onAdd={openFilterSheet}
          onClearAll={() => {
            setLocalSelections(defaultSelections())
            onClearAllFilters?.()
          }}
          resultCount={resultCount}
          totalCount={totalCount}
          maxVisible={2}
          chipSize='md'
          clearButtonSize='sm'
          clearButtonSx={{ color: 'text.secondary' }}
        />
      )}

      {/* ── Unified Filter bottom sheet ─────────────────────────────────────── */}
      <AppModal
        open={filterSheetOpen}
        isMobile
        onClose={() => {
          setSaveMenuAnchorEl(null)
          setFilterSheetOpen(false)
        }}
        maxHeight='92vh'
        title={
          <span className='flex items-center gap-2'>
            <FigmaIcon name='bars' size={20} />
            {t('toolbar.filters')}
            {hasAnyActive && (
              <span
                className='badge bg-brand'
                style={{ color: 'var(--brand-contrast)' }}
              >
                {totalActiveCount}
              </span>
            )}
          </span>
        }
        footer={
          savingFilter ? (
            <div className='flex items-center gap-2' style={{ width: '100%' }}>
              <input
                className='input'
                placeholder={t('toolbar.filterNamePlaceholder')}
                value={saveFilterName}
                onChange={e => setSaveFilterName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSaveFilter()}
                autoFocus
                style={{ flex: 1, minHeight: 30, padding: '5px 10px' }}
              />
              <button
                type='button'
                className='btn btn-primary btn-sm'
                onClick={handleSaveFilter}
                disabled={!saveFilterName.trim()}
              >
                {t('toolbar.save')}
              </button>
              <button
                type='button'
                className='btn btn-ghost btn-sm'
                onClick={() => setSavingFilter(false)}
              >
                {t('toolbar.cancel')}
              </button>
            </div>
          ) : (
            <div
              className='flex items-center gap-2'
              style={{ justifyContent: 'space-between' }}
            >
              <button
                type='button'
                className='btn btn-danger btn-sm'
                disabled={!hasAnyActive && activeConditions.length === 0}
                onClick={() => {
                  setLocalSelections(defaultSelections())
                  setSaveMenuAnchorEl(null)
                  onClearAllFilters?.()
                  setFilterSheetOpen(false)
                }}
              >
                {t('toolbar.clearAll')}
              </button>

              {activeConditions.length > 0 ? (
                <div className='relative flex gap-2' ref={saveMenuContainerRef}>
                  <div className='flex'>
                    <button
                      type='button'
                      className='btn btn-primary btn-sm'
                      onClick={() => {
                        setSaveMenuAnchorEl(null)
                        setFilterSheetOpen(false)
                      }}
                      style={{
                        borderRadius: 'var(--r-md) 0 0 var(--r-md)',
                        minWidth: 140,
                      }}
                    >
                      {resultCount != null
                        ? t('toolbar.showResults', { count: resultCount })
                        : t('toolbar.done')}
                    </button>
                    <button
                      type='button'
                      className='btn btn-primary btn-icon'
                      ref={saveMenuRef}
                      aria-label={t('toolbar.moreSaveOptions')}
                      aria-expanded={Boolean(saveMenuAnchorEl)}
                      aria-haspopup='menu'
                      onClick={e => setSaveMenuAnchorEl(e.currentTarget)}
                      style={{
                        borderInlineStart:
                          '1px solid color-mix(in srgb, var(--brand-contrast) 30%, transparent)',
                        borderRadius: '0 var(--r-md) var(--r-md) 0',
                        minHeight: 30,
                      }}
                    >
                      <FigmaIcon name='chevron_down' size={16} />
                    </button>
                  </div>

                  {saveMenuAnchorEl && (
                    <div
                      role='menu'
                      aria-label={t('toolbar.moreSaveOptions')}
                      className='card'
                      style={{
                        bottom: 'calc(100% + 8px)',
                        minWidth: 200,
                        padding: 4,
                        position: 'absolute',
                        insetInlineEnd: 0,
                        zIndex: Z_INDEX.MODAL_CONTENT + 10,
                      }}
                    >
                      <button
                        ref={saveMenuFirstItemRef}
                        type='button'
                        role='menuitem'
                        className='btn btn-ghost btn-sm'
                        onClick={handleUpdateFilter}
                        disabled={!editingSavedFilter}
                        style={{ justifyContent: 'flex-start', width: '100%' }}
                      >
                        <FigmaIcon name='check' size={16} />
                        {t('toolbar.saveFilter')}
                      </button>
                      <button
                        type='button'
                        role='menuitem'
                        className='btn btn-ghost btn-sm'
                        onClick={() => {
                          setSaveMenuAnchorEl(null)
                          setSaveFilterName(
                            editingSavedFilter
                              ? t('toolbar.filterCopy', {
                                  name: editingSavedFilter.name,
                                })
                              : '',
                          )
                          setSavingFilter(true)
                        }}
                        style={{ justifyContent: 'flex-start', width: '100%' }}
                      >
                        <FigmaIcon name='plus' size={16} />
                        {t('toolbar.saveAsNewFilter')}
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  type='button'
                  className='btn btn-primary btn-sm'
                  onClick={() => {
                    setSaveMenuAnchorEl(null)
                    setFilterSheetOpen(false)
                  }}
                  style={{ minWidth: 140 }}
                >
                  {t('toolbar.done')}
                </button>
              )}
            </div>
          )
        }
      >
        <div className='flex flex-col'>
          {/* Full advanced filter content */}
          <FilterBuilderContent
            selections={localSelections}
            onSelectionsChange={handleSelectionsChange}
            members={members}
            labels={labels}
            projects={projects}
          />

          {/* Saved filters section */}
          {savedFilters.length > 0 && (
            <>
              <div
                className='border-line'
                style={{ borderTop: '1px solid var(--line)', margin: '20px 0' }}
              />
              <div
                className='text-primary'
                style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}
              >
                {t('toolbar.savedFilters')}
              </div>
              <div className='flex flex-wrap gap-2'>
                {savedFilters.map(filter => {
                  const isActive = activeFilterId === filter.id
                  return (
                    <ToolbarChip
                      key={filter.id}
                      selected={isActive}
                      color={isActive ? 'primary' : 'neutral'}
                      startDecorator={
                        isActive ? (
                          <FigmaIcon name='check' size={14} />
                        ) : (
                          <span className='badge bg-surface-3 text-muted'>
                            {filter.count ?? 0}
                          </span>
                        )
                      }
                      onClick={() => {
                        onSavedFilterClick?.(filter.id)
                        if (!isActive) setFilterSheetOpen(false)
                      }}
                      style={
                        filter.color && !isActive
                          ? { borderColor: filter.color }
                          : undefined
                      }
                    >
                      {filter.name}
                    </ToolbarChip>
                  )
                })}
              </div>
            </>
          )}
        </div>
      </AppModal>

      {/* ── Display bottom sheet (View + Group + Assignee + Project) ──────────── */}
      <AppModal
        open={displaySheetOpen}
        isMobile
        onClose={() => setDisplaySheetOpen(false)}
        title={
          <span className='flex items-center gap-2'>
            <FigmaIcon name='tasks' size={20} />
            {t('toolbar.display')}
          </span>
        }
        footer={
          <button
            type='button'
            className='btn btn-primary btn-sm'
            onClick={() => setDisplaySheetOpen(false)}
            style={{ minWidth: 140 }}
          >
            {t('toolbar.done')}
          </button>
        }
      >
        <div className='flex flex-col'>
          {/* View section */}
          <SectionHeader label={t('toolbar.view')} />
          <div className='flex flex-wrap gap-2'>
            {viewOptions.map(opt => (
              <ToolbarChip
                key={opt.value}
                selected={viewMode === opt.value}
                color={viewMode === opt.value ? 'primary' : 'neutral'}
                startDecorator={
                  viewMode === opt.value ? (
                    <FigmaIcon name='check' size={14} />
                  ) : (
                    opt.icon
                  )
                }
                onClick={() => onToggleViewMode?.(opt.value)}
              >
                {opt.label}
              </ToolbarChip>
            ))}
          </div>

          <div
            className='border-line'
            style={{ borderTop: '1px solid var(--line)', margin: '20px 0' }}
          />

          {/* Group by section */}
          <SectionHeader
            icon={<FigmaIcon name='bars' size={18} />}
            label={t('toolbar.groupBy')}
            badge={
              selectedGroupBy !== 'default'
                ? groupByOptions.find(o => o.value === selectedGroupBy)?.label
                : null
            }
          />
          <div className='flex flex-wrap gap-2'>
            {groupByOptions.map(opt => (
              <ToolbarChip
                key={opt.value}
                selected={selectedGroupBy === opt.value}
                color={selectedGroupBy === opt.value ? 'primary' : 'neutral'}
                onClick={() => onGroupBySelect?.(opt.value)}
              >
                {opt.label}
              </ToolbarChip>
            ))}
          </div>

          {/* Show tasks for section */}
          <div
            className='border-line'
            style={{ borderTop: '1px solid var(--line)', margin: '20px 0' }}
          />
          <SectionHeader
            icon={<FigmaIcon name='bars' size={18} />}
            label={t('toolbar.showTasksFor')}
            badge={
              selectedAssigneeFilter !== 'anyone'
                ? assigneeOptions.find(o => o.value === selectedAssigneeFilter)
                    ?.label
                : null
            }
          />
          <OptionChips
            options={assigneeOptions}
            selected={selectedAssigneeFilter}
            multi={false}
            onToggle={v => onAssigneeFilterChange?.(v)}
          />
        </div>
      </AppModal>
    </>
  )
}

export default ChoreToolbar
