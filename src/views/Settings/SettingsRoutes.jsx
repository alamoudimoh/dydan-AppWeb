import { Outlet } from 'react-router-dom'

import SettingsNav from './SettingsNav'

/**
 * Settings module shell: a categorized sidebar/tab navigation stays visible
 * around every settings detail route so users are never lost on a flat,
 * long, overwhelming page.
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
