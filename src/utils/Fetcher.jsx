import { apiClient } from './ApiClient'
import {
  chorePriorityEndpoint,
  completeChoreRequest,
} from './ChoreCompletionRequest'
import { createSingleFlight, ensureOperationId } from './SubmissionGuards'
import { getRefreshToken, isNative } from './TokenStorage'

const runCompletion = createSingleFlight()

// Migration helpers to maintain compatibility with existing code
const Fetch = async (endpoint, options = {}) => {
  // base on options.method, call the appropriate method on apiClient:
  switch (options.method) {
    case 'GET':
      return apiClient.get(endpoint, options)
    case 'POST':
      return apiClient.post(endpoint, options.body, options)
    case 'PUT':
      return apiClient.put(endpoint, options.body, options)
    case 'DELETE':
      return apiClient.delete(endpoint, options)
    default:
      return apiClient.request(endpoint, options)
  }
}

const HEADERS = () => {
  return apiClient.getHeaders()
}

const apiManager = {
  getApiURL: () => apiClient.getApiURL(),
}

const createChore = userID => {
  return Fetch(`/chores/`, {
    method: 'POST',
    headers: HEADERS(),
    body: JSON.stringify({
      createdBy: Number(userID),
    }),
  }).then(response => response.json())
}

const signUp = async (username, password, displayName, email) => {
  await apiClient.init(true)
  const baseURL = apiManager.getApiURL()
  return fetch(`${baseURL}/auth/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username, password, displayName, email }),
  })
}

const UpdatePassword = async (currentPassword, newPassword) => {
  await apiClient.init(true)
  const baseURL = apiManager.getApiURL()
  // The server verifies current_password before accepting a change and
  // revokes every other session afterwards.
  return fetch(`${baseURL}/users/change_password`, {
    method: 'PUT',
    headers: HEADERS(),
    body: JSON.stringify({
      password: newPassword,
      current_password: currentPassword,
    }),
  })
}

const login = async (username, password) => {
  await apiClient.init(true)
  const baseURL = apiManager.getApiURL()
  return fetch(`${baseURL}/auth/login`, {
    headers: {
      'Content-Type': 'application/json',
    },
    method: 'POST',
    body: JSON.stringify({ username, password }),
  })
}

const logout = async () => {
  await apiClient.init(true)
  const baseURL = apiManager.getApiURL()
  const nativePlatform = isNative()

  const config = {
    method: 'POST',
  }

  // Only use credentials for web, not for native apps
  if (!nativePlatform) {
    config.credentials = 'include'
  } else {
    const refreshToken = await getRefreshToken()
    if (refreshToken) {
      config.headers = { 'Content-Type': 'application/json' }
      config.body = JSON.stringify({ refresh_token: refreshToken })
    }
  }

  return fetch(`${baseURL}/auth/logout`, config)
}

const GetAllUsers = () => {
  return Fetch(`/users/`, {
    method: 'GET',
    headers: HEADERS(),
  })
}
const GetChoresNew = async includeArchived => {
  var url = `/chores/`
  if (includeArchived) {
    url += `?includeArchived=true`
  }

  const resp = await Fetch(url, {
    method: 'GET',
    headers: HEADERS(),
  })
  return resp.json()
}

const GetChores = () => {
  return Fetch(`/chores/`, {
    method: 'GET',
    headers: HEADERS(),
  })
}
const GetPersonalChores = async () => {
  const resp = await Fetch('/chores/?personal=true', {
    method: 'GET',
    headers: HEADERS(),
  })
  if (!resp.ok) throw new Error('Unable to load your tasks')
  return resp.json()
}
const GetCalendar = async (from, to) => {
  const params = new URLSearchParams({ from, to })
  const resp = await Fetch(`/chores/calendar?${params}`, {
    method: 'GET',
    headers: HEADERS(),
  })
  if (!resp.ok) throw new Error('Unable to load your calendar')
  return resp.json()
}
const GetArchivedChores = () => {
  return Fetch(`/chores/archived`, {
    method: 'GET',
    headers: HEADERS(),
  })
}
const ArchiveChore = id => {
  return Fetch(`/chores/${id}/archive`, {
    method: 'PUT',
    headers: HEADERS(),
  })
}
const UnArchiveChore = id => {
  return Fetch(`/chores/${id}/unarchive`, {
    method: 'PUT',
    headers: HEADERS(),
  })
}

const GetChoreByID = id => {
  return Fetch(`/chores/${id}`, {
    method: 'GET',
    headers: HEADERS(),
  })
}
const GetChoreDetailById = id => {
  return Fetch(`/chores/${id}/details`, {
    method: 'GET',
    headers: HEADERS(),
  })
}
const MarkChoreComplete = (id, body, completedDate, performer) => {
  const payload = ensureOperationId(body)
  const request = completeChoreRequest(id, payload, completedDate, performer)

  return runCompletion(id, () =>
    Fetch(request.endpoint, {
      method: 'POST',
      headers: HEADERS(),
      body: JSON.stringify(request.payload),
    }).then(response => {
      // Completion success is handled by the caller; offline completions are
      // queued and replayed by SubmissionGuards/ChoreCompletionRequest.
      return response
    }),
  )
}

const StartChore = id => {
  return Fetch(`/chores/${id}/start`, {
    method: 'PUT',
    headers: HEADERS(),
  })
}

const PauseChore = id => {
  return Fetch(`/chores/${id}/pause`, {
    method: 'PUT',
    headers: HEADERS(),
  })
}

const CompleteSubTask = (id, choreId, completedAt) => {
  var markChoreURL = `/chores/${choreId}/subtask`
  return Fetch(markChoreURL, {
    method: 'PUT',
    headers: HEADERS(),
    body: JSON.stringify({ completedAt, id, choreId }),
  })
}

const SkipChore = id => {
  return Fetch(`/chores/${id}/skip`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({}),
  })
}

const ApproveChore = id => {
  return Fetch(`/chores/${id}/approve`, {
    method: 'POST',
    headers: HEADERS(),
    body: JSON.stringify({}),
  })
}

const RejectChore = id => {
  return Fetch(`/chores/${id}/reject`, {
    method: 'POST',
    headers: HEADERS(),
    body: JSON.stringify({}),
  })
}

const UndoChoreAction = id => {
  return Fetch(`/chores/${id}/undo`, {
    method: 'POST',
    headers: HEADERS(),
    body: JSON.stringify({}),
  })
}

const NudgeChore = (id, { message, notifyAllAssignees }) => {
  return Fetch(`/chores/${id}/nudge`, {
    method: 'POST',
    headers: HEADERS(),
    body: JSON.stringify({
      all_assignees: notifyAllAssignees,
      message: message || '',
    }),
  })
}

const UpdateChoreAssignee = (id, assignee) => {
  return Fetch(`/chores/${id}/assignee`, {
    method: 'PUT',
    headers: HEADERS(),
    body: JSON.stringify({
      assignee: Number(assignee),
      updatedAt: new Date().toISOString(),
    }),
  })
}

const CreateChore = chore => {
  return Fetch(`/chores/`, {
    method: 'POST',
    headers: HEADERS(),
    body: JSON.stringify(chore),
  })
}

const DeleteChore = id => {
  return Fetch(`/chores/${id}`, {
    method: 'DELETE',
    headers: HEADERS(),
  })
}

const SaveChore = chore => {
  return Fetch(`/chores/`, {
    method: 'PUT',
    headers: HEADERS(),
    body: JSON.stringify(chore),
  })
}

const UpdateChorePriority = (id, priority) => {
  return Fetch(chorePriorityEndpoint(id), {
    method: 'PUT',
    headers: HEADERS(),
    body: JSON.stringify({ priority: priority }),
  })
}
const GetChoreHistory = choreId => {
  return Fetch(`/chores/${choreId}/history`, {
    method: 'GET',
    headers: HEADERS(),
  })
}
const DeleteChoreHistory = (choreId, id) => {
  return Fetch(`/chores/${choreId}/history/${id}`, {
    method: 'DELETE',
    headers: HEADERS(),
  })
}

const UpdateChoreHistory = (choreId, id, choreHistory) => {
  return Fetch(`/chores/${choreId}/history/${id}`, {
    method: 'PUT',
    headers: HEADERS(),
    body: JSON.stringify(choreHistory),
  })
}

const GetAllCircleMembers = async () => {
  const resp = await Fetch(`/circles/members`, {
    method: 'GET',
    headers: HEADERS(),
  })
  return resp.json()
}

const UpdateMemberRole = async (memberId, role) => {
  return Fetch(`/circles/members/role`, {
    method: 'PUT',
    headers: HEADERS(),
    body: JSON.stringify({ role, memberId }),
  })
}

const GetUserProfile = () => {
  return Fetch(`/users/profile`, {
    method: 'GET',
    headers: HEADERS(),
  })
}

const GetUserCircle = () => {
  return Fetch(`/circles/`, {
    method: 'GET',
    headers: HEADERS(),
  })
}

const UpdateCircleSettings = name => {
  return Fetch(`/circles/settings`, {
    method: 'PUT',
    headers: HEADERS(),
    body: JSON.stringify({ name }),
  })
}

const RegenerateCircleInviteCode = () => {
  return Fetch(`/circles/invite-code/regenerate`, {
    method: 'POST',
    headers: HEADERS(),
  })
}

const JoinCircle = inviteCode => {
  return Fetch(`/circles/join?invite_code=${inviteCode}`, {
    method: 'POST',
    headers: HEADERS(),
  })
}

const GetCircleMemberRequests = () => {
  return Fetch(`/circles/members/requests`, {
    method: 'GET',
    headers: HEADERS(),
  })
}

const AcceptCircleMemberRequest = id => {
  return Fetch(`/circles/members/requests/accept?requestId=${id}`, {
    method: 'PUT',
    headers: HEADERS(),
  })
}

const LeaveCircle = id => {
  return Fetch(`/circles/leave?circle_id=${id}`, {
    method: 'DELETE',
    headers: HEADERS(),
  })
}

const DeleteCircleMember = (circleID, memberID) => {
  return Fetch(`/circles/${circleID}/members/delete?member_id=${memberID}`, {
    method: 'DELETE',
    headers: HEADERS(),
  })
}

const UpdateUserDetails = userDetails => {
  return Fetch(`/users`, {
    method: 'PUT',
    headers: HEADERS(),
    body: JSON.stringify(userDetails),
  })
}

const UpdateNotificationTarget = notificationTarget => {
  return Fetch(`/users/targets`, {
    method: 'PUT',
    headers: HEADERS(),
    body: JSON.stringify(notificationTarget),
  })
}

const GetSubscriptionSession = () => {
  return Fetch(`/payments/create-subscription`, {
    method: 'GET',
    headers: HEADERS(),
  })
}

const CancelSubscription = () => {
  return Fetch(`/payments/cancel-subscription`, {
    method: 'POST',
    headers: HEADERS(),
  })
}

const GetThings = () => {
  return Fetch(`/things`, {
    method: 'GET',
    headers: HEADERS(),
  })
}
const CreateThing = thing => {
  return Fetch(`/things`, {
    method: 'POST',
    headers: HEADERS(),
    body: JSON.stringify(thing),
  })
}

const SaveThing = thing => {
  return Fetch(`/things`, {
    method: 'PUT',
    headers: HEADERS(),
    body: JSON.stringify(thing),
  })
}

const UpdateThingState = thing => {
  return Fetch(`/things/${thing.id}/state?value=${thing.state}`, {
    method: 'PUT',
    headers: HEADERS(),
  })
}
const DeleteThing = id => {
  return Fetch(`/things/${id}`, {
    method: 'DELETE',
    headers: HEADERS(),
  })
}

const GetThingHistory = (id, offset) => {
  return Fetch(`/things/${id}/history?offset=${offset}`, {
    method: 'GET',
    headers: HEADERS(),
  })
}

const GetMeters = () => Fetch('/meters', { method: 'GET', headers: HEADERS() })
const CreateMeter = meter =>
  Fetch('/meters', {
    method: 'POST',
    headers: HEADERS(),
    body: JSON.stringify(meter),
  })
const SaveMeter = meter =>
  Fetch(`/meters/${meter.id}`, {
    method: 'PUT',
    headers: HEADERS(),
    body: JSON.stringify(meter),
  })
const AddMeterReading = (id, reading) =>
  Fetch(`/meters/${id}/readings`, {
    method: 'POST',
    headers: HEADERS(),
    body: JSON.stringify(reading),
  })
const CompleteMeterReminder = (id, reading) =>
  Fetch(`/meters/${id}/reminder/complete`, {
    method: 'POST',
    headers: HEADERS(),
    body: JSON.stringify(reading),
  })
const GetMeterHistory = (id, offset = 0) =>
  Fetch(`/meters/${id}/readings?offset=${offset}`, {
    method: 'GET',
    headers: HEADERS(),
  })

const GetAssets = (includeArchived = false) =>
  Fetch(
    `/maintenance/assets${includeArchived ? '?includeArchived=true' : ''}`,
    {
      method: 'GET',
      headers: HEADERS(),
    },
  )
const GetAsset = id =>
  Fetch(`/maintenance/assets/${id}`, { method: 'GET', headers: HEADERS() })
const CreateAsset = asset =>
  Fetch('/maintenance/assets', {
    method: 'POST',
    headers: HEADERS(),
    body: JSON.stringify(asset),
  })
const SaveAsset = asset =>
  Fetch(`/maintenance/assets/${asset.id}`, {
    method: 'PUT',
    headers: HEADERS(),
    body: JSON.stringify(asset),
  })
const ArchiveAsset = id =>
  Fetch(`/maintenance/assets/${id}`, { method: 'DELETE', headers: HEADERS() })
const LinkAsset = (id, link) =>
  Fetch(`/maintenance/assets/${id}/links`, {
    method: 'POST',
    headers: HEADERS(),
    body: JSON.stringify(link),
  })
const GetMaintenance = () =>
  Fetch('/maintenance', { method: 'GET', headers: HEADERS() })

const ResetUserPoints = (circleID, userId) =>
  Fetch(`/circles/${circleID}/members/${userId}/points/reset`, {
    method: 'POST',
    headers: HEADERS(),
  })
const ResetAllPoints = circleID =>
  Fetch(`/circles/${circleID}/members/points/reset`, {
    method: 'POST',
    headers: HEADERS(),
  })
const GetPointsHistory = (circleID, userId) =>
  Fetch(
    `/circles/${circleID}/members/points/history${userId ? `?userId=${userId}` : ''}`,
    { method: 'GET', headers: HEADERS() },
  )

const CreateLongLiveToken = name => {
  return Fetch(`/users/tokens`, {
    method: 'POST',
    headers: HEADERS(),
    body: JSON.stringify({ name }),
  })
}
const DeleteLongLiveToken = id => {
  return Fetch(`/users/tokens/${id}`, {
    method: 'DELETE',
    headers: HEADERS(),
  })
}

const GetLongLiveTokens = () => {
  return Fetch(`/users/tokens`, {
    method: 'GET',
    headers: HEADERS(),
  })
}
const PutNotificationTarget = (platform, deviceToken) => {
  return Fetch(`/users/targets`, {
    method: 'PUT',
    headers: HEADERS(),
    body: JSON.stringify({ platform, deviceToken }),
  })
}
const CreateLabel = label => {
  return Fetch(`/labels`, {
    method: 'POST',
    headers: HEADERS(),
    body: JSON.stringify(label),
  })
}

const GetLabels = async () => {
  const resp = await Fetch(`/labels`, {
    method: 'GET',
    headers: HEADERS(),
  })
  return resp.json()
}

const GetResource = async () => {
  await apiClient.init()
  const basedURL = apiManager.getApiURL()
  const resp = await fetch(`${basedURL}/resource`, {
    method: 'GET',
    headers: HEADERS(),
  })
  return resp.json()
}

const UpdateLabel = label => {
  return Fetch(`/labels`, {
    method: 'PUT',
    headers: HEADERS(),
    body: JSON.stringify(label),
  })
}
const DeleteLabel = id => {
  return Fetch(`/labels/${id}`, {
    method: 'DELETE',
    headers: HEADERS(),
  })
}
const GetCategories = async (includeArchived = false) => {
  const resp = await Fetch(`/categories?includeArchived=${includeArchived}`, {
    method: 'GET',
    headers: HEADERS(),
  })
  if (!resp.ok) throw new Error('Unable to load categories')
  return resp.json()
}
const CreateCategory = category =>
  Fetch('/categories', {
    method: 'POST',
    headers: HEADERS(),
    body: JSON.stringify(category),
  })
const UpdateCategory = category =>
  Fetch('/categories', {
    method: 'PUT',
    headers: HEADERS(),
    body: JSON.stringify(category),
  })
const SetCategoryArchived = (id, archived) =>
  Fetch(`/categories/${id}/archive`, {
    method: 'PATCH',
    headers: HEADERS(),
    body: JSON.stringify({ archived }),
  })

const ChangePassword = async (verificationCode, password) => {
  await apiClient.init()
  const baseURL = apiManager.getApiURL()
  return fetch(`${baseURL}/auth/password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ password, code: verificationCode }),
  })
}

