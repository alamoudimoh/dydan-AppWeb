import { useTranslation } from 'react-i18next'

import SettingsLayout from './SettingsLayout'
import ThemeToggle from './ThemeToggle'

const ThemeSettings = () => {
  const { t } = useTranslation('settings')

  return (
    <SettingsLayout title={t('theme.title')}>
      <ThemeToggle />
    </SettingsLayout>
  )
}

export default ThemeSettings
