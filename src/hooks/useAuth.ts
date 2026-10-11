import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useState } from 'react'

import type { ApiProfile } from '../model/api'
import { useNotification } from '../service/NotificationProvider'
import { apiClient } from '../utils/ApiClient'
import { GetUserProfile, login, logout, VerifyMFA } from '../utils/Fetcher'
import {
  clearAllTokens,
  getAccessToken,
  hasAccessToken,
  saveTokens,
} from '../utils/TokenStorage'

/* ─────────────────────────────────────────────
   Real authentication hook.

   Reads the access token issued by the live
   server, restores the session, signs in/out,
   and handles the MFA challenge. The transport
   layer (ApiClient.request) already handles
   single-flight refresh and HttpOnly cookies on
   the web; this hook only manages auth state.
───────────────────────────────────────────── */

export type LoginResult = {
  mfaRequired: boolean
  sessionToken?: string
  access_token?: string
}

export type AuthState = {
  isAuthenticated: boolean
  isLoading: boolean
  isSessionExpired: boolean
  user: ApiProfile | null
  error: string | null
}

export function useAuth() {
  const queryClient = useQueryClient()
  const { showError, showSuccess } = useNotification()
  const [restoreCompleted, setRestoreCompleted] = useState(hasAccessToken)
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    isLoading: true,
    isSessionExpired: false,
    user: null,
    error: null,
  })

  // Fetch user profile (enabled only when an access token exists).
  const {
    data: userProfile,
    error: profileError,
    isLoading: profileLoading,
    refetch: refetchProfile,
  } = useQuery({
    queryKey: ['userProfile'],
    queryFn: async () => {
      const resp = await GetUserProfile()
      const result = await resp.json().catch(() => ({}))
      if (!resp.ok) throw new Error(result?.error || 'Failed to load profile')
      return result?.res as ApiProfile
    },
    enabled: Boolean(getAccessToken()),
    staleTime: 5 * 60 * 1000,
    retry: 0,
  })

  useEffect(() => {
    if (userProfile) {
      setAuthState({
        isAuthenticated: true,
        isLoading: false,
        isSessionExpired: false,
        user: userProfile,
        error: null,
      })
    } else if (hasAccessToken() && !profileLoading && profileError) {
      setAuthState({
        isAuthenticated: false,
        isLoading: false,
        isSessionExpired: true,
        user: null,
        error: 'Session expired. Please sign in again.',
      })
    } else if (!hasAccessToken()) {
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        isAuthenticated: false,
        isSessionExpired: false,
        user: null,
      }))
    }
  }, [userProfile, profileLoading, profileError])

  // Web session restore: a page reload starts with no in-memory access token;
  // the HttpOnly refresh cookie still exists, so try a single-flight refresh
  // (no forced-logout fallback) before giving up on the session.
  useEffect(() => {
    if (hasAccessToken()) {
      setRestoreCompleted(true)
      return
    }
    let cancelled = false
    // All hook instances share this boot attempt, including the in-place sign-in
    // screen mounted after a failure. Mounting it must not silently retry login.
    // Logout clears this query with the rest of the account-scoped query cache.
    queryClient
      .fetchQuery({
        queryKey: ['sessionRestore'],
        queryFn: () => apiClient.refreshToken({ allowLogoutFallback: false }),
        staleTime: Infinity,
        retry: false,
      })
      .then((result: { success?: boolean } | undefined) => {
        if (cancelled) return
        if (result?.success) {
          // Access token landed in memory via saveTokens; drop any stale
          // profile and let the re-enabled query fetch the fresh one.
          queryClient.invalidateQueries({ queryKey: ['userProfile'] })
        }
        // Re-render so the profile query re-evaluates `enabled` now that the
        // token presence may have changed.
        setAuthState(prev => ({ ...prev, isLoading: false }))
        setRestoreCompleted(true)
      })
    return () => {
      cancelled = true
    }
  }, [apiClient, queryClient])

  // Login mutation
  const { mutateAsync: loginAsync } = useMutation({
    mutationFn: async ({
      password,
      username,
    }: {
      username: string
      password: string
    }) => {
      const resp = await login(username, password)
      const result = await resp.json().catch(() => ({}))
      if (!resp.ok) throw new Error(result?.error || 'Login failed')
      return result as LoginResult
    },
    onSuccess: async data => {
      if (!data.mfaRequired) {
        await saveTokens({
          accessToken: data.access_token,
          accessTokenExpiry: undefined,
          refreshToken: null,
          refreshTokenExpiry: null,
        })
        queryClient.invalidateQueries({ queryKey: ['userProfile'] })
      }
    },
    onError: error => {
      showError({
        title: 'Login failed',
        message: error instanceof Error ? error.message : 'Invalid credentials',
      })
    },
  })

  // MFA verification
  const { mutateAsync: mfaAsync } = useMutation({
    mutationFn: async ({
      code,
      sessionToken,
    }: {
      sessionToken: string
      code: string
    }) => {
      const resp = await VerifyMFA(sessionToken, code)
      const result = await resp.json().catch(() => ({}))
      if (!resp.ok) {
        throw new Error(
          result?.error ||
            (resp.status === 400
              ? 'Invalid code. Please try again.'
              : 'Verification failed'),
        )
      }
      await saveTokens({
        accessToken: result?.access_token,
        accessTokenExpiry: result?.access_token_expiry,
        refreshToken: null,
        refreshTokenExpiry: null,
      })
      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userProfile'] })
    },
    onError: error => {
      showError({
        title: 'Verification failed',
        message: error instanceof Error ? error.message : 'Invalid code',
      })
    },
  })

  // Logout mutation
  const { mutateAsync: logoutAsync } = useMutation({
    mutationFn: async () => {
      try {
        await logout()
      } catch {
        // Local cleanup proceeds even if the server can't be reached.
      }
      await clearAllTokens()
    },
    onSuccess: () => {
      queryClient.clear()
      setAuthState({
        isAuthenticated: false,
        isLoading: false,
        isSessionExpired: false,
        user: null,
        error: null,
      })
    },
  })

  const signIn = useCallback(
    async (username: string, password: string): Promise<LoginResult> => {
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }))
      return loginAsync({ username, password })
    },
    [loginAsync],
  )

  const verifyMfa = useCallback(
    async (sessionToken: string, code: string) => {
      await mfaAsync({ sessionToken, code })
    },
    [mfaAsync],
  )

  const signOut = useCallback(async () => {
    await logoutAsync()
  }, [logoutAsync])

  const triggerSessionExpiry = useCallback(() => {
    setAuthState(prev => ({
      ...prev,
      isSessionExpired: true,
      isAuthenticated: false,
    }))
  }, [])

  const clearSessionExpired = useCallback(() => {
    setAuthState(prev => ({ ...prev, isSessionExpired: false, error: null }))
  }, [])

  return {
    ...authState,
    // No token before refresh finishes is an unresolved session, not a guest.
    // The shared transport makes StrictMode's second subscription single-flight.
    isLoading: authState.isLoading || !restoreCompleted,
    signIn,
    verifyMfa,
    signOut,
    triggerSessionExpiry,
    clearSessionExpired,
    refetchProfile,
    profileLoading,
    showError,
    showSuccess,
  }
}
