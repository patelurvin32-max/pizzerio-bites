import axios from 'axios'

let _accessToken = null
let _csrfToken = null

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

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
  timeout: 25000,
  withCredentials: true,
})

api.interceptors.request.use(async (config) => {
  const method = config.method?.toLowerCase()

  if (method && MUTATING_METHODS.has(method) && !getCsrfToken()) {
    await api.get('/api/health')
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
      } catch {
        setAccessToken(null)
      }
    }

    const msg = err.response?.data?.message || err.message || 'Request failed'
    return Promise.reject(new Error(msg))
  }
)

export default api
