import PropTypes from 'prop-types'

/** Shared Figma Settings shell for every production-only settings detail route. */
const SettingsLayout = ({ children, title }) => (
  <div className='figma-settings-wrap'>
    <div className='page-header pb-5'>
      <h1
        className='text-primary'
        style={{ fontSize: 24, fontWeight: 800, margin: 0 }}
      >
        {title}
      </h1>
    </div>
    <div className='figma-settings-detail px-4 md:px-7'>{children}</div>
  </div>
)

SettingsLayout.propTypes = {
  children: PropTypes.node,
  title: PropTypes.node.isRequired,
}

export default SettingsLayout
