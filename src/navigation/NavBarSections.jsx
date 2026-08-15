import { Box, Divider, List, Typography } from '@mui/joy'
import { useTranslation } from 'react-i18next'

import NavBarLink from '../views/components/NavBarLink'

const NavBarSections = ({ sections }) => {
  const { t } = useTranslation('common')

  return (
    <>
      {sections.map((section, index) => (
        <Box key={section.id} sx={{ mb: index < sections.length - 1 ? 1 : 0 }}>
          {index > 0 && <Divider sx={{ my: 1.5 }} />}
          <Typography
            level='body-xs'
            sx={{
              px: 1.5,
              py: 0.75,
              fontWeight: 600,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              color: 'text.tertiary',
            }}
          >
            {t(`navigation.sections.${section.id}`)}
          </Typography>
          <List size='md' sx={{ p: 0 }}>
            {section.links.map(link => (
              <NavBarLink key={link.id} link={link} />
            ))}
          </List>
        </Box>
      ))}
    </>
  )
}

export default NavBarSections
