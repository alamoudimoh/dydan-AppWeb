import { useEffect, useId, useRef, useState } from 'react'

import FigmaIcon from '../../components/FigmaIcon'

const defaultPriorityColors = {
  0: '#9CA3AF',
  1: '#EF4444',
  2: '#F97316',
  3: '#FBBF24',
  4: '#3B82F6',
}

const defaultPriorityLabels = {
  0: 'No Priority',
  1: 'P1',
  2: 'P2',
  3: 'P3',
  4: 'P4',
}

const PriorityPickerField = ({
  emptyDisplay = 'icon-text',
  onChange,
  onClear,
  priorityColors = defaultPriorityColors,
  priorityLabels = defaultPriorityLabels,
  size = 'sm',
  value = 0,
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [focusedIndex, setFocusedIndex] = useState(null)
  const pickerRef = useRef(null)
  const triggerRef = useRef(null)
  const optionRefs = useRef([])
  const menuId = useId()
  const options = [1, 2, 3, 4].map(priorityOption => ({
    id: priorityOption,
    label: priorityLabels[priorityOption],
    color: priorityColors[priorityOption],
  }))
  const selectedItem = options.find(option => option.id === value)
  const isEmpty = !selectedItem
  const shouldShowLabel = !isEmpty || emptyDisplay === 'icon-text'

  useEffect(() => {
    if (!isOpen) return

    const handleDocumentPointerDown = event => {
      if (!pickerRef.current?.contains(event.target)) setIsOpen(false)
    }
    const handleEscape = event => {
      if (event.key === 'Escape') {
        setIsOpen(false)
        triggerRef.current?.focus()
      }
    }

    document.addEventListener('pointerdown', handleDocumentPointerDown)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('pointerdown', handleDocumentPointerDown)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen])

  useEffect(() => {
    if (isOpen && focusedIndex !== null) {
      optionRefs.current[focusedIndex]?.focus()
    }
  }, [focusedIndex, isOpen])

  const openMenu = index => {
    setFocusedIndex(index)
    setIsOpen(true)
  }

  const closeMenu = () => {
    setFocusedIndex(null)
    setIsOpen(false)
  }

  const handleSelect = priorityOption => {
    onChange?.(priorityOption)
    closeMenu()
    triggerRef.current?.focus()
  }

  const handleTriggerKeyDown = event => {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      openMenu(0)
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      openMenu(options.length - 1)
    }
  }

  const handleOptionKeyDown = (event, index) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      setFocusedIndex(
        event.key === 'ArrowDown'
          ? (index + 1) % options.length
          : (index - 1 + options.length) % options.length,
      )
    } else if (event.key === 'Home') {
      event.preventDefault()
      setFocusedIndex(0)
    } else if (event.key === 'End') {
      event.preventDefault()
      setFocusedIndex(options.length - 1)
    } else if (event.key === 'Escape') {
      event.preventDefault()
      closeMenu()
      triggerRef.current?.focus()
    }
  }

  // Don't add the 0 option to the menu - priority 0 is the "empty" state (icon only)

  return (
    <div
      ref={pickerRef}
      className='figma-priority-picker'
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
      }}
    >
      <button
        ref={triggerRef}
        type='button'
        className='btn btn-secondary figma-priority-picker__trigger'
        data-size={size}
        onClick={() => (isOpen ? closeMenu() : openMenu(null))}
        onKeyDown={handleTriggerKeyDown}
        aria-controls={isOpen ? menuId : undefined}
        aria-expanded={isOpen}
        aria-haspopup='menu'
        aria-label={isEmpty ? 'Priority' : `Priority: ${selectedItem.label}`}
        style={{
          alignItems: 'center',
          backgroundColor: selectedItem ? `${selectedItem.color}20` : undefined,
          borderColor: selectedItem?.color || undefined,
          borderRadius: 'var(--r-full)',
          color: selectedItem?.color || 'var(--t-primary)',
          cursor: 'pointer',
          display: 'inline-flex',
          gap: shouldShowLabel ? 8 : 0,
          justifyContent: 'flex-start',
          minHeight: 40,
          minWidth: 'min-content',
          padding: shouldShowLabel ? '8px 10px' : '8px 6px',
        }}
      >
        <FigmaIcon name='flag' size={20} />
        {shouldShowLabel && (
          <span
            style={{
              maxWidth: 180,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {isEmpty ? 'Priority' : selectedItem.label}
          </span>
        )}
      </button>
      {!isEmpty && onClear && (
        <button
          type='button'
          className='figma-icon-button figma-priority-picker__clear'
          onClick={event => {
            event.stopPropagation()
            onClear()
          }}
          aria-label='Clear priority'
          title='Clear priority'
          style={{
            alignItems: 'center',
            background: 'var(--sig-over-bg, var(--surface-2))',
            border: '1px solid var(--sig-over, var(--line))',
            borderRadius: '50%',
            color: 'var(--sig-over, var(--t-primary))',
            cursor: 'pointer',
            display: 'inline-flex',
            height: 18,
            justifyContent: 'center',
            padding: 0,
            position: 'absolute',
            right: -16,
            top: -12,
            width: 18,
            zIndex: 1,
          }}
        >
          <FigmaIcon name='x' size={14} />
        </button>
      )}
      {isOpen && (
        <div
          id={menuId}
          className='figma-dropdown-menu figma-priority-picker__menu'
          role='menu'
          aria-label='Priority options'
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--line)',
            borderRadius: 'var(--r-md)',
            bottom: 'calc(100% + 8px)',
            boxShadow: 'var(--shadow-sm)',
            minWidth: 180,
            overflow: 'hidden',
            padding: 6,
            position: 'absolute',
            left: 0,
            zIndex: 1000,
          }}
        >
          {options.map((option, index) => {
            const isSelected = option.id === value

            return (
              <button
                key={option.id}
                ref={element => {
                  optionRefs.current[index] = element
                }}
                type='button'
                className='figma-menu-item figma-priority-picker__option'
                role='menuitemradio'
                aria-checked={isSelected}
                onClick={() => handleSelect(option.id)}
                onKeyDown={event => handleOptionKeyDown(event, index)}
                style={{
                  alignItems: 'center',
                  background: isSelected ? `${option.color}20` : 'transparent',
                  border: 0,
                  borderRadius: 'var(--r-sm)',
                  color: isSelected ? option.color : 'var(--t-primary)',
                  cursor: 'pointer',
                  display: 'flex',
                  font: '500 14px var(--font-ui)',
                  gap: 8,
                  padding: '8px 10px',
                  textAlign: 'left',
                  width: '100%',
                }}
              >
                <FigmaIcon
                  name='flag'
                  size={18}
                  style={{ color: option.color }}
                />
                <span>{option.label}</span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default PriorityPickerField
