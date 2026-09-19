import { Outlet } from 'react-router-dom'

import SettingsNav from './SettingsNav'

/**
 * Settings module shell: a horizontal tab strip stays visible above every
 * settings detail route so users are never lost on a flat, long, overwhelming
 * page. Routes render below inside the styled content area.
 */
const SettingsRoutes = () => (
  <div className='figma-settings-shell'>
    <SettingsNav />
    <main className='figma-settings-content'>
      <Outlet />
    </main>
  </div>
)

export default SettingsRoutes
