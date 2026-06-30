import axios from 'axios'

let _accessToken = null
let _csrfToken = null
let _csrfInitPromise = null

export const AUTH_SESSION_EXPIRED = 'auth:session-expired'

export function getAccessToken() {
  return _accessToken
}

export function setAccessToken(token) {
  _accessToken = token || null
}

function getCsrfToken() {
  return _csrfToken || document.querySelector('meta[name="csrf-token"]')?.content || null
}

function setCsrfToken(token) {
  if (token) _csrfToken = token
}

const MUTATING_METHODS = new Set(['post', 'put', 'patch', 'delete'])

function skipCsrfPrefetch(url) {
  return url?.includes('/api/auth/login')
}

function formatApiError(err) {
  if (err.code === 'ECONNABORTED') {
    return new Error('Request timed out. The server may still be starting — please try again.')
  }
  if (err.code === 'ERR_NETWORK' || !err.response) {
    return new Error('Unable to reach the server. Check your connection and try again.')
  }
  const msg = err.response?.data?.message || err.message || 'Request failed'
  return new Error(msg)
}

function notifySessionExpired() {
  setAccessToken(null)
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(AUTH_SESSION_EXPIRED))
  }
}

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
  timeout: 25000,
  withCredentials: true,
})

export function ensureCsrfToken() {
  if (getCsrfToken()) return Promise.resolve()
  if (!_csrfInitPromise) {
    _csrfInitPromise = api
      .get('/api/health')
      .catch((err) => {
        console.warn('[auth] CSRF prefetch failed:', err.message)
        throw err
      })
      .finally(() => {
        _csrfInitPromise = null
      })
  }
  return _csrfInitPromise
}

api.interceptors.request.use(async (config) => {
  const method = config.method?.toLowerCase()

  if (method && MUTATING_METHODS.has(method) && !getCsrfToken() && !skipCsrfPrefetch(config.url)) {
    try {
      await ensureCsrfToken()
    } catch {
      /* allow request to proceed; server may skip CSRF when no refresh cookie */
    }
  }

  const token = getAccessToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  const csrfToken = getCsrfToken()
  if (csrfToken && method && MUTATING_METHODS.has(method)) {
    config.headers['X-CSRF-Token'] = csrfToken
  }

  return config
})

let refreshPromise = null

api.interceptors.response.use(
  (response) => {
    const csrfToken = response.headers['x-csrf-token']
    if (csrfToken) setCsrfToken(csrfToken)
    return response
  },
  async (err) => {
    const original = err.config
    const isAuthRoute =
      original?.url?.includes('/api/auth/login') ||
      original?.url?.includes('/api/auth/refresh')

    if (err.response?.status === 401 && original && !original._retry && !isAuthRoute) {
      original._retry = true
      if (!refreshPromise) {
        refreshPromise = api
          .post('/api/auth/refresh')
          .then((res) => {
            setAccessToken(res.data.token)
            return res
          })
          .finally(() => {
            refreshPromise = null
          })
      }
      try {
        await refreshPromise
        original.headers.Authorization = `Bearer ${getAccessToken()}`
        const csrfToken = getCsrfToken()
        if (csrfToken) original.headers['X-CSRF-Token'] = csrfToken
        return api(original)
      } catch (refreshErr) {
        console.warn('[auth] Token refresh failed:', refreshErr.message)
        notifySessionExpired()
      }
    }

    return Promise.reject(formatApiError(err))
  }
)

export default api
