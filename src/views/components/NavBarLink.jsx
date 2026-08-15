import {
  ListItem,
  ListItemButton,
  ListItemContent,
  ListItemDecorator,
} from '@mui/joy'
import { Link, useLocation } from 'react-router-dom'

import { isNavLinkActive } from '../../navigation/navLinkState'
import { navItemButtonSx } from '../../navigation/navStyles'

const NavBarLink = ({ link, onActivate }) => {
  const location = useLocation()
  const { icon, id, label, onClick, to } = link
  const isActive = isNavLinkActive(location.pathname, id)

  const handleActivate = event => {
    onClick?.(event)
    onActivate?.()
  }

  return (
    <ListItem sx={{ p: 0, mb: 0.25 }}>
      <ListItemButton
        {...(onClick
          ? { onClick: handleActivate }
          : {
              component: Link,
              to,
              onClick: () => onActivate?.(),
            })}
        variant='plain'
        color='neutral'
        selected={isActive}
        aria-current={isActive ? 'page' : undefined}
        sx={navItemButtonSx(isActive)}
      >
        <ListItemDecorator>{icon}</ListItemDecorator>
        <ListItemContent sx={{ fontSize: 'sm' }}>{label}</ListItemContent>
      </ListItemButton>
    </ListItem>
  )
}

export default NavBarLink