const ResetPassword = async email => {
  await apiClient.init()
  const basedURL = apiManager.getApiURL()
  return fetch(`${basedURL}/auth/reset`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email: email }),
  })
}

// MFA Related Functions
const GetMFAStatus = () => {
  return Fetch(`/users/mfa/status`, {
    method: 'GET',
    headers: HEADERS(),
  })
}

const SetupMFA = () => {
  return Fetch(`/users/mfa/setup`, {
    method: 'POST',
    headers: HEADERS(),
  })
}

const ConfirmMFA = (secret, code, backupCodes) => {
  return Fetch(`/users/mfa/confirm`, {
    method: 'POST',
    headers: HEADERS(),
    body: JSON.stringify({
      secret,
      code,
      backupCodes,
    }),
  })
}

const DisableMFA = code => {
  return Fetch(`/users/mfa/disable`, {
    method: 'POST',
    headers: HEADERS(),
    body: JSON.stringify({ code }),
  })
}

const RegenerateBackupCodes = code => {
  return Fetch(`/users/mfa/regenerate-backup-codes`, {
    method: 'POST',
    headers: HEADERS(),
    body: JSON.stringify({ code }),
  })
}

const VerifyMFA = async (sessionToken, code) => {
  await apiClient.init()
  const baseURL = apiManager.getApiURL()
  return fetch(`${baseURL}/auth/mfa/verify`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      sessionToken,
      code,
    }),
  })
}

