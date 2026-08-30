import { useTranslation } from 'react-i18next'

import FigmaIcon from '../../../components/FigmaIcon'
import Priorities from '../../../utils/Priorities'

export const DUE_DATE_OPTIONS = [
  { value: 'isOverdue', labelKey: 'overdue', color: 'danger' },
  { value: 'isDueToday', labelKey: 'today', color: 'warning' },
  { value: 'isDueTomorrow', labelKey: 'tomorrow', color: 'primary' },
  { value: 'isDueThisWeek', labelKey: 'thisWeek', color: 'primary' },
  { value: 'isDueThisMonth', labelKey: 'thisMonth', color: 'neutral' },
  { value: 'hasNoDueDate', labelKey: 'noDueDate', color: 'neutral' },
  { value: 'hasDueDate', labelKey: 'hasDueDate', color: 'neutral' },
]

export const POINTS_OPERATORS = [
  { value: 'greaterThan', label: '>' },
  { value: 'greaterThanOrEqual', label: '>=' },
  { value: 'equals', label: '=' },
  { value: 'lessThanOrEqual', label: '<=' },
  { value: 'lessThan', label: '<' },
]

export const CHORE_STATUSES = [
  { value: 0, labelKey: 'active' },
  { value: 1, labelKey: 'started' },
  { value: 2, labelKey: 'inProgress' },
  { value: 3, labelKey: 'pendingApproval' },
]

export const defaultSelections = () => ({
  assignee: { operator: 'is', values: [] },
  createdBy: { operator: 'is', values: [] },
  status: { operator: 'is', values: [] },
  priority: { operator: 'is', values: [] },
  label: { operator: 'is', values: [] },
  project: { operator: 'is', values: [] },
  dueDate: { operator: null },
  points: { operator: 'greaterThan', value: 0, active: false },
})

export const conditionsToSelections = conditions => {
  const sel = defaultSelections()
  if (!conditions) return sel
  conditions.forEach(c => {
    if (c.type === 'dueDate') {
      sel.dueDate = { operator: c.operator }
    } else if (c.type === 'points') {
      sel.points = { operator: c.operator, value: c.value ?? 0, active: true }
    } else if (c.type in sel) {
      sel[c.type] = {
        operator: c.operator ?? 'is',
        values: Array.isArray(c.value)
          ? c.value
          : c.value != null
            ? [c.value]
            : [],
      }
    }
  })
  return sel
}

export const selectionsToConditions = selections => {
  const conditions = []
  ;['assignee', 'createdBy', 'status', 'priority', 'label', 'project'].forEach(
    type => {
      if (selections[type].values?.length > 0) {
        conditions.push({
          type,
          operator: selections[type].operator,
          value: selections[type].values,
        })
      }
    },
  )
  if (selections.dueDate.operator) {
    conditions.push({
      type: 'dueDate',
      operator: selections.dueDate.operator,
      value: null,
    })
  }
  if (selections.points.active) {
    conditions.push({
      type: 'points',
      operator: selections.points.operator,
      value: selections.points.value,
    })
  }
  return conditions
}

const CHIP_COLORS = {
  danger: {
    solid: 'var(--sig-over)',
    soft: 'var(--sig-over-bg)',
    text: 'var(--sig-over)',
  },
  neutral: {
    solid: 'var(--surface-3)',
    soft: 'var(--surface-2)',
    text: 'var(--t-muted)',
  },
  primary: {
    solid: 'var(--brand)',
    soft: 'var(--brand-faint)',
    text: 'var(--brand)',
  },
  warning: {
    solid: 'var(--sig-due)',
    soft: 'var(--sig-due-bg)',
    text: 'var(--sig-due)',
  },
}

