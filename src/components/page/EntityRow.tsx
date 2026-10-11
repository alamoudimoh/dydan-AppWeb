import type { CSSProperties, ReactNode } from 'react'

type EntityRowProps = {
  children: ReactNode
  onClick: () => void
  testId?: string
  role?: string
  'aria-selected'?: boolean
  'aria-label'?: string
  style?: Pick<CSSProperties, 'color' | 'background' | 'borderColor'>
}

/** Compact selectable entity. Shared geometry, caller-owned semantics. */
export default function EntityRow({
  children,
  onClick,
  style,
  testId,
  ...aria
}: EntityRowProps) {
  return (
    <button
      type='button'
      className='card entity-row'
      onClick={onClick}
      data-testid={testId}
      style={style}
      {...aria}
    >
      {children}
    </button>
  )
}