const GetRoutines = () => {
  return Fetch('/routines', {
    method: 'GET',
    headers: HEADERS(),
  })
}

const GetRewards = () => {
  return Fetch('/rewards', {
    method: 'GET',
    headers: HEADERS(),
  })
}

const CreateReward = reward => {
  return Fetch('/rewards', {
    method: 'POST',
    headers: HEADERS(),
    body: JSON.stringify(reward),
  })
}

const UpdateReward = (id, reward) => {
  return Fetch(`/rewards/${id}`, {
    method: 'PUT',
    headers: HEADERS(),
    body: JSON.stringify(reward),
  })
}

const GetRewardRequests = (mine = false) => {
  return Fetch(mine ? '/rewards/requests/mine' : '/rewards/requests', {
    method: 'GET',
    headers: HEADERS(),
  })
}

const CreateRewardRequest = rewardId => {
  return Fetch('/rewards/requests', {
    method: 'POST',
    headers: HEADERS(),
    body: JSON.stringify({ rewardId }),
  })
}

const ApproveRewardRequest = id => {
  return Fetch(`/rewards/requests/${id}/approve`, {
    method: 'POST',
    headers: HEADERS(),
    body: JSON.stringify({}),
  })
}

const RejectRewardRequest = id => {
  return Fetch(`/rewards/requests/${id}/reject`, {
    method: 'POST',
    headers: HEADERS(),
    body: JSON.stringify({}),
  })
}

