import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext.jsx'
import { ThemeProvider } from './context/ThemeContext.jsx'
import { NotificationProvider } from './context/NotificationContext.jsx'
import AppRoutes from './routes/AppRoutes.jsx'
import AttendancePopup from './components/attendance/AttendancePopup.jsx'
import { useAuth } from './context/AuthContext.jsx'

function AppContent() {
  const { showAttendancePopup, setShowAttendancePopup, todayAttendance } = useAuth()

  return (
    <>
      <AppRoutes />
      <AttendancePopup
        isOpen={showAttendancePopup}
        onClose={() => setShowAttendancePopup(false)}
        initialAttendance={todayAttendance}
      />
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ThemeProvider>
          <NotificationProvider>
            <AppContent />
          </NotificationProvider>
        </ThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
