import type { KeyboardEvent as ReactKeyboardEvent } from 'react'
import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'

import { Icon } from '../../App'
import { CREATE_SELECTOR_TYPES, getCreateEntityConfig } from './entityConfigs'
import type { CreateEntityType } from './types'

type CreateSelectorProps = {
  onClose: () => void
  onSelect: (type: CreateEntityType) => void
}

/** Compact, keyboard-accessible universal Create selector for the global +. */
export default function CreateSelector({
  onClose,
  onSelect,
}: CreateSelectorProps) {
  const { t } = useTranslation()
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const first =
      rootRef.current?.querySelector<HTMLButtonElement>('[role="menuitem"]')
    first?.focus()
    const onPointerDown = (event: PointerEvent) => {
      if ((event.target as Element).closest?.('.create-launcher')) return
      if (!rootRef.current?.contains(event.target as Node)) onClose()
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
      }
    }
    document.addEventListener('pointerdown', onPointerDown)
    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [onClose])

  const moveFocus = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return
    event.preventDefault()
    const options = Array.from(
      rootRef.current?.querySelectorAll<HTMLButtonElement>(
        '[role="menuitem"]',
      ) ?? [],
    )
    const current = options.indexOf(document.activeElement as HTMLButtonElement)
    const delta = event.key === 'ArrowDown' ? 1 : -1
    options[(current + delta + options.length) % options.length]?.focus()
  }

  return (
    <div
      ref={rootRef}
      className='create-selector'
      role='menu'
      aria-label={t('create.selector.title')}
      data-testid='create-selector'
      onKeyDown={moveFocus}
    >
      <div className='create-selector-title'>{t('create.selector.title')}</div>
      <div className='create-selector-options'>
        {CREATE_SELECTOR_TYPES.map(type => {
          const config = getCreateEntityConfig(type)
          return (
            <button
              key={type}
              type='button'
              role='menuitem'
              className='create-selector-option'
              data-entity-type={type}
              onClick={() => onSelect(type)}
            >
              <span
                className='create-selector-icon'
                data-entity-icon={config.icon}
              >
                <Icon name={config.icon} size={17} />
              </span>
              <span>{t(config.labelKey)}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
