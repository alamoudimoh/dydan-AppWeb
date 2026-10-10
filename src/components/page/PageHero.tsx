import type { ReactNode } from 'react'

export type PageHeroVariant = 'callout' | 'surface' | 'dashboard'

type PageHeroProps = {
  children: ReactNode
  variant?: PageHeroVariant
  testId?: string
}

/**
 * Shared hero / summary outer geometry. Business content may differ; the
 * shell geometry (width, border/radius family, outer padding, block rhythm,
 * responsive collapse, relationship to tabs/content, theme tokens) must not.
 *
 * Variants (explicit, structural only):
 * - callout: inverted callout surface (Rewards points hero)
 * - surface: default card surface
 * - dashboard: home-hero brand surface (Home/Quest dashboard hero)
 */
export default function PageHero({
  children,
  testId,
  variant = 'callout',
}: PageHeroProps) {
  return (
    <div
      className={`page-hero page-hero--${variant}`}
      {...(testId ? { 'data-testid': testId } : {})}
    >
      {children}
    </div>
  )
}

/** Alias kept for dashboard-like summaries that read better as a panel. */
export function SummaryPanel(props: PageHeroProps) {
  return <PageHero {...props} />
}
