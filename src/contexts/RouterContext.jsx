import { lazy } from 'react'
import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom'

import App from '@/App'

// Route-level code splitting: every page is loaded on demand so the initial
// payload only needs the app shell. Keep truly shell-critical, tiny components
// static (App, Error, guards); everything else goes through React.lazy().
const ChoreEdit = lazy(() => import('@/views/ChoreEdit/ChoreEdit'))
const Error = lazy(() => import('@/views/Error'))
const AccountSettings = lazy(() => import('@/views/Settings/AccountSettings'))
const AdvancedSettings = lazy(() => import('@/views/Settings/AdvancedSettings'))
const ChildUserSettings = lazy(
  () => import('@/views/Settings/ChildUserSettings'),
)
const CircleSettings = lazy(() => import('@/views/Settings/CircleSettings'))
const DeveloperSettings = lazy(
  () => import('@/views/Settings/DeveloperSettings'),
)
const IntegrationsSettings = lazy(
  () => import('@/views/Settings/IntegrationsSettings'),
)
const PrivacySettings = lazy(() => import('@/views/Settings/PrivacySettings'))
const SecuritySettings = lazy(() => import('@/views/Settings/SecuritySettings'))
const Settings = lazy(() => import('@/views/Settings/Settings'))
const FigmaSettingsScreen = lazy(
  () => import('@/views/Settings/FigmaSettingsScreen'),
)
const SettingsPermissionGuard = lazy(
  () => import('@/views/Settings/SettingsPermissionGuard'),
)
const SettingsRoutes = lazy(() => import('@/views/Settings/SettingsRoutes'))
const ThemeSettings = lazy(() => import('@/views/Settings/ThemeSettings'))

const AuthenticationLoading = lazy(
  () => import('../views/Authorization/Authenticating'),
)
const ForgotPasswordView = lazy(
  () => import('../views/Authorization/ForgotPasswordView'),
)
const LoginSettings = lazy(() => import('../views/Authorization/LoginSettings'))
const LoginView = lazy(() => import('../views/Authorization/LoginView'))
const SignupView = lazy(() => import('../views/Authorization/Signup'))
const UpdatePasswordView = lazy(
  () => import('../views/Authorization/UpdatePasswordView'),
)
const FigmaCalendarScreen = lazy(
  () => import('../views/Calendar/FigmaCalendarScreen'),
)
const CategoryView = lazy(() => import('../views/Categories/CategoryView'))
const ChoreView = lazy(() => import('../views/ChoreEdit/ChoreView'))
const ArchivedTasks = lazy(() => import('../views/Chores/ArchivedTasks'))
const MyChores = lazy(() => import('../views/Chores/MyChores'))
const FigmaTasksScreen = lazy(() => import('../views/Chores/FigmaTasksScreen'))
const JoinCircleView = lazy(() => import('../views/Circles/JoinCircle'))
const NotFound = lazy(() => import('../views/components/NotFound'))

// PE2 route ports: each of these renders the matching Product Experience 2
// screen pixel-for-pixel against the shared `src/pe2` fixtures.
const FigmaActivityScreen = lazy(
  () => import('@/views/User/pe2/FigmaActivityScreen'),
)
const FigmaGoalsScreen = lazy(() => import('@/views/Goals/FigmaGoalsScreen'))
const FigmaMaintenanceScreen = lazy(
  () => import('@/views/Maintenance/pe2/FigmaMaintenanceScreen'),
)
const FigmaNotificationsScreen = lazy(
  () => import('@/views/Notifications/FigmaNotificationsScreen'),
)
const FigmaProgressScreen = lazy(
  () => import('@/views/FamilyProgress/FigmaProgressScreen'),
)
const FigmaProjectsScreen = lazy(
  () => import('@/views/Projects/pe2/FigmaProjectsScreen'),
)
const FigmaRewardsScreen = lazy(
  () => import('@/views/Rewards/FigmaRewardsScreen'),
)
const FigmaRoutinesScreen = lazy(
  () => import('@/views/Routines/pe2/FigmaRoutinesScreen'),
)
const FigmaSearchScreen = lazy(() => import('@/views/Search/FigmaSearchScreen'))
const FigmaShoppingScreen = lazy(
  () => import('@/views/ShoppingLists/pe2/FigmaShoppingScreen'),
)
const FigmaHomeScreen = lazy(() => import('@/views/Home/today/FigmaHomeScreen'))
const FigmaTodayScreen = lazy(
  () => import('@/views/Home/today/FigmaTodayScreen'),
)