const CancelRewardRequest = id => {
  return Fetch(`/rewards/requests/${id}/cancel`, {
    method: 'POST',
    headers: HEADERS(),
    body: JSON.stringify({}),
  })
}

const GetNotifications = () => {
  return Fetch('/notifications', {
    method: 'GET',
    headers: HEADERS(),
  })
}

const MarkNotificationRead = id => {
  return Fetch(`/notifications/${id}/read`, {
    method: 'PATCH',
    headers: HEADERS(),
    body: JSON.stringify({}),
  })
}

const MarkAllNotificationsRead = () => {
  return Fetch('/notifications/read-all', {
    method: 'POST',
    headers: HEADERS(),
    body: JSON.stringify({}),
  })
}

const GetGoals = () => {
  return Fetch('/progress/goals', {
    method: 'GET',
    headers: HEADERS(),
  })
}

const CreateGoal = goal => {
  return Fetch('/progress/goals', {
    method: 'POST',
    headers: HEADERS(),
    body: JSON.stringify(goal),
  })
}

const UpdateDueDate = (id, dueDate) => {
  return Fetch(`/chores/${id}/dueDate`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      dueDate: dueDate ? new Date(dueDate).toISOString() : null,
      updatedAt: new Date().toISOString(),
    }),
  })
}

