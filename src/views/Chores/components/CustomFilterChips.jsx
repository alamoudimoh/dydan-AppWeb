import PropTypes from 'prop-types'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

import FigmaIcon from '../../../components/FigmaIcon'
import { getTextColorFromBackgroundColor } from '../../../utils/Colors'

const CustomFilterChips = ({
  activeFilterId,
  filters = [],
  onFilterClick,
  onFilterDelete,
  onFilterEdit,
  onFilterPin,
}) => {
  const navigate = useNavigate()
  const { t } = useTranslation('chores')
  const [menuAnchor, setMenuAnchor] = useState(null)
  const [selectedFilter, setSelectedFilter] = useState(null)

  const handleMenuClose = () => {
    setMenuAnchor(null)
    setSelectedFilter(null)
  }

  useEffect(() => {
    if (!menuAnchor) return undefined

    const closeMenu = event => {
      if (!event.target.closest('[data-filter-menu]')) handleMenuClose()
    }
    const closeOnEscape = event => {
      if (event.key === 'Escape') handleMenuClose()
    }

    document.addEventListener('mousedown', closeMenu)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('mousedown', closeMenu)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [menuAnchor])

  if (filters.length === 0) return null

  const handleContextMenu = (event, filter) => {
    event.preventDefault()
    event.stopPropagation()
    setMenuAnchor(event.currentTarget)
    setSelectedFilter(filter)
  }

  const handleDelete = () => {
    if (selectedFilter) onFilterDelete(selectedFilter.id)
    handleMenuClose()
  }

  const handlePin = () => {
    if (selectedFilter) onFilterPin(selectedFilter.id)
    handleMenuClose()
  }

  const handleEdit = () => {
    if (selectedFilter && onFilterEdit) onFilterEdit(selectedFilter)
    handleMenuClose()
  }

  const pinnedFilters = filters
    .filter(filter => filter.isPinned)
    .sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0))
  const menuPosition = menuAnchor?.getBoundingClientRect()

  if (pinnedFilters.length === 0) return null

  return (
    <div className='relative'>
      <div
        className='flex gap-2 overflow-x-auto py-2 pr-2'
        style={{ scrollbarWidth: 'none' }}
      >
        {pinnedFilters.map(filter => {
          const isActive = activeFilterId === filter.id
          const hasWarning = !filter.isValid
          const badgeColor = filter.color || 'var(--t-faint)'
          const badgeTextColor = filter.color
            ? getTextColorFromBackgroundColor(filter.color)
            : 'var(--brand-contrast)'
          const displayCount = filter.count > 99 ? '99+' : (filter.count ?? 0)
          const taskCount = t('filters.filterTasksCount', {
            count: filter.count ?? 0,
          })
          const overdueCount =
            filter.overdueCount > 0
              ? ` (${t('filters.filterOverdueCount', {
                  count: filter.overdueCount,
                })})`
              : ''
          const tooltip = hasWarning
            ? t('filters.filterHasIssues', {
                issues: filter.validationIssues?.join(', '),
              })
            : `${filter.description ? `${filter.description} - ` : ''}${taskCount}${overdueCount}`

          return (
            <div
              className='badge flex-shrink-0'
              key={filter.id}
              style={{
                background: hasWarning
                  ? 'var(--sig-due-bg)'
                  : isActive
                    ? 'var(--brand)'
                    : 'var(--surface)',
                border: `1px solid ${hasWarning ? 'var(--sig-due)' : isActive ? 'var(--brand)' : 'var(--line)'}`,
                color: hasWarning
                  ? 'var(--sig-due)'
                  : isActive
                    ? 'var(--brand-contrast)'
                    : 'var(--t-primary)',
                fontSize: 13,
                fontWeight: isActive ? 700 : 600,
                height: 32,
                padding: 0,
              }}
              title={tooltip}
            >
              <button
                aria-pressed={isActive}
                className='flex min-w-0 items-center gap-1'
                disabled={hasWarning}
                onClick={() => onFilterClick(filter.id)}
                style={{
                  background: 'transparent',
                  border: 0,
                  color: 'inherit',
                  cursor: hasWarning ? 'not-allowed' : 'pointer',
                  font: 'inherit',
                  height: '100%',
                  padding: '0 4px 0 8px',
                }}
                type='button'
              >
                {!hasWarning && (
                  <span
                    className='flex flex-shrink-0 items-center justify-center rounded-full'
                    style={{
                      background: badgeColor,
                      color: badgeTextColor,
                      fontSize: isActive ? 14 : 10,
                      height: 20,
                      lineHeight: 1,
                      width: 20,
                    }}
                  >
                    {isActive ? (
                      <FigmaIcon name='check' size={14} />
                    ) : (
                      displayCount
                    )}
                  </span>
                )}
                <span
                  style={{
                    maxWidth: 100,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {filter.name}
                </span>
              </button>
              <button
                aria-expanded={
                  menuAnchor?.dataset.filterId === String(filter.id)
                }
                aria-haspopup='menu'
                aria-label={t('list.moreOptions')}
                data-filter-id={filter.id}
                data-filter-menu
                onClick={event => handleContextMenu(event, filter)}
                style={{
                  alignItems: 'center',
                  background: 'transparent',
                  border: 0,
                  color: 'inherit',
                  cursor: 'pointer',
                  display: 'flex',
                  height: '100%',
                  justifyContent: 'center',
                  opacity: 0.6,
                  padding: 0,
                  width: 24,
                }}
                type='button'
              >
                <span
                  style={{ fontSize: 16, lineHeight: 1 }}
                  aria-hidden='true'
                >
                  &#8942;
                </span>
              </button>
            </div>
          )
        })}

        <button
          aria-label={t('toolbar.filters')}
          className='btn btn-secondary btn-icon shrink-0'
          onClick={event => {
            event.preventDefault()
            event.stopPropagation()
            navigate('/filters')
          }}
          style={{
            borderRadius: 'var(--r-full)',
            height: 32,
            minHeight: 32,
            width: 32,
          }}
          title={t('toolbar.filters')}
          type='button'
        >
          <FigmaIcon name='settings' size={17} />
        </button>
      </div>

      <div
        aria-hidden='true'
        style={{
          background: 'linear-gradient(to right, transparent, var(--surface))',
          bottom: 0,
          insetInlineEnd: 0,
          pointerEvents: 'none',
          position: 'absolute',
          top: 0,
          width: 24,
        }}
      />

      {selectedFilter && menuPosition && (
        <div
          data-filter-menu
          role='menu'
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--line)',
            borderRadius: 'var(--r-md)',
            boxShadow: 'var(--shadow-sm)',
            left: menuPosition.left,
            minWidth: 180,
            padding: 4,
            position: 'fixed',
            top: menuPosition.bottom + 4,
            zIndex: 1300,
          }}
        >
          <button
            className='btn btn-ghost btn-sm w-full justify-start'
            onClick={handlePin}
            role='menuitem'
            style={{ border: 0 }}
            type='button'
          >
            <FigmaIcon name='star' size={16} />
            {selectedFilter.isPinned
              ? t('filters.unpinFilter')
              : t('filters.pinFilter')}
          </button>
          {onFilterEdit && (
            <button
              className='btn btn-ghost btn-sm w-full justify-start'
              onClick={handleEdit}
              role='menuitem'
              style={{ border: 0 }}
              type='button'
            >
              <FigmaIcon name='edit' size={16} />
              {t('filters.editFilter')}
            </button>
          )}
          <button
            className='btn btn-ghost btn-sm w-full justify-start'
            onClick={handleDelete}
            role='menuitem'
            style={{ border: 0, color: 'var(--sig-over)' }}
            type='button'
          >
            <FigmaIcon name='trash' size={16} />
            {t('filters.deleteFilter')}
          </button>
        </div>
      )}
    </div>
  )
}

export default CustomFilterChips

CustomFilterChips.propTypes = {
  activeFilterId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  filters: PropTypes.array,
  onFilterClick: PropTypes.func.isRequired,
  onFilterDelete: PropTypes.func.isRequired,
  onFilterEdit: PropTypes.func,
  onFilterPin: PropTypes.func.isRequired,
}
