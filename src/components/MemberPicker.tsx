import { useEffect, useMemo, useRef, useState } from 'react'

import { Icon } from '../App'
import type { Member } from '../data'
import { useLiveData } from '../model/liveData'

type Props = {
  value: string
  onChange: (id: string) => void
  members?: Member[]
  allowUnassigned?: boolean
  allowEveryone?: boolean
  label?: string
}

export default function MemberPicker({
  allowEveryone = false,
  allowUnassigned = false,
  label = 'Assigned to',
  members,
  onChange,
  value,
}: Props) {
  const { members: liveMembers } = useLiveData()
  members = members ?? liveMembers

  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const wrapper = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const chosen = members.find(member => member.id === value)
  const emptyLabel = allowEveryone
    ? 'Everyone'
    : allowUnassigned
      ? 'Unassigned'
      : 'Choose a member'
  const filtered = useMemo(() => {
    const term = query.trim().toLocaleLowerCase()
    return term
      ? members.filter(member =>
          (member.name + ' ' + member.initials + ' ' + (member.email ?? ''))
            .toLocaleLowerCase()
            .includes(term),
        )
      : members
  }, [members, query])

  useEffect(() => {
    if (!open) return
    searchRef.current?.focus()
    const dismiss = (event: PointerEvent) => {
      if (!wrapper.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', dismiss)
    return () => document.removeEventListener('pointerdown', dismiss)
  }, [open])

  const choose = (id: string) => {
    onChange(id)
    setQuery('')
    setOpen(false)
  }

  return (
    <div className='theme-field' ref={wrapper}>
      <button
        type='button'
        className='input themed-trigger'
        aria-haspopup='listbox'
        aria-label={label}
        aria-expanded={open}
        onClick={() => setOpen(active => !active)}
      >
        {chosen ? (
          <span className='flex items-center gap-2 min-w-0'>
            <span
              className='avatar'
              style={{
                width: 24,
                height: 24,
                background: chosen.avatarColor,
                fontSize: 9,
              }}
            >
              {chosen.initials}
            </span>
            <span className='truncate'>{chosen.name}</span>
          </span>
        ) : (
          <span className='text-muted'>{emptyLabel}</span>
        )}
        <Icon
          name='chevron_down'
          size={15}
          style={{ color: 'var(--t-muted)', flexShrink: 0 }}
        />
      </button>
      {open && (
        <div
          className='theme-popover member-popover'
          onKeyDown={event => {
            if (event.key === 'Escape') {
              event.preventDefault()
              setOpen(false)
            }
          }}
        >
          <div className='p-2'>
            <input
              ref={searchRef}
              className='input w-full'
              type='search'
              aria-label='Search members'
              placeholder='Search members…'
              value={query}
              onChange={event => setQuery(event.target.value)}
              onKeyDown={event => {
                if (event.key === 'Enter' && filtered.length === 1) {
                  event.preventDefault()
                  choose(filtered[0].id)
                }
              }}
            />
          </div>
          <div role='listbox' aria-label={label} className='member-options'>
            {(allowUnassigned || allowEveryone) && !query && (
              <button
                type='button'
                role='option'
                aria-selected={!value}
                className='member-option'
                onClick={() => choose('')}
              >
                <span>{emptyLabel}</span>
                {!value && <Icon name='check' size={14} />}
              </button>
            )}
            {filtered.map(member => (
              <button
                type='button'
                key={member.id}
                role='option'
                className='member-option'
                aria-selected={member.id === value}
                onClick={() => choose(member.id)}
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
                <span className='flex-1 text-start min-w-0'>
                  <span className='block truncate'>{member.name}</span>
                  <span
                    className='block text-faint truncate'
                    style={{ fontSize: 10 }}
                  >
                    {member.email}
                  </span>
                </span>
                {member.id === value && <Icon name='check' size={14} />}
              </button>
            ))}
            {filtered.length === 0 && (
              <div className='p-3 text-muted' style={{ fontSize: 12 }}>
                No matching members
              </div>
            )}
          </div>
          <div className='popover-footer text-faint' style={{ fontSize: 10 }}>
            {filtered.length} of {members.length} members
          </div>
        </div>
      )}
    </div>
  )
}
