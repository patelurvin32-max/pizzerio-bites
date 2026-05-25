import { useAuth } from '../context/AuthContext.jsx'

export function useAuthGuard() {
  return useAuth()
}
