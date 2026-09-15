import {
  AccountCircleRounded,
  AutoAwesomeMosaicRounded,
  CalendarMonthRounded,
  CardGiftcardRounded,
  ChecklistRounded,
  CloseRounded,
  DarkModeRounded,
  DashboardRounded,
  DevicesRounded,
  FolderRounded,
  GroupsRounded,
  InboxRounded,
  LanguageRounded,
  LightModeRounded,
  MenuRounded,
  NotificationsRounded,
  PaletteRounded,
  PlaylistAddCheckRounded,
  SettingsRounded,
  ShoppingCartRounded,
  SpeedRounded,
  TollRounded,
} from '@mui/icons-material'
import {
  Avatar,
  Badge,
  Box,
  Chip,
  CssBaseline,
  Divider,
  Drawer,
  GlobalStyles,
  IconButton,
  List,
  ListItemButton,
  ListItemContent,
  ListItemDecorator,
  Option,
  Select,
  Stack,
  Tooltip,
  Typography,
  useColorScheme,
} from '@mui/joy'
import { CssVarsProvider } from '@mui/joy/styles'
import { useEffect, useMemo, useState } from 'react'

import { NAV_DRAWER_WIDTH } from '../../src/navigation/navStyles.js'
import {
  getReferenceBrand,
  resolveReferenceDirection,
} from './referenceModel.js'
import {
  getReferenceGlobalStyles,
  getReferenceTheme,
} from './referenceTheme.js'
import { ReferenceScreen } from './screens.jsx'

const NAV_SECTIONS = [
  {
    label: 'Daily',
    items: [
      ['dashboard', 'Dashboard', DashboardRounded],
      ['tasks', 'Chores & tasks', ChecklistRounded],
      ['calendar', 'Calendar', CalendarMonthRounded],
      ['notifications', 'Notifications', NotificationsRounded],
    ],
  },
  {
    label: 'Organize',
    items: [
      ['routines', 'Routines', PlaylistAddCheckRounded],
      ['projects', 'Projects', FolderRounded],
      ['shopping', 'Shopping lists', ShoppingCartRounded],
      ['meters', 'Meters', SpeedRounded],
    ],
  },
  {
    label: 'Family',
    items: [
      ['progress', 'Family progress', GroupsRounded],
      ['rewards', 'Rewards', CardGiftcardRounded],
    ],
  },
  {
    label: 'Account',
    items: [
      ['settings', 'Settings', SettingsRounded],
      ['sessions', 'Account & sessions', DevicesRounded],
    ],
  },
  {
    label: 'Reference',
    items: [
      ['components', 'Components', AutoAwesomeMosaicRounded],
      ['states', 'States', InboxRounded],
      ['arabic', 'Arabic / RTL', LanguageRounded],
    ],
  },
]

const PAGE_LABELS = Object.fromEntries(
  NAV_SECTIONS.flatMap(section =>
    section.items.map(([id, label]) => [id, label]),
  ),
)

const BrandMark = ({ brand, compact = false }) => (
  <Stack
    direction='row'
    alignItems='center'
    spacing={1.25}
    sx={{ minWidth: 0 }}
  >
    <Box
      aria-hidden='true'
      sx={{
        width: compact ? 28 : 34,
        height: compact ? 28 : 34,
        borderRadius: brand.id === 'sovereign' ? '8px' : '12px',
        display: 'grid',
        placeItems: 'center',
        bgcolor: 'primary.solidBg',
        color: 'primary.solidColor',
        fontFamily: 'var(--ref-wordmark-font)',
        fontWeight: 700,
        boxShadow: 'var(--joy-shadow-sm)',
      }}
    >
      {brand.name.slice(0, 1)}
    </Box>
    <Box sx={{ minWidth: 0 }}>
      <Typography
        className='reference-wordmark'
        sx={{ fontSize: compact ? '1.15rem' : '1.38rem', lineHeight: 1.1 }}
      >
        {brand.name}
      </Typography>
      {!compact && (
        <Typography
          level='body-xs'
          sx={{
            color: 'text.secondary',
            textTransform: 'none',
            letterSpacing: 0,
          }}
        >
          Product reference
        </Typography>
      )}
    </Box>
  </Stack>
)

