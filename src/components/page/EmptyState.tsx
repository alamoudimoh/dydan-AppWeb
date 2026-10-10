import type { ReactNode } from 'react'

type EmptyStateProps = {
  /** Icon identity (glyph, emoji or <Icon/>). Size/geometry owned by CSS. */
  icon?: ReactNode
  title: string
  description?: string
  /** Optional SECONDARY action only. Do not duplicate a primary Create action
   *  that already lives in the page header. */
  action?: ReactNode
  testId?: string
}

/**
 * Canonical empty-state pattern. Owns content width, alignment, icon
 * geometry, title/description typography + spacing, vertical placement,
 * responsive + RTL behavior.
 *
 * Semantic rule: zero data only. Never used for API failure, loading,
 * unauthorized or network failure — those states remain distinct.
 */
export default function EmptyState({
  action,
  description,
  icon,
  testId,
  title,
}: EmptyStateProps) {
  return (
    <div className='empty-state' {...(testId ? { 'data-testid': testId } : {})}>
      {icon ? <div className='empty-state__icon'>{icon}</div> : null}
      <div className='empty-state__title'>{title}</div>
      {description ? (
        <div className='empty-state__description'>{description}</div>
      ) : null}
      {action ? <div className='empty-state__action'>{action}</div> : null}
    </div>
  )
}