const chipStyle = (color, selected) => {
  const tokens = CHIP_COLORS[color] || CHIP_COLORS.primary
  return {
    background: selected ? tokens.solid : tokens.soft,
    border: `1px solid ${selected ? tokens.solid : 'var(--line)'}`,
    color: selected ? 'var(--brand-contrast)' : tokens.text,
    cursor: 'pointer',
    font: '700 12px var(--font-ui)',
    minHeight: 28,
    transition: 'all 0.15s ease',
    userSelect: 'none',
  }
}

const FilterChip = ({
  children,
  color = 'neutral',
  endDecorator,
  isToggle = true,
  selected = false,
  startDecorator,
  style,
  ...props
}) => (
  <button
    type='button'
    className='badge'
    aria-pressed={isToggle ? selected : undefined}
    style={{ ...chipStyle(color, selected), ...style }}
    {...props}
  >
    {startDecorator}
    {children}
    {endDecorator}
  </button>
)

const SectionHeader = ({ children, icon, label }) => (
  <div className='flex items-center gap-2' style={{ marginBottom: 12 }}>
    <span className='text-muted flex' aria-hidden='true'>
      {icon}
    </span>
    <span className='text-primary' style={{ fontSize: 14, fontWeight: 600 }}>
      {label}
    </span>
    {children}
  </div>
)

const IncludeExcludeToggle = ({ labels, onChange, value }) => {
  const { t } = useTranslation('chores')
  const resolvedLabels = labels || [t('filters.include'), t('filters.exclude')]
  return (
    <div className='flex gap-1' style={{ marginInlineStart: 'auto' }}>
      {[
        { op: 'is', label: resolvedLabels[0] },
        { op: 'isNot', label: resolvedLabels[1] },
      ].map(o => (
        <FilterChip
          key={o.op}
          selected={value === o.op}
          color={
            value === o.op
              ? o.op === 'isNot'
                ? 'danger'
                : 'primary'
              : 'neutral'
          }
          onClick={() => onChange(o.op)}
        >
          {o.label}
        </FilterChip>
      ))}
    </div>
  )
}

/**
 * Reusable filter conditions UI used by both the filter sheet in ChoreToolbar
 * and the AdvancedFilterBuilder save modal.
 *
 * `onSelectionsChange` must accept either a new selections object or a
 * functional updater `prev => next` (same contract as React's setState setter).
 */