const Navigation = ({ activePage, brand, onNavigate }) => (
  <Stack sx={{ width: '100%', height: '100%' }}>
    <Box sx={{ px: 2.5, pt: 2.5, pb: 2 }}>
      <BrandMark brand={brand} />
    </Box>
    <Box sx={{ flex: 1, overflowY: 'auto', px: 1.5, pb: 2 }}>
      {NAV_SECTIONS.map((section, sectionIndex) => (
        <Box key={section.label} sx={{ mt: sectionIndex === 0 ? 0 : 2 }}>
          <Typography
            level='body-xs'
            sx={{ px: 1.25, pb: 0.5, color: 'text.secondary', fontWeight: 600 }}
          >
            {section.label}
          </Typography>
          <List size='sm' sx={{ gap: 0.25, p: 0 }}>
            {section.items.map(([id, label, Icon]) => {
              const active = activePage === id
              return (
                <ListItemButton
                  key={id}
                  selected={active}
                  onClick={() => onNavigate(id)}
                  sx={{
                    minHeight: 38,
                    px: 1.25,
                    color: active ? 'primary.500' : 'text.primary',
                    bgcolor: active ? 'var(--dydan-brand-soft)' : 'transparent',
                    '&:hover': {
                      bgcolor: active
                        ? 'var(--dydan-brand-soft)'
                        : 'neutral.softHoverBg',
                    },
                  }}
                >
                  <ListItemDecorator
                    sx={{
                      minWidth: 30,
                      color: active ? 'primary.500' : 'text.secondary',
                    }}
                  >
                    <Icon fontSize='small' />
                  </ListItemDecorator>
                  <ListItemContent
                    sx={{
                      fontSize: '0.8125rem',
                      fontWeight: active ? 600 : 400,
                    }}
                  >
                    {label}
                  </ListItemContent>
                </ListItemButton>
              )
            })}
          </List>
        </Box>
      ))}
    </Box>
    <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
      <Stack direction='row' alignItems='center' spacing={1.25}>
        <Avatar className='reference-member-avatar' data-member='1' size='sm'>
          MA
        </Avatar>
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography level='title-sm' noWrap>
            Mohammed
          </Typography>
          <Typography level='body-xs' sx={{ color: 'text.secondary' }}>
            Family admin
          </Typography>
        </Box>
        <AccountCircleRounded sx={{ color: 'text.tertiary' }} />
      </Stack>
    </Box>
  </Stack>
)

const TopBar = ({
  brandId,
  colorMode,
  direction,
  onBrandChange,
  onDirectionChange,
  onMenuOpen,
  onModeChange,
  page,
}) => (
  <Box
    component='header'
    sx={{
      position: 'sticky',
      top: 0,
      zIndex: 20,
      minHeight: 64,
      px: { xs: 1.5, sm: 3 },
      display: 'flex',
      alignItems: 'center',
      gap: 1.5,
      bgcolor: 'background.body',
      borderBottom: '1px solid',
      borderColor: 'divider',
      backdropFilter: 'blur(12px)',
    }}
  >
    <IconButton
      className='reference-mobile-only'
      variant='plain'
      onClick={onMenuOpen}
      aria-label='Open navigation'
    >
      <MenuRounded />
    </IconButton>
    <Typography
      level='title-md'
      sx={{ flex: 1, display: { xs: 'none', sm: 'block' } }}
    >
      {PAGE_LABELS[page]}
    </Typography>
    <Box sx={{ flex: 1, display: { xs: 'block', sm: 'none' } }} />
    <Stack direction='row' spacing={0.75} alignItems='center'>
      <Select
        size='sm'
        value={brandId}
        onChange={(_, value) => value && onBrandChange(value)}
        startDecorator={<PaletteRounded fontSize='small' />}
        aria-label='Product brand'
        sx={{
          minWidth: { xs: 44, sm: 140 },
          '& button': { px: { xs: 0, sm: 1 } },
        }}
        slotProps={{
          button: {
            sx: {
              '& > span:not(.MuiSelect-startDecorator)': {
                display: { xs: 'none', sm: 'inline' },
              },
            },
          },
        }}
      >
        <Option value='dydan'>Dydan</Option>
        <Option value='sovereign'>Sovereign</Option>
      </Select>
      <Tooltip
        title={
          direction === 'rtl'
            ? 'Switch to English / LTR'
            : 'Switch to Arabic / RTL'
        }
      >
        <IconButton
          size='sm'
          variant='outlined'
          onClick={() => onDirectionChange(direction === 'rtl' ? 'ltr' : 'rtl')}
          aria-label='Toggle text direction'
        >
          <LanguageRounded />
        </IconButton>
      </Tooltip>
      <Tooltip
        title={colorMode === 'dark' ? 'Use light mode' : 'Use dark mode'}
      >
        <IconButton
          size='sm'
          variant='outlined'
          onClick={() => onModeChange(colorMode === 'dark' ? 'light' : 'dark')}
          aria-label='Toggle color mode'
        >
          {colorMode === 'dark' ? <LightModeRounded /> : <DarkModeRounded />}
        </IconButton>
      </Tooltip>
      <Tooltip title='Notifications'>
        <IconButton size='sm' variant='plain' aria-label='Notifications'>
          <Badge badgeContent={3} color='danger' size='sm'>
            <NotificationsRounded />
          </Badge>
        </IconButton>
      </Tooltip>
      <Avatar className='reference-member-avatar' data-member='1' size='sm'>
        MA
      </Avatar>
    </Stack>
  </Box>
)

