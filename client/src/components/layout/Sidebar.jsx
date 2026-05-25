import { motion } from 'framer-motion'
import { NavLink, useLocation } from 'react-router-dom'
import { FiLogOut } from 'react-icons/fi'
import { NAV_ITEMS, canAccessNav } from '../../utils/constants.js'
import { useAuth } from '../../context/AuthContext.jsx'
import { fadeUp } from '../../utils/animations.js'
import { cn } from '../../utils/helpers.js'

export default function Sidebar({ onNavigate }) {
  const { user, logout } = useAuth()
  const location = useLocation()

  const items = NAV_ITEMS.filter((n) => user && canAccessNav(user.role, n.minRoles))

  return (
    <aside className="hidden h-full w-64 shrink-0 flex-col border-r border-white/10 bg-nb-surface/80 py-6 backdrop-blur-xl lg:flex">
      <div className="px-5">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-nb-neon-orange to-nb-neon-red text-sm font-black text-nb-bg shadow-neon-sm">
            PB
          </div>
          <div>
            <p className="font-heading text-sm font-bold text-nb-white">Pizzerio Bites</p>
            <p className="text-xs text-nb-gray">Admin Panel</p>
          </div>
        </div>
      </div>

      <nav className="mt-8 flex-1 space-y-1 overflow-y-auto px-3 scrollbar-thin">
        {items.map((item, idx) => {
          const Icon = item.icon
          const active =
            location.pathname === item.to || (item.to !== '/dashboard' && location.pathname.startsWith(`${item.to}`))
          return (
            <motion.div key={item.to} variants={fadeUp} initial="initial" animate="animate" transition={{ delay: idx * 0.03 }}>
              <NavLink
                to={item.to}
                onClick={() => onNavigate?.()}
                className={() =>
                  cn(
                    'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition',
                    active
                      ? 'bg-gradient-to-r from-nb-neon-orange/25 to-transparent text-nb-white neon-ring'
                      : 'text-nb-gray hover:bg-white/[0.04] hover:text-nb-white'
                  )
                }
              >
                <Icon className={cn('h-5 w-5', active ? 'text-nb-neon-orange' : 'text-nb-gray group-hover:text-nb-neon-orange')} />
                <span className="font-medium">{item.label}</span>
              </NavLink>
            </motion.div>
          )
        })}
      </nav>

      <div className="mt-auto space-y-2 border-t border-white/10 px-4 pt-4">
        <div className="rounded-xl border border-white/10 bg-black/30 px-3 py-2">
          <p className="truncate text-sm font-semibold text-nb-white">{user?.name}</p>
          <p className="truncate text-xs text-nb-gray">{user?.role?.replaceAll('_', ' ')}</p>
        </div>
        <button
          type="button"
          onClick={logout}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-nb-gray transition hover:border-nb-neon-red/40 hover:text-nb-neon-red"
        >
          <FiLogOut /> Sign out
        </button>
      </div>
    </aside>
  )
}