const RedeemPoints = (userId, points, circleID) => {
  return Fetch(`/circles/${circleID}/members/points/redeem`, {
    method: 'POST',
    headers: HEADERS(),
    body: JSON.stringify({ points, userId }),
  })
}
const RefreshToken = async legacyRefreshToken => {
  await apiClient.init()
  const basedURL = apiManager.getApiURL()

  // Check if running on native platform
  const nativePlatform = isNative()

  if (nativePlatform) {
    // For native platforms, send refresh token in request body
    const refreshToken = await getRefreshToken()

    if (!refreshToken) {
      throw new Error('No refresh token available')
    }

    return fetch(`${basedURL}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refresh_token: refreshToken }),
    })
  } else {
    // For web, continue using cookies
    return fetch(`${basedURL}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', ...HEADERS() },
      ...(legacyRefreshToken
        ? { body: JSON.stringify({ refresh_token: legacyRefreshToken }) }
        : {}),
    })
  }
}
const GetChoresHistory = async (limit, includeMembers) => {
  var url = `/chores/history`
  if (!limit) limit = 7

  if (limit) {
    url += `?limit=${limit}`
  }
  if (includeMembers) {
    url += `&members=true`
  }
  const resp = await Fetch(url, {
    method: 'GET',
    headers: HEADERS(),
  })
  return resp.json()
}

