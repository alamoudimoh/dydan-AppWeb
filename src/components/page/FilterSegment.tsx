export type FilterSegmentOption = {
  id: string
  label: string
}

type FilterSegmentProps = {
  options: readonly FilterSegmentOption[]
  value: string
  onChange: (id: string) => void
  ariaLabel: string
  testId?: string
}

/**
 * Canonical compact filter / segmented control. Used for status filters such
 * as Routines All/Active/Inactive — functionally filters, not primary page
 * tabs. Owns height, radius, label style, selected state, spacing, mobile
 * wrapping/scroll and RTL behavior.
 */
export default function FilterSegment({
  ariaLabel,
  onChange,
  options,
  testId,
  value,
}: FilterSegmentProps) {
  return (
    <div
      className='filter-segment'
      role='group'
      aria-label={ariaLabel}
      {...(testId ? { 'data-testid': testId } : {})}
    >
      {options.map(item => {
        const selected = value === item.id
        return (
          <button
            key={item.id}
            type='button'
            aria-pressed={selected}
            className={`filter-segment-btn${selected ? ' active' : ''}`}
            onClick={() => onChange(item.id)}
          >
            {item.label}
          </button>
        )
      })}
    </div>
  )
}
