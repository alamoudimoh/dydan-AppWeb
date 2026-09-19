import {
  Autocomplete,
  Avatar,
  Box,
  Button,
  Card,
  Chip,
  Divider,
  Input,
  Typography,
} from '@mui/joy'
import { useQueryClient } from '@tanstack/react-query'
import imageCompression from 'browser-image-compression'
import { useRef, useState } from 'react'
import Cropper from 'react-easy-crop'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

import AppModal from '../../components/common/AppModal'
import ModalActions from '../../components/common/ModalActions'
import FigmaIcon from '../../components/FigmaIcon'
import SettingsQueryStateView from '../../components/settings/SettingsQueryStateView'
import { useLocalization } from '../../contexts/LocalizationContext'
import { useCircleMembers, useUserProfile } from '../../queries/UserQueries'
import { useNotification } from '../../service/NotificationProvider'
import { formStackSx, sectionCardSx } from '../../theme/appLayout'
import { buildAccountIdentity } from '../../utils/AccountIdentity'
import { apiClient } from '../../utils/ApiClient'
import { UpdateUserDetails } from '../../utils/Fetcher'
import { resolvePhotoURL } from '../../utils/Helpers'
import { getCroppedImg } from '../../utils/imageCropUtils'
import {
  hasPermission,
  PERMISSIONS,
  resolveEffectiveRole,
} from '../../utils/PermissionModel'
import { initialProfileForm } from '../../utils/ProfileFormState'
import {
  isValidIanaTimezone,
  supportedTimezones,
} from '../../utils/SchedulingDate'
import {
  getPrivacyPreference,
  PRIVACY_PREFERENCES,
} from '../../utils/SettingsPrivacy'
import {
  resolveSettingsQueryState,
  SETTINGS_QUERY_STATE,
} from '../../utils/SettingsQueryState'
import LoadingComponent from '../components/Loading'
import SettingsLayout from './SettingsLayout'

const WhoCanSeeLink = ({ label = null }) => {
  const { t } = useTranslation('settings')
  const navigate = useNavigate()
  return (
    <Button
      variant='plain'
      size='sm'
      color='neutral'
      onClick={() => navigate('/settings/privacy')}
      sx={{ px: 0, minHeight: 28, alignSelf: 'flex-start' }}
    >
      <FigmaIcon
        name='eye'
        size={14}
        style={{ color: 'var(--t-muted)', marginInlineEnd: 6 }}
      />
      {label || t('profile.whoCanSee')}
    </Button>
  )
}

const ProfilePreviewCard = ({
  displayName,
  identity,
  intlLocale,
  profile,
  showEmail,
  showTimezone,
  timezone,
}) => {
  const { t } = useTranslation('settings')
  const memberSince = profile?.created_at
    ? new Intl.DateTimeFormat(intlLocale, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }).format(new Date(profile.created_at))
    : null

  return (
    <Card
      sx={{ ...sectionCardSx, maxWidth: 440 }}
      data-testid='profile-preview-card'
    >
      <Typography level='title-sm' sx={{ mb: 0.25 }}>
        {t('profile.preview')}
      </Typography>
      <Typography level='body-sm' sx={{ opacity: 0.85 }}>
        {t('profile.previewHelp')}
      </Typography>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          marginTop: 14,
        }}
      >
        <Avatar
          src={resolvePhotoURL(profile?.image)}
          sx={{ width: 72, height: 72, flexShrink: 0 }}
        />
        <div style={{ minWidth: 0 }}>
          <Typography level='title-lg' sx={{ overflowWrap: 'anywhere' }}>
            {displayName.trim() || profile?.displayName?.trim() || '—'}
          </Typography>
          {identity.username && (
            <Typography level='body-sm' sx={{ color: 'text.secondary' }}>
              @{identity.username}
            </Typography>
          )}
          <div
            style={{
              display: 'flex',
              gap: 8,
              marginTop: 8,
              flexWrap: 'wrap',
            }}
          >
            <Chip variant='soft' size='sm'>
              {t(`profile.accountIdentity.roles.${identity.effectiveRoleKey}`)}
            </Chip>
            {showTimezone && timezone && (
              <Chip variant='outlined' size='sm'>
                {String(timezone).replace(/_/g, ' ')}
              </Chip>
            )}
            {memberSince && (
              <Chip variant='outlined' size='sm'>
                {`${t('profile.memberSince')} ${memberSince}`}
              </Chip>
            )}
          </div>
        </div>
      </div>

      {showEmail && identity.email && (
        <Typography level='body-sm' sx={{ mt: 1.5, opacity: 0.85 }}>
          {identity.email}
        </Typography>
      )}
    </Card>
  )
}