const PutWebhookURL = url => {
  return Fetch(`/users/webhook`, {
    method: 'PUT',
    headers: HEADERS(),
    body: JSON.stringify({ url }),
  })
}

const GetStorageUsage = () => {
  return Fetch(`/users/storage`, {
    method: 'GET',
    headers: HEADERS(),
  })
}

// Timer/TimeSession API functions
const GetChoreTimer = choreId => {
  return Fetch(`/chores/${choreId}/timer`, {
    method: 'GET',
    headers: HEADERS(),
  })
}

const UpdateTimeSession = (choreId, sessionId, sessionData) => {
  return Fetch(`/chores/${choreId}/timer/${sessionId}`, {
    method: 'PUT',
    headers: HEADERS(),
    body: JSON.stringify(sessionData),
  })
}

const DeleteTimeSession = (choreId, sessionId) => {
  return Fetch(`/chores/${choreId}/timer/${sessionId}`, {
    method: 'DELETE',
    headers: HEADERS(),
  })
}

const ResetChoreTimer = choreId => {
  return Fetch(`/chores/${choreId}/timer/reset`, {
    method: 'PUT',
    headers: HEADERS(),
  })
}

const ClearChoreTimer = choreId => {
  return Fetch(`/chores/${choreId}/timer`, {
    method: 'DELETE',
    headers: HEADERS(),
  })
}

const CheckUserDeletion = password => {
  return Fetch(`/users/delete/check`, {
    method: 'POST',
    headers: HEADERS(),
    body: JSON.stringify({
      password,
    }),
  })
}

const DeleteUser = (password, confirmation, transferOptions = []) => {
  return Fetch(`/users/delete`, {
    method: 'DELETE',
    headers: HEADERS(),
    body: JSON.stringify({
      password,
      confirmation,
      transferOptions,
    }),
  })
}

const UploadChoreAttachment = (
  file,
  entityType,
  { draftId, entityId } = {},
) => {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('entityType', entityType)
  if (entityId != null) formData.append('entityId', String(entityId))
  if (draftId != null) formData.append('draftId', draftId)
  return apiClient.upload('/assets/chore', formData)
}

const DeleteDraftAttachment = filePath => {
  return Fetch(`/assets/chore`, {
    method: 'DELETE',
    headers: HEADERS(),
    body: JSON.stringify({ file_path: filePath }),
  })
}

// Returns a fresh signed URL for a stored asset path the current user may access.
const SignAssetURL = path => {
  return Fetch(`/files/sign?path=${encodeURIComponent(path)}`, {
    method: 'GET',
    headers: HEADERS(),
  })
}

const GetChoreAttachments = choreId => {
  return Fetch(`/chores/${choreId}/attachments`, {
    method: 'GET',
    headers: HEADERS(),
  })
}

const DeleteChoreAttachment = (choreId, filePath) => {
  return Fetch(`/chores/${choreId}/attachments`, {
    method: 'DELETE',
    headers: HEADERS(),
    body: JSON.stringify({ file_path: filePath }),
  })
}

const CreateBackup = (encryptionKey, includeAssets = true, backupName = '') => {
  return Fetch(`/backup/create`, {
    method: 'POST',
    headers: HEADERS(),
    body: JSON.stringify({
      encryption_key: encryptionKey,
      include_assets: includeAssets,
      backup_name: backupName,
    }),
  })
}

const RestoreBackup = (encryptionKey, backupData) => {
  return Fetch(`/backup/restore`, {
    method: 'POST',
    headers: HEADERS(),
    body: JSON.stringify({
      encryption_key: encryptionKey,
      backup_data: backupData,
    }),
  })
}

const RegisterDeviceToken = (
  token,
  deviceId,
  platform,
  appVersion,
  deviceModel,
) => {
  return Fetch(`/devices/tokens`, {
    method: 'POST',
    headers: HEADERS(),
    body: JSON.stringify({
      token,
      deviceId,
      platform,
      appVersion,
      deviceModel,
    }),
  })
}

const UnregisterDeviceToken = (deviceId, token) => {
  return Fetch(`/devices/tokens`, {
    method: 'DELETE',
    headers: HEADERS(),
    body: JSON.stringify({
      deviceId,
      token,
    }),
  })
}

