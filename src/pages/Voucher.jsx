import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import Banderitas from '../components/Banderitas.jsx'
import { useStore, VOUCHERS } from '../store.jsx'
import { sendEmail } from '../lib/email.js'
import { VOUCHER_URL, reducedMotion, vibrate } from '../lib/util.js'

gsap.registerPlugin(useGSAP)

const TAPS = 3
const CRACKS = ['M50 16l-5 14 9 8-7 12', 'M22 48l14 4 6-8 12 6', 'M78 58l-13 2-4 10-10 3']
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const FLAG_COLORS = ['#FFC531', '#BE185D', '#FFF4E0', '#1D4ED8', '#FF6A13']

async function fireConfetti() {
  if (reducedMotion()) return
  try {
    const { default: confetti } = await import('canvas-confetti')
    let shapes
    try { shapes = [confetti.shapeFromPath({ path: 'M0 0 L10 0 L5 10 Z' })] } catch { shapes = ['square'] }
    const base = { colors: FLAG_COLORS, shapes, scalar: 1.5, disableForReducedMotion: true, ticks: 220 }
    confetti({ ...base, particleCount: 90, spread: 80, origin: { y: 0.55 } })
    setTimeout(() => confetti({ ...base, particleCount: 50, angle: 60, spread: 60, origin: { x: 0, y: 0.6 } }), 180)
    setTimeout(() => confetti({ ...base, particleCount: 50, angle: 120, spread: 60, origin: { x: 1, y: 0.6 } }), 320)
  } catch { /* confetti is decoration only */ }
}