const ProfileSettingsForm = ({
  circleMembers,
  intlLocale,
  refetchUserProfile,
  userProfile,
}) => {
  const { t } = useTranslation('settings')
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const { showError, showSuccess } = useNotification()
  const initialForm = initialProfileForm(userProfile)
  const [displayName, setDisplayName] = useState(initialForm.displayName)
  const [timezone, setTimezone] = useState(initialForm.timezone)
  const [isUploading, setIsUploading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const fileInputRef = useRef()
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null)
  const [showCropper, setShowCropper] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)
  const canManageAccount = hasPermission(
    resolveEffectiveRole(userProfile, circleMembers),
    PERMISSIONS.MANAGE_ACCOUNT,
  )

  // Live privacy defaults (the Privacy page owns these toggles).
  const showTimezone = getPrivacyPreference(PRIVACY_PREFERENCES.showTimezone)
  const showEmail = getPrivacyPreference(PRIVACY_PREFERENCES.showEmail)

  const timezones = supportedTimezones()
  const identity = buildAccountIdentity(userProfile, circleMembers)

  const onCropComplete = (croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels)
  }

  const handlePhotoChange = e => {
    const file = e.target.files[0]
    if (!file) return
    setSelectedFile(URL.createObjectURL(file))
    setShowCropper(true)
  }

  const handleCropSave = async () => {
    setIsUploading(true)
    try {
      const croppedBlob = await getCroppedImg(
        selectedFile,
        croppedAreaPixels,
        160,
        160,
        'image/jpeg',
      )

      // Compress the cropped image
      const compressionOptions = {
        maxSizeMB: 0.02, // Smaller size for profile images
        maxWidthOrHeight: 160, // Match the cropped dimensions
        useWebWorker: true,
        fileType: 'image/jpeg',
        initialQuality: 0.8,
      }

      const compressedFile = await imageCompression(
        croppedBlob,
        compressionOptions,
      )

      const formData = new FormData()
      formData.append('file', compressedFile, 'profile.jpg')
      const response = await apiClient.upload('/users/profile_photo', formData)
      if (!response.ok) throw new Error('Upload failed')
      await response.json()

      refetchUserProfile() // Refresh user profile to get the new photoURL
      showSuccess({
        title: t('profile.photoUpdated'),
        message: t('profile.photoUpdatedMessage'),
      })
    } catch (err) {
      showError({
        title: t('profile.uploadFailed'),
        message: t('profile.uploadFailedMessage'),
      })
    } finally {
      setIsUploading(false)
      setShowCropper(false)
      setSelectedFile(null)
    }
  }

  const handleSave = async () => {
    if (!isValidIanaTimezone(timezone)) {
      showError({
        title: t('profile.updateFailed'),
        message: 'Choose a valid timezone.',
      })
      return
    }
    setIsSaving(true)
    try {
      const userDetails = { displayName, timezone }
      const response = await UpdateUserDetails(userDetails)
      // invalidate user profile cache here if using react-query or similar:
      queryClient.invalidateQueries(['userProfile'])
      queryClient.refetchQueries(['userProfile'])

      if (response.ok) {
        showSuccess({
          title: t('profile.profileUpdated'),
          message: t('profile.profileUpdatedMessage'),
        })
      } else {
        const body = await response.json().catch(() => ({}))
        throw new Error(body.error || 'Failed to update profile')
      }
    } catch (err) {
      showError({
        title: t('profile.updateFailed'),
        message: err.message || t('profile.updateFailedMessage'),
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <SettingsLayout title={t('profile.title')}>
      <Box sx={formStackSx} id='profile'>
        <Typography level='body-md'>{t('profile.description')}</Typography>

        <ProfilePreviewCard
          displayName={displayName}
          identity={identity}
          intlLocale={intlLocale}
          profile={userProfile}
          showEmail={showEmail}
          showTimezone={showTimezone}
          timezone={timezone}
        />

        <Card sx={{ ...sectionCardSx, maxWidth: 440 }}>
          <Typography level='title-sm' sx={{ mb: 0.25 }}>
            {t('profile.identitySection')}
          </Typography>
          <Typography level='body-sm' sx={{ mb: 2, opacity: 0.85 }}>
            {t('profile.identityDescription')}
          </Typography>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              marginBottom: 12,
            }}
          >
            <Avatar
              src={resolvePhotoURL(userProfile?.image)}
              sx={{ width: 64, height: 64 }}
            />
            <Box sx={{ flex: 1 }}>
              <Button
                variant='soft'
                color='primary'
                onClick={() => fileInputRef.current.click()}
                loading={isUploading}
                sx={{ mb: 1 }}
              >
                {t('profile.changePhoto')}
              </Button>
              <input
                ref={fileInputRef}
                type='file'
                accept='image/*'
                style={{ display: 'none' }}
                onChange={handlePhotoChange}
              />
              <WhoCanSeeLink />
            </Box>
          </div>

          <Divider sx={{ mb: 2 }} />

          <Box sx={{ flexDirection: 'column', display: 'flex', gap: 1.5 }}>
            <div>
              <Typography level='body-sm' sx={{ mb: 0.5 }}>
                {t('profile.displayName')}
              </Typography>
              <Input
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                placeholder={t('profile.displayNamePlaceholder')}
              />
            </div>

            <div>
              <Typography level='body-sm' sx={{ mb: 0.5 }}>
                {t('profile.handle')}
              </Typography>
              <Input
                value={identity.username || ''}
                readOnly
                variant='soft'
                startDecorator='@'
              />
              <Typography level='body-xs' sx={{ mt: 0.5, opacity: 0.75 }}>
                {t('profile.handleHelp')}
              </Typography>
            </div>

            <div>
              <Typography level='body-sm' sx={{ mb: 0.5 }}>
                {t('profile.email')}
              </Typography>
              <Input value={identity.email || ''} readOnly variant='soft' />
              <Typography level='body-xs' sx={{ mt: 0.5, opacity: 0.75 }}>
                {t('profile.emailHelp')}
              </Typography>
            </div>

            <div>
              <Typography level='body-sm' sx={{ mb: 0.5 }}>
                {t('profile.role')}
              </Typography>
              <Input
                value={t(
                  `profile.accountIdentity.roles.${identity.effectiveRoleKey}`,
                )}
                readOnly
                variant='soft'
              />
              <Typography level='body-xs' sx={{ mt: 0.5, opacity: 0.75 }}>
                {t('profile.roleHelp')}
              </Typography>
            </div>

            <div>
              <Typography level='body-sm' sx={{ mb: 0.5 }}>
                {t('profile.timezone')}
              </Typography>
              <Autocomplete
                value={timezone}
                onChange={(e, newValue) => setTimezone(newValue)}
                options={timezones}
                getOptionLabel={tz => {
                  const formattedTimezone = tz.replace(/_/g, ' ')
                  const currentTime = new Date().toLocaleString(intlLocale, {
                    timeZone: tz,
                    timeStyle: 'short',
                  })
                  return `${formattedTimezone} (${currentTime})`
                }}
                filterOptions={(options, { inputValue }) => {
                  if (!inputValue) return options

                  const searchTerms = inputValue.toLowerCase().split(/\s+/)
                  return options.filter(tz => {
                    const timezoneLower = tz.toLowerCase()
                    const timezoneParts = tz.toLowerCase().split(/[/_]/)

                    return searchTerms.every(
                      term =>
                        timezoneLower.includes(term) ||
                        timezoneParts.some(part => part.includes(term)),
                    )
                  })
                }}
                placeholder={t('profile.timezonePlaceholder')}
              />
            </div>

            <WhoCanSeeLink />
          </Box>

          <Button
            variant='soft'
            color='primary'
            onClick={handleSave}
            loading={isSaving}
            sx={{ width: 120, mt: 2 }}
          >
            {t('profile.save')}
          </Button>
        </Card>

        {canManageAccount && (
          <Card
            sx={{
              ...sectionCardSx,
              maxWidth: 440,
              bgcolor: 'background.surface',
            }}
          >
            <Typography level='title-sm' sx={{ mb: 0.25 }}>
              {t('profile.securityMoved')}
            </Typography>
            <Typography level='body-sm' sx={{ mb: 1.5, opacity: 0.85 }}>
              {t('profile.securityMovedHelp')}
            </Typography>
            <Button
              variant='soft'
              color='neutral'
              startDecorator={
                <FigmaIcon
                  name='lock'
                  size={16}
                  style={{ color: 'var(--t-muted)' }}
                />
              }
              onClick={() => navigate('/settings/security')}
            >
              {t('profile.openSecurity')}
            </Button>
          </Card>
        )}
      </Box>

      <AppModal
        open={showCropper}
        onClose={() => {
          setShowCropper(false)
          setSelectedFile(null)
        }}
        title={t('profile.editPhoto', { defaultValue: 'Edit profile photo' })}
        size='sm'
        closeOnBackdrop={!isUploading}
        closeOnEscape={!isUploading}
        footer={
          <ModalActions
            secondary={{
              label: t('profile.cancel'),
              disabled: isUploading,
              onClick: () => {
                setShowCropper(false)
                setSelectedFile(null)
              },
            }}
            primary={{
              label: t('profile.save'),
              loading: isUploading,
              onClick: handleCropSave,
            }}
          />
        }
      >
        <Box
          sx={{
            width: '100%',
            maxWidth: 320,
            aspectRatio: '1',
            position: 'relative',
            mx: 'auto',
          }}
        >
          <Cropper
            image={selectedFile}
            crop={crop}
            zoom={zoom}
            aspect={1}
            cropShape='round'
            showGrid={false}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />
        </Box>
      </AppModal>
    </SettingsLayout>
  )
}

const ProfileSettings = () => {
  const { t } = useTranslation('settings')
  const { intlLocale } = useLocalization()
  const { data: userProfile, error, isLoading, refetch } = useUserProfile()
  const { data: membersData } = useCircleMembers()
  const circleMembers = membersData?.res || []
  const profileState = resolveSettingsQueryState({
    isLoading,
    isError: Boolean(error),
    hasData: Boolean(userProfile),
  })

  if (profileState === SETTINGS_QUERY_STATE.LOADING) {
    return <LoadingComponent />
  }

  if (profileState === SETTINGS_QUERY_STATE.ERROR) {
    return (
      <SettingsLayout title={t('profile.title')}>
        <SettingsQueryStateView
          onRetry={() => refetch()}
          description={error?.message}
        />
      </SettingsLayout>
    )
  }

  return (
    <ProfileSettingsForm
      key={userProfile.id}
      userProfile={userProfile}
      circleMembers={circleMembers}
      intlLocale={intlLocale}
      refetchUserProfile={refetch}
    />
  )
}

export default ProfileSettings
