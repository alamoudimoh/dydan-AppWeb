import PropTypes from 'prop-types'
import { Link } from 'react-router-dom'

import { sxToStyle } from '../../theme/sxToStyle'

/**
 * The single empty/error surface for the app, rendered with the Figma
 * `.empty-state` and `.btn` vocabulary.
 *
 * variant drives the tone, the icon tile color and the a11y role:
 *   - 'empty'      nothing exists yet. Teach the feature, offer the way in.
 *   - 'no-results' something exists, the current search/filter hides it.
 *   - 'error'      we failed to load. Say what happened, offer a retry.
 *
 * Actions are objects instead of nodes so every call site gets the same
 * button vocabulary (solid primary lead, plain neutral follow).
 */

const TONES = {
  empty: {
    tile: 'var(--brand-faint)',
    iconColor: 'var(--brand)',
    role: 'status',
  },
  'no-results': {
    tile: 'var(--surface-2)',
    iconColor: 'var(--t-muted)',
    role: 'status',
  },
  error: {
    tile: 'var(--sig-over-bg)',
    iconColor: 'var(--sig-over)',
    role: 'alert',
  },
}

const SIZES = {
  sm: { tile: 48, icon: '1.375rem', py: 40, minWidth: 0 },
  md: { tile: 68, icon: '1.875rem', py: 64, minWidth: 148 },
}

const ActionButton = ({ action, className, minWidth, ...buttonProps }) => {
  const { endDecorator, label, onClick, ref, startDecorator, to, ...rest } =
    action

  let emphasis = className
  if ((rest.color ?? 'primary') === 'danger') emphasis += ' btn-danger'

  const content = (
    <>
      {startDecorator}
      {label}
      {endDecorator}
    </>
  )

  if (to) {
    return (
      <Link to={to} className={emphasis} style={{ minWidth }} {...rest}>
        {content}
      </Link>
    )
  }
  return (
    <button
      ref={ref}
      type='button'
      className={emphasis}
      onClick={onClick}
      style={{ minWidth }}
      {...rest}
    >
      {content}
    </button>
  )
}

ActionButton.propTypes = {
  action: PropTypes.object.isRequired,
  className: PropTypes.string,
  minWidth: PropTypes.number,
}

const EmptyState = ({
  description,
  fullHeight = false,
  icon,
  primaryAction,
  secondaryAction,
  size = 'md',
  sx,
  title,
  variant = 'empty',
  ...rest
}) => {
  const tone = TONES[variant] || TONES.empty
  const dimensions = SIZES[size] || SIZES.md

  return (
    <div
      role={tone.role}
      aria-live={variant === 'error' ? 'assertive' : 'polite'}
      className='empty-state'
      style={{
        ...(fullHeight ? { minHeight: '55vh' } : null),
        ...sxToStyle(sx),
      }}
      {...rest}
    >
      {icon && (
        <span
          aria-hidden='true'
          className='flex items-center justify-center rounded-full'
          style={{
            width: dimensions.tile + 16,
            height: dimensions.tile + 16,
            marginBottom: 8,
            background: tone.tile,
            opacity: 0.45,
          }}
        >
          <span
            className='flex items-center justify-center rounded-full'
            style={{
              width: dimensions.tile,
              height: dimensions.tile,
              background: tone.tile,
              color: tone.iconColor,
              fontSize: dimensions.icon,
              opacity: 1,
            }}
          >
            {icon}
          </span>
        </span>
      )}

      <h2
        className='text-primary text-balance font-bold tracking-tight'
        style={{ fontSize: size === 'sm' ? '1rem' : '1.25rem', margin: 0 }}
      >
        {title}
      </h2>

      {description && (
        <p className='text-muted text-sm' style={{ maxWidth: '38ch' }}>
          {description}
        </p>
      )}

      {(primaryAction || secondaryAction) && (
        <div
          className='flex flex-wrap items-center justify-center gap-2'
          style={{ marginTop: 12 }}
        >
          {primaryAction && (
            <ActionButton
              action={primaryAction}
              className='btn btn-primary'
              minWidth={dimensions.minWidth}
            />
          )}
          {secondaryAction && (
            <ActionButton
              action={secondaryAction}
              className='btn btn-ghost'
              minWidth={0}
            />
          )}
        </div>
      )}
    </div>
  )
}

EmptyState.propTypes = {
  variant: PropTypes.oneOf(['empty', 'no-results', 'error']),
  icon: PropTypes.node,
  title: PropTypes.node.isRequired,
  description: PropTypes.node,
  primaryAction: PropTypes.shape({
    label: PropTypes.node.isRequired,
    onClick: PropTypes.func,
    to: PropTypes.string,
    startDecorator: PropTypes.node,
    endDecorator: PropTypes.node,
    color: PropTypes.string,
    ref: PropTypes.object,
  }),
  secondaryAction: PropTypes.shape({
    label: PropTypes.node.isRequired,
    onClick: PropTypes.func,
    to: PropTypes.string,
    startDecorator: PropTypes.node,
    endDecorator: PropTypes.node,
    color: PropTypes.string,
    ref: PropTypes.object,
  }),
  size: PropTypes.oneOf(['sm', 'md']),
  fullHeight: PropTypes.bool,
  sx: PropTypes.object,
}

export default EmptyState
