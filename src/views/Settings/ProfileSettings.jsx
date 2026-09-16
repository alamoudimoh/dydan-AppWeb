import {
  Autocomplete,
  Avatar,
  Box,
  Button,
  Card,
  Input,
  Typography,
} from '@mui/joy'
import { useQueryClient } from '@tanstack/react-query'
import imageCompression from 'browser-image-compression'
import { useRef, useState } from 'react'
import Cropper from 'react-easy-crop'
import { useTranslation } from 'react-i18next'

import AppModal from '../../components/common/AppModal'
import ModalActions from '../../components/common/ModalActions'
import AccountIdentityCard from '../../components/settings/AccountIdentityCard'
import AccountSessionsCard from '../../components/settings/AccountSessionsCard'
import SettingsQueryStateView from '../../components/settings/SettingsQueryStateView'
import { useLocalization } from '../../contexts/LocalizationContext'
import { useCircleMembers, useUserProfile } from '../../queries/UserQueries'
import { useNotification } from '../../service/NotificationProvider'
import { formStackSx, sectionCardSx } from '../../theme/appLayout'
import { apiClient } from '../../utils/ApiClient'
import { UpdatePassword, UpdateUserDetails } from '../../utils/Fetcher'
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
  resolveSettingsQueryState,
  SETTINGS_QUERY_STATE,
} from '../../utils/SettingsQueryState'
import LoadingComponent from '../components/Loading'
import PassowrdChangeModal from '../Modals/Inputs/PasswordChangeModal'
import UserDeletionModal from '../Modals/Inputs/UserDeletionModal'
import SettingsLayout from './SettingsLayout'

const ProfileSettingsForm = ({
  circleMembers,
  intlLocale,
  refetchUserProfile,
  userProfile,
}) => {
  const { t } = useTranslation('settings')
  const queryClient = useQueryClient()
  const { showError, showSuccess } = useNotification()
  const initialForm = initialProfileForm(userProfile)
  const [displayName, setDisplayName] = useState(initialForm.displayName)
  const [timezone, setTimezone] = useState(initialForm.timezone)
  const [isUploading, setIsUploading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [changePasswordModal, setChangePasswordModal] = useState(false)
  const [userDeletionModal, setUserDeletionModal] = useState(false)
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
  const isSelfHosted = import.meta.env.VITE_IS_SELF_HOSTED === 'true'

  // Get available timezones
  const timezones = supportedTimezones()

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

      console.log(`Original size: ${(croppedBlob.size / 1024).toFixed(2)} KB`)
      console.log(
        `Compressed size: ${(compressedFile.size / 1024).toFixed(2)} KB`,
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
      console.log(err)

      showError({
        title: t('profile.updateFailed'),
        message: err.message || t('profile.updateFailedMessage'),
      })
    } finally {
      setIsSaving(false)
    }
  }

  // Helper to resolve photoURL with baseURL if needed

  return (
    <SettingsLayout title={t('profile.title')}>
      <Box sx={formStackSx} id='profile'>
        <Typography level='body-md'>{t('profile.description')}</Typography>
        <AccountIdentityCard
          profile={userProfile}
          circleMembers={circleMembers}
        />
        <Card
          sx={{
            ...sectionCardSx,
            flexDirection: 'row',
            alignItems: 'center',
            maxWidth: 400,
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
          </Box>
        </Card>
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
        <Box sx={{ maxWidth: 400, mt: 3 }}>
          <Typography level='body-sm' sx={{ mb: 0.5 }}>
            {t('profile.displayName')}
          </Typography>
          <Input
            value={displayName}
            onChange={e => setDisplayName(e.target.value)}
            placeholder={t('profile.displayNamePlaceholder')}
            sx={{ mb: 2 }}
          />

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
            sx={{ mb: 2 }}
          />

          <Button
            variant='soft'
            color='primary'
            onClick={handleSave}
            loading={isSaving}
            sx={{ width: 120 }}
          >
            {t('profile.save')}
          </Button>
        </Box>

        {canManageAccount && (
          <>
            <Box sx={{ mt: 4 }}>
              <Typography level='title-md' mb={0.5}>
                {t('profile.security')}
              </Typography>
              <Typography level='body-sm' sx={{ color: 'text.secondary' }}>
                {t('profile.securityDescription')}
              </Typography>
            </Box>
            {isSelfHosted && (
              <Card sx={{ ...sectionCardSx, maxWidth: 400 }}>
                <Typography level='title-sm' mb={0.5}>
                  {t('accountSettings.password')}
                </Typography>
                <Typography level='body-sm' mb={2} sx={{ opacity: 0.85 }}>
                  {t('profile.passwordHelp')}
                </Typography>
                <Button
                  variant='soft'
                  onClick={() => setChangePasswordModal(true)}
                >
                  {t('accountSettings.changePassword')}
                </Button>
              </Card>
            )}
            <AccountSessionsCard userId={userProfile.id} />
            <Card
              sx={{
                ...sectionCardSx,
                maxWidth: 400,
                bgcolor: 'danger.softBg',
              }}
            >
              <Typography level='title-md' mb={1} color='danger'>
                {t('accountSettings.dangerZone')}
              </Typography>
              <Typography level='body-sm' mb={2} color='neutral'>
                {t('accountSettings.dangerZoneDescription')}
              </Typography>
              <Button
                variant='outlined'
                color='danger'
                onClick={() => setUserDeletionModal(true)}
              >
                {t('accountSettings.deleteAccount')}
              </Button>
            </Card>
          </>
        )}
      </Box>

      {canManageAccount &&
        (changePasswordModal ? (
          <PassowrdChangeModal
            isOpen={changePasswordModal}
            onClose={({ currentPassword, password } = {}) => {
              if (password && currentPassword) {
                UpdatePassword(currentPassword, password).then(resp => {
                  if (resp.ok) {
                    showSuccess({
                      title: t('accountSettings.changePassword'),
                      message: t('profile.passwordChanged'),
                    })
                  } else if (resp.status === 403) {
                    showError({
                      title: t('accountSettings.changePassword'),
                      message: t('profile.wrongCurrentPassword'),
                    })
                  } else {
                    showError({
                      title: t('accountSettings.changePassword'),
                      message: t('profile.passwordChangeFailed'),
                    })
                  }
                })
              }
              setChangePasswordModal(false)
            }}
          />
        ) : null)}

      {canManageAccount && (
        <UserDeletionModal
          isOpen={userDeletionModal}
          onClose={success => {
            setUserDeletionModal(false)
            if (success) {
              showSuccess({
                title: t('accountSettings.deleteAccount'),
                message: t('profile.accountDeleted'),
              })
            }
          }}
        />
      )}
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
