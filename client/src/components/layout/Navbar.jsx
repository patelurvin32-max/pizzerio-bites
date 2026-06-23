import { AnimatePresence, motion } from 'framer-motion'
import { FiMenu, FiX } from 'react-icons/fi'
import { useState } from 'react'
import { useAuth } from '../../context/AuthContext.jsx'
import MobileSidebar from './MobileSidebar.jsx'
import NotificationDropdown from './NotificationDropdown.jsx'

export default function Navbar() {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-white/10 bg-nb-bg/70 backdrop-blur-xl">
        <div className="flex items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-nb-white lg:hidden"
              onClick={() => setOpen(true)}
              aria-label="Open menu"
            >
              <FiMenu className="h-5 w-5" />
            </button>
            <div>
              <p className="font-heading text-sm font-bold text-nb-white sm:text-base">Pizzerio Bites Admin</p>
              {/* <p className="hidden text-xs text-nb-gray sm:block">Premium operations</p> */}
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {user && <NotificationDropdown />}
            <div className="hidden h-10 w-10 items-center justify-center rounded-full border border-nb-neon-orange/40 bg-gradient-to-br from-nb-neon-orange/30 to-nb-neon-red/20 text-xs font-bold text-nb-white sm:flex">
              {user?.name?.slice(0, 2)?.toUpperCase()}
            </div>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {open && (
          <motion.div className="fixed inset-0 z-50 lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <button type="button" className="absolute inset-0 bg-black/70 backdrop-blur-sm" aria-label="Close menu" onClick={() => setOpen(false)} />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 380, damping: 34 }}
              className="absolute left-0 top-0 flex h-full w-[min(88vw,320px)] flex-col border-r border-white/10 bg-nb-surface shadow-glass"
            >
              <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
                <span className="font-heading text-sm font-bold">Menu</span>
                <button type="button" className="rounded-lg p-2 text-nb-gray hover:text-nb-white" onClick={() => setOpen(false)} aria-label="Close">
                  <FiX className="h-5 w-5" />
                </button>
              </div>
              <MobileSidebar onNavigate={() => setOpen(false)} />
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
