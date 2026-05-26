import { NavLink, useLocation } from 'react-router-dom'
import { NAV_ITEMS, canAccessNav } from '../../utils/constants.js'
import { useAuth } from '../../context/AuthContext.jsx'
import { cn } from '../../utils/helpers.js'

const MOBILE_SHORTLIST = ['/dashboard', '/dashboard/orders', '/dashboard/inventory', '/dashboard/reservations', '/dashboard/menu', '/dashboard/settings']

export default function BottomNav() {
  const { user } = useAuth()
  const location = useLocation()
  if (!user) return null

  const items = NAV_ITEMS.filter(
    (n) => canAccessNav(user.role, n.minRoles) && MOBILE_SHORTLIST.includes(n.to)
  )

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-white/10 bg-nb-bg/90 px-2 py-2 backdrop-blur-xl lg:hidden">
      <div className="mx-auto flex max-w-lg items-stretch justify-between gap-1">
        {items.map((item) => {
          const Icon = item.icon
          const active =
            location.pathname === item.to || (item.to !== '/dashboard' && location.pathname.startsWith(item.to))
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={cn(
                'flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-xl px-1 py-1.5 text-[10px] font-semibold uppercase tracking-wide',
                active ? 'text-nb-neon-orange' : 'text-nb-gray'
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="truncate">{item.label}</span>
            </NavLink>
          )
        })}
      </div>
    </nav>
  )
}
