import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import type { ApiProfile } from '../model/api'
import { parseAccountResponse } from '../utils/AccountResponse'
import * as Fetcher from '../utils/Fetcher'
import { getAccessToken } from '../utils/TokenStorage'
import { KEYS, parseRes } from './useHousehold'

export type AuthSession = {
  id: string
  current: boolean
  createdAt: string
  lastActiveAt: string
  expiresAt: string
  device?: string
  location?: string
}

export type MFASetup = {
  secret: string
  qrCodeUrl: string
  backupCodes: string[]
}

type MFAStatus = { mfaEnabled: boolean }
type SubscriptionCheckout = { sessionURL: string }
type ProfilePhotoUpload = { sign: string }

export type UserCircle = {
  id: number
  name: string
  invite_code?: string
  inviteCode?: string
}

const accountKeys = {
  mfa: ['account', 'mfa'] as const,
  sessions: ['account', 'sessions'] as const,
  circles: ['account', 'circles'] as const,
}

const enabled = () => Boolean(getAccessToken())

const parseBody = <T>(response: Promise<Response>) =>
  parseAccountResponse(response) as Promise<T>

export function useMFAStatus() {
  return useQuery({
    queryKey: accountKeys.mfa,
    queryFn: () => parseBody<MFAStatus>(Fetcher.GetMFAStatus()),
    enabled: enabled(),
  })
}

export function useAuthSessions() {
  return useQuery({
    queryKey: accountKeys.sessions,
    queryFn: async () => {
      const body = await parseBody<{ sessions?: AuthSession[] }>(
        Fetcher.GetAuthSessions(),
      )
      if (!Array.isArray(body.sessions)) {
        throw new Error('The server returned an invalid session list')
      }
      return body.sessions
    },
    enabled: enabled(),
    refetchOnMount: 'always',
  })
}

export function useUserCircles() {
  return useQuery({
    queryKey: accountKeys.circles,
    queryFn: () => parseRes<UserCircle[]>(Fetcher.GetUserCircle()),
    enabled: enabled(),
  })
}

/** Real account, security, team, and subscription mutations for Settings. */
export function useAccountSettingsMutations() {
  const client = useQueryClient()
  const refreshProfile = () =>
    client.invalidateQueries({ queryKey: KEYS.profile })
  const refreshMembers = () =>
    client.invalidateQueries({ queryKey: KEYS.members })
  const refreshCircles = () =>
    client.invalidateQueries({ queryKey: accountKeys.circles })
  const refreshMFA = () =>
    client.invalidateQueries({ queryKey: accountKeys.mfa })
  const refreshSessions = () =>
    client.invalidateQueries({ queryKey: accountKeys.sessions })

  const updateProfile = useMutation({
    mutationFn: (
      details: Partial<Pick<ApiProfile, 'displayName' | 'timezone'>>,
    ) => parseRes<ApiProfile>(Fetcher.UpdateUserDetails(details)),
    onSuccess: refreshProfile,
  })

  const uploadProfilePhoto = useMutation({
    mutationFn: (file: File) =>
      parseBody<ProfilePhotoUpload>(Fetcher.UploadProfilePhoto(file)),
    onSuccess: photo => {
      client.setQueryData<ApiProfile | undefined>(KEYS.profile, profile =>
        profile ? { ...profile, image: photo.sign } : profile,
      )
      refreshProfile()
    },
  })

  const changePassword = useMutation({
    mutationFn: ({
      currentPassword,
      newPassword,
    }: {
      currentPassword: string
      newPassword: string
    }) => parseBody(Fetcher.UpdatePassword(currentPassword, newPassword)),
    onSuccess: refreshSessions,
  })

  const startEmailChange = useMutation({
    mutationFn: ({
      currentPassword,
      email,
    }: {
      email: string
      currentPassword: string
    }) =>
      parseBody<{ message: string; expiresInSeconds: number }>(
        Fetcher.StartEmailChange({ email, currentPassword }),
      ),
  })

  const setupMFA = useMutation({
    mutationFn: () => parseBody<MFASetup>(Fetcher.SetupMFA()),
  })

  const confirmMFA = useMutation({
    mutationFn: ({ backupCodes, code, secret }: MFASetup & { code: string }) =>
      parseBody(Fetcher.ConfirmMFA(secret, code, backupCodes)),
    onSuccess: () => {
      refreshMFA()
      refreshProfile()
      refreshSessions()
    },
  })

  const disableMFA = useMutation({
    mutationFn: (code: string) => parseBody(Fetcher.DisableMFA(code)),
    onSuccess: () => {
      refreshMFA()
      refreshProfile()
      refreshSessions()
    },
  })

  const regenerateBackupCodes = useMutation({
    mutationFn: (code: string) =>
      parseBody<{ backupCodes: string[] }>(Fetcher.RegenerateBackupCodes(code)),
  })

  const revokeSession = useMutation({
    mutationFn: (sessionID: string) =>
      parseBody(Fetcher.RevokeAuthSession(sessionID)),
    onSuccess: refreshSessions,
  })

  const revokeOtherSessions = useMutation({
    mutationFn: () => parseBody(Fetcher.RevokeOtherAuthSessions()),
    onSuccess: refreshSessions,
  })

  const updateCircle = useMutation({
    mutationFn: (name: string) => parseBody(Fetcher.UpdateCircleSettings(name)),
    onSuccess: () => {
      refreshProfile()
      refreshMembers()
      refreshCircles()
    },
  })

  const regenerateInviteCode = useMutation({
    mutationFn: () =>
      parseBody<{ inviteCode?: string; invite_code?: string }>(
        Fetcher.RegenerateCircleInviteCode(),
      ),
  })

  const removeMember = useMutation({
    mutationFn: ({
      circleID,
      memberID,
    }: {
      circleID: number
      memberID: number
    }) => parseBody(Fetcher.DeleteCircleMember(circleID, memberID)),
    onSuccess: refreshMembers,
  })

  const leaveCircle = useMutation({
    mutationFn: (circleID: number) => parseBody(Fetcher.LeaveCircle(circleID)),
    onSuccess: () => {
      refreshProfile()
      refreshMembers()
      refreshCircles()
    },
  })

  const joinCircle = useMutation({
    mutationFn: (inviteCode: string) =>
      parseBody(Fetcher.JoinCircle(inviteCode)),
    onSuccess: () => {
      refreshProfile()
      refreshMembers()
      refreshCircles()
    },
  })

  const startSubscriptionCheckout = useMutation({
    mutationFn: () =>
      parseBody<SubscriptionCheckout>(Fetcher.GetSubscriptionSession()),
  })

  const cancelSubscription = useMutation({
    mutationFn: () => parseBody(Fetcher.CancelSubscription()),
    onSuccess: refreshProfile,
  })

  const checkAccountDeletion = useMutation({
    mutationFn: (password: string) =>
      parseBody(Fetcher.CheckUserDeletion(password)),
  })

  const deleteAccount = useMutation({
    mutationFn: ({
      password,
      transferOptions = [],
    }: {
      password: string
      transferOptions?: unknown[]
    }) => parseBody(Fetcher.DeleteUser(password, 'DELETE', transferOptions)),
  })

  return {
    cancelSubscription,
    changePassword,
    checkAccountDeletion,
    confirmMFA,
    deleteAccount,
    disableMFA,
    joinCircle,
    leaveCircle,
    regenerateBackupCodes,
    regenerateInviteCode,
    removeMember,
    revokeOtherSessions,
    revokeSession,
    setupMFA,
    startEmailChange,
    startSubscriptionCheckout,
    updateCircle,
    updateProfile,
    uploadProfilePhoto,
  }
}
