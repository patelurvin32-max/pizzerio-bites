import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiCheck } from 'react-icons/fi'
import Card from '../../components/common/Card.jsx'
import Button from '../../components/common/Button.jsx'
import Loader from '../../components/common/Loader.jsx'
import { getNotificationLink, notificationIcon } from '../../components/layout/NotificationDropdown.jsx'
import { notificationService } from '../../services/notificationService.js'
import { formatDate } from '../../utils/helpers.js'

export default function Notifications() {
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const unread = items.filter((n) => !n.read).length

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const data = await notificationService.list()
      setItems(data.items || [])
    } catch {
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  async function onSelect(notification) {
    if (!notification.read) {
      try {
        await notificationService.markRead(notification._id)
      } catch {
        /* continue navigation */
      }
    }
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
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold text-nb-white">Notifications</h1>
          <p className="text-sm text-nb-gray">
            {unread > 0 ? `${unread} unread notification${unread === 1 ? '' : 's'}` : 'All caught up'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {unread > 0 && (
            <Button variant="ghost" onClick={onMarkAllRead}>
              <FiCheck className="mr-1.5 h-4 w-4" />
              Mark all read
            </Button>
          )}
          <Button variant="ghost" onClick={refresh}>
            Refresh
          </Button>
        </div>
      </div>

      <Card className="overflow-hidden p-0">
        {loading ? (
          <Loader />
        ) : items.length === 0 ? (
          <p className="px-4 py-12 text-center text-sm text-nb-gray">No notifications yet</p>
        ) : (
          <ul className="divide-y divide-white/5">
            {items.map((n) => {
              const Icon = notificationIcon(n.type)
              return (
                <li key={n._id}>
                  <button
                    type="button"
                    onClick={() => onSelect(n)}
                    className={`flex w-full gap-3 px-4 py-4 text-left transition hover:bg-white/5 sm:px-6 ${
                      !n.read ? 'bg-nb-neon-orange/5' : ''
                    }`}
                  >
                    <span
                      className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${
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
                      {n.body && <span className="mt-1 block text-sm text-nb-gray">{n.body}</span>}
                      <span className="mt-1.5 block text-[10px] uppercase tracking-wide text-nb-gray/80">
                        {formatDate(n.createdAt)}
                      </span>
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </Card>
    </div>
  )
}
