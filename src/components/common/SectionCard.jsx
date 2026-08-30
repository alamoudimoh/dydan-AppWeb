import PropTypes from 'prop-types'

import { sxToStyle } from '../../theme/sxToStyle'

const LEVEL_TAG = {
  h1: 'h1',
  h2: 'h2',
  h3: 'h3',
  h4: 'h4',
  h5: 'h5',
  h6: 'h6',
  'title-lg': 'h2',
  'title-md': 'h3',
  'title-sm': 'h4',
}

const Heading = ({ level, title }) => {
  const Tag = LEVEL_TAG[level] || 'h3'
  return (
    <Tag
      className='text-primary'
      style={{ fontSize: 16, fontWeight: 700, margin: 0 }}
    >
      {title}
    </Tag>
  )
}

/**
 * Section card rendered with the Figma `.card` vocabulary.
 * `variant` is accepted for Joy call-site compatibility; the Figma card
 * presentation is the same for every variant. `titleLevel` maps Joy Typography
 * levels ('title-lg', 'title-md', …) to the matching heading element.
 */
const SectionCard = ({
  action,
  children,
  sx,
  title,
  titleLevel = 'title-lg',
  variant,
}) => (
  <section
    className='card'
    data-variant={variant}
    style={{
      padding: 18,
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
      ...sxToStyle(sx),
    }}
  >
    {title && (
      <header className='flex items-center justify-between gap-2'>
        <Heading level={titleLevel} title={title} />
        {action}
      </header>
    )}
    {children}
  </section>
)

SectionCard.propTypes = {
  action: PropTypes.node,
  children: PropTypes.node,
  sx: PropTypes.object,
  title: PropTypes.node,
  titleLevel: PropTypes.string,
  variant: PropTypes.string,
}

export default SectionCard
