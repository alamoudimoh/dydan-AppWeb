import { useEffect, useId, useMemo, useRef, useState } from 'react'

import FigmaIcon from '../../components/FigmaIcon'
import { Z_INDEX } from '../../constants/zIndex'

const menuPositionStyle = placement => {
  switch (placement) {
    case 'top-end':
      return { bottom: 'calc(100% + 8px)', insetInlineEnd: 0 }
    case 'bottom-start':
      return { top: 'calc(100% + 8px)', insetInlineStart: 0 }
    case 'bottom-end':
      return { top: 'calc(100% + 8px)', insetInlineEnd: 0 }
    case 'top-start':
    default:
      return { bottom: 'calc(100% + 8px)', insetInlineStart: 0 }
  }
}

const BaseOptionPicker = ({
  emptyDisplay = 'icon',
  emptyLabel = 'Select',
  getItemColor,
  getItemLabel = item => item.label,
  getItemValue = item => item.id,
  getTriggerText,
  items = [],
  menuFooter,
  menuMaxHeight = 280,
  menuMinWidth = 180,
  multiple = false,
  onChange,
  onClear,
  onOpenChange,
  onValuesChange,
  open: openProp,
  placement = 'top-start',
  renderItemStart,
  renderTriggerIcon,
  value = null,
  values = [],
}) => {
  const [internalOpen, setInternalOpen] = useState(false)
  const isControlled = openProp !== undefined
  const isOpen = isControlled ? openProp : internalOpen
  const setIsOpen = value => {
    if (!isControlled) setInternalOpen(value)
    const nextValue = typeof value === 'function' ? value(isOpen) : value
    onOpenChange?.(nextValue)
  }
  const buttonRef = useRef(null)
  const wrapperRef = useRef(null)
  const menuId = useId()

  useEffect(() => {
    if (!isOpen) return

    const handlePointerDown = event => {
      if (!wrapperRef.current?.contains(event.target)) {
        setIsOpen(false)
      }
    }
    const handleEscape = event => {
      if (event.key === 'Escape') {
        setIsOpen(false)
        buttonRef.current?.focus()
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen])

  const selectedItems = useMemo(() => {
    if (multiple) {
      const selectedSet = new Set(values)
      return items.filter(item => selectedSet.has(getItemValue(item)))
    }

    if (value === null || value === undefined) return []
    return items.filter(item => getItemValue(item) === value)
  }, [items, multiple, value, values, getItemValue])

  const isEmpty = selectedItems.length === 0
  const shouldShowLabel = !isEmpty || emptyDisplay === 'icon-text'

  const triggerText = getTriggerText
    ? getTriggerText({ selectedItems, isEmpty })
    : isEmpty
      ? emptyLabel
      : getItemLabel(selectedItems[0])

  const triggerColor = isEmpty
    ? undefined
    : getItemColor
      ? getItemColor(selectedItems[0])
      : undefined

  const handleSelect = selectedValue => {
    if (multiple) {
      const selectedSet = new Set(values)
      if (selectedSet.has(selectedValue)) {
        selectedSet.delete(selectedValue)
      } else {
        selectedSet.add(selectedValue)
      }
      onValuesChange?.(Array.from(selectedSet))
      return
    }

    onChange?.(selectedValue)
    setIsOpen(false)
    buttonRef.current?.focus()
  }

  const isSelected = item => {
    const optionValue = getItemValue(item)
    if (multiple) {
      return values.includes(optionValue)
    }
    return value === optionValue
  }

  const handleClear = e => {
    e.stopPropagation()
    onClear?.()
  }

  return (
    <div
      ref={wrapperRef}
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
      }}
    >
      <button
        ref={buttonRef}
        type='button'
        className='btn btn-secondary'
        aria-controls={isOpen ? menuId : undefined}
        aria-expanded={isOpen}
        aria-haspopup='listbox'
        onClick={() => setIsOpen(prev => !prev)}
        style={{
          alignItems: 'center',
          background: isEmpty
            ? 'var(--surface)'
            : triggerColor
              ? `${triggerColor}20`
              : 'var(--surface-2)',
          border: isEmpty
            ? '1px solid var(--line)'
            : triggerColor
              ? `1px solid ${triggerColor}`
              : '1px solid transparent',
          borderRadius: 'var(--r-full)',
          color: triggerColor || 'var(--t-primary)',
          display: 'inline-flex',
          gap: shouldShowLabel ? 8 : 0,
          justifyContent: 'flex-start',
          minHeight: 40,
          minWidth: 'min-content',
          padding: shouldShowLabel ? '8px 10px' : '8px 6px',
          transition: 'all 0.25s ease-in-out',
          whiteSpace: 'nowrap',
        }}
      >
        {renderTriggerIcon?.({ selectedItems, isEmpty })}
        <span
          style={{
            maxWidth: shouldShowLabel ? 180 : 0,
            opacity: shouldShowLabel ? 1 : 0,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            transform: shouldShowLabel ? 'translateX(0)' : 'translateX(-4px)',
            transition:
              'max-width 0.25s ease-in-out, opacity 0.2s ease-in-out, transform 0.25s ease-in-out',
            whiteSpace: 'nowrap',
          }}
        >
          {triggerText}
        </span>
      </button>
      {!isEmpty && onClear && (
        <button
          type='button'
          className='btn btn-danger btn-icon'
          aria-label='Clear selection'
          title='Clear selection'
          onClick={handleClear}
          style={{
            borderRadius: '50%',
            insetInlineEnd: -18,
            minHeight: 30,
            padding: 6,
            position: 'absolute',
            top: -18,
            width: 30,
            zIndex: 10,
          }}
        >
          <FigmaIcon name='x' size={18} />
        </button>
      )}
      {isOpen && (
        <div
          id={menuId}
          role='listbox'
          className='card'
          aria-label={emptyLabel}
          style={{
            ...menuPositionStyle(placement),
            background: 'var(--surface)',
            border: '1px solid var(--line)',
            borderRadius: 'var(--r-md)',
            boxShadow: 'var(--shadow-lg)',
            maxHeight: menuMaxHeight,
            minWidth: menuMinWidth,
            overflowX: 'hidden',
            overflowY: 'auto',
            padding: 6,
            position: 'absolute',
            zIndex: Z_INDEX.MODAL_CLOSE_BUTTON + 1,
          }}
        >
          {items.map((item, index) => {
            const optionValue = getItemValue(item)
            const selected = isSelected(item)
            const itemColor = getItemColor ? getItemColor(item) : undefined

            return (
              <button
                key={optionValue ?? index}
                type='button'
                role='option'
                aria-selected={selected}
                onClick={() => handleSelect(optionValue)}
                style={{
                  alignItems: 'center',
                  background: selected
                    ? itemColor
                      ? `${itemColor}20`
                      : 'var(--surface-2)'
                    : 'transparent',
                  border: 0,
                  borderRadius: 'var(--r-sm)',
                  color: selected
                    ? itemColor || 'var(--t-primary)'
                    : 'var(--t-primary)',
                  cursor: 'pointer',
                  display: 'flex',
                  font: '500 14px var(--font-ui)',
                  gap: 8,
                  marginBottom: index === items.length - 1 ? 0 : 4,
                  padding: '8px 10px',
                  textAlign: 'left',
                  transition: 'background 0.12s ease',
                  width: '100%',
                }}
              >
                {renderItemStart?.({ item, selected })}
                <span
                  style={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {getItemLabel(item)}
                </span>
              </button>
            )
          })}
          {menuFooter && (
            <div style={{ marginTop: items.length > 0 ? 4 : 0 }}>
              {menuFooter}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default BaseOptionPicker
