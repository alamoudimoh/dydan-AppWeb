import PropTypes from 'prop-types'

/**
 * One shared presentation pattern for every segmented settings choice
 * (theme, default home view, language). All options render through the
 * exact same markup so icon size, label, spacing, and selected state can
 * never drift between options.
 */
const OptionButtonGroup = ({ onChange, options, value }) => (
  <div className='view-toggle figma-view-toggle' role='group'>
    {options.map(option => {
      const selected = value === option.value
      return (
        <button
          aria-pressed={selected}
          className={`view-toggle-btn ${selected ? 'active' : ''}`}
          key={option.value}
          onClick={() => onChange(option.value)}
          type='button'
        >
          {option.icon && (
            <span aria-hidden='true' className='view-toggle-icon'>
              {option.icon}
            </span>
          )}
          <span>{option.label}</span>
        </button>
      )
    })}
  </div>
)

OptionButtonGroup.propTypes = {
  onChange: PropTypes.func.isRequired,
  options: PropTypes.arrayOf(
    PropTypes.shape({
      icon: PropTypes.string,
      label: PropTypes.string.isRequired,
      value: PropTypes.string.isRequired,
    }),
  ).isRequired,
  value: PropTypes.string,
}

export default OptionButtonGroup
