import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { FiBell, FiCalendar, FiCheck, FiMail, FiPackage, FiShoppingBag, FiUsers } from 'react-icons/fi'
import { notificationService } from '../../services/notificationService.js'
import { formatDate } from '../../utils/helpers.js'

function notificationIcon(type) {
  switch (type) {
    case 'reservation':
      return FiCalendar
    case 'order':
      return FiShoppingBag
    case 'user':
      return FiUsers
    case 'inventory':
      return FiPackage
    default:
      return FiMail
  }
}

export function getNotificationLink(notification) {
  const { type, meta = {} } = notification
  switch (type) {
    case 'reservation':
      return '/dashboard/reservations'
    case 'order':
      return meta.orderId ? `/dashboard/orders` : '/dashboard/orders'
    case 'user':
      return '/dashboard/users'
    case 'inventory':
      return '/dashboard/inventory'
    case 'payment':
      return '/dashboard/settings'
    default:
      return meta.messageId ? '/dashboard/messages' : '/dashboard/messages'
  }
}

export default function NotificationDropdown() {
  const navigate = useNavigate()
  const rootRef = useRef(null)
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState([])
  const [unread, setUnread] = useState(0)
  const [loading, setLoading] = useState(false)

  const refresh = useCallback(async () => {
    try {
      const data = await notificationService.list()
      const list = data.items || []
      setItems(list)
      setUnread(list.filter((n) => !n.read).length)
    } catch {
      /* ignore polling errors */
    }
  }, [])

  useEffect(() => {
    refresh()
    const t = setInterval(refresh, 60000)
    return () => clearInterval(t)
  }, [refresh])

  useEffect(() => {
    if (!open) return undefined
    const onDocClick = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    const onEscape = (e) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    document.addEventListener('keydown', onEscape)
    return () => {
      document.removeEventListener('mousedown', onDocClick)
      document.removeEventListener('keydown', onEscape)
    }
  }, [open])

  async function openPanel() {
    setOpen((v) => !v)
    if (!open) {
      setLoading(true)
      await refresh()
      setLoading(false)
    }
  }

  async function onSelect(notification) {
    if (!notification.read) {
      try {
        await notificationService.markRead(notification._id)
      } catch {
        /* continue navigation */
      }
    }
    setOpen(false)
    await refresh()
    navigate(getNotificationLink(notification))
  }

  async function onMarkAllRead() {
    try {
      await notificationService.markAllRead()
      await refresh()
    } catch {
      /* ignore */
    }
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-nb-white transition hover:border-nb-neon-orange/40 hover:bg-white/10"
        onClick={openPanel}
        aria-label={unread > 0 ? `${unread} unread notifications` : 'Notifications'}
        aria-expanded={open}
        aria-haspopup="true"
      >
        <FiBell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-nb-neon-red px-1 text-[10px] font-bold text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.18 }}
            className="absolute right-0 z-50 mt-2 w-[min(92vw,360px)] overflow-hidden rounded-2xl border border-white/10 bg-nb-surface shadow-glass"
            role="dialog"
            aria-label="Notifications"
          >
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
              <div>
                <p className="font-heading text-sm font-bold text-nb-white">Notifications</p>
                <p className="text-xs text-nb-gray">
                  {unread > 0 ? `${unread} unread` : 'All caught up'}
                </p>
              </div>
              {unread > 0 && (
                <button
                  type="button"
                  onClick={onMarkAllRead}
                  className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-nb-neon-orange transition hover:bg-white/5"
                >
                  <FiCheck className="h-3.5 w-3.5" />
                  Mark all read
                </button>
              )}
            </div>

            <div className="scrollbar-thin max-h-[min(70vh,420px)] overflow-y-auto">
              {loading ? (
                <p className="px-4 py-8 text-center text-sm text-nb-gray">Loading…</p>
              ) : items.length === 0 ? (
                <p className="px-4 py-8 text-center text-sm text-nb-gray">No notifications yet</p>
              ) : (
                <ul className="divide-y divide-white/5">
                  {items.map((n) => {
                    const Icon = notificationIcon(n.type)
                    return (
                      <li key={n._id}>
                        <button
                          type="button"
                          onClick={() => onSelect(n)}
                          className={`flex w-full gap-3 px-4 py-3 text-left transition hover:bg-white/5 ${
                            !n.read ? 'bg-nb-neon-orange/5' : ''
                          }`}
                        >
                          <span
                            className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${
                              !n.read
                                ? 'border-nb-neon-orange/40 bg-nb-neon-orange/15 text-nb-neon-orange'
                                : 'border-white/10 bg-white/5 text-nb-gray'
                            }`}
                          >
                            <Icon className="h-4 w-4" />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="flex items-start justify-between gap-2">
                              <span className={`text-sm ${!n.read ? 'font-semibold text-nb-white' : 'text-nb-cream'}`}>
                                {n.title}
                              </span>
                              {!n.read && (
                                <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-nb-neon-orange" aria-hidden />
                              )}
                            </span>
                            {n.body && (
                              <span className="mt-0.5 line-clamp-2 block text-xs text-nb-gray">{n.body}</span>
                            )}
                            <span className="mt-1 block text-[10px] uppercase tracking-wide text-nb-gray/80">
                              {formatDate(n.createdAt)}
                            </span>
                          </span>
                        </button>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
