import { motion } from 'framer-motion'

export default function Loader({ label = 'Loading' }) {
  return (
    <div className="flex min-h-[160px] flex-col items-center justify-center gap-3 py-10">
      <motion.div
        className="h-12 w-12 rounded-full border-2 border-white/10 border-t-nb-neon-orange border-r-nb-gold"
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 0.9, ease: 'linear' }}
      />
      <p className="text-sm text-nb-gray">{label}</p>
    </div>
  )
}