const FamilyCircleGuard = lazy(() => import('../components/FamilyCircleGuard'))
const FilterView = lazy(() => import('../views/Filters/FilterView'))
const ChoreHistory = lazy(() => import('../views/History/ChoreHistory'))
const Landing = lazy(() => import('../views/Landing/Landing'))
const AssetDetailLazy = lazy(() =>
  import('../views/Maintenance/MaintenanceView').then(m => ({
    default: m.AssetDetail,
  })),
)
const MetersView = lazy(() => import('../views/Meters/MetersView'))
const CircleSetupView = lazy(
  () => import('../views/Onboarding/CircleSetupView'),
)
const GetStartedView = lazy(() => import('../views/Onboarding/GetStartedView'))
const HeardAboutView = lazy(() => import('../views/Onboarding/HeardAboutView'))
const OnboardingView = lazy(() => import('../views/Onboarding/OnboardingView'))
const WorkspaceReadyView = lazy(
  () => import('../views/Onboarding/WorkspaceReadyView'),
)
const PaymentCancelledView = lazy(
  () => import('../views/Payments/PaymentFailView'),
)
const PaymentSuccessView = lazy(
  () => import('../views/Payments/PaymentSuccessView'),
)
const PrivacyPolicyView = lazy(
  () => import('../views/PrivacyPolicy/PrivacyPolicyView'),
)
const ShoppingListDetail = lazy(
  () => import('../views/ShoppingLists/ShoppingListDetail'),
)
const APITokenSettings = lazy(() => import('@/views/Settings/APITokenSettings'))
const LocalizationSettings = lazy(
  () => import('@/views/Settings/LocalizationSettings'),
)
const MFASettings = lazy(() => import('@/views/Settings/MFASettings'))
const NotificationSetting = lazy(
  () => import('@/views/Settings/NotificationSetting'),
)
const ProfileSettings = lazy(() => import('@/views/Settings/ProfileSettings'))
const SidepanelSettings = lazy(
  () => import('@/views/Settings/SidepanelSettings'),
)
const StorageSettings = lazy(() => import('@/views/Settings/StorageSettings'))
const TermsView = lazy(() => import('../views/Terms/TermsView'))
const ThingsHistory = lazy(() => import('../views/Things/ThingsHistory'))
const ThingsView = lazy(() => import('../views/Things/ThingsView'))
const TimerDetails = lazy(() => import('../views/Timer/TimerDetails'))
const UserPoints = lazy(() => import('../views/User/UserPoints'))

import { PERMISSIONS } from '../utils/PermissionModel'

const restrictedSetting = (permission, element) => (
  <SettingsPermissionGuard permission={permission}>
    {element}
  </SettingsPermissionGuard>
)

const familyRoute = element => <FamilyCircleGuard>{element}</FamilyCircleGuard>

