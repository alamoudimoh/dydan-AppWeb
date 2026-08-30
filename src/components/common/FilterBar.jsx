import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import FigmaIcon from '../../components/FigmaIcon'
import AppModal from './AppModal'
import ActiveFilterChips from './filter/ActiveFilterChips'
import ModalActions from './ModalActions'

/**
 * Reusable filter bar component.
 *
 * Props:
 *   filterDefs   - array of filter definitions:
 *                  { id, label, type ('multi-select'|'single-select'|'boolean'|'date-range'),
 *                    icon, options?, defaultValue?, filterFn }
 *                  options item: { value, label, color?, icon?, avatar? }
 *                  defaultValue: if the active value equals this, no chip is shown
 *                  date-range value shape: { preset?, from?: ISO string, to?: ISO string }
 *   activeFilters - current filter state object { [id]: value }
 *   onSetFilter  - (filterId, value | null) => void
 *   onClearAll   - () => void
 *   resultCount  - optional number shown in "Show N results" button
 *   totalCount   - optional total for "N of M" label
 */

// ── Date range presets (no moment dependency — pure Date) ────────────────────

const d = (date, h = 0, m = 0, s = 0, ms = 0) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate(), h, m, s, ms)

const DATE_RANGE_PRESETS = [
  {
    value: 'today',
    labelKey: 'today',
    getRange: () => {
      const t = d(new Date())
      return {
        from: t.toISOString(),
        to: d(new Date(), 23, 59, 59, 999).toISOString(),
      }
    },
  },
  {
    value: 'yesterday',
    labelKey: 'yesterday',
    getRange: () => {
      const t = d(new Date())
      const y = new Date(t)
      y.setDate(t.getDate() - 1)
      return {
        from: d(y).toISOString(),
        to: d(y, 23, 59, 59, 999).toISOString(),
      }
    },
  },
  {
    value: 'this-week',
    labelKey: 'thisWeek',
    getRange: () => {
      const t = d(new Date())
      const start = new Date(t)
      start.setDate(t.getDate() - t.getDay())
      const end = new Date(start)
      end.setDate(start.getDate() + 6)
      return {
        from: d(start).toISOString(),
        to: d(end, 23, 59, 59, 999).toISOString(),
      }
    },
  },
  {
    value: 'last-7-days',
    labelKey: 'last7Days',
    getRange: () => {
      const t = d(new Date())
      const start = new Date(t)
      start.setDate(t.getDate() - 6)
      return {
        from: d(start).toISOString(),
        to: d(new Date(), 23, 59, 59, 999).toISOString(),
      }
    },
  },
  {
    value: 'this-month',
    labelKey: 'thisMonth',
    getRange: () => {
      const n = new Date()
      const start = new Date(n.getFullYear(), n.getMonth(), 1)
      const end = new Date(n.getFullYear(), n.getMonth() + 1, 0)
      return {
        from: start.toISOString(),
        to: d(end, 23, 59, 59, 999).toISOString(),
      }
    },
  },
  {
    value: 'last-30-days',
    labelKey: 'last30Days',
    getRange: () => {
      const t = d(new Date())
      const start = new Date(t)
      start.setDate(t.getDate() - 29)
      return {
        from: d(start).toISOString(),
        to: d(new Date(), 23, 59, 59, 999).toISOString(),
      }
    },
  },
  {
    value: 'last-3-months',
    labelKey: 'last3Months',
    getRange: () => {
      const t = d(new Date())
      const start = new Date(t)
      start.setMonth(t.getMonth() - 3)
      return {
        from: d(start).toISOString(),
        to: d(new Date(), 23, 59, 59, 999).toISOString(),
      }
    },
  },
]

const toInputDate = iso => (iso ? iso.split('T')[0] : '')

