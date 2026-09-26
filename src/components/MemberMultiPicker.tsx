import { useEffect, useMemo, useRef, useState } from 'react'

import { Icon } from '../App'
import { useLiveData } from '../model/liveData'

export default function MemberMultiPicker({
  label = 'Members',
  onChange,
  value,
}: {
  value: string[]
  onChange: (ids: string[]) => void
  label?: string
}) {
  const { members } = useLiveData()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const root = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const matches = useMemo(
    () =>
      members.filter(m =>
        (m.name + ' ' + m.initials + ' ' + (m.email ?? ''))
          .toLocaleLowerCase()
          .includes(query.trim().toLocaleLowerCase()),
      ),
    [members, query],
  )

  useEffect(() => {
    if (!open) return
    searchRef.current?.focus()
    const dismiss = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', dismiss)
    return () => document.removeEventListener('pointerdown', dismiss)
  }, [open])

  const toggle = (id: string) => {
    onChange(
      value.includes(id)
        ? value.filter(existing => existing !== id)
        : [...value, id],
    )
  }

  return (
    <div className='theme-field' ref={root}>
      <button
        type='button'
        className='input themed-trigger'
        aria-label={label}
        aria-expanded={open}
        aria-haspopup='listbox'
        onClick={() => setOpen(previous => !previous)}
      >
        <span className='text-primary'>
          {value.length} of {members.length} members selected
        </span>
        <Icon
          name='chevron_down'
          size={15}
          style={{ color: 'var(--t-muted)' }}
        />
      </button>
      {open && (
        <div
          className='theme-popover member-popover'
          onKeyDown={e => {
            if (e.key === 'Escape') {
              e.preventDefault()
              setOpen(false)
            }
          }}
        >
          <div className='p-2 flex flex-col gap-2'>
            <input
              type='search'
              className='input'
              placeholder='search contributors…'
              ref={searchRef}
              aria-label='Search contributors'
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
            <div className='flex gap-2'>
              <button
                type='button'
                className='btn btn-secondary btn-sm flex-1'
                onClick={() => onChange(members.map(m => m.id))}
              >
                select all
              </button>
              <button
                type='button'
                className='btn btn-ghost btn-sm flex-1'
                onClick={() => onChange([])}
              >
                clear
              </button>
            </div>
          </div>
          <div
            className='member-options'
            role='listbox'
            aria-multiselectable='true'
            aria-label={label}
          >
            {matches.map(member => (
              <button
                type='button'
                role='option'
                aria-selected={value.includes(member.id)}
                key={member.id}
                className='member-option'
                onClick={() => toggle(member.id)}
              >
                <span
                  className='avatar'
                  style={{
                    width: 26,
                    height: 26,
                    background: member.avatarColor,
                    fontSize: 9,
                  }}
                >
                  {member.initials}
                </span>
                <span className='flex-1 text-start'>{member.name}</span>
                <span
                  aria-hidden='true'
                  style={{
                    width: 17,
                    height: 17,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px solid var(--line-strong)',
                    borderRadius: 'var(--r-xs)',
                    background: value.includes(member.id)
                      ? 'var(--selected-bg)'
                      : 'var(--surface)',
                  }}
                >
                  {value.includes(member.id) && (
                    <Icon
                      name='check'
                      size={12}
                      style={{ color: 'var(--selected-text)' }}
                    />
                  )}
                </span>
              </button>
            ))}
            {matches.length === 0 && (
              <span className='p-3 text-muted'>No matching contributors</span>
            )}
          </div>
          <div className='popover-footer text-faint' style={{ fontSize: 10 }}>
            {matches.length} of {members.length} members
          </div>
        </div>
      )}
    </div>
  )
}