export const appRouteConfig = [
  {
    path: '/',
    element: <App />,
    errorElement: <Error />,
    children: [
      {
        path: '/',
        element: <FigmaHomeScreen />,
      },
      {
        path: '/today',
        element: <FigmaTodayScreen />,
      },
      {
        path: '/profile',
        element: <ProfileSettings />,
      },
      {
        path: '/settings',
        element: <SettingsRoutes />,
        children: [
          {
            index: true,
            element: <FigmaSettingsScreen />,
          },
          {
            path: 'detailed',
            element: restrictedSetting(
              PERMISSIONS.MANAGE_ACCOUNT,
              <Settings />,
            ),
          },
          {
            // Profile lives at /profile; keep legacy deep links working.
            path: 'profile',
            element: <Navigate replace to='/profile' />,
          },
          {
            path: 'circle',
            element: restrictedSetting(
              PERMISSIONS.MANAGE_ACCOUNT,
              <CircleSettings />,
            ),
          },
          {
            path: 'account',
            element: restrictedSetting(
              PERMISSIONS.MANAGE_ACCOUNT,
              <AccountSettings />,
            ),
          },
          {
            path: 'subaccounts',
            element: restrictedSetting(
              PERMISSIONS.MANAGE_SUBACCOUNTS,
              <ChildUserSettings />,
            ),
          },
          {
            path: 'notifications',
            element: <NotificationSetting />,
          },
          {
            path: 'mfa',
            element: restrictedSetting(
              PERMISSIONS.MANAGE_ACCOUNT,
              <MFASettings />,
            ),
          },
          {
            // Account & security: passwords, two-factor auth, sessions,
            // connected accounts, and the account danger zone.
            path: 'security',
            element: restrictedSetting(
              PERMISSIONS.MANAGE_ACCOUNT,
              <SecuritySettings />,
            ),
          },
          {
            // Privacy is personal, so it is available to every role.
            path: 'privacy',
            element: <PrivacySettings />,
          },
          {
            // Integrations & data is a hub; the detail routes it opens are
            // individually permission-guarded.
            path: 'integrations',
            element: <IntegrationsSettings />,
          },
          {
            path: 'apitokens',
            element: restrictedSetting(
              PERMISSIONS.MANAGE_ACCOUNT,
              <APITokenSettings />,
            ),
          },
          {
            path: 'storage',
            element: <StorageSettings />,
          },
          {
            path: 'sidepanel',
            element: <SidepanelSettings />,
          },
          {
            path: 'theme',
            element: <ThemeSettings />,
          },
          {
            path: 'localization',
            element: <LocalizationSettings />,
          },
          {
            path: 'advanced',
            element: <AdvancedSettings />,
          },
          {
            path: 'developer',
            element: <DeveloperSettings />,
          },
        ],
      },
      {
        path: '/chores',
        element: <FigmaTasksScreen />,
      },
      {
        path: '/calendar',
        element: <FigmaCalendarScreen />,
      },
      {
        path: '/family',
        element: familyRoute(<FigmaProgressScreen />),
      },
      {
        path: '/goals',
        element: <FigmaGoalsScreen />,
      },
      {
        path: '/search',
        element: <FigmaSearchScreen />,
      },
      {
        path: '/archived',
        element: <ArchivedTasks />,
      },
      {
        path: '/chores/:choreId/edit',
        element: <ChoreEdit />,
      },
      {
        path: '/chores/:choreId',
        element: <ChoreView />,
      },
      {
        path: '/chores/create',
        element: <ChoreEdit />,
      },
      {
        path: '/chores/:choreId/history',
        element: <ChoreHistory />,
      },
      {
        path: '/chores/:choreId/timer',
        element: <TimerDetails />,
      },
      {
        path: '/my/chores',
        element: <MyChores />,
      },
      {
        path: '/activities',
        element: familyRoute(<FigmaActivityScreen />),
      },
      {
        path: '/points',
        element: familyRoute(<UserPoints />),
      },
      {
        path: '/rewards',
        element: familyRoute(<FigmaRewardsScreen />),
      },
      {
        path: '/notifications',
        element: <FigmaNotificationsScreen />,
      },
      {
        path: '/login',
        element: <LoginView />,
      },
      {
        path: '/login/settings',
        element: <LoginSettings />,
      },
      {
        path: '/signup',
        element: <SignupView />,
      },
      {
        path: '/onboarding',
        element: <OnboardingView />,
      },
      {
        path: '/get-started',
        element: <GetStartedView />,
      },
      {
        path: '/ready',
        element: <WorkspaceReadyView />,
      },
      {
        path: '/circle-setup',
        element: <CircleSetupView />,
      },
      {
        path: '/heard-about',
        element: <HeardAboutView />,
      },

      {
        path: '/auth/:provider',
        element: <AuthenticationLoading />,
      },
      {
        path: '/welcome',
        element: <Landing />,
      },
      {
        path: '/forgot-password',
        element: <ForgotPasswordView />,
      },
      {
        path: '/password/update',
        element: <UpdatePasswordView />,
      },
      {
        path: '/privacy',
        element: <PrivacyPolicyView />,
      },
      {
        path: '/terms',
        element: <TermsView />,
      },
      {
        path: 'circle/join',
        element: <JoinCircleView />,
      },
      {
        path: 'payments/success',
        element: <PaymentSuccessView />,
      },
      {
        path: 'payments/cancel',
        element: <PaymentCancelledView />,
      },
      {
        path: 'things',
        element: <ThingsView />,
      },
      {
        path: 'meters',
        element: <MetersView />,
      },
      {
        path: 'maintenance',
        element: <FigmaMaintenanceScreen />,
      },
      {
        path: 'routines',
        element: <FigmaRoutinesScreen />,
      },
      {
        path: 'maintenance/assets/:id',
        element: <AssetDetailLazy />,
      },
      {
        path: 'things/:id',
        element: <ThingsHistory />,
      },
      {
        path: 'labels/',
        element: <CategoryView />,
      },
      {
        path: 'projects/',
        element: <FigmaProjectsScreen />,
      },
      {
        path: 'shopping',
        element: <FigmaShoppingScreen />,
      },
      {
        path: 'shopping/:id',
        element: <ShoppingListDetail />,
      },
      {
        path: 'filters/',
        element: <FilterView />,
      },
      {
        path: '*',
        element: <NotFound />,
      },
    ],
  },
]

const Router = createBrowserRouter(appRouteConfig)

const RouterContext = ({ children }) => {
  return <RouterProvider router={Router} />
}

export default RouterContext
