import { useStore } from '../store.jsx'

export default function Toasts() {
  const { toasts, dismiss } = useStore()
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-20 z-[60] flex flex-col items-center gap-2 px-4" role="status" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className="toast-in on-dark pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-full bg-ink py-2 pl-5 pr-2 font-bold text-cream shadow-[0_4px_0_rgb(0_0_0/0.3)]">
          <span className="flex-1 py-1.5">{t.msg}</span>
          {t.action && (
            <button type="button" className="min-h-11 rounded-full bg-yellow px-4 font-bold text-ink" onClick={() => { t.action.fn(); dismiss(t.id) }}>
              {t.action.label}
            </button>
          )}
        </div>
      ))}
    </div>
  )
}