const ReferenceExperience = ({
  brandId,
  colorMode,
  direction,
  setBrandId,
  setColorMode,
  setDirection,
}) => {
  const [page, setPage] = useState('dashboard')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const brand = getReferenceBrand(brandId)
  const { setMode } = useColorScheme()

  useEffect(() => {
    setMode(colorMode)
  }, [colorMode, setMode])

  const navigate = next => {
    setPage(next)
    setDrawerOpen(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <Box className='reference-shell'>
      <Box
        component='aside'
        className='reference-sidebar'
        sx={{
          width: NAV_DRAWER_WIDTH,
          bgcolor: 'background.surface',
          borderInlineEnd: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Navigation activePage={page} brand={brand} onNavigate={navigate} />
      </Box>
      <Box className='reference-main'>
        <TopBar
          brandId={brandId}
          colorMode={colorMode}
          direction={direction}
          page={page}
          onBrandChange={setBrandId}
          onDirectionChange={setDirection}
          onMenuOpen={() => setDrawerOpen(true)}
          onModeChange={setColorMode}
        />
        <ReferenceScreen page={page} brand={brand} onNavigate={navigate} />
      </Box>
      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        anchor={direction === 'rtl' ? 'right' : 'left'}
        slotProps={{
          content: {
            sx: {
              width: 'min(88vw, 320px)',
              bgcolor: 'background.surface',
              borderRadius: 0,
            },
          },
        }}
      >
        <IconButton
          onClick={() => setDrawerOpen(false)}
          aria-label='Close navigation'
          sx={{ position: 'absolute', top: 12, insetInlineEnd: 12, zIndex: 1 }}
        >
          <CloseRounded />
        </IconButton>
        <Navigation activePage={page} brand={brand} onNavigate={navigate} />
      </Drawer>
    </Box>
  )
}

export default function ReferenceApp() {
  const [brandId, setBrandId] = useState('dydan')
  const [colorMode, setColorMode] = useState('light')
  const [direction, setDirection] = useState('ltr')
  const theme = useMemo(() => getReferenceTheme(brandId), [brandId])
  const globalStyles = useMemo(
    () => getReferenceGlobalStyles(brandId),
    [brandId],
  )

  useEffect(() => {
    const language = direction === 'rtl' ? 'ar-SA' : 'en'
    document.documentElement.dir = resolveReferenceDirection(language)
    document.documentElement.lang = language
    document.title = `${getReferenceBrand(brandId).name} · Product design reference`
  }, [brandId, direction])

  return (
    <CssVarsProvider
      key={brandId}
      theme={theme}
      defaultMode={colorMode}
      modeStorageKey='dydan-reference-color-mode'
    >
      <CssBaseline />
      <GlobalStyles styles={globalStyles} />
      <ReferenceExperience
        brandId={brandId}
        colorMode={colorMode}
        direction={direction}
        setBrandId={setBrandId}
        setColorMode={setColorMode}
        setDirection={setDirection}
      />
    </CssVarsProvider>
  )
}
