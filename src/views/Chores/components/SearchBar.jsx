import PropTypes from 'prop-types'
import { useTranslation } from 'react-i18next'

import FigmaIcon from '../../../components/FigmaIcon'
import { formatSearchPlaceholder } from '../../../config/AppBranding'
import { useGlobalSearch } from '../../../search/GlobalSearchContext'

const ShortcutHint = ({ shortcut, show }) => {
  if (!show) return null

  const modifierKey = navigator.platform.toUpperCase().includes('MAC')
    ? '⌘'
    : 'Ctrl'

  return (
    <kbd
      className='text-faint hidden md:inline-flex'
      style={{ fontFamily: 'var(--font-mono)', fontSize: 10 }}
    >
      {modifierKey} + {shortcut}
    </kbd>
  )
}

ShortcutHint.propTypes = {
  shortcut: PropTypes.string.isRequired,
  show: PropTypes.bool,
}

const SearchBar = ({
  inputRef,
  onChange,
  onClose,
  onFocus,
  showKeyboardShortcuts,
  value,
}) => {
  const { openSearch } = useGlobalSearch()
  const { t } = useTranslation('chores')
  const handleOpen = () => {
    onFocus?.()
    openSearch(value)
  }

  return (
    <div
      className='card figma-search-input my-2 flex min-w-0 flex-1 items-center gap-2 px-3'
      style={{ cursor: 'pointer' }}
      onMouseDown={event => {
        event.preventDefault()
        handleOpen()
      }}
    >
      <FigmaIcon
        name='search'
        size={18}
        style={{ color: 'var(--t-muted)', flexShrink: 0 }}
      />
      <ShortcutHint shortcut='F' show={showKeyboardShortcuts} />
      <input
        className='text-primary min-w-0 flex-1 bg-transparent py-2 outline-none'
        onChange={onChange}
        onFocus={handleOpen}
        placeholder={formatSearchPlaceholder()}
        readOnly
        ref={inputRef}
        style={{ cursor: 'pointer' }}
        value={value}
      />
      {value && (
        <>
          <ShortcutHint shortcut='X' show={showKeyboardShortcuts} />
          <button
            aria-label={t('list.clearTaskSearch')}
            className='btn btn-ghost btn-icon'
            onClick={event => {
              event.stopPropagation()
              onClose()
            }}
            onMouseDown={event => event.stopPropagation()}
            type='button'
          >
            <FigmaIcon name='x' size={15} />
          </button>
        </>
      )}
    </div>
  )
}

SearchBar.propTypes = {
  inputRef: PropTypes.oneOfType([
    PropTypes.func,
    PropTypes.shape({ current: PropTypes.any }),
  ]),
  onChange: PropTypes.func,
  onClose: PropTypes.func.isRequired,
  onFocus: PropTypes.func,
  showKeyboardShortcuts: PropTypes.bool,
  value: PropTypes.string.isRequired,
}

export default SearchBar
