import { lazy } from 'react'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'

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
const Settings = lazy(() => import('@/views/Settings/Settings'))
const SettingsOverview = lazy(() => import('@/views/Settings/SettingsOverview'))
const SettingsPermissionGuard = lazy(
  () => import('@/views/Settings/SettingsPermissionGuard'),
)
const SettingsRoutes = lazy(() => import('@/views/Settings/SettingsRoutes'))
const ThemeSettings = lazy(() => import('@/views/Settings/ThemeSettings'))

const GlobalSearchPage = lazy(() => import('../search/GlobalSearchPage'))
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
const CalendarView = lazy(() => import('../views/Calendar/CalendarView'))
const CategoryView = lazy(() => import('../views/Categories/CategoryView'))
const ChoreView = lazy(() => import('../views/ChoreEdit/ChoreView'))
const ArchivedTasks = lazy(() => import('../views/Chores/ArchivedTasks'))
const MyChores = lazy(() => import('../views/Chores/MyChores'))
const JoinCircleView = lazy(() => import('../views/Circles/JoinCircle'))
const NotFound = lazy(() => import('../views/components/NotFound'))
const Dashboard = lazy(() => import('../views/Dashboard/Dashboard'))
const TodayView = lazy(() => import('../views/Home/today/TodayView'))
const FamilyProgress = lazy(
  () => import('../views/FamilyProgress/FamilyProgress'),
)
const FamilyCircleGuard = lazy(() => import('../components/FamilyCircleGuard'))
const FilterView = lazy(() => import('../views/Filters/FilterView'))
const ChoreHistory = lazy(() => import('../views/History/ChoreHistory'))
const Landing = lazy(() => import('../views/Landing/Landing'))
const MaintenanceViewLazy = lazy(
  () => import('../views/Maintenance/MaintenanceView'),
)
const AssetDetailLazy = lazy(() =>
  import('../views/Maintenance/MaintenanceView').then(m => ({
    default: m.AssetDetail,
  })),
)
const MetersView = lazy(() => import('../views/Meters/MetersView'))
const NotificationsView = lazy(
  () => import('../views/Notifications/NotificationsView'),
)
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
const ProjectView = lazy(() => import('../views/Projects/ProjectView'))
const ShoppingListDetail = lazy(
  () => import('../views/ShoppingLists/ShoppingListDetail'),
)
const ShoppingListsView = lazy(
  () => import('../views/ShoppingLists/ShoppingListsView'),
)
const RewardsView = lazy(() => import('../views/Rewards/RewardsView'))
const RoutinesView = lazy(() => import('../views/Routines/RoutinesView'))
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
const UserActivities = lazy(() => import('../views/User/UserActivities'))
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
        element: <Dashboard />,
      },
      {
        path: '/today',
        element: <TodayView />,
      },
      {
        path: '/settings',
        element: <SettingsRoutes />,
        children: [
          {
            index: true,
            element: <SettingsOverview />,
          },
          {
            path: 'detailed',
            element: restrictedSetting(
              PERMISSIONS.MANAGE_ACCOUNT,
              <Settings />,
            ),
          },
          {
            path: 'profile',
            element: <ProfileSettings />,
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
        element: <MyChores />,
      },
      {
        path: '/calendar',
        element: <CalendarView />,
      },
      {
        path: '/family',
        element: familyRoute(<FamilyProgress />),
      },
      {
        path: '/search',
        element: <GlobalSearchPage />,
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
        element: familyRoute(<UserActivities />),
      },
      {
        path: '/points',
        element: familyRoute(<UserPoints />),
      },
      {
        path: '/rewards',
        element: familyRoute(<RewardsView />),
      },
      {
        path: '/notifications',
        element: <NotificationsView />,
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
        element: <MaintenanceViewLazy />,
      },
      {
        path: 'routines',
        element: <RoutinesView />,
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
        element: <ProjectView />,
      },
      {
        path: 'shopping',
        element: <ShoppingListsView />,
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
