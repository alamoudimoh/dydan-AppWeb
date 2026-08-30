import PropTypes from 'prop-types'

import { sxToStyle } from '../../theme/sxToStyle'

/**
 * Centered inline loading state rendered with the Figma skeleton vocabulary.
 * No Joy thermostat: a couple of shimmer bars plus an optional label.
 */
const QueryLoadingView = ({ label, size = 'md', sx }) => (
  <div
    role='status'
    aria-label={label || 'Loading'}
    className='flex flex-col items-center justify-center gap-3 px-6 py-12'
    style={sxToStyle(sx)}
  >
    <div className='flex w-full max-w-72 flex-col gap-2' aria-hidden='true'>
      <div
        className='skeleton'
        style={{ height: size === 'sm' ? 10 : 14, width: '100%' }}
      />
      <div
        className='skeleton'
        style={{ height: size === 'sm' ? 10 : 14, width: '72%' }}
      />
    </div>
    {label && <p className='text-muted text-sm'>{label}</p>}
  </div>
)

QueryLoadingView.propTypes = {
  label: PropTypes.string,
  size: PropTypes.string,
  sx: PropTypes.object,
}

export default QueryLoadingView
