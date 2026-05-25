export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-nb-surface/40 px-4 py-3 text-center text-xs text-nb-gray backdrop-blur sm:px-6">
      <span className="text-nb-white/80">Pizzerio Bites</span> · Admin Panel · {new Date().getFullYear()}
    </footer>
  )
}
