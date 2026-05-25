import { motion, AnimatePresence } from 'framer-motion'
import { FiX } from 'react-icons/fi'
import Button from './Button.jsx'
import { cn } from '../../utils/helpers.js'

export default function Modal({ open, title, children, onClose, footer, wide, sheet }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className={cn(
            'fixed inset-0 z-[80] flex justify-center',
            sheet ? 'items-stretch p-0 sm:items-center sm:p-3' : 'items-end p-3 sm:items-center'
          )}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <button type="button" aria-label="Close modal" className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
            initial={{ opacity: 0, y: sheet ? 0 : 24, scale: sheet ? 1 : 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: sheet ? 0 : 18, scale: sheet ? 1 : 0.98 }}
            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
            className={cn(
              'relative z-[81] flex w-full flex-col overflow-hidden border-white/10 bg-nb-surface shadow-glass',
              sheet
                ? 'h-[100dvh] max-h-[100dvh] border-0 sm:h-auto sm:max-h-[min(90dvh,900px)] sm:rounded-2xl sm:border'
                : 'max-h-[90dvh] rounded-t-2xl border sm:rounded-2xl',
              wide ? 'sm:max-w-3xl' : 'sm:max-w-lg'
            )}
          >
            <div className="flex shrink-0 items-center justify-between border-b border-white/10 px-4 py-3.5 sm:px-5 sm:py-4">
              <h2 id="modal-title" className="font-heading text-lg font-bold text-nb-white sm:text-xl">
                {title}
              </h2>
              <Button variant="ghost" size="sm" className="!min-h-[44px] !min-w-[44px] !p-2" onClick={onClose} aria-label="Close">
                <FiX className="h-5 w-5" />
              </Button>
            </div>
            <div
              className={cn(
                'scrollbar-thin flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-5',
                sheet ? 'pb-4' : 'max-h-[calc(90dvh-8rem)]'
              )}
            >
              {children}
            </div>
            {footer && (
              <div
                className={cn(
                  'shrink-0 border-t border-white/10 bg-nb-surface/95 backdrop-blur-md',
                  'px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-5'
                )}
              >
                {footer}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
