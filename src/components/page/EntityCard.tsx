import type { ReactNode } from 'react'

export type EntityCardVariant = 'standard' | 'compact' | 'summary'

type EntityCardProps = {
  children: ReactNode
  variant?: EntityCardVariant
  testId?: string
  style?: React.CSSProperties
  onClick?: () => void
  className?: string
}

/**
 * Shared entity-card anatomy. Different content density is legitimate, but
 * the outer card anatomy (radius, border, surface, shadow, padding,
 * title/meta rhythm, action placement, responsive width) comes from one
 * source. Fixed card widths are forbidden — grids own the width behavior.
 */
export default function EntityCard({
  children,
  className = '',
  onClick,
  style,
  testId,
  variant = 'standard',
}: EntityCardProps) {
  return (
    <div
      className={`card entity-card entity-card--${variant}${className ? ` ${className}` : ''}`}
      onClick={onClick}
      style={style}
      {...(testId ? { 'data-testid': testId } : {})}
    >
      {children}
    </div>
  )
}

export function EntityGrid({
  children,
  min = 260,
  testId,
  variant = 'standard',
}: {
  children: ReactNode
  min?: number
  testId?: string
  variant?: 'standard' | 'stats'
}) {
  return (
    <div
      className={`entity-grid${variant === 'stats' ? ' entity-grid--stats' : ''}`}
      style={
        variant === 'stats'
          ? undefined
          : {
              gridTemplateColumns: `repeat(auto-fill, minmax(${min}px, 1fr))`,
            }
      }
      {...(testId ? { 'data-testid': testId } : {})}
    >
      {children}
    </div>
  )
}

export function EntityList({
  children,
  testId,
}: {
  children: ReactNode
  testId?: string
}) {
  return (
    <div className='entity-list' {...(testId ? { 'data-testid': testId } : {})}>
      {children}
    </div>
  )
}