export default function Voucher() {
  const [params] = useSearchParams()
  const { applyPromo } = useStore()
  const root = useRef(null)
  const [taps, setTaps] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const [emailOpen, setEmailOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [emailState, setEmailState] = useState({ status: 'idle', msg: '' })
  const headline = useRef(null)

  const raw = (params.get('promo') || 'TUSOK50').toUpperCase()
  const code = VOUCHERS[raw] ? raw : 'TUSOK50'

  // Save the promo right away so it is auto-applied at checkout even if the user skips the game.
  useEffect(() => { applyPromo(code); document.title = 'May regalo ka — TUSOK' }, [code, applyPromo])

  const { contextSafe } = useGSAP(() => {
    const mm = gsap.matchMedia()
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      gsap.timeline()
        .from('.flag', { y: -40, opacity: 0, stagger: 0.03, duration: 0.3, ease: 'back.out(2)' })
        .from('.v-logo', { scale: 2.4, opacity: 0, duration: 0.4, ease: 'back.out(2.6)' }, '-=0.1')
        .from('.v-rise', { y: 30, opacity: 0, stagger: 0.1, duration: 0.35, ease: 'power2.out' })
        .from('.v-ball', { y: '-90vh', duration: 0.55, ease: 'power2.in' }, '-=0.1')
        .fromTo('.v-ball-inner', { scaleY: 0.62, scaleX: 1.3 }, { scaleY: 1, scaleX: 1, duration: 0.55, ease: 'elastic.out(1.1, 0.35)', transformOrigin: '50% 100%' })
        .to('.v-ball-inner', { keyframes: { rotation: [0, 5, -5, 0] }, duration: 2.6, repeat: -1, ease: 'sine.inOut', transformOrigin: '50% 95%' })
    })
  }, { scope: root })

  useGSAP(() => {
    if (!revealed) return
    headline.current?.focus()
    fireConfetti()
    const mm = gsap.matchMedia()
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      gsap.from('.ticket', { rotateY: 100, opacity: 0, duration: 0.7, ease: 'back.out(1.5)', transformPerspective: 800 })
      gsap.from('.v-after', { y: 20, opacity: 0, stagger: 0.08, duration: 0.3, delay: 0.4 })
    })
  }, { scope: root, dependencies: [revealed] })

  const tap = contextSafe(() => {
    if (revealed) return
    const n = taps + 1
    setTaps(n)
    vibrate(20)
    const motion = !reducedMotion()
    if (n >= TAPS) {
      if (motion) gsap.to('.v-ball', { scale: 1.7, opacity: 0, duration: 0.18, ease: 'power2.in', onComplete: () => setRevealed(true) })
      else setRevealed(true)
    } else if (motion) {
      gsap.fromTo('.v-ball', { scaleX: 1.22, scaleY: 0.72 }, { scaleX: 1, scaleY: 1, duration: 0.5, ease: 'elastic.out(1.1, 0.35)', transformOrigin: '50% 100%' })
    }
  })

  const send = async (e) => {
    e.preventDefault()
    if (!EMAIL_RE.test(email.trim())) { setEmailState({ status: 'error', msg: 'Kulang ang email — dapat may @ at domain.' }); return }
    setEmailState({ status: 'sending', msg: '' })
    try {
      await sendEmail({
        subject: `TUSOK voucher mo: ${code} (₱${VOUCHERS[code]} off)`,
        message: `Ito ang voucher mo. Buksan ang link sa baba para magamit — auto-apply na ’yan sa checkout.`,
        to_name: 'Ka-tusok', to_email: email.trim(), order_no: `Voucher ${code}`,
        items: `Voucher ${code} — ₱${VOUCHERS[code]} off sa order mo`, total: `−₱${VOUCHERS[code]}`,
        sawsawan: '—', pickup: '—', track_url: VOUCHER_URL,
      })
      setEmailState({ status: 'sent', msg: 'Naipadala! Check mo ang inbox mo.' })
    } catch {
      setEmailState({ status: 'failed', msg: 'Hindi na-send ang email, pero naka-save na ang voucher sa phone na ito.' })
    }
  }

  const left = TAPS - taps
  return (
    <div ref={root} className="banig flex min-h-dvh flex-col overflow-hidden">
      <Banderitas />
      <main id="main" className="mx-auto flex w-full max-w-md flex-1 flex-col items-center px-5 pb-8 pt-4 text-center">
        <Link to="/" className="v-logo display rounded-lg text-5xl text-cream" aria-label="TUSOK — Home">TUSOK<span className="text-yellow">.</span></Link>

        <h1 ref={headline} tabIndex={-1} className="v-rise display mt-5 text-7xl text-yellow" aria-live="polite">
          {revealed ? 'Swerte mo!' : 'May regalo ka'}
        </h1>
        <p className="v-rise mt-2 text-lg">
          {revealed ? 'Sa’yo na ’to. Gamitin mo sa unang order mo.' : 'I-tap ang fishball nang 3 beses para mabuksan.'}
        </p>

        {!revealed ? (
          <>
            <button
              type="button" onClick={tap}
              className="v-ball mt-6 rounded-full" style={{ touchAction: 'manipulation' }}
              aria-label={`Fishball na may regalo. ${left} tap${left === 1 ? '' : 's'} pa para mabuksan.`}
            >
              <svg viewBox="0 0 100 150" width="200" height="300" className="v-ball-inner sticker" aria-hidden="true">
                <line x1="50" y1="60" x2="50" y2="146" stroke="#FFF4E0" strokeWidth="9" strokeLinecap="round" />
                <line x1="50" y1="60" x2="50" y2="146" stroke="#E7B77A" strokeWidth="4.5" strokeLinecap="round" />
                <circle cx="50" cy="50" r="40" fill="#D98A3D" stroke="#FFF4E0" strokeWidth="6" />
                <circle cx="64" cy="64" r="5" fill="#B86A24" /><circle cx="42" cy="72" r="3" fill="#B86A24" />
                <ellipse cx="34" cy="32" rx="12" ry="6" fill="#fff" opacity="0.5" transform="rotate(-30 34 32)" />
                {CRACKS.slice(0, taps).map((d) => <path key={d} d={d} fill="none" stroke="#431407" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />)}
              </svg>
            </button>
            <div className="mt-2 flex gap-3" role="img" aria-label={`${taps} sa ${TAPS} taps`}>
              {Array.from({ length: TAPS }, (_, i) => (
                <span key={i} className={`h-4 w-4 rounded-full border-2 border-cream ${i < taps ? 'bg-yellow' : ''}`} />
              ))}
            </div>
            <Link to="/menu" className="mt-auto inline-flex min-h-11 items-center pt-6 font-bold underline underline-offset-4">Skip, punta sa menu</Link>
          </>
        ) : (
          <>
            <div className="ticket on-light relative mt-6 w-full rounded-[26px] bg-cream p-3 text-ink" id="ticket">
              <span className="absolute -left-4 top-1/2 h-8 w-8 -translate-y-1/2 rounded-full bg-orange" aria-hidden="true" />
              <span className="absolute -right-4 top-1/2 h-8 w-8 -translate-y-1/2 rounded-full bg-orange" aria-hidden="true" />
              <div className="rounded-[18px] border-[3px] border-dashed border-ink/70 px-4 py-6">
                <p className="display text-7xl text-orange">₱{VOUCHERS[code]} OFF</p>
                <p className="mx-auto mt-3 inline-block rounded-full bg-ink px-5 py-1.5 font-bold tracking-[0.2em] text-yellow">{code}</p>
                <p className="mt-3 font-medium">auto-apply sa checkout</p>
              </div>
            </div>

            <Link to="/" className="v-after btn btn-yellow mt-6 w-full text-lg">Mag-order na →</Link>

            <div className="v-after mt-3 w-full">
              <button type="button" className="min-h-11 font-bold underline underline-offset-4" aria-expanded={emailOpen} aria-controls="voucher-email" onClick={() => setEmailOpen((o) => !o)}>
                Ipadala rin sa email ko (optional)
              </button>
              {emailOpen && (
                <form id="voucher-email" onSubmit={send} noValidate className="on-light mt-2 rounded-[22px] bg-cream p-4 text-left text-ink">
                  <label htmlFor="v-email" className="mb-1 block font-bold">Email mo</label>
                  <div className="flex gap-2">
                    <input id="v-email" type="email" inputMode="email" autoComplete="email" autoCapitalize="none" className="field" placeholder="ikaw@email.com"
                      value={email} onChange={(e) => setEmail(e.target.value)}
                      aria-invalid={emailState.status === 'error' ? 'true' : 'false'} aria-describedby="v-email-msg" />
                    <button className="btn btn-ink shrink-0" disabled={emailState.status === 'sending' || emailState.status === 'sent'}>
                      {emailState.status === 'sending' ? <><span className="spinner" aria-hidden="true" /> Pinapadala…</> : 'Ipadala'}
                    </button>
                  </div>
                  <p id="v-email-msg" role="status" className={`mt-1 text-sm font-bold ${emailState.status === 'error' ? 'text-[#B91C1C]' : ''}`}>{emailState.msg}</p>
                </form>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  )
}
