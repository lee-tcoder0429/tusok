import { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import Banderitas from './Banderitas.jsx'
import { useStore } from '../store.jsx'

const LINKS = [
  { to: '/menu', label: 'Menu' },
  { to: { pathname: '/', hash: '#kwento' }, label: 'Kwento' },
  { to: '/orders', label: 'Mga order' },
  { to: '/v?promo=TUSOK50', label: 'Promo' },
  { to: '/board', label: 'Board' },
]

export function BilaoIcon({ size = 22 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true" focusable="false">
      <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2.4" />
      <path d="M5 8l14 8M5 16l14-8M12 2.5v19" stroke="currentColor" strokeWidth="1.6" fill="none" opacity="0.7" />
    </svg>
  )
}

export default function Header() {
  const { count, bump } = useStore()
  const [open, setOpen] = useState(false)
  const loc = useLocation()
  const btn = useRef(null)

  useEffect(() => { setOpen(false) }, [loc])
  useEffect(() => {
    if (!open) return
    const onKey = (e) => { if (e.key === 'Escape') { setOpen(false); btn.current?.focus() } }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <header className="relative z-40">
      <Banderitas />
      <div className="mx-auto flex max-w-6xl items-center gap-2 px-4 py-3">
        <Link to="/" className="display rounded-lg text-3xl text-cream" aria-label="TUSOK — Home">TUSOK<span className="text-yellow">.</span></Link>

        <nav id="top-menu" aria-label="Main" className="ml-6 hidden gap-1 md:flex">
          {LINKS.map((l) => (
            <Link key={l.label} to={l.to} className="flex min-h-11 items-center rounded-full px-4 font-bold text-cream hover:bg-ink/25">{l.label}</Link>
          ))}
        </nav>

        <Link
          id="bilao-pill" to="/checkout"
          className="btn btn-yellow ml-auto !px-4"
          aria-label={`Bilao, ${count} ${count === 1 ? 'item' : 'items'}. Pumunta sa checkout`}
        >
          <span key={bump} className={bump ? 'bump items-center gap-2' : 'inline-flex items-center gap-2'}>
            <BilaoIcon /> Bilao <span className="min-w-6 rounded-full bg-ink px-2 py-0.5 text-center text-sm text-cream">{count}</span>
          </span>
        </Link>

        <button
          ref={btn} id="hamburger" type="button"
          className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-cream text-cream md:hidden"
          aria-expanded={open} aria-controls="mobile-menu" aria-label={open ? 'Isara ang menu' : 'Buksan ang menu'}
          onClick={() => setOpen((o) => !o)}
        >
          <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
            {open
              ? <path d="M5 5l14 14M19 5L5 19" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
              : <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />}
          </svg>
        </button>
      </div>

      {open && (
        <nav id="mobile-menu" aria-label="Mobile" className="sheet-in absolute inset-x-3 top-full rounded-[26px] bg-ink p-3 md:hidden">
          <ul>
            {[...LINKS, { to: '/patterns', label: 'HCI Patterns' }].map((l) => (
              <li key={l.label}>
                <Link to={l.to} className="display flex min-h-12 items-center rounded-2xl px-4 text-2xl text-cream hover:bg-cream/10">{l.label}</Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  )
}
