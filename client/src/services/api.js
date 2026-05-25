import axios from 'axios'

const TOKEN_KEY = 'pb_admin_token'

export function getAccessToken() {
  return sessionStorage.getItem(TOKEN_KEY)
}

export function setAccessToken(token) {
  if (token) sessionStorage.setItem(TOKEN_KEY, token)
  else sessionStorage.removeItem(TOKEN_KEY)
}

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
  timeout: 25000,
  withCredentials: true,
})

api.interceptors.request.use((config) => {
  const token = getAccessToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

let refreshPromise = null

api.interceptors.response.use(
  (r) => r,
  async (err) => {
    const original = err.config
    const isAuthRoute =
      original?.url?.includes('/api/auth/login') ||
      original?.url?.includes('/api/auth/refresh') ||
      original?.url?.includes('/api/auth/forgot-password') ||
      original?.url?.includes('/api/auth/reset-password')

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
