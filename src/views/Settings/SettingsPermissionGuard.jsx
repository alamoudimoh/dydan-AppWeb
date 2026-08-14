import { Navigate } from 'react-router-dom'

import { useCircleMembers, useUserProfile } from '../../queries/UserQueries'
import {
  hasPermission,
  resolveEffectiveRole,
} from '../../utils/PermissionModel'
import LoadingComponent from '../components/Loading'

const SettingsPermissionGuard = ({ children, permission }) => {
  const { data: profile, isLoading: profileLoading } = useUserProfile()
  const { data: membersData, isLoading: membersLoading } = useCircleMembers()

  if (profileLoading || membersLoading) return <LoadingComponent />

  const role = resolveEffectiveRole(profile, membersData?.res || [])
  if (!hasPermission(role, permission)) {
    return <Navigate to='/settings' replace />
  }
  return children
}

export default SettingsPermissionGuard
