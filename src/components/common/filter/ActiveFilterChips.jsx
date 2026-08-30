import { useTranslation } from 'react-i18next'

import FigmaIcon from '../../FigmaIcon'

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

const resolveSx = sx => {
  if (!sx) return undefined
  const colorMap = {
    'text.primary': 'var(--t-primary)',
    'text.secondary': 'var(--t-muted)',
    'text.tertiary': 'var(--t-faint)',
    primary: 'var(--brand)',
    neutral: 'var(--t-muted)',
    danger: 'var(--sig-over)',
  }
  const out = {}
  for (const [key, value] of Object.entries(sx)) {
    if (key === 'color' && typeof value === 'string' && colorMap[value]) {
      out[key] = colorMap[value]
    } else {
      out[key] = value
    }
  }
  return out
}

const ActiveFilterChips = ({
  chipSize = 'md',
  chipSx,
  chips = [],
  clearButtonSize = 'sm',
  clearButtonSx,
  containerSx,
  maxVisible = 2,
  onAdd,
  onClearAll,
  onOpen,
  overflowChipSx,
  resultCount,
  resultSx,
  showAddChip = false,
  totalCount,
}) => {
  const { t } = useTranslation('chores')
  if (!chips.length) {
    return null
  }

  const visible = chips.slice(0, maxVisible)
  const overflow = chips.length - maxVisible
  const isSm = chipSize === 'sm'
  const chipBaseStyle = {
    cursor: 'pointer',
    flexShrink: 0,
    transition: 'all 0.15s ease',
    alignItems: 'center',
    lineHeight: 1.2,
  }

  return (
    <div
      className='flex items-center'
      style={{
        flexWrap: 'nowrap',
        gap: 4,
        overflowX: 'auto',
        paddingBlock: 2,
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
        ...containerSx,
      }}
    >
      {visible.map(({ color = 'primary', key, label, onClear }) => (
        <span
          key={key}
          className='badge'
          role='button'
          tabIndex={0}
          onClick={onOpen}
          onKeyDown={e => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              onOpen?.()
            }
          }}
          style={{
            ...chipBaseStyle,
            ...chipStyle(color),
            ...resolveSx(chipSx),
          }}
        >
          {label}
          <button
            type='button'
            onClick={event => {
              event.stopPropagation()
              onClear?.()
            }}
            aria-label={t('filters.removeFilter', { label })}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'inherit',
              borderRadius: '50%',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              lineHeight: 0,
              marginInlineStart: 4,
              minHeight: 0,
              minWidth: 0,
              padding: 2,
              ...(isSm ? { height: 18, width: 18 } : { height: 22, width: 22 }),
            }}
          >
            <FigmaIcon name='x' size={isSm ? 12 : 16} />
          </button>
        </span>
      ))}

      {overflow > 0 ? (
        <span
          className='badge'
          role='button'
          tabIndex={0}
          onClick={onOpen}
          onKeyDown={e => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              onOpen?.()
            }
          }}
          style={{
            ...chipBaseStyle,
            ...chipStyle('neutral'),
            ...resolveSx(overflowChipSx),
          }}
        >
          {t('filters.more', { count: overflow })}
        </span>
      ) : (
        showAddChip &&
        (onAdd || onOpen) && (
          <button
            type='button'
            className='badge'
            onClick={onAdd || onOpen}
            aria-label={t('filters.addFilterCondition')}
            title={t('filters.addFilterCondition')}
            style={{
              background: 'transparent',
              border: '1px solid var(--line)',
              color: 'var(--t-muted)',
              cursor: 'pointer',
              flexShrink: 0,
              transition: 'all 0.15s ease',
              paddingInline: 6,
              ...resolveSx(overflowChipSx),
            }}
          >
            <FigmaIcon name='plus' size={isSm ? 12 : 16} />
          </button>
        )
      )}

      {resultCount !== null && totalCount !== null && (
        <span
          style={{
            color: 'var(--t-faint)',
            flexShrink: 0,
            fontSize: 12,
            marginInlineStart: 'auto',
            ...resolveSx(resultSx),
          }}
        >
          {resultCount} / {totalCount}
        </span>
      )}

      {onClearAll && (
        <button
          type='button'
          className={`btn btn-ghost${clearButtonSize === 'sm' ? ' btn-sm' : ''}`}
          onClick={onClearAll}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--t-muted)',
            flexShrink: 0,
            fontSize: isSm ? '0.72rem' : '0.75rem',
            minHeight: 0,
            padding: '0 4px',
            ...resolveSx(clearButtonSx),
          }}
        >
          {t('filters.clearAll')}
        </button>
      )}
    </div>
  )
}

export default ActiveFilterChips
