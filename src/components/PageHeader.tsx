import type { ReactNode } from 'react'

import type { PagePrimaryActionData } from './page/PagePrimaryAction'
import PagePrimaryAction from './page/PagePrimaryAction'

type PageHeaderProps = {
  /** Primary page title. Rendered as h1 with a stable test anchor. */
  title: ReactNode
  /** Optional eyebrow/metadata shown above the title (e.g. Today date).
   *  The eyebrow slot is always rendered with identical height so the
   *  title stays at the same vertical anchor whether or not an eyebrow
   *  is provided. */
  eyebrow?: ReactNode
  /** Optional subtitle/counters/progress shown below the title. */
  subtitle?: ReactNode
  /** Optional header actions (buttons, toggles) on the trailing side. */
  actions?: ReactNode
  /** Page-level primary create control; a dedicated full-width mobile row. */
  primaryAction?: PagePrimaryActionData | undefined
}

/**
 * Shared page-header layout contract.
 *
 * Guarantees the primary page title (`data-testid="page-title"`) sits at
 * one consistent vertical anchor across primary dydan pages at the same
 * viewport/zoom. The eyebrow slot reserves fixed height on every page so
 * optional metadata (e.g. the Today date) never pushes the title down
 * relative to pages without an eyebrow.
 *
 * Preserves existing visual treatment (`.page-header` tokens, padding,
 * responsive + RTL behavior) — only the structure is shared.
 */
export default function PageHeader({
  actions,
  eyebrow,
  primaryAction,
  subtitle,
  title,
}: PageHeaderProps) {
  return (
    <div className='page-header'>
      <div className='page-header__main'>
        <div
          className='page-header__eyebrow text-faint'
          aria-hidden={eyebrow ? undefined : true}
        >
          {eyebrow ?? ' '}
        </div>
        <h1 className='text-primary' data-testid='page-title'>
          {title}
        </h1>
        <div className='text-muted page-header__subtitle'>
          {subtitle ?? '\u00a0'}
        </div>
      </div>
      <div className='page-header__action-row'>
        {actions || primaryAction ? (
          <div className='page-header__controls'>
            {actions ? (
              <div className='page-header__actions'>{actions}</div>
            ) : null}
            {primaryAction ? (
              <div className='page-header__primary-action'>
                <PagePrimaryAction {...primaryAction} />
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  )
}
