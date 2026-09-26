import { useEffect, useMemo, useRef, useState } from 'react'

import { Icon } from '../App'

export type ThemeOption = {
  value: string
  label: string
  disabled?: boolean
  /**
   * Optional color rendered as a small swatch beside the label, in both the
   * trigger and each option. Used where the option's value is a persisted
   * color, so the choice can be made by name rather than by eye.
   */
  swatch?: string
}

export default function ThemeSelect({
  className,
  disabled = false,
  label = 'Select',
  onChange,
  options,
  value,
}: {
  value: string
  onChange: (value: string) => void
  options: ThemeOption[]
  label?: string
  disabled?: boolean
  /**
   * Optional extra class on the field wrapper, for a caller that needs to
   * scope its own geometry to one instance. Everything downstream (trigger,
   * popover, options) lives inside this element, so a single class can address
   * the whole control. Call sites that pass nothing keep the shared geometry.
   */
  className?: string
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const root = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const selected = options.find(item => item.value === value)
  const searchable = options.length > 10
  const filtered = useMemo(() => {
    const term = query.trim().toLocaleLowerCase()
    return term
      ? options.filter(item => item.label.toLocaleLowerCase().includes(term))
      : options
  }, [options, query])

  useEffect(() => {
    if (!open) return
    if (searchable) searchRef.current?.focus()
    const dismiss = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', dismiss)
    return () => document.removeEventListener('pointerdown', dismiss)
  }, [open, searchable])

  const choose = (option: ThemeOption) => {
    if (option.disabled) return
    onChange(option.value)
    setQuery('')
    setOpen(false)
  }

  return (
    <div
      className={`theme-field${className ? ` ${className}` : ''}`}
      ref={root}
    >
      <button
        type='button'
        className='input themed-trigger'
        aria-label={label}
        aria-haspopup='listbox'
        aria-expanded={open}
        disabled={disabled}
        onClick={() => setOpen(previous => !previous)}
        onKeyDown={event => {
          if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault()
            if (!open) setOpen(true)
          }
        }}
      >
        <span className='flex items-center gap-2 min-w-0'>
          {selected?.swatch && (
            <span
              aria-hidden='true'
              data-testid='color-swatch'
              data-color={selected.swatch}
              style={{
                width: 14,
                height: 14,
                borderRadius: 4,
                flexShrink: 0,
                background: selected.swatch,
                border: '1px solid var(--line-strong)',
              }}
            />
          )}
          <span className='text-primary truncate'>
            {selected?.label ?? label}
          </span>
        </span>
        <Icon
          name='chevron_down'
          size={15}
          style={{ flexShrink: 0, color: 'var(--t-muted)' }}
        />
      </button>
      {open && !disabled && (
        <div
          className='theme-popover theme-select-popover'
          onKeyDown={event => {
            if (event.key === 'Escape') {
              event.preventDefault()
              setOpen(false)
            }
          }}
        >
          {searchable && (
            <div className='theme-select-search p-2'>
              <input
                className='input w-full'
                ref={searchRef}
                type='search'
                value={query}
                aria-label={'Search ' + label.toLowerCase()}
                placeholder='search…'
                onChange={event => setQuery(event.target.value)}
                onKeyDown={event => {
                  if (event.key === 'Enter' && filtered.length === 1) {
                    event.preventDefault()
                    choose(filtered[0])
                  }
                }}
              />
            </div>
          )}
          <div role='listbox' aria-label={label} className='member-options'>
            {filtered.map(option => (
              <button
                type='button'
                role='option'
                key={option.value}
                className='member-option'
                aria-selected={option.value === value}
                disabled={option.disabled}
                onClick={() => choose(option)}
              >
                <span className='flex items-center gap-2 flex-1 min-w-0'>
                  {option.swatch && (
                    <span
                      aria-hidden='true'
                      data-testid='color-swatch'
                      data-color={option.swatch}
                      style={{
                        width: 14,
                        height: 14,
                        borderRadius: 4,
                        flexShrink: 0,
                        background: option.swatch,
                        border: '1px solid var(--line-strong)',
                      }}
                    />
                  )}
                  <span className='text-start truncate'>{option.label}</span>
                </span>
                {option.value === value && <Icon name='check' size={14} />}
              </button>
            ))}
            {filtered.length === 0 && (
              <div className='p-3 text-muted' style={{ fontSize: 12 }}>
                No matching options
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
