import {
  BrightnessAuto,
  DarkModeOutlined,
  LightModeOutlined,
} from '@mui/icons-material'
import { FormControl, IconButton, useColorScheme } from '@mui/joy'
import { useTranslation } from 'react-i18next'

import useStickyState from '@/hooks/useStickyState'

const ELEMENTID = 'select-theme-mode'

const ThemeToggleButton = ({ sx }) => {
  const { mode, setMode } = useColorScheme()
  const [themeMode, setThemeMode] = useStickyState(mode, 'themeMode')
  const { t } = useTranslation('common')

  const handleThemeModeChange = e => {
    e.preventDefault()
    e.stopPropagation()

    let newThemeMode
    switch (themeMode) {
      case 'light':
        newThemeMode = 'dark'
        break
      case 'dark':
        newThemeMode = 'system'
        break
      case 'system':
      default:
        newThemeMode = 'light'
        break
    }
    setThemeMode(newThemeMode)
    setMode(newThemeMode)
  }

  const ariaLabel =
    themeMode === 'light'
      ? t('profileMenu.switchToDark')
      : themeMode === 'dark'
        ? t('profileMenu.switchToLight')
        : t('profileMenu.switchToLight')

  return (
    <FormControl sx={sx}>
      <IconButton onClick={handleThemeModeChange} aria-label={ariaLabel}>
        {themeMode === 'light' ? (
          <DarkModeOutlined />
        ) : themeMode === 'dark' ? (
          <BrightnessAuto />
        ) : (
          <LightModeOutlined />
        )}
      </IconButton>
    </FormControl>
  )
}

export default ThemeToggleButton
