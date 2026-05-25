import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import Loader from '../components/common/Loader.jsx'
import ProtectedRoute from './ProtectedRoute.jsx'
import RoleRoute from './RoleRoute.jsx'
import DashboardLayout from '../components/layout/DashboardLayout.jsx'
import { ROLES } from '../utils/constants.js'

const Login = lazy(() => import('../pages/auth/Login.jsx'))
const ForgotPassword = lazy(() => import('../pages/auth/ForgotPassword.jsx'))
const ResetPassword = lazy(() => import('../pages/auth/ResetPassword.jsx'))

const Dashboard = lazy(() => import('../pages/dashboard/Dashboard.jsx'))
const Users = lazy(() => import('../pages/dashboard/Users.jsx'))
const Staff = lazy(() => import('../pages/dashboard/Staff.jsx'))
const Menu = lazy(() => import('../pages/dashboard/Menu.jsx'))
const Orders = lazy(() => import('../pages/dashboard/Orders.jsx'))
const Reservations = lazy(() => import('../pages/dashboard/Reservations.jsx'))
const Offers = lazy(() => import('../pages/dashboard/Offers.jsx'))
const Categories = lazy(() => import('../pages/dashboard/Categories.jsx'))
const Gallery = lazy(() => import('../pages/dashboard/Gallery.jsx'))
const Reviews = lazy(() => import('../pages/dashboard/Reviews.jsx'))
const Messages = lazy(() => import('../pages/dashboard/Messages.jsx'))
const Analytics = lazy(() => import('../pages/dashboard/Analytics.jsx'))
const Settings = lazy(() => import('../pages/dashboard/Settings.jsx'))
const CMS = lazy(() => import('../pages/dashboard/CMS.jsx'))
const Inventory = lazy(() => import('../pages/dashboard/Inventory.jsx'))

const mgmt = [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER]
const adminUp = [ROLES.SUPER_ADMIN, ROLES.ADMIN]

function SuspensePage({ children }) {
  return <Suspense fallback={<Loader label="Loading module" />}>{children}</Suspense>
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <SuspensePage>
            <Login />
          </SuspensePage>
        }
      />
      <Route
        path="/forgot-password"
        element={
          <SuspensePage>
            <ForgotPassword />
          </SuspensePage>
        }
      />
      <Route
        path="/reset-password"
        element={
          <SuspensePage>
            <ResetPassword />
          </SuspensePage>
        }
      />

      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route
            path="/dashboard"
            element={
              <SuspensePage>
                <Dashboard />
              </SuspensePage>
            }
          />
          <Route
            path="/dashboard/orders"
            element={
              <SuspensePage>
                <Orders />
              </SuspensePage>
            }
          />
          <Route
            path="/dashboard/reservations"
            element={
              <SuspensePage>
                <Reservations />
              </SuspensePage>
            }
          />
          <Route
            path="/dashboard/messages"
            element={
              <SuspensePage>
                <Messages />
              </SuspensePage>
            }
          />
          <Route
            path="/dashboard/gallery"
            element={
              <SuspensePage>
                <Gallery />
              </SuspensePage>
            }
          />
          <Route
            path="/dashboard/reviews"
            element={
              <SuspensePage>
                <Reviews />
              </SuspensePage>
            }
          />
          <Route
            path="/dashboard/analytics"
            element={
              <SuspensePage>
                <RoleRoute roles={mgmt}>
                  <Analytics />
                </RoleRoute>
              </SuspensePage>
            }
          />
          <Route
            path="/dashboard/menu"
            element={
              <SuspensePage>
                <RoleRoute roles={mgmt}>
                  <Menu />
                </RoleRoute>
              </SuspensePage>
            }
          />
          <Route
            path="/dashboard/categories"
            element={
              <SuspensePage>
                <RoleRoute roles={mgmt}>
                  <Categories />
                </RoleRoute>
              </SuspensePage>
            }
          />
          <Route
            path="/dashboard/offers"
            element={
              <SuspensePage>
                <RoleRoute roles={mgmt}>
                  <Offers />
                </RoleRoute>
              </SuspensePage>
            }
          />
          <Route
            path="/dashboard/staff"
            element={
              <SuspensePage>
                <RoleRoute roles={mgmt}>
                  <Staff />
                </RoleRoute>
              </SuspensePage>
            }
          />
          <Route
            path="/dashboard/inventory"
            element={
              <SuspensePage>
                <RoleRoute roles={mgmt}>
                  <Inventory />
                </RoleRoute>
              </SuspensePage>
            }
          />
          <Route
            path="/dashboard/users"
            element={
              <SuspensePage>
                <RoleRoute roles={adminUp}>
                  <Users />
                </RoleRoute>
              </SuspensePage>
            }
          />
          <Route
            path="/dashboard/cms"
            element={
              <SuspensePage>
                <RoleRoute roles={mgmt}>
                  <CMS />
                </RoleRoute>
              </SuspensePage>
            }
          />
          <Route
            path="/dashboard/settings"
            element={
              <SuspensePage>
                <RoleRoute roles={mgmt}>
                  <Settings />
                </RoleRoute>
              </SuspensePage>
            }
          />
        </Route>
      </Route>

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
