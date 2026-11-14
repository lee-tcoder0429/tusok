import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Banderitas from '../components/Banderitas.jsx'
import { useStore } from '../store.jsx'
import { fbEnabled, fbSubscribe } from '../lib/firebase.js'
import { liveStatus, T_READY } from '../lib/status.js'
import { VOUCHER_URL, pad } from '../lib/util.js'

const NAMES = ['J', 'Jed', 'JC', 'Haya', 'Vaughn', 'Yosh', 'Drei', 'Andrei', 'Shane', 'Abby', 'Erron', 'Aeron', 'Dom', 'Ranzel']
const READY_TTL = 5 * 60 * 1000 // real ready orders drop off the board after 5 minutes

// Seeded demo orders so the board never looks empty (fallback mode only).
function initialSeeds() {
  const now = Date.now()
  return {
    next: 18,
    name: 5,
    list: [
      { key: 's12', no: '012', name: NAMES[0], status: 'ready', readyAt: now - 90000 },
      { key: 's14', no: '014', name: NAMES[1], status: 'ready', readyAt: now - 4000 },
      { key: 's15', no: '015', name: NAMES[2], status: 'cooking' },
      { key: 's16', no: '016', name: NAMES[3], status: 'cooking' },
      { key: 's17', no: '017', name: NAMES[4], status: 'cooking' },
    ],
  }
}

function Chip({ o, ready }) {
  return (
    <li className={`${ready ? 'chip-across bg-yellow text-ink' : 'chip-in bg-cream text-ink'} flex items-baseline gap-3 rounded-full px-5 py-2 lg:px-7 lg:py-3`}>
      <span className="display text-3xl lg:text-5xl">#{o.no}</span>
      <span className="truncate text-xl font-bold lg:text-3xl">{o.name}</span>
    </li>
  )
}

export default function Board() {
  const { orders } = useStore()
  const [remote, setRemote] = useState(null)
  const [seeds, setSeeds] = useState(initialSeeds)
  const [now, setNow] = useState(Date.now())
  const [qr, setQr] = useState('')

  useEffect(() => { document.title = 'Now Serving — TUSOK' }, [])
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t) }, [])
  useEffect(() => (fbEnabled ? fbSubscribe(setRemote) : undefined), [])

  useEffect(() => {
    let live = true
    import('qrcode').then(({ default: QR }) => QR.toDataURL(VOUCHER_URL, { margin: 1, width: 520, errorCorrectionLevel: 'M', color: { dark: '#1C0A03', light: '#FFF4E0' } }))
      .then((url) => live && setQr(url)).catch(() => {})
    return () => { live = false }
  }, [])

  // Keep the seeded queue moving: every 10s one order finishes cooking and a new one arrives.
  useEffect(() => {
    const t = setInterval(() => setSeeds((s) => {
      const i = s.list.findIndex((o) => o.status === 'cooking')
      if (i < 0) return s
      const list = s.list.map((o, j) => (j === i ? { ...o, status: 'ready', readyAt: Date.now() } : o))
      const ready = list.filter((o) => o.status === 'ready').sort((a, b) => a.readyAt - b.readyAt)
      const drop = ready.length > 3 ? ready[0].key : null
      return {
        next: s.next + 1, name: s.name + 1,
        list: [...list.filter((o) => o.key !== drop), { key: `s${s.next}`, no: pad(s.next), name: NAMES[s.name % NAMES.length], status: 'cooking' }],
      }
    }), 10000)
    return () => clearInterval(t)
  }, [])

  const real = useMemo(() => (remote ?? orders).map((o) => {
    const status = liveStatus(o, now)
    return { key: `o${o.id}`, no: o.no, name: String(o.name).split(' ')[0], status, readyAt: o.createdAt + T_READY }
  }).filter((o) => o.status !== 'done' && !(o.status === 'ready' && now - o.readyAt > READY_TTL)), [remote, orders, now])

  const useSeeds = !fbEnabled || real.length === 0
  const all = [...(useSeeds ? seeds.list : []), ...real]
  const cooking = all.filter((o) => o.status !== 'ready')
  const ready = all.filter((o) => o.status === 'ready').sort((a, b) => b.readyAt - a.readyAt)
  const serving = ready[0]

  return (
    <div className="flex min-h-dvh flex-col bg-deep">
      <Banderitas count={25} />
      <main id="main" className="grid flex-1 lg:grid-cols-[5fr_7fr]">
        <section className="banig flex flex-col justify-between gap-6 bg-orange p-6 lg:p-10" aria-labelledby="serving-h">
          <div>
            <p className="display text-3xl lg:text-4xl"><Link to="/" className="rounded-lg">TUSOK<span className="text-yellow">.</span></Link></p>
            <h1 id="serving-h" className="display mt-4 text-5xl text-yellow lg:text-6xl">Now serving</h1>
            <div aria-live="polite" aria-atomic="true">
              {serving ? (
                <div key={serving.key} className="chip-in">
                  <p className="display text-[7rem] leading-none lg:text-[9.5rem]">#{serving.no}</p>
                  <p className="text-3xl font-bold lg:text-4xl">{serving.name}, kunin mo na!</p>
                </div>
              ) : <p className="mt-4 text-3xl font-bold">Wala pang ready. Konting hintay lang.</p>}
            </div>
          </div>
          <div className="on-light flex items-center gap-5 rounded-[28px] bg-cream p-4 text-ink">
            {qr
              ? <img src={qr} alt="QR code papunta sa TUSOK voucher page" className="h-36 w-36 rounded-xl lg:h-48 lg:w-48" />
              : <div className="h-36 w-36 rounded-xl bg-ink/10 lg:h-48 lg:w-48" role="status" aria-label="Ginagawa ang QR code" />}
            <div className="min-w-0">
              <p className="display text-3xl lg:text-5xl">Scan para mag-order</p>
              <p className="display text-3xl text-orange lg:text-5xl">+ ₱50 off</p>
              <p className="mt-1 break-all text-sm font-medium">{VOUCHER_URL.replace(/^https?:\/\//, '')}</p>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-2 gap-4 p-6 lg:gap-8 lg:p-10" aria-label="Pila ng mga order">
          <div>
            <h2 className="display border-b-4 border-cream/40 pb-2 text-4xl lg:text-6xl">Pinriprito <span className="text-cream/70">{cooking.length}</span></h2>
            <ul className="mt-4 flex flex-col gap-3" aria-label="Pinriprito pa">{cooking.map((o) => <Chip key={o.key} o={o} />)}</ul>
          </div>
          <div>
            <h2 className="display border-b-4 border-yellow pb-2 text-4xl text-yellow lg:text-6xl">Ready na <span className="opacity-80">{ready.length}</span></h2>
            <ul className="mt-4 flex flex-col gap-3" aria-label="Ready na">{ready.map((o) => <Chip key={o.key} o={o} ready />)}</ul>
          </div>
          <p className="col-span-2 self-end text-sm text-cream/80">{fbEnabled ? 'Live: naka-connect sa Firestore.' : 'Demo mode: mga order mula sa device na ito + sample na pila.'}</p>
        </section>
      </main>
    </div>
  )
}
