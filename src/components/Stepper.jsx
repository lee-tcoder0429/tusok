export default function Stepper({ value, onChange, min = 1, max = 20, label }) {
  const b = 'flex h-11 w-11 items-center justify-center rounded-full border-2 border-ink text-xl font-bold disabled:opacity-40'
  return (
    <div className="inline-flex items-center gap-1" role="group" aria-label={`Dami ng ${label}`}>
      <button type="button" className={b} onClick={() => onChange(value - 1)} disabled={value <= min} aria-label={`Bawasan ang ${label}`}>−</button>
      <span className="w-8 text-center text-lg font-bold" aria-live="polite">{value}</span>
      <button type="button" className={b} onClick={() => onChange(value + 1)} disabled={value >= max} aria-label={`Dagdagan ang ${label}`}>+</button>
    </div>
  )
}
