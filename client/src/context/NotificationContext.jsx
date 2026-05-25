import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { FiCheckCircle, FiAlertTriangle, FiInfo } from 'react-icons/fi'

const NotificationContext = createContext(null)

let idSeq = 0

export function NotificationProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const push = useCallback((toast) => {
    const id = ++idSeq
    const item = { id, type: toast.type || 'info', title: toast.title, message: toast.message || '' }
    setToasts((t) => [...t, item])
    const duration = toast.duration ?? 4200
    if (duration > 0) {
      setTimeout(() => {
        setToasts((t) => t.filter((x) => x.id !== id))
      }, duration)
    }
    return id
  }, [])

  const dismiss = useCallback((id) => {
    setToasts((t) => t.filter((x) => x.id !== id))
  }, [])

  const value = useMemo(() => ({ push, dismiss, success: (m) => push({ type: 'success', title: 'Success', message: m }), error: (m) => push({ type: 'error', title: 'Error', message: m }), info: (m) => push({ type: 'info', title: 'Notice', message: m }) }), [push])

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[100] flex flex-col items-center gap-2 px-3 sm:items-end sm:pr-6">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: 16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.96 }}
              className="pointer-events-auto w-full max-w-md"
            >
              <button
                type="button"
                onClick={() => dismiss(t.id)}
                className="glass-panel neon-ring flex w-full items-start gap-3 rounded-2xl px-4 py-3 text-left"
              >
                <span className="mt-0.5 text-nb-neon-orange">
                  {t.type === 'success' && <FiCheckCircle className="h-5 w-5" />}
                  {t.type === 'error' && <FiAlertTriangle className="h-5 w-5 text-nb-neon-red" />}
                  {t.type === 'info' && <FiInfo className="h-5 w-5 text-nb-gold" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="font-heading text-sm font-semibold text-nb-white">{t.title}</span>
                  {t.message && <p className="mt-0.5 text-sm text-nb-gray">{t.message}</p>}
                </span>
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </NotificationContext.Provider>
  )
}

export function useNotify() {
  const ctx = useContext(NotificationContext)
  if (!ctx) throw new Error('useNotify must be used within NotificationProvider')
  return ctx
}
