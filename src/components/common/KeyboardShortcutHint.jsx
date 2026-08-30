import PropTypes from 'prop-types'
import { useEffect, useState } from 'react'

function KeyboardShortcutHint({
  shortcut,
  show = true,
  sx = {},
  withCmd = true,
  withCtrl,
  withShift = false,
  ...props
}) {
  const [isDesktop, setIsDesktop] = useState(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia('(min-width: 768px)').matches,
  )

  useEffect(() => {
    const media = window.matchMedia('(min-width: 768px)')
    const update = () => setIsDesktop(media.matches)
    update()
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])

  if (!show || !isDesktop) return null

  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0
  const modifierKey = isMac ? '⌘' : 'Ctrl'

  let displayShortcut = ''
  const shouldShowModifier = withCmd || withCtrl
  if (shouldShowModifier) {
    displayShortcut += modifierKey
  }
  if (withShift) {
    displayShortcut += (displayShortcut ? ' + ' : '') + 'Shift'
  }
  if (shortcut) {
    displayShortcut += (displayShortcut ? ' + ' : '') + shortcut
  }

  const spacing = value => `${value * 0.25}rem`
  const marginStyle = {}
  if (sx.mt !== undefined) marginStyle.marginTop = spacing(sx.mt)
  if (sx.me !== undefined) marginStyle.marginInlineEnd = spacing(sx.me)
  if (sx.ms !== undefined) marginStyle.marginInlineStart = spacing(sx.ms)
  if (sx.mb !== undefined) marginStyle.marginBottom = spacing(sx.mb)

  return (
    <span
      className='badge'
      style={{
        fontSize: '0.75rem',
        maxHeight: '1.5rem',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        fontWeight: '500',
        letterSpacing: '0.025em',
        border: '1px solid var(--line)',
        color: 'var(--t-muted)',
        borderRadius: 'var(--r-sm)',
        padding: '0.125rem 0.5rem',
        boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
        ...marginStyle,
      }}
      {...props}
    >
      {displayShortcut}
    </span>
  )
}

KeyboardShortcutHint.propTypes = {
  shortcut: PropTypes.string.isRequired,
  show: PropTypes.bool,
  withCmd: PropTypes.bool,
  withCtrl: PropTypes.bool,
  withShift: PropTypes.bool,
  sx: PropTypes.object,
}

export default KeyboardShortcutHint
