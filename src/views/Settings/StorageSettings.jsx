import { Capacitor } from '@capacitor/core'
import { Box, Button, Card, Chip, LinearProgress, Typography } from '@mui/joy'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

import SettingsQueryStateView from '../../components/settings/SettingsQueryStateView'
import { useUserProfile } from '../../queries/UserQueries'
import { formStackSx, sectionCardSx } from '../../theme/appLayout'
import { GetStorageUsage } from '../../utils/Fetcher'
import { isPlusAccount } from '../../utils/Helpers'
import ConfirmationModal from '../Modals/Inputs/ConfirmationModal'
import SettingsLayout from './SettingsLayout'

const StorageSettings = () => {
  const { t } = useTranslation('common')
  const Navigate = useNavigate()
  const { data: userProfile } = useUserProfile()
  const [usage, setUsage] = useState({ used: 0, total: 0 })
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)
  const [confirmModalConfig, setConfirmModalConfig] = useState({})

  const showConfirmation = (
    message,
    title,
    onConfirm,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    color = 'primary',
  ) => {
    setConfirmModalConfig({
      isOpen: true,
      message,
      title,
      confirmText,
      cancelText,
      color,
      onClose: isConfirmed => {
        if (isConfirmed) {
          onConfirm()
        }
        setConfirmModalConfig({})
      },
    })
  }

  const loadUsage = async () => {
    if (!isPlusAccount(userProfile)) {
      setLoading(false)
      setLoadError(null)
      return
    }

    setLoading(true)
    setLoadError(null)
    try {
      const resp = await GetStorageUsage()
      const data = await resp.json().catch(() => ({}))
      if (!resp.ok) {
        throw new Error(data?.error || 'Failed to load storage usage')
      }
      setUsage(data.res || { used: 0, total: 0 })
    } catch (err) {
      setLoadError(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUsage()
  }, [userProfile])

  const percent =
    usage.total > 0 ? Math.round((usage.used / usage.total) * 100) : 0
  const usedMB = (usage.used / (1024 * 1024)).toFixed(2)
  const totalMB = (usage.total / (1024 * 1024)).toFixed(2)

  return (
    <SettingsLayout title='Storage Settings'>
      <Box sx={formStackSx} id='storage'>
        <Card sx={{ ...sectionCardSx, maxWidth: 500 }}>
          <Typography level='title-md' sx={{ mb: 1 }}>
            Server Storage Usage
            {!isPlusAccount(userProfile) && (
              <Chip variant='soft' color='warning' sx={{ ms: 1 }}>
                Plus Feature
              </Chip>
            )}
          </Typography>
          <Typography level='body-sm' sx={{ mb: 1 }}>
            This is the storage used by your account on our servers (e.g. files,
            images, and data you have uploaded).
          </Typography>
          {!isPlusAccount(userProfile) ? (
            <>
              <LinearProgress
                determinate
                value={0}
                sx={{
                  mb: 1,
                  opacity: 0.4,
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: 'var(--joy-palette-neutral-400)',
                  },
                }}
              />
              <Typography level='body-xs' sx={{ opacity: 0.6, mb: 1 }}>
                -- MB used / -- MB total (--)
              </Typography>
              <Typography level='body-sm' color='warning'>
                Server storage is not available in the Basic plan. Upgrade to
                Plus to track your server storage usage.
              </Typography>
            </>
          ) : loading ? (
            <>
              <LinearProgress sx={{ mb: 1 }} />
              <Typography level='body-xs'>{t('loading')}</Typography>
            </>
          ) : loadError ? (
            <SettingsQueryStateView onRetry={loadUsage} />
          ) : (
            <>
              <LinearProgress determinate value={percent} sx={{ mb: 1 }} />
              <Typography level='body-xs'>
                {usedMB} MB used / {totalMB} MB total ({percent}%)
              </Typography>
            </>
          )}
        </Card>

        <Card sx={{ ...sectionCardSx, maxWidth: 500 }}>
          <Typography level='title-md' sx={{ mb: 1 }}>
            {Capacitor.isNativePlatform() ? 'App' : 'Browser'} Local Storage &
            Cache
          </Typography>
          <Typography level='body-sm' sx={{ mb: 1 }}>
            This is data stored locally in your browser for faster access.
            Clearing this will not affect your server data, but may log you out.
          </Typography>
          <Button
            variant='soft'
            color='danger'
            onClick={() => {
              showConfirmation(
                'Are you sure you want to clear your local storage and cache? This will remove all your data from this browser and require login.',
                'Clear All Local Storage',
                () => {
                  localStorage.clear()
                  Navigate('/login')
                },
                'Clear All',
                'Cancel',
                'danger',
              )
            }}
          >
            Clear All Local Storage and Cache
          </Button>
        </Card>

        {Capacitor.isNativePlatform() && (
          <Card sx={{ ...sectionCardSx, maxWidth: 500 }}>
            <Typography level='title-md' sx={{ mb: 1 }}>
              App Preferences
              <Chip variant='soft' color='info' sx={{ ms: 1 }}>
                Device Only
              </Chip>
            </Typography>
            <Typography level='body-sm' sx={{ mb: 1 }}>
              These are preferences and settings stored locally on your device
              by the app. Clearing them will reset app-specific settings and may
              log you out, but will not affect your server data.
            </Typography>
            <Button
              variant='soft'
              color='danger'
              onClick={() => {
                showConfirmation(
                  'Are you sure you want to clear all app preferences? This will reset your app settings and may require you to log in again.',
                  'Clear App Preferences',
                  async () => {
                    try {
                      const { Preferences } =
                        await import('@capacitor/preferences')
                      await Preferences.clear()
                      Navigate('/login')
                    } catch (e) {
                      // Optionally show error feedback
                    }
                  },
                  'Clear Preferences',
                  'Cancel',
                  'danger',
                )
              }}
            >
              Clear App Preferences
            </Button>
          </Card>
        )}

        {/* Modals */}
        {confirmModalConfig?.isOpen && (
          <ConfirmationModal config={confirmModalConfig} />
        )}
      </Box>
    </SettingsLayout>
  )
}

export default StorageSettings
