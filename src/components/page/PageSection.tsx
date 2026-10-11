import type { ReactNode } from 'react'

type PageSectionProps = {
  title?: ReactNode
  headingVariant?: 'standard' | 'label'
  action?: ReactNode
  children: ReactNode
  testId?: string
}

/**
 * Shared section pattern. Owns section heading alignment, heading
 * typography, optional section-action position, vertical rhythm and the
 * heading→content relationship.
 */
export default function PageSection({
  action,
  children,
  headingVariant = 'standard',
  testId,
  title,
}: PageSectionProps) {
  return (
    <section
      className='page-section'
      {...(testId ? { 'data-testid': testId } : {})}
    >
      {title || action ? (
        <div className='page-section__header'>
          {title ? (
            <h2
              className={
                headingVariant === 'label'
                  ? 'section-label page-section__label'
                  : 'page-section__title'
              }
            >
              {title}
            </h2>
          ) : (
            <span />
          )}
          {action ? <div className='page-section__action'>{action}</div> : null}
        </div>
      ) : null}
      <div className='page-section__content'>{children}</div>
    </section>
  )
}
