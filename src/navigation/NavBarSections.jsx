import { Box, List, Typography } from '@mui/joy'
import { useTranslation } from 'react-i18next'

import NavBarLink from '../views/components/NavBarLink'
import { navSectionLabelSx, navSectionSpacingSx } from './navStyles'

const NavBarSections = ({ onItemActivate, sections }) => {
  const { t } = useTranslation('common')

  return (
    <>
      {sections.map((section, index) => (
        <Box key={section.id} sx={navSectionSpacingSx(index)}>
          <Typography level='body-xs' sx={navSectionLabelSx}>
            {t(`navigation.sections.${section.id}`)}
          </Typography>
          <List size='md' sx={{ p: 0, gap: 0 }}>
            {section.links.map(link => (
              <NavBarLink
                key={link.id}
                link={link}
                onActivate={onItemActivate}
              />
            ))}
          </List>
        </Box>
      ))}
    </>
  )
}

export default NavBarSections
