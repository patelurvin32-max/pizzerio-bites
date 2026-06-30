import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import * as authApi from '../services/authService.js'
import { AUTH_SESSION_EXPIRED, ensureCsrfToken, getAccessToken, setAccessToken } from '../services/api.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [permissions, setPermissions] = useState(null)
  const [loading, setLoading] = useState(true)
  const [todayAttendance, setTodayAttendance] = useState(null)
  const [showAttendancePopup, setShowAttendancePopup] = useState(false)
  const refreshTimerRef = useRef(null)

  const clearSession = useCallback(() => {
    setAccessToken(null)
    setUser(null)
    setPermissions(null)
    setTodayAttendance(null)
    setShowAttendancePopup(false)
  }, [])

  const scheduleTokenRefresh = useCallback(() => {
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current)
      refreshTimerRef.current = null
    }

    const token = getAccessToken()
    const exp = authApi.parseTokenExp(token)
    if (!exp) return

    const refreshIn = Math.max(exp - Date.now() - 60_000, 30_000)
    refreshTimerRef.current = setTimeout(async () => {
      try {
        await authApi.refreshSession()
        scheduleTokenRefresh()
      } catch (err) {
        console.warn('[auth] Proactive token refresh failed:', err.message)
      }
    }, refreshIn)
  }, [])

  const logout = useCallback(async () => {
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current)
      refreshTimerRef.current = null
    }
    await authApi.logout()
    clearSession()
  }, [clearSession])

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      let token = getAccessToken()

      if (!token) {
        try {
          await authApi.refreshSession()
          token = getAccessToken()
        } catch (err) {
          console.info('[auth] No active session to restore:', err.message)
          clearSession()
          return
        }
      }

      const [u, p] = await Promise.all([authApi.me(), authApi.fetchRolePermissions()])
      setUser(u)
      setPermissions(p.permissions || {})
      scheduleTokenRefresh()
    } catch (err) {
      console.warn('[auth] Session validation failed:', err.message)
      clearSession()
    } finally {
      setLoading(false)
    }
  }, [clearSession, scheduleTokenRefresh])

  useEffect(() => {
    async function bootstrap() {
      await ensureCsrfToken().catch(() => {})
      await refresh()
    }
    bootstrap()
  }, [refresh])

  useEffect(() => {
    const onSessionExpired = () => {
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current)
        refreshTimerRef.current = null
      }
      clearSession()
    }
    window.addEventListener(AUTH_SESSION_EXPIRED, onSessionExpired)
    return () => window.removeEventListener(AUTH_SESSION_EXPIRED, onSessionExpired)
  }, [clearSession])

  useEffect(() => () => {
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current)
  }, [])

  const login = useCallback(async (email, password) => {
    const data = await authApi.login({ email, password })
    setUser(data.user)
    setTodayAttendance(data.todayAttendance || null)

    if (data.user.role === 'RECEPTION' && (!data.todayAttendance || !data.todayAttendance.check_in_time)) {
      setShowAttendancePopup(true)
    }

    try {
      const p = await authApi.fetchRolePermissions()
      setPermissions(p.permissions || {})
    } catch {
      setPermissions({})
    }

    scheduleTokenRefresh()
    return data.user
  }, [scheduleTokenRefresh])

  const value = useMemo(
    () => ({
      user,
      permissions,
      loading,
      login,
      logout,
      refresh,
      isAuthenticated: Boolean(user),
      todayAttendance,
      setTodayAttendance,
      showAttendancePopup,
      setShowAttendancePopup,
    }),
    [user, permissions, loading, login, logout, refresh, todayAttendance, showAttendancePopup]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
