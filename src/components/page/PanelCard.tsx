import type { ReactNode } from 'react'

type PanelCardProps = {
  children: ReactNode
  layout?: 'block' | 'stack' | 'row'
  align?: 'start' | 'center'
  role?: string
  testId?: string
  variant?: 'standard' | 'flush' | 'callout'
}

/** Content panels are content-driven, never fixed-height summaries. */
export default function PanelCard({
  align = 'start',
  children,
  layout = 'block',
  role,
  testId,
  variant = 'standard',
}: PanelCardProps) {
  return (
    <div
      className={`card panel-card panel-card--${variant} panel-card--${layout} card-align--${align}`}
      data-testid={testId}
      role={role}
    >
      {children}
    </div>
  )
}
