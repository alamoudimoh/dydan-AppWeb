import type { ReactNode } from 'react'

import { Icon } from '../../App'

type PageEmptyStateProps = {
  icon: string
  title: string
  description: string
  testId?: string
}

/** Full page zero-data region. All anatomy is mandatory; icons are vector names. */
export default function PageEmptyState({
  description,
  icon,
  testId,
  title,
}: PageEmptyStateProps) {
  return (
    <div className='empty-state page-empty-state' data-testid={testId}>
      <div className='empty-state__body'>
        <div className='empty-state__icon'>
          <Icon name={icon} size={26} />
        </div>
        <div className='empty-state__title'>{title}</div>
        <div className='empty-state__description'>{description}</div>
      </div>
    </div>
  )
}

type InlineEmptyStateProps = {
  icon: string
  title: string
  description?: string
  action?: ReactNode
  testId?: string
}

/** Compact nested zero-data treatment, never an entire page region. */
export function InlineEmptyState({
  action,
  description,
  icon,
  testId,
  title,
}: InlineEmptyStateProps) {
  return (
    <div className='inline-empty-state' data-testid={testId}>
      <div className='inline-empty-state__icon'>
        <Icon name={icon} size={20} />
      </div>
      <div className='inline-empty-state__title'>{title}</div>
      {description && (
        <div className='inline-empty-state__description'>{description}</div>
      )}
      {action && <div className='inline-empty-state__action'>{action}</div>}
    </div>
  )
}
