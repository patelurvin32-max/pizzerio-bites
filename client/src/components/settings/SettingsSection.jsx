export default function SettingsSection({ title, description, children }) {
  return (
    <section className="space-y-3 rounded-2xl border border-white/10 bg-nb-surface/60 p-4 sm:p-5">
      <header>
        <h3 className="font-heading text-base font-bold text-nb-white">{title}</h3>
        {description && <p className="text-sm text-nb-gray">{description}</p>}
      </header>
      {children}
    </section>
  )
}
