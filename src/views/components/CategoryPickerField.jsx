import PropTypes from 'prop-types'
import { useEffect, useId, useRef, useState } from 'react'

import FigmaIcon from '../../components/FigmaIcon'
import {
  useCategories,
  useCategoryActions,
} from '../../queries/CategoryQueries'

const UNCATEGORIZED_VALUE = 'uncategorized'

const CategoryPickerField = ({ onChange, value }) => {
  const { data: categories = [] } = useCategories()
  const { create } = useCategoryActions()
  const [creating, setCreating] = useState(false)
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(0)
  const inputId = useId()
  const labelId = useId()
  const listboxId = useId()
  const pickerRef = useRef(null)
  const collator = new Intl.Collator(undefined, { sensitivity: 'base' })
  const sorted = [...categories].sort((a, b) =>
    collator.compare(a.name, b.name),
  )
  const selectedId =
    value === null || value === undefined ? null : Number(value)
  const options = [
    { id: UNCATEGORIZED_VALUE, name: 'Uncategorized' },
    ...sorted.map(category => ({
      id: Number(category.id),
      name: category.name,
    })),
  ]
  const selectedIndex = options.findIndex(option => option.id === selectedId)
  const activeIndex = selectedIndex === -1 ? 0 : selectedIndex

  useEffect(() => {
    const closeOnOutsidePointerDown = event => {
      if (!pickerRef.current?.contains(event.target)) setIsOpen(false)
    }

    document.addEventListener('pointerdown', closeOnOutsidePointerDown)
    return () =>
      document.removeEventListener('pointerdown', closeOnOutsidePointerDown)
  }, [])

  const selectCategory = option => {
    onChange(option.id === UNCATEGORIZED_VALUE ? null : Number(option.id))
    setIsOpen(false)
  }

  const openPicker = () => {
    setHighlightedIndex(activeIndex)
    setIsOpen(true)
  }

  const handlePickerKeyDown = event => {
    if (event.key === 'Escape') {
      setIsOpen(false)
      return
    }

    if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault()
      if (!isOpen) openPicker()
      setHighlightedIndex(event.key === 'Home' ? 0 : options.length - 1)
      return
    }

    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      if (!isOpen) {
        openPicker()
        return
      }
      setHighlightedIndex(index => {
        const direction = event.key === 'ArrowDown' ? 1 : -1
        return (index + direction + options.length) % options.length
      })
      return
    }

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      if (isOpen) selectCategory(options[highlightedIndex])
      else openPicker()
    }
  }

  const save = async () => {
    const trimmed = name.trim()
    if (!trimmed) return setError('Category name is required')
    if (categories.some(item => collator.compare(item.name, trimmed) === 0))
      return setError('Category already exists')
    try {
      const response = await create.mutateAsync({ name: trimmed })
      const body = await response.json()
      if (!response.ok)
        throw new Error(body.error || 'Unable to create category')
      onChange(Number(body.res.id))
      setName('')
      setCreating(false)
      setError('')
    } catch (reason) {
      setError(reason.message)
    }
  }
  return (
    <div style={{ display: 'grid', gap: 8 }}>
      <label
        id={labelId}
        style={{ color: 'var(--t-primary)', fontSize: 14, fontWeight: 600 }}
      >
        Category
      </label>
      <div ref={pickerRef} style={{ position: 'relative' }}>
        <button
          id={inputId}
          type='button'
          className='input'
          role='combobox'
          aria-labelledby={labelId}
          aria-controls={isOpen ? listboxId : undefined}
          aria-activedescendant={
            isOpen ? `${listboxId}-option-${highlightedIndex}` : undefined
          }
          aria-expanded={isOpen}
          aria-haspopup='listbox'
          onClick={() => (isOpen ? setIsOpen(false) : openPicker())}
          onKeyDown={handlePickerKeyDown}
          style={{
            alignItems: 'center',
            cursor: 'pointer',
            display: 'flex',
            justifyContent: 'space-between',
            textAlign: 'start',
          }}
        >
          {options[activeIndex].name}
          <FigmaIcon name='chevron_down' size={16} />
        </button>
        {isOpen && (
          <div
            id={listboxId}
            role='listbox'
            aria-labelledby={labelId}
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--line)',
              borderRadius: 'var(--r-md)',
              boxShadow: 'var(--shadow-sm)',
              left: 0,
              marginTop: 4,
              maxWidth: 'calc(100vw - 24px)',
              maxHeight: 240,
              overflowY: 'auto',
              padding: 4,
              position: 'absolute',
              right: 0,
              top: '100%',
              zIndex: 2100,
            }}
          >
            {options.map((option, index) => (
              <button
                key={option.id}
                id={`${listboxId}-option-${index}`}
                type='button'
                role='option'
                aria-selected={index === activeIndex}
                onClick={() => selectCategory(option)}
                onMouseMove={() => setHighlightedIndex(index)}
                style={{
                  background:
                    index === highlightedIndex ? 'var(--brand-faint)' : 'none',
                  border: 0,
                  borderRadius: 'var(--r-sm)',
                  color: 'var(--t-primary)',
                  cursor: 'pointer',
                  display: 'block',
                  font: '14px var(--font-ui)',
                  padding: '8px 10px',
                  textAlign: 'start',
                  width: '100%',
                }}
              >
                {option.name}
              </button>
            ))}
          </div>
        )}
      </div>
      {!creating ? (
        <button
          type='button'
          className='btn btn-ghost'
          onClick={() => setCreating(true)}
          style={{
            alignSelf: 'flex-start',
            font: '600 13px var(--font-ui)',
            gap: 6,
            minHeight: 32,
            padding: '4px 8px',
          }}
        >
          <FigmaIcon name='plus' size={16} />
          Create new category
        </button>
      ) : (
        <form
          onSubmit={event => {
            event.preventDefault()
            save()
          }}
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 8,
            marginTop: 8,
          }}
        >
          <input
            autoFocus
            className='input'
            value={name}
            onChange={event => setName(event.target.value)}
            placeholder='Category name'
            maxLength={80}
            dir='auto'
            style={{ flex: '1 1 180px', minWidth: 0 }}
          />
          <button
            type='submit'
            className='btn btn-primary'
            disabled={create.isPending}
            aria-busy={create.isPending}
            style={{ padding: '6px 12px' }}
          >
            {create.isPending ? 'Creating...' : 'Create'}
          </button>
          <button
            type='button'
            className='btn btn-ghost'
            onClick={() => setCreating(false)}
            style={{ padding: '6px 12px' }}
          >
            Cancel
          </button>
        </form>
      )}
      {error && (
        <p
          role='alert'
          style={{ color: 'var(--sig-over, #c62828)', fontSize: 14, margin: 0 }}
        >
          {error}
        </p>
      )}
    </div>
  )
}

CategoryPickerField.propTypes = {
  onChange: PropTypes.func.isRequired,
  value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
}

export default CategoryPickerField
