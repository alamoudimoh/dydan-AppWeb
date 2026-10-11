import type { CSSProperties, ReactNode } from 'react'

export type EntityCardVariant = 'standard' | 'compact'

type EntityCardProps = {
  children: ReactNode
  variant?: EntityCardVariant
  testId?: string
  style?: Pick<
    CSSProperties,
    'opacity' | 'borderColor' | 'background' | 'color'
  >
  onClick?: () => void
  layout?: 'block' | 'stack' | 'row'
  align?: 'start' | 'center'
}

/**
 * Shared entity-card anatomy. Different content density is legitimate, but
 * the outer card anatomy (radius, border, surface, shadow, padding,
 * title/meta rhythm, action placement, responsive width) comes from one
 * source. Fixed card widths are forbidden — grids own the width behavior.
 */
export default function EntityCard({
  align = 'start',
  children,
  layout = 'block',
  onClick,
  style,
  testId,
  variant = 'standard',
}: EntityCardProps) {
  return (
    <div
      className={`card entity-card entity-card--${variant} entity-card--${layout}${onClick ? ' entity-card--interactive' : ''} card-align--${align}`}
      onClick={onClick}
      style={
        style
          ? {
              opacity: style.opacity,
              borderColor: style.borderColor,
              background: style.background,
              color: style.color,
            }
          : undefined
      }
      {...(testId ? { 'data-testid': testId } : {})}
    >
      {children}
    </div>
  )
}

export function EntityGrid({
  children,
  testId,
  variant = 'standard',
}: {
  children: ReactNode
  testId?: string
  variant?: 'standard' | 'compact' | 'dense' | 'stats'
}) {
  return (
    <div
      className={`entity-grid entity-grid--${variant}`}
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
