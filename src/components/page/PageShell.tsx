import type { ReactElement } from 'react'

import PageHeader from '../PageHeader'
import PageFlow from './PageFlow'

export type PageShellVariant = 'standard' | 'wide' | 'reading'

type PageShellProps = {
  /** Page header (usually <PageHeader/>). Rendered outside the guttered body so the
   *  shared header padding stays the single source of truth for the title anchor. */
  header: ReactElement
  children: ReactElement
  /** Centrally defined width variants only — no per-screen max-width values. */
  variant?: PageShellVariant
  /** Stable test anchor for the page root (e.g. shopping-page). */
  testId?: string
}

/**
 * Canonical page shell. Owns page content width, logical horizontal gutters
 * (via .page-body), desktop bottom rhythm and overflow behavior. Mobile bottom
 * clearance and the top inset live on .main-scroll for every route.
 *
 * Variants:
 * - standard: 1080px — default for all primary screens
 * - wide: 1280px — only when a page legitimately needs extra columns
 * - reading: 720px — long-form reading surfaces
 */
export default function PageShell({
  children,
  header,
  testId,
  variant = 'standard',
}: PageShellProps) {
  if (children.type !== PageFlow || header.type !== PageHeader) {
    throw new Error('PageShell requires PageHeader and a single PageFlow')
  }
  return (
    <div
      className={`page page--${variant}`}
      {...(testId ? { 'data-testid': testId } : {})}
    >
      {header}
      <div className='page-body'>
        {children}
        <div data-testid='page-end' aria-hidden='true' className='page-end' />
      </div>
    </div>
  )
}
