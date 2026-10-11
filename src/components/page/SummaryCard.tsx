import { Icon } from '../../App'

export type SummaryCardProps = {
  icon: string
  label: string
  value: string | number
  meta: string
  variant?: 'surface' | 'callout'
  tone?: 'brand' | 'done' | 'overdue' | 'accent'
  testId?: string
}

/** Mandatory summary anatomy. Variants change color only. */
export default function SummaryCard({
  icon,
  label,
  meta,
  testId,
  tone = 'brand',
  value,
  variant = 'surface',
}: SummaryCardProps) {
  return (
    <div
      className={`card summary-card summary-card--${variant} summary-card--${tone}`}
      data-testid={testId}
    >
      <div className='summary-card__icon'>
        <Icon name={icon} size={16} />
      </div>
      <div className='summary-card__label'>{label}</div>
      <div className='summary-card__value'>{value}</div>
      <div className='summary-card__meta'>{meta}</div>
    </div>
  )
}
