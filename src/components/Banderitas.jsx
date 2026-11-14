const COLORS = ['#FFC531', '#BE185D', '#FFF4E0', '#1D4ED8', '#FF6A13']

export default function Banderitas({ count = 13 }) {
  return (
    <div className="flex w-full overflow-hidden bg-ink/25 pb-1" aria-hidden="true">
      <div className="flex w-full border-t-[3px] border-cream/80">
        {Array.from({ length: count }, (_, i) => (
          <span
            key={i}
            className="flag block h-6 flex-1"
            style={{ background: COLORS[i % COLORS.length], clipPath: 'polygon(6% 0, 94% 0, 50% 100%)' }}
          />
        ))}
      </div>
    </div>
  )
}
