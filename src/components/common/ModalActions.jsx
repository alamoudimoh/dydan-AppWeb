import PropTypes from 'prop-types'
import { Link } from 'react-router-dom'

import { sxToStyle } from '../../theme/sxToStyle'

const VARIANT_CLASS = {
  solid: 'btn-primary',
  outlined: 'btn-secondary',
  plain: 'btn-ghost',
  soft: 'btn-secondary',
}

const resolveClass = (role, action) => {
  const color =
    action?.color === 'danger' && role === 'primary' ? 'danger' : null
  if (color === 'danger') return 'btn-danger'
  const variant =
    action?.variant ||
    {
      primary: 'solid',
      secondary: 'outlined',
      tertiary: 'plain',
    }[role]
  if (variant === 'solid') return 'btn-primary'
  if (variant === 'danger') return 'btn-danger'
  return VARIANT_CLASS[variant] || 'btn-ghost'
}

const ActionButton = ({ action, role, stackOnMobile, sx }) => {
  if (!action) return null
  const {
    className,
    color,
    endDecorator,
    label,
    onClick,
    ref,
    startDecorator,
    sx: actionSx,
    to,
    variant,
    ...rest
  } = action

  const classes = [
    'btn',
    resolveClass(role, action),
    className,
    stackOnMobile ? 'max-sm:w-full' : '',
  ]
    .filter(Boolean)
    .join(' ')

  const style = { ...sxToStyle(actionSx), ...sxToStyle(sx) }
  const marginEndAuto = role === 'tertiary' ? { marginInlineEnd: 'auto' } : null
  const content = (
    <>
      {startDecorator}
      {label}
      {endDecorator}
    </>
  )

  if (to) {
    return (
      <Link
        to={to}
        className={classes}
        style={{ ...marginEndAuto, ...style }}
        {...rest}
      >
        {content}
      </Link>
    )
  }
  return (
    <button
      ref={ref}
      type='button'
      className={classes}
      onClick={onClick}
      style={{ ...marginEndAuto, ...style }}
      {...rest}
    >
      {content}
    </button>
  )
}

ActionButton.propTypes = {
  action: PropTypes.object,
  role: PropTypes.string,
  stackOnMobile: PropTypes.bool,
  sx: PropTypes.object,
}

/**
 * Consistent modal action row. Secondary actions are rendered first and the
 * primary action is always the final, highest-emphasis control.
 */
const ModalActions = ({
  children,
  primary,
  secondary,
  stackOnMobile = false,
  sx,
  tertiary,
}) => {
  const layout = {
    display: 'flex',
    flexDirection: stackOnMobile ? 'column-reverse' : 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 8,
  }

  if (children) {
    return (
      <div
        className={stackOnMobile ? 'max-sm:[&>*]:w-full' : ''}
        style={{ ...layout, ...sxToStyle(sx) }}
      >
        {children}
      </div>
    )
  }

  return (
    <div style={{ ...layout, ...sxToStyle(sx) }}>
      <ActionButton
        action={tertiary}
        role='tertiary'
        stackOnMobile={stackOnMobile}
      />
      <ActionButton
        action={secondary}
        role='secondary'
        stackOnMobile={stackOnMobile}
      />
      <ActionButton
        action={primary}
        role='primary'
        stackOnMobile={stackOnMobile}
      />
    </div>
  )
}

ModalActions.propTypes = {
  children: PropTypes.node,
  primary: PropTypes.object,
  secondary: PropTypes.object,
  tertiary: PropTypes.object,
  stackOnMobile: PropTypes.bool,
  sx: PropTypes.object,
}

export default ModalActions
