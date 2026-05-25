import { NavLink, useLocation } from 'react-router-dom'
import { FiLogOut } from 'react-icons/fi'
import { NAV_ITEMS, canAccessNav } from '../../utils/constants.js'
import { useAuth } from '../../context/AuthContext.jsx'

export default function MobileSidebar({ onNavigate }) {
  const { user, logout } = useAuth()
  const location = useLocation()
  const items = NAV_ITEMS.filter((n) => user && canAccessNav(user.role, n.minRoles))

  return (
    <div className="flex flex-1 flex-col overflow-y-auto px-3 py-4 scrollbar-thin">
      <nav className="space-y-1">
        {items.map((item) => {
          const Icon = item.icon
          const active = location.pathname === item.to || location.pathname.startsWith(`${item.to}/`)
          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => onNavigate?.()}
              className={() =>
                [
                  'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition',
                  active ? 'bg-white/10 text-nb-white' : 'text-nb-gray hover:bg-white/[0.05] hover:text-nb-white',
                ].join(' ')
              }
            >
              <Icon className={`h-5 w-5 ${active ? 'text-nb-neon-orange' : ''}`} />
              {item.label}
            </NavLink>
          )
        })}
      </nav>
      <button
        type="button"
        onClick={logout}
        className="mt-6 flex items-center justify-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-sm text-nb-gray hover:text-nb-neon-red"
      >
        <FiLogOut /> Sign out
      </button>
    </div>
  )
}