const GetDeviceTokens = (active = true) => {
  return Fetch(`/devices/tokens?active=${active}`, {
    method: 'GET',
    headers: HEADERS(),
  })
}

// Child User Management Functions
const CreateChildUser = (childName, displayName, password) => {
  return Fetch(`/users/subaccounts`, {
    method: 'POST',
    headers: HEADERS(),
    body: JSON.stringify({
      childName,
      displayName,
      password,
    }),
  })
}

const GetChildUsers = () => {
  return Fetch(`/users/subaccounts`, {
    method: 'GET',
    headers: HEADERS(),
  })
}

const UpdateChildPassword = (childUserId, password) => {
  return Fetch(`/users/subaccounts/password`, {
    method: 'PUT',
    headers: HEADERS(),
    body: JSON.stringify({
      childUserId,
      password,
    }),
  })
}

const DeleteChildUser = childUserId => {
  return Fetch(`/users/subaccounts/${childUserId}`, {
    method: 'DELETE',
    headers: HEADERS(),
  })
}

// Project-related API functions
const GetProjects = () => {
  return Fetch(`/projects`, {
    method: 'GET',
    headers: HEADERS(),
  })
}

const CreateProject = project => {
  return Fetch(`/projects`, {
    method: 'POST',
    headers: HEADERS(),
    body: JSON.stringify(project),
  })
}

const UpdateProject = (id, project) => {
  return Fetch(`/projects/${id}`, {
    method: 'PUT',
    headers: HEADERS(),
    body: JSON.stringify(project),
  })
}

const DeleteProject = id => {
  return Fetch(`/projects/${id}`, {
    method: 'DELETE',
    headers: HEADERS(),
  })
}

// Filter-related API functions
const GetFilters = () => {
  return Fetch(`/filters`, {
    method: 'GET',
    headers: HEADERS(),
  })
}

const GetPinnedFilters = () => {
  return Fetch(`/filters/pinned`, {
    method: 'GET',
    headers: HEADERS(),
  })
}

const GetFiltersByUsage = () => {
  return Fetch(`/filters/by-usage`, {
    method: 'GET',
    headers: HEADERS(),
  })
}

const GetFilterById = id => {
  return Fetch(`/filters/${id}`, {
    method: 'GET',
    headers: HEADERS(),
  })
}

const CreateFilter = filter => {
  return Fetch(`/filters`, {
    method: 'POST',
    headers: HEADERS(),
    body: JSON.stringify(filter),
  })
}

const UpdateFilter = (id, filter) => {
  return Fetch(`/filters/${id}`, {
    method: 'PUT',
    headers: HEADERS(),
    body: JSON.stringify(filter),
  })
}

const DeleteFilter = id => {
  return Fetch(`/filters/${id}`, {
    method: 'DELETE',
    headers: HEADERS(),
  })
}

const ToggleFilterPin = id => {
  return Fetch(`/filters/${id}/toggle-pin`, {
    method: 'POST',
    headers: HEADERS(),
  })
}

const GetShoppingLists = (includeArchived = false) => {
  const query = includeArchived ? '?includeArchived=true' : ''
  return Fetch(`/shopping-lists${query}`, {
    method: 'GET',
    headers: HEADERS(),
  })
}

const GetShoppingList = id => {
  return Fetch(`/shopping-lists/${id}`, {
    method: 'GET',
    headers: HEADERS(),
  })
}

const CreateShoppingList = payload => {
  return Fetch(`/shopping-lists`, {
    method: 'POST',
    headers: HEADERS(),
    body: JSON.stringify(payload),
  })
}

const UpdateShoppingList = (id, payload) => {
  return Fetch(`/shopping-lists/${id}`, {
    method: 'PUT',
    headers: HEADERS(),
    body: JSON.stringify(payload),
  })
}

const ArchiveShoppingList = id => {
  return Fetch(`/shopping-lists/${id}/archive`, {
    method: 'POST',
    headers: HEADERS(),
  })
}

const DeleteShoppingList = id => {
  return Fetch(`/shopping-lists/${id}`, {
    method: 'DELETE',
    headers: HEADERS(),
  })
}

const CreateShoppingListItem = (listId, payload) => {
  return Fetch(`/shopping-lists/${listId}/items`, {
    method: 'POST',
    headers: HEADERS(),
    body: JSON.stringify(payload),
  })
}

const UpdateShoppingListItem = (listId, itemId, payload) => {
  return Fetch(`/shopping-lists/${listId}/items/${itemId}`, {
    method: 'PUT',
    headers: HEADERS(),
    body: JSON.stringify(payload),
  })
}