const FilterBuilderContent = ({
  labels = [],
  members = [],
  onSelectionsChange,
  projects = [],
  selections,
}) => {
  const { t } = useTranslation('chores')
  const resolveLabel = opt =>
    opt.labelKey ? t(`filters.${opt.labelKey}`) : opt.label
  const toggleValue = (type, value) =>
    onSelectionsChange(prev => {
      const cur = prev[type].values || []
      const next = cur.includes(value)
        ? cur.filter(v => v !== value)
        : [...cur, value]
      return { ...prev, [type]: { ...prev[type], values: next } }
    })

  const setOperator = (type, op) =>
    onSelectionsChange(prev => ({
      ...prev,
      [type]: { ...prev[type], operator: op },
    }))

  const toggleDueDate = op =>
    onSelectionsChange(prev => ({
      ...prev,
      dueDate: { operator: prev.dueDate.operator === op ? null : op },
    }))

  const setPointsOperator = op =>
    onSelectionsChange(prev => ({
      ...prev,
      points: { ...prev.points, operator: op, active: true },
    }))

  const setPointsValue = val =>
    onSelectionsChange(prev => ({
      ...prev,
      points: { ...prev.points, value: val, active: val > 0 },
    }))

  const chipRow = (type, options, getChipProps) => {
    const selected = selections[type].values || []
    return (
      <div className='flex flex-wrap gap-2'>
        {options.map(opt => {
          const isSelected = selected.includes(opt.value)
          const extra = getChipProps ? getChipProps(opt, isSelected) : {}
          return (
            <FilterChip
              key={opt.value}
              selected={isSelected}
              color={isSelected ? (extra.color ?? 'primary') : 'neutral'}
              startDecorator={
                isSelected ? (
                  <FigmaIcon name='check' size={14} />
                ) : (
                  (extra.startDecorator ?? null)
                )
              }
              onClick={() => toggleValue(type, opt.value)}
            >
              {resolveLabel(opt)}
            </FilterChip>
          )
        })}
      </div>
    )
  }

  const personChipRow = type => {
    const selected = selections[type].values || []
    return (
      <div className='flex flex-wrap gap-2'>
        {members.map(m => {
          const isSelected = selected.includes(m.userId)
          const name = m.displayName || m.username
          return (
            <FilterChip
              key={m.userId}
              selected={isSelected}
              color={isSelected ? 'primary' : 'neutral'}
              startDecorator={
                isSelected ? (
                  <FigmaIcon name='check' size={14} />
                ) : m.image ? (
                  <img
                    className='avatar'
                    src={m.image}
                    alt=''
                    style={{ height: 20, objectFit: 'cover', width: 20 }}
                  />
                ) : (
                  <span
                    className='avatar bg-brand'
                    aria-hidden='true'
                    style={{ height: 20, width: 20 }}
                  >
                    {name?.slice(0, 1).toUpperCase() || '?'}
                  </span>
                )
              }
              onClick={() => toggleValue(type, m.userId)}
            >
              {name}
            </FilterChip>
          )
        })}
      </div>
    )
  }

  return (
    <div className='flex flex-col'>
      {/* Assignee */}
      {members.length > 0 && (
        <>
          <SectionHeader
            icon={<FigmaIcon name='user' size={18} />}
            label='Assignee'
          >
            <IncludeExcludeToggle
              value={selections.assignee.operator}
              onChange={op => setOperator('assignee', op)}
            />
          </SectionHeader>
          {personChipRow('assignee')}
          <hr
            className='border-line'
            style={{
              border: 0,
              borderTop: '1px solid var(--line)',
              margin: '20px 0',
            }}
          />
        </>
      )}

      {/* Created By */}
      {members.length > 0 && (
        <>
          <SectionHeader
            icon={<FigmaIcon name='user' size={18} />}
            label='Created By'
          >
            <IncludeExcludeToggle
              value={selections.createdBy.operator}
              onChange={op => setOperator('createdBy', op)}
            />
          </SectionHeader>
          {personChipRow('createdBy')}
          <hr
            className='border-line'
            style={{
              border: 0,
              borderTop: '1px solid var(--line)',
              margin: '20px 0',
            }}
          />
        </>
      )}

      {/* Status */}
      <SectionHeader icon={<FigmaIcon name='tasks' size={18} />} label='Status'>
        <IncludeExcludeToggle
          value={selections.status.operator}
          onChange={op => setOperator('status', op)}
        />
      </SectionHeader>
      {chipRow('status', CHORE_STATUSES)}
      <hr
        className='border-line'
        style={{
          border: 0,
          borderTop: '1px solid var(--line)',
          margin: '20px 0',
        }}
      />

      {/* Priority */}
      <SectionHeader
        icon={<FigmaIcon name='flag' size={18} />}
        label='Priority'
      >
        <IncludeExcludeToggle
          value={selections.priority.operator}
          onChange={op => setOperator('priority', op)}
        />
      </SectionHeader>
      {chipRow(
        'priority',
        Priorities.map(p => ({ value: p.value, label: p.name })),
        (opt, isSelected) => ({
          color: isSelected
            ? Priorities.find(p => p.value === opt.value)?.color || 'primary'
            : 'neutral',
          startDecorator: !isSelected ? (
            <FigmaIcon name='flag' size={14} />
          ) : null,
        }),
      )}
      <hr
        className='border-line'
        style={{
          border: 0,
          borderTop: '1px solid var(--line)',
          margin: '20px 0',
        }}
      />

      {/* Due Date */}
      <SectionHeader
        icon={<FigmaIcon name='calendar' size={18} />}
        label='Due Date'
      />
      <div className='flex flex-wrap gap-2'>
        {DUE_DATE_OPTIONS.map(opt => {
          const isSelected = selections.dueDate.operator === opt.value
          return (
            <FilterChip
              key={opt.value}
              selected={isSelected}
              color={isSelected ? (opt.color ?? 'primary') : 'neutral'}
              startDecorator={
                isSelected ? <FigmaIcon name='check' size={14} /> : null
              }
              onClick={() => toggleDueDate(opt.value)}
            >
              {resolveLabel(opt)}
            </FilterChip>
          )
        })}
      </div>
      <hr
        className='border-line'
        style={{
          border: 0,
          borderTop: '1px solid var(--line)',
          margin: '20px 0',
        }}
      />

      {/* Labels */}
      {labels.length > 0 && (
        <>
          <SectionHeader
            icon={<FigmaIcon name='tag' size={18} />}
            label='Labels'
          >
            <IncludeExcludeToggle
              value={selections.label.operator}
              onChange={op => setOperator('label', op)}
              labels={['Has', "Doesn't Have"]}
            />
          </SectionHeader>
          <div className='flex flex-wrap gap-2'>
            {labels.map(lbl => {
              const isSelected = selections.label.values.includes(lbl.id)
              return (
                <FilterChip
                  key={lbl.id}
                  selected={isSelected}
                  color='neutral'
                  startDecorator={
                    <span
                      aria-hidden='true'
                      style={{
                        background: lbl.color || '#90a4ae',
                        borderRadius: '50%',
                        flexShrink: 0,
                        height: 10,
                        width: 10,
                      }}
                    />
                  }
                  endDecorator={
                    isSelected ? <FigmaIcon name='check' size={12} /> : null
                  }
                  onClick={() => toggleValue('label', lbl.id)}
                  style={
                    isSelected
                      ? { outline: '2px solid var(--brand)' }
                      : undefined
                  }
                >
                  {lbl.name}
                </FilterChip>
              )
            })}
          </div>
          <hr
            className='border-line'
            style={{
              border: 0,
              borderTop: '1px solid var(--line)',
              margin: '20px 0',
            }}
          />
        </>
      )}

      {/* Projects */}
      {projects.length > 0 && (
        <>
          <SectionHeader
            icon={<FigmaIcon name='projects' size={18} />}
            label='Projects'
          >
            <IncludeExcludeToggle
              value={selections.project.operator}
              onChange={op => setOperator('project', op)}
            />
          </SectionHeader>
          {chipRow('project', [
            { value: 'default', label: 'Default Project' },
            ...projects
              .filter(p => p.id !== 'default')
              .map(p => ({ value: p.id, label: p.name })),
          ])}
          <hr
            className='border-line'
            style={{
              border: 0,
              borderTop: '1px solid var(--line)',
              margin: '20px 0',
            }}
          />
        </>
      )}

      {/* Points */}
      <SectionHeader
        icon={<FigmaIcon name='star' size={18} />}
        label='Points'
      />
      <div className='flex flex-wrap items-center gap-2'>
        {POINTS_OPERATORS.map(op => (
          <FilterChip
            key={op.value}
            selected={
              selections.points.operator === op.value &&
              selections.points.active
            }
            color={
              selections.points.operator === op.value &&
              selections.points.active
                ? 'primary'
                : 'neutral'
            }
            onClick={() => setPointsOperator(op.value)}
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            {op.label}
          </FilterChip>
        ))}
        <input
          type='number'
          className='input'
          value={selections.points.value}
          onChange={e => setPointsValue(parseInt(e.target.value) || 0)}
          min={0}
          aria-label={t('filters.points')}
          style={{ width: 80 }}
        />
        {selections.points.active && (
          <FilterChip
            color='danger'
            isToggle={false}
            onClick={() =>
              onSelectionsChange(prev => ({
                ...prev,
                points: { ...prev.points, active: false, value: 0 },
              }))
            }
          >
            {t('filters.clear')}
          </FilterChip>
        )}
      </div>
    </div>
  )
}

export default FilterBuilderContent
