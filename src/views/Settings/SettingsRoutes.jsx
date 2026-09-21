import { Outlet, useLocation } from 'react-router-dom'

import SettingsNav from './SettingsNav'

/**
 * Settings module shell. The `/settings` index renders the pixel-identical
 * PE2 settings screen (FigmaSettingsScreen), which ships its own single
 * tabbed layout, so the index stays bare. Every `/settings/*` detail route
 * keeps the horizontal tab strip above the styled content area.
 */
const SettingsRoutes = () => {
  const { pathname } = useLocation()
  const isIndex = pathname === '/settings' || pathname === '/settings/'

  if (isIndex) return <Outlet />

  return (
    <div className='figma-settings-shell'>
      <SettingsNav />
      <main className='figma-settings-content'>
        <Outlet />
      </main>
    </div>
  )
}

export default SettingsRoutes