const DeleteShoppingListItem = (listId, itemId) => {
  return Fetch(`/shopping-lists/${listId}/items/${itemId}`, {
    method: 'DELETE',
    headers: HEADERS(),
  })
}

const ClearCompletedShoppingItems = listId => {
  return Fetch(`/shopping-lists/${listId}/clear-completed`, {
    method: 'POST',
    headers: HEADERS(),
  })
}

export {
  AcceptCircleMemberRequest,
  AddMeterReading,
  ApproveChore,
  ApproveRewardRequest,
  ArchiveAsset,
  ArchiveChore,
  ArchiveShoppingList,
  CancelRewardRequest,
  CancelSubscription,
  ChangePassword,
  CheckUserDeletion,
  ClearChoreTimer,
  ClearCompletedShoppingItems,
  CompleteMeterReminder,
  CompleteSubTask,
  ConfirmMFA,
  CreateAsset,
  CreateBackup,
  CreateCategory,
  CreateChildUser,
  CreateChore,
  createChore,
  CreateFilter,
  CreateGoal,
  CreateLabel,
  CreateLongLiveToken,
  CreateMeter,
  CreateProject,
  CreateReward,
  CreateRewardRequest,
  CreateShoppingList,
  CreateShoppingListItem,
  CreateThing,
  DeleteChildUser,
  DeleteChore,
  DeleteChoreAttachment,
  DeleteChoreHistory,
  DeleteCircleMember,
  DeleteDraftAttachment,
  DeleteFilter,
  DeleteLabel,
  DeleteLongLiveToken,
  DeleteProject,
  DeleteShoppingList,
  DeleteShoppingListItem,
  DeleteThing,
  DeleteTimeSession,
  DeleteUser,
  DisableMFA,
  GetAllCircleMembers,
  GetAllUsers,
  GetArchivedChores,
  GetAsset,
  GetAssets,
  GetCalendar,
  GetCategories,
  GetChildUsers,
  GetChoreAttachments,
  GetChoreByID,
  GetChoreDetailById,
  GetChoreHistory,
  GetChores,
  GetChoresHistory,
  GetChoresNew,
  GetChoreTimer,
  GetCircleMemberRequests,
  GetDeviceTokens,
  GetFilterById,
  GetFilters,
  GetFiltersByUsage,
  GetGoals,
  GetLabels,
  GetLongLiveTokens,
  GetMaintenance,
  GetMeterHistory,
  GetMeters,
  GetMFAStatus,
  GetNotifications,
  GetPersonalChores,
  GetPinnedFilters,
  GetPointsHistory,
  GetProjects,
  GetResource,
  GetRewardRequests,
  GetRewards,
  GetRoutines,
  GetShoppingList,
  GetShoppingLists,
  GetStorageUsage,
  GetSubscriptionSession,
  GetThingHistory,
  GetThings,
  GetUserCircle,
  GetUserProfile,
  JoinCircle,
  LeaveCircle,
  LinkAsset,
  login,
  logout,
  MarkAllNotificationsRead,
  MarkChoreComplete,
  MarkNotificationRead,
  NudgeChore,
  PauseChore,
  PutNotificationTarget,
  PutWebhookURL,
  RedeemPoints,
  RefreshToken,
  RegenerateBackupCodes,
  RegenerateCircleInviteCode,
  RegisterDeviceToken,
  RejectChore,
  RejectRewardRequest,
  ResetAllPoints,
  ResetChoreTimer,
  ResetPassword,
  ResetUserPoints,
  RestoreBackup,
  SaveAsset,
  SaveChore,
  SaveMeter,
  SaveThing,
  SetCategoryArchived,
  SetupMFA,
  SignAssetURL,
  signUp,
  SkipChore,
  StartChore,
  ToggleFilterPin,
  UnArchiveChore,
  UndoChoreAction,
  UnregisterDeviceToken,
  UpdateCategory,
  UpdateChildPassword,
  UpdateChoreAssignee,
  UpdateChoreHistory,
  UpdateChorePriority,
  UpdateCircleSettings,
  UpdateDueDate,
  UpdateFilter,
  UpdateLabel,
  UpdateMemberRole,
  UpdateNotificationTarget,
  UpdatePassword,
  UpdateProject,
  UpdateReward,
  UpdateShoppingList,
  UpdateShoppingListItem,
  UpdateThingState,
  UpdateTimeSession,
  UpdateUserDetails,
  UploadChoreAttachment,
  VerifyMFA,
}
