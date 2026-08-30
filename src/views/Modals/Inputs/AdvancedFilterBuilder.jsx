import { useEffect, useMemo, useState } from 'react'

import AppModal from '../../../components/common/AppModal'
import ModalActions from '../../../components/common/ModalActions'
import FigmaIcon from '../../../components/FigmaIcon'
import { FILTER_COLORS } from '../../../utils/Colors'
import { applyFilter } from '../../../utils/FilterEngine'
import FilterBuilderContent, {
  conditionsToSelections,
  defaultSelections,
  selectionsToConditions,
} from '../../Chores/components/FilterBuilderContent'
import { useFilters } from '../../Filters/FilterQueries'

const EMPTY_FILTERS = []

const AdvancedFilterBuilder = ({
  allChores = [],
  editingFilter = null,
  isOpen,
  labels = [],
  members = [],
  onClose,
  onSave,
  projects = [],
  userProfile = null,
}) => {
  const [filterName, setFilterName] = useState('')
  const [filterColor, setFilterColor] = useState(FILTER_COLORS[0].value)
  const [selections, setSelections] = useState(defaultSelections())
  const [error, setError] = useState('')
  const { data: existedFilters = EMPTY_FILTERS } = useFilters()

  const filterNameExists = (name, excludeId = null) =>
    existedFilters.some(
      f => f.name.toLowerCase() === name.toLowerCase() && f.id !== excludeId,
    )

  useEffect(() => {
    if (!isOpen) return
    if (editingFilter) {
      setFilterName(editingFilter.name)
      setFilterColor(editingFilter.color || FILTER_COLORS[0].value)
      setSelections(conditionsToSelections(editingFilter.conditions))
    } else {
      setFilterName('')
      const potentialColor = FILTER_COLORS.find(
        c => !existedFilters.some(f => f.color === c.value),
      )
      setFilterColor(potentialColor?.value ?? FILTER_COLORS[0].value)
      setSelections(defaultSelections())
    }
    setError('')
  }, [editingFilter, existedFilters, isOpen])

  const conditions = useMemo(
    () => selectionsToConditions(selections),
    [selections],
  )

  const previewChores = useMemo(() => {
    if (conditions.length === 0) return []
    return applyFilter(
      allChores,
      { conditions, operator: 'AND' },
      { userId: userProfile?.id, members, labels, projects },
    )
  }, [conditions, allChores, userProfile, members, labels, projects])

  const previewCount = previewChores.length
  const previewOverdueCount = previewChores.filter(
    c => c.nextDueDate && new Date(c.nextDueDate) < new Date(),
  ).length

  const activeConditionCount = conditions.length

  const handleSave = () => {
    if (!filterName.trim()) {
      setError('Please enter a filter name')
      return
    }
    if (filterNameExists(filterName.trim(), editingFilter?.id)) {
      setError('A filter with this name already exists')
      return
    }
    if (conditions.length === 0) {
      setError('Please configure at least one filter condition')
      return
    }
    onSave({
      name: filterName.trim(),
      description: editingFilter?.description ?? '',
      color: filterColor,
      conditions,
      operator: 'AND',
      ...(editingFilter ? { id: editingFilter.id } : {}),
    })
    onClose()
  }

  return (
    <AppModal
      open={isOpen}
      isMobile
      onClose={onClose}
      maxHeight='92vh'
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {editingFilter ? 'Edit Filter' : 'New Filter'}
          {activeConditionCount > 0 && (
            <span
              className='badge'
              style={{ background: 'var(--brand)', color: 'white' }}
            >
              {activeConditionCount} condition
              {activeConditionCount !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      }
      footer={
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 8,
          }}
        >
          <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
            {conditions.length > 0 ? (
              <>
                <span
                  className='badge'
                  style={{
                    background: 'var(--surface-2)',
                    color: 'var(--t-secondary)',
                  }}
                >
                  {previewCount} task{previewCount !== 1 ? 's' : ''}
                </span>
                {previewOverdueCount > 0 && (
                  <span
                    className='badge'
                    style={{ background: 'var(--sig-overdue)', color: 'white' }}
                  >
                    {previewOverdueCount} overdue
                  </span>
                )}
              </>
            ) : (
              <span style={{ color: 'var(--t-muted)', fontSize: 12 }}>
                Add conditions to preview
              </span>
            )}
          </div>

          <ModalActions>
            <button
              type='button'
              className='btn btn-secondary'
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type='button'
              className='btn btn-primary'
              onClick={handleSave}
            >
              <FigmaIcon name='check' size={16} />
              Save Filter
            </button>
          </ModalActions>
        </div>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{ marginBottom: 16 }}>
          <label
            style={{
              display: 'block',
              marginBottom: 6,
              color: 'var(--t-secondary)',
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            Filter Name
          </label>
          <input
            className='input'
            placeholder='e.g. Overdue tasks for Alice'
            value={filterName}
            onChange={e => {
              setFilterName(e.target.value)
              setError('')
            }}
            autoFocus
          />
          {error && (
            <p
              style={{
                margin: '4px 0 0',
                color: 'var(--sig-overdue)',
                fontSize: 12,
              }}
            >
              {error}
            </p>
          )}
        </div>

        <div style={{ marginBottom: 16 }}>
          <p
            style={{
              margin: '0 0 6px',
              color: 'var(--t-secondary)',
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            Color
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {FILTER_COLORS.map(c => (
              <button
                type='button'
                key={c.value}
                title={c.name}
                onClick={() => setFilterColor(c.value)}
                aria-pressed={filterColor === c.value}
                style={{
                  width: 26,
                  height: 26,
                  border: 0,
                  borderRadius: '50%',
                  background: c.value,
                  cursor: 'pointer',
                  outline:
                    filterColor === c.value
                      ? '3px solid var(--brand)'
                      : '2px solid transparent',
                  outlineOffset: 2,
                  transition: 'transform 0.15s ease',
                  flexShrink: 0,
                }}
              />
            ))}
          </div>
        </div>

        <hr
          className='border-line'
          style={{ width: '100%', margin: '0 0 20px' }}
        />

        <FilterBuilderContent
          selections={selections}
          onSelectionsChange={setSelections}
          members={members}
          labels={labels}
          projects={projects}
        />
      </div>
    </AppModal>
  )
}

export default AdvancedFilterBuilder
