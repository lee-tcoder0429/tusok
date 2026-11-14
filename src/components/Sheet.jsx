import { useEffect, useId, useRef } from 'react'
import { createPortal } from 'react-dom'

const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])'

// Bottom sheet on phones, centered modal on wider screens. Traps focus, closes on Esc / backdrop.
export default function Sheet({ open, onClose, title, children, locked = false }) {
  const ref = useRef(null)
  const closeRef = useRef(onClose)
  closeRef.current = onClose
  const lockedRef = useRef(locked)
  lockedRef.current = locked
  const id = useId()

  useEffect(() => {
    if (!open) return
    const prev = document.activeElement
    const el = ref.current
    const items = () => [...el.querySelectorAll(FOCUSABLE)]
    ;(items()[1] || items()[0] || el).focus()
    const onKey = (e) => {
      if (e.key === 'Escape') { if (!lockedRef.current) closeRef.current() }
      else if (e.key === 'Tab') {
        const f = items()
        if (!f.length) { e.preventDefault(); return }
        const first = f[0], last = f[f.length - 1]
        if (!el.contains(document.activeElement)) { e.preventDefault(); first.focus() }
        else if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
      }
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
      prev?.focus?.()
    }
  }, [open])

  if (!open) return null
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-ink/75" onClick={() => !locked && onClose()} />
      <div
        ref={ref} role="dialog" aria-modal="true" aria-labelledby={id} tabIndex={-1}
        className="sheet-in on-light relative max-h-[88dvh] w-full overflow-y-auto rounded-t-[28px] bg-cream p-5 pb-8 text-ink sm:max-w-md sm:rounded-[28px]"
      >
        <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-ink/25 sm:hidden" aria-hidden="true" />
        <div className="mb-3 flex items-start justify-between gap-3">
          <h2 id={id} className="display text-3xl">{title}</h2>
          <button type="button" onClick={onClose} disabled={locked} aria-label="Isara" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 border-ink">
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M5 5l14 14M19 5L5 19" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" /></svg>
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body,
  )
}
