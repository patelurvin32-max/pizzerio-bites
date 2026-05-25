import { cn } from '../../utils/helpers.js'

export default function Table({ children, className }) {
  return (
    <div className={cn('scrollbar-thin w-full overflow-x-auto rounded-2xl border border-white/10 bg-nb-surface/60', className)}>
      <table className="min-w-[720px] w-full border-collapse text-left text-sm">{children}</table>
    </div>
  )
}

export function Th({ children, className }) {
  return <th className={cn('border-b border-white/10 bg-white/[0.04] px-4 py-3 font-heading text-xs font-semibold uppercase tracking-wide text-nb-gray', className)}>{children}</th>
}

export function Td({ children, className }) {
  return <td className={cn('border-b border-white/5 px-4 py-3 text-nb-white/90', className)}>{children}</td>
}

export function Tr({ children, className }) {
  return <tr className={cn('hover:bg-white/[0.03]', className)}>{children}</tr>
}