const fmtDisplayDate = iso => {
  if (!iso) return null
  const dt = new Date(iso)
  return dt.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

// ── Chip styling (Figma token palette) ───────────────────────────────────────

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

const selectableChipBase = {
  cursor: 'pointer',
  transition: 'all 0.15s ease',
  userSelect: 'none',
  alignItems: 'center',
  lineHeight: 1.2,
}

const selectableChip = (color, selected) => ({
  ...selectableChipBase,
  ...chipStyle(color, selected),
})

const sectionBadgeChip = {
  ...chipStyle('primary', true),
  ...selectableChipBase,
  fontSize: '0.7rem',
  marginInlineStart: 'auto',
  minHeight: 22,
  padding: '2px 6px',
}

const modalCountChip = {
  ...chipStyle('primary', true),
  minHeight: 22,
  padding: '2px 6px',
}

// ── Component ────────────────────────────────────────────────────────────────

const FilterBar = ({
  activeFilters,
  filterDefs,
  onClearAll,
  onSetFilter,
  resultCount,
  totalCount,
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const { t } = useTranslation('chores')

  const presetLabel = preset =>
    preset.labelKey
      ? t(`filters.dateRangePresets.${preset.labelKey}`)
      : preset.label

  // ── Active count ───────────────────────────────────────────────────────────

  const activeFilterCount = filterDefs.filter(def => {
    const value = activeFilters[def.id]
    if (value === undefined || value === null) return false
    if (def.defaultValue !== undefined && value === def.defaultValue)
      return false
    if (Array.isArray(value) && value.length === 0) return false
    if (def.type === 'date-range') return !!(value?.from || value?.to)
    return true
  }).length

  const hasActive = activeFilterCount > 0

  // ── Chip labels for inline bar ─────────────────────────────────────────────

  const getActiveChipLabel = def => {
    const value = activeFilters[def.id]
    if (value === undefined || value === null) return null

    if (def.type === 'single-select') {
      if (def.defaultValue !== undefined && value === def.defaultValue)
        return null
      return def.options?.find(o => o.value === value)?.label ?? def.label
    }

    if (def.type === 'boolean') return def.label

    if (
      def.type === 'multi-select' &&
      Array.isArray(value) &&
      value.length > 0
    ) {
      if (value.length === 1) {
        return def.options?.find(o => o.value === value[0])?.label ?? def.label
      }
      return `${def.label} (${value.length})`
    }

    if (def.type === 'date-range') {
      if (!value?.from && !value?.to) return null
      if (value.preset) {
        const preset = DATE_RANGE_PRESETS.find(p => p.value === value.preset)
        return preset ? presetLabel(preset) : t('filters.dateRange')
      }
      const from = fmtDisplayDate(value.from)
      const to = fmtDisplayDate(value.to)
      if (from && to) return `${from} – ${to}`
      if (from) return t('filters.from', { date: from })
      if (to) return t('filters.until', { date: to })
      return null
    }

    return null
  }

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleMultiToggle = (defId, optValue) => {
    const current = activeFilters[defId] || []
    const next = current.includes(optValue)
      ? current.filter(v => v !== optValue)
      : [...current, optValue]
    onSetFilter(defId, next.length > 0 ? next : null)
  }

  const handleSingleToggle = (defId, optValue) => {
    onSetFilter(defId, activeFilters[defId] === optValue ? null : optValue)
  }

  const handleBoolToggle = defId => {
    onSetFilter(defId, activeFilters[defId] ? null : true)
  }

  const handleDateRangePreset = (defId, presetValue) => {
    const current = activeFilters[defId] || {}
    if (current.preset === presetValue) {
      onSetFilter(defId, null)
      return
    }
    const preset = DATE_RANGE_PRESETS.find(p => p.value === presetValue)
    onSetFilter(defId, { preset: presetValue, ...preset.getRange() })
  }

  const handleDateRangeInput = (defId, field, dateStr) => {
    const current = activeFilters[defId] || {}
    if (!dateStr) {
      const next = { ...current, preset: null, [field]: null }
      onSetFilter(defId, next.from || next.to ? next : null)
    } else {
      const iso =
        field === 'to'
          ? new Date(dateStr + 'T23:59:59').toISOString()
          : new Date(dateStr + 'T00:00:00').toISOString()
      onSetFilter(defId, { ...current, preset: null, [field]: iso })
    }
  }

  // ── Render helper: selectable option chip ──────────────────────────────────

  const renderOptionChip = ({
    avatar,
    color,
    icon,
    isSelected,
    key,
    label,
    onClick,
  }) => (
    <span
      key={key}
      className='badge'
      role='button'
      tabIndex={0}
      aria-pressed={isSelected}
      onClick={onClick}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick()
        }
      }}
      style={selectableChip(
        (isSelected ? color : null) ?? 'neutral',
        isSelected,
      )}
    >
      {avatar ? (
        <img
          src={avatar}
          alt={label}
          style={{
            borderRadius: '50%',
            height: 20,
            objectFit: 'cover',
            width: 20,
          }}
        />
      ) : isSelected ? (
        <FigmaIcon name='check' size={14} />
      ) : (
        (icon ?? null)
      )}
      {label}
    </span>
  )

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <>
      {/* ── Inline bar ─────────────────────────────────────── */}
      <div
        className='flex items-center gap-1 flex-wrap'
        style={{ marginBottom: 16 }}
      >
        <span
          className='relative inline-flex items-center'
          style={{ alignItems: 'center' }}
        >
          <button
            type='button'
            className={hasActive ? 'btn btn-primary' : 'btn btn-secondary'}
            onClick={() => setIsOpen(true)}
            style={{
              alignItems: 'center',
              borderRadius: 'var(--r-lg)',
              gap: 4,
              minHeight: 0,
              padding: '4px 8px',
            }}
          >
            <FigmaIcon name='bars' size={16} />
            {t('filters.filters')}
          </button>
          {activeFilterCount > 0 && (
            <span
              className='badge bg-brand'
              aria-label={String(activeFilterCount)}
              style={{
                color: 'var(--brand-contrast)',
                minWidth: 18,
                padding: '2px 5px',
                position: 'absolute',
                top: -6,
                insetInlineEnd: -6,
              }}
            >
              {activeFilterCount}
            </span>
          )}
        </span>

        <ActiveFilterChips
          chips={filterDefs
            .map(def => ({ def, label: getActiveChipLabel(def) }))
            .filter(({ label }) => !!label)
            .map(({ def, label }) => ({
              key: def.id,
              label,
              onClear: () => onSetFilter(def.id, null),
            }))}
          onOpen={() => setIsOpen(true)}
          onClearAll={hasActive ? onClearAll : undefined}
          resultCount={hasActive ? resultCount : undefined}
          totalCount={hasActive ? totalCount : undefined}
          maxVisible={2}
          chipSize='md'
        />
      </div>

      {/* ── Bottom sheet ────────────────────────────────────── */}
      <AppModal
        open={isOpen}
        isMobile
        onClose={() => setIsOpen(false)}
        title={
          <span className='flex items-center gap-2'>
            <FigmaIcon name='bars' size={20} />
            {t('filters.filters')}
            {hasActive && (
              <span
                className='badge bg-brand'
                style={{ color: 'var(--brand-contrast)', ...modalCountChip }}
              >
                {activeFilterCount}
              </span>
            )}
          </span>
        }
        footer={
          <ModalActions
            tertiary={{
              label: t('filters.clearAll'),
              color: 'danger',
              disabled: !hasActive,
              onClick: onClearAll,
            }}
            primary={{
              label:
                resultCount !== undefined
                  ? t('filters.showResults', { count: resultCount })
                  : t('filters.done'),
              onClick: () => setIsOpen(false),
            }}
          />
        }
      >
        <div className='flex flex-col' style={{ gap: 0 }}>
          {filterDefs.map((def, idx) => (
            <div key={def.id}>
              {idx > 0 && (
                <div
                  style={{
                    borderTop: '1px solid var(--line)',
                    margin: '20px 0',
                  }}
                />
              )}

              {/* Section header */}
              <div
                className='flex items-center gap-1'
                style={{ marginBottom: 12 }}
              >
                {def.icon && (
                  <span className='flex items-center text-muted'>
                    {def.icon}
                  </span>
                )}
                <span
                  className='text-primary'
                  style={{ fontSize: 14, fontWeight: 600 }}
                >
                  {def.label}
                </span>

                {/* active badge in header */}
                {def.type === 'multi-select' &&
                  (activeFilters[def.id]?.length ?? 0) > 0 && (
                    <span className='badge' style={sectionBadgeChip}>
                      {t('filters.selected', {
                        count: activeFilters[def.id].length,
                      })}
                    </span>
                  )}
                {def.type === 'single-select' &&
                  activeFilters[def.id] !== null &&
                  (() => {
                    const opt = def.options?.find(
                      o => o.value === activeFilters[def.id],
                    )
                    return opt ? (
                      <span className='badge' style={sectionBadgeChip}>
                        {opt.label}
                      </span>
                    ) : null
                  })()}
                {def.type === 'date-range' && getActiveChipLabel(def) && (
                  <span className='badge' style={sectionBadgeChip}>
                    {getActiveChipLabel(def)}
                  </span>
                )}
              </div>

              {/* multi-select */}
              {def.type === 'multi-select' && (
                <div className='flex flex-wrap gap-2'>
                  {def.options?.map(opt => {
                    const isSelected = (activeFilters[def.id] || []).includes(
                      opt.value,
                    )
                    return renderOptionChip({
                      key: opt.value,
                      isSelected,
                      color: opt.color ?? 'primary',
                      onClick: () => handleMultiToggle(def.id, opt.value),
                      avatar: opt.avatar,
                      label: opt.label,
                      icon: opt.icon,
                    })
                  })}
                </div>
              )}

              {/* single-select */}
              {def.type === 'single-select' && (
                <div className='flex flex-wrap gap-2'>
                  {def.options?.map(opt => {
                    const isSelected = activeFilters[def.id] === opt.value
                    return renderOptionChip({
                      key: opt.value,
                      isSelected,
                      color: opt.color ?? 'primary',
                      onClick: () => handleSingleToggle(def.id, opt.value),
                      avatar: opt.avatar,
                      label: opt.label,
                      icon: opt.icon,
                    })
                  })}
                </div>
              )}

              {/* boolean */}
              {def.type === 'boolean' && (
                <span
                  role='button'
                  tabIndex={0}
                  aria-pressed={Boolean(activeFilters[def.id])}
                  className='badge'
                  onClick={() => handleBoolToggle(def.id)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      handleBoolToggle(def.id)
                    }
                  }}
                  style={selectableChip(
                    activeFilters[def.id] ? 'primary' : 'neutral',
                    Boolean(activeFilters[def.id]),
                  )}
                >
                  {activeFilters[def.id] && (
                    <FigmaIcon name='check' size={14} />
                  )}
                  {def.label}
                </span>
              )}

              {/* date-range */}
              {def.type === 'date-range' &&
                (() => {
                  const val = activeFilters[def.id] || {}
                  return (
                    <div className='flex flex-col' style={{ gap: 12 }}>
                      {/* Preset chips */}
                      <div className='flex flex-wrap gap-2'>
                        {DATE_RANGE_PRESETS.map(preset => {
                          const isSelected = val.preset === preset.value
                          return (
                            <span
                              key={preset.value}
                              className='badge'
                              role='button'
                              tabIndex={0}
                              aria-pressed={isSelected}
                              onClick={() =>
                                handleDateRangePreset(def.id, preset.value)
                              }
                              onKeyDown={e => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  e.preventDefault()
                                  handleDateRangePreset(def.id, preset.value)
                                }
                              }}
                              style={selectableChip(
                                isSelected ? 'primary' : 'neutral',
                                isSelected,
                              )}
                            >
                              {isSelected && (
                                <FigmaIcon name='check' size={14} />
                              )}
                              {presetLabel(preset)}
                            </span>
                          )
                        })}
                      </div>

                      {/* Custom date inputs */}
                      <div className='flex items-center' style={{ gap: 4 }}>
                        <input
                          type='date'
                          className='input'
                          value={toInputDate(val.from)}
                          max={toInputDate(val.to) || undefined}
                          onChange={e =>
                            handleDateRangeInput(def.id, 'from', e.target.value)
                          }
                          style={{ flex: 1, fontSize: '0.8rem', minHeight: 30 }}
                        />
                        <span
                          className='text-faint'
                          style={{ flexShrink: 0, fontSize: 12 }}
                        >
                          –
                        </span>
                        <input
                          type='date'
                          className='input'
                          value={toInputDate(val.to)}
                          min={toInputDate(val.from) || undefined}
                          onChange={e =>
                            handleDateRangeInput(def.id, 'to', e.target.value)
                          }
                          style={{ flex: 1, fontSize: '0.8rem', minHeight: 30 }}
                        />
                      </div>
                    </div>
                  )
                })()}
            </div>
          ))}
        </div>
      </AppModal>
    </>
  )
}

export default FilterBar
