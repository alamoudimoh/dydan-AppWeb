import type { KeyboardEvent } from 'react'
import { useCallback, useRef } from 'react'

export type PageTabItem = {
  id: string
  label: string
}

type PageTabsProps = {
  variant?: 'equal' | 'scroll'
  semantics?: 'controls' | 'tabs'
  tabs: readonly PageTabItem[]
  value: string
  onChange: (id: string) => void
  /** Accessible label for the tab group (e.g. "Shopping sections"). */
  ariaLabel: string
  testId?: string
}

/**
 * Canonical full-width page-tab primitive. Single source of truth for the
 * outer track, height, radius, border, background, selected state,
 * typography, internal padding, equal-width behavior, keyboard semantics,
 * focus, hover/pressed, RTL and mobile responsiveness.
 *
 * Consumers: Assets (Assets/Meters/Trackers), Shopping
 * (Shopping Lists/Items/Overview), Rewards (Rewards/My Requests/Points).
 *
 * Semantics: native buttons in a labelled group with roving tabindex and
 * arrow/Home/End navigation (RTL-aware). This preserves the established
 * `aria-pressed` contract existing e2e coverage asserts while providing the
 * required keyboard behavior.
 */
export default function PageTabs({
  ariaLabel,
  onChange,
  semantics = 'controls',
  tabs,
  testId,
  value,
  variant = 'equal',
}: PageTabsProps) {
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([])

  const onKeyDown = useCallback(
    (event: KeyboardEvent, index: number) => {
      const isRTL =
        typeof document !== 'undefined' &&
        document.documentElement.getAttribute('dir') === 'rtl'
      let next: number | null = null
      if (event.key === 'ArrowRight') next = isRTL ? index - 1 : index + 1
      else if (event.key === 'ArrowLeft') next = isRTL ? index + 1 : index - 1
      else if (event.key === 'Home') next = 0
      else if (event.key === 'End') next = tabs.length - 1
      if (next === null) return
      event.preventDefault()
      const clamped = (next + tabs.length) % tabs.length
      const target = tabs[clamped]
      if (target) {
        onChange(target.id)
        buttonRefs.current[clamped]?.focus()
      }
    },
    [onChange, tabs],
  )

  return (
    <div
      className={`page-tabs page-tabs--${variant}`}
      role={semantics === 'tabs' ? 'tablist' : 'group'}
      aria-label={ariaLabel}
      {...(testId ? { 'data-testid': testId } : {})}
    >
      {tabs.map((item, index) => {
        const selected = value === item.id
        return (
          <button
            key={item.id}
            ref={el => {
              buttonRefs.current[index] = el
            }}
            type='button'
            id={
              semantics === 'tabs'
                ? `${testId ?? 'page-tabs'}-${item.id}`
                : undefined
            }
            aria-controls={
              semantics === 'tabs'
                ? `${testId ?? 'page-tabs'}-panel-${item.id}`
                : undefined
            }
            role={semantics === 'tabs' ? 'tab' : undefined}
            aria-selected={semantics === 'tabs' ? selected : undefined}
            aria-pressed={semantics === 'controls' ? selected : undefined}
            tabIndex={selected ? 0 : -1}
            className={`page-tab${selected ? ' active' : ''}`}
            onClick={() => onChange(item.id)}
            onKeyDown={event => onKeyDown(event, index)}
          >
            {item.label}
          </button>
        )
      })}
    </div>
  )
}
