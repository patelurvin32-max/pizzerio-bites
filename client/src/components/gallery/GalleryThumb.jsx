export default function GalleryThumb({ src, title }) {
  return (
    <div className="group relative overflow-hidden rounded-xl border border-white/10">
      <img src={src} alt={title || ''} className="h-24 w-full object-cover transition duration-500 group-hover:scale-105" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 transition group-hover:opacity-100" />
    </div>
  )
}
