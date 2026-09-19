import { Divider, Typography } from '@mui/joy'
import { useTranslation } from 'react-i18next'

import ProductThemePicker from './ProductThemePicker'
import SettingsLayout from './SettingsLayout'
import ThemeToggle from './ThemeToggle'

const ThemeSettings = () => {
  const { t } = useTranslation('settings')

  return (
    <SettingsLayout title={t('theme.title')}>
      <Typography level='title-md' mb={1}>
        {t('theme.productTheme')}
      </Typography>
      <Typography level='body-sm' mb={2} color='neutral'>
        {t('theme.productThemeHelp')}
      </Typography>
      <ProductThemePicker />
      <Divider sx={{ my: 3 }} />
      <ThemeToggle />
    </SettingsLayout>
  )
}

export default ThemeSettings
