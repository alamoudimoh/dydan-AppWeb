import PropTypes from 'prop-types'

import { sxToStyle } from '../../theme/sxToStyle'

const LEVELS = { h1: 'h1', h2: 'h2', h3: 'h3', h4: 'h4', h5: 'h5', h6: 'h6' }

const PageHeader = ({
  action,
  icon,
  subtitle,
  sx,
  title,
  titleLevel = 'h2',
  ...rest
}) => {
  const Heading = LEVELS[titleLevel] || 'h2'
  return (
    <header className='page-header' style={sxToStyle(sx)} {...rest}>
      <div className='flex min-w-0 flex-1 items-start gap-2'>
        {icon && (
          <span aria-hidden='true' className='text-muted mt-0.5 flex'>
            {icon}
          </span>
        )}
        <div className='min-w-0'>
          <Heading
            className='text-primary'
            style={{
              fontSize: 20,
              fontWeight: 700,
              letterSpacing: '-0.01em',
              margin: 0,
            }}
          >
            {title}
          </Heading>
          {subtitle && (
            <p className='text-muted text-sm' style={{ margin: '2px 0 0' }}>
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {action && (
        <div className='shrink-0 self-start max-sm:w-full max-sm:flex-grow max-sm:[&>*]:w-full'>
          {action}
        </div>
      )}
    </header>
  )
}

PageHeader.propTypes = {
  action: PropTypes.node,
  icon: PropTypes.node,
  subtitle: PropTypes.node,
  title: PropTypes.node.isRequired,
  titleLevel: PropTypes.string,
  sx: PropTypes.object,
}

export default PageHeader
