import { Navigate, Outlet } from 'react-router-dom'
import Loader from '../components/common/Loader.jsx'
import { useAuth } from '../context/AuthContext.jsx'

export default function ProtectedRoute() {
  const { loading, isAuthenticated } = useAuth()
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-nb-bg">
        <Loader label="Authenticating" />
      </div>
    )
  }
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  return <Outlet />
}
