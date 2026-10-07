import type { ReactNode } from 'react'

import { Icon } from '../App'

/**
 * The Settings layout primitives.
 *
 * Extracted verbatim from SettingsScreen so a section that lives in its own
 * component (CategorySettings) renders identically to the sections declared
 * inline, instead of either duplicating the markup or importing the screen
 * and creating a cycle.
 */
export function Section({
  children,
  title,
}: {
  title?: string
  children: ReactNode
}) {
  return (
    <div className='mb-6'>
      {title && (
        <div style={{ padding: '0 0 8px' }}>
          <div className='section-label' style={{ padding: 0 }}>
            {title}
          </div>
        </div>
      )}
      <div className='card overflow-hidden'>{children}</div>
    </div>
  )
}

export function Row({
  children,
  detail,
  icon,
  label,
  onClick,
}: {
  icon?: string
  label: string
  /** Persisted setting or status; visually distinct from explanatory help. */
  detail?: string | undefined
  children?: ReactNode
  onClick?: () => void
}) {
  return (
    <div
      className='flex items-center gap-4 px-5 py-4 border-b border-line last:border-0'
      style={{
        borderColor: 'var(--line)',
        cursor: onClick ? 'pointer' : undefined,
      }}
      onClick={onClick}
    >
      {icon && (
        <Icon
          name={icon}
          size={18}
          style={{ color: 'var(--t-muted)', flexShrink: 0 }}
        />
      )}
      <div className='flex-1 min-w-0'>
        <div className='font-medium text-primary' style={{ fontSize: 14 }}>
          {label}
        </div>
        {detail && (
          <div className='text-primary' style={{ fontSize: 12, marginTop: 1 }}>
            {detail}
          </div>
        )}
      </div>
      {children && <div className='flex-shrink-0'>{children}</div>}
    </div>
  )
}
