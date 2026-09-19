import {
  DarkModeOutlined,
  LaptopOutlined,
  LightModeOutlined,
} from '@mui/icons-material'
import { Button, FormControl, FormLabel, ToggleButtonGroup } from '@mui/joy'
import { useTranslation } from 'react-i18next'

import { useProductTheme } from '@/contexts/ThemeContext'

const ELEMENTID = 'select-theme-mode'

const ThemeToggle = () => {
  const { t } = useTranslation('settings')
  const { mode, setMode } = useProductTheme()

  const handleThemeModeChange = (_, newThemeMode) => {
    if (!newThemeMode) return
    setMode(newThemeMode)
  }

  return (
    <FormControl>
      <FormLabel
        level='title-md'
        id={`${ELEMENTID}-label`}
        htmlFor='select-theme-mode'
      >
        {t('theme.themeMode')}
      </FormLabel>
      <div className='flex items-center gap-4'>
        <ToggleButtonGroup
          id={ELEMENTID}
          variant='outlined'
          value={mode}
          onChange={handleThemeModeChange}
        >
          <Button startDecorator={<LightModeOutlined />} value='light'>
            {t('theme.light')}
          </Button>
          <Button startDecorator={<DarkModeOutlined />} value='dark'>
            {t('theme.dark')}
          </Button>
          <Button startDecorator={<LaptopOutlined />} value='system'>
            {t('theme.automatic')}
          </Button>
        </ToggleButtonGroup>
      </div>
    </FormControl>
  )
}

export default ThemeToggle
