import type { ReactElement, ReactNode } from 'react'
import { Children, isValidElement } from 'react'

import { EntityGrid } from './EntityCard'
import FilterSegment from './FilterSegment'
import PageSection from './PageSection'
import PageTabs from './PageTabs'
import SummaryCard from './SummaryCard'

type PageFlowProps = {
  navigation?: ReactElement
  summary?: ReactElement
  children: ReactNode
  secondary?: ReactNode
}

/** Semantic region order and rhythm. Geometry is deliberately not configurable. */
export default function PageFlow({
  children,
  navigation,
  secondary,
  summary,
}: PageFlowProps) {
  if (
    navigation &&
    ![PageTabs, FilterSegment, PageSection].some(
      component => navigation.type === component,
    )
  ) {
    throw new Error(
      'PageFlow navigation requires PageTabs, FilterSegment or PageSection',
    )
  }
  if (summary) {
    const cards =
      summary.type === EntityGrid
        ? Children.toArray((summary.props as { children: ReactNode }).children)
        : [summary]
    if (
      !cards.every(card => isValidElement(card) && card.type === SummaryCard)
    ) {
      throw new Error(
        'PageFlow summary requires SummaryCard or an EntityGrid of SummaryCards',
      )
    }
  }
  return (
    <div className='page-flow'>
      {navigation && (
        <div className='page-flow__navigation' data-page-slot='navigation'>
          {navigation}
        </div>
      )}
      {summary && (
        <div className='page-flow__summary' data-page-slot='summary'>
          {summary}
        </div>
      )}
      <div className='page-flow__content' data-page-slot='content'>
        {children}
      </div>
      {secondary && (
        <div className='page-flow__secondary' data-page-slot='secondary'>
          {secondary}
        </div>
      )}
    </div>
  )
}
