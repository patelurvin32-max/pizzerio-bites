import { Outlet, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import Sidebar from './Sidebar.jsx'
import Navbar from './Navbar.jsx'
import Footer from './Footer.jsx'
import BottomNav from './BottomNav.jsx'
import { pageTransition } from '../../utils/animations.js'

export default function DashboardLayout() {
  const location = useLocation()
  return (
    <div className="flex min-h-screen bg-nb-bg">
      <Sidebar />
      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <Navbar />
        <motion.main
          key={location.pathname}
          variants={pageTransition}
          initial="initial"
          animate="animate"
          exit="exit"
          className="flex-1 px-4 py-6 sm:px-6 lg:px-8"
        >
          <Outlet />
        </motion.main>
        <div className="pb-20 lg:pb-0">
          <Footer />
        </div>
        <BottomNav />
      </div>
    </div>
  )
}
