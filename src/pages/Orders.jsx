import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Header from '../components/Header.jsx'
import Footer from '../components/Footer.jsx'
import FoodSticker from '../components/FoodSticker.jsx'
import { byId, peso } from '../data/menu.js'
import { useStore } from '../store.jsx'
import { STAGES, liveStatus } from '../lib/status.js'

const TONE = { received: 'bg-ink text-cream', cooking: 'bg-orange text-cream', ready: 'bg-yellow text-ink', done: 'bg-ink/15 text-ink' }

export default function Orders() {
  const { orders, add, toast } = useStore()
  const nav = useNavigate()
  const [now, setNow] = useState(Date.now())
  useEffect(() => { document.title = 'Mga order ko — TUSOK' }, [])
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t) }, [])

  const list = [...orders].sort((a, b) => b.createdAt - a.createdAt)

  const reorder = (o) => {
    const ok = o.items.filter((i) => byId[i.id]?.available)
    const skipped = o.items.length - ok.length
    if (!ok.length) { toast('Ubos na ang lahat ng item sa order na ito.'); return }
    ok.forEach((i) => add(i.id, i.qty))
    toast(skipped ? `Naidagdag sa bilao (${skipped} item ang ubos na).` : 'Naidagdag ulit sa bilao!')
    nav('/checkout')
  }

  return (
    <div className="banig min-h-dvh">
      <Header />
      <main id="main" className="mx-auto max-w-xl px-4 pb-16">
        <h1 className="display text-6xl text-yellow">Mga order ko</h1>
        <p className="mt-1">Lahat ng in-order mo sa device na ito.</p>

        {list.length === 0 ? (
          <div className="card on-light mt-6 flex flex-col items-center gap-3 p-8 text-center">
            <FoodSticker type="turon" size={88} />
            <h2 className="display text-3xl">Wala ka pang order</h2>
            <p>Pag nag-order ka, dito mo makikita ang resibo at status.</p>
            <Link to="/menu" className="btn btn-ink">Tingnan ang menu →</Link>
          </div>
        ) : (
          <ul className="mt-5 flex flex-col gap-3">
            {list.map((o) => {
              const status = liveStatus(o, now)
              return (
                <li key={o.id} className="card on-light p-4">
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="display text-3xl">#{o.no}</h2>
                    <span className={`rounded-full px-3 py-1 text-sm font-bold ${TONE[status]}`}>{STAGES.find((s) => s.key === status).label}</span>
                  </div>
                  <p className="text-sm text-ink/80">
                    <time dateTime={new Date(o.createdAt).toISOString()}>{new Date(o.createdAt).toLocaleString('en-PH', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</time> · {o.name}
                  </p>
                  <div className="mt-2 flex items-center gap-1" aria-hidden="true">
                    {o.items.slice(0, 5).map((i) => <FoodSticker key={i.id} type={i.id} size={38} />)}
                  </div>
                  <p className="mt-1 text-sm">{o.items.map((i) => `${i.qty} × ${i.name}`).join(', ')}</p>
                  <p className="mt-1 font-bold">Total: {peso(o.total)}{o.discount > 0 && <span className="font-normal"> (voucher −{peso(o.discount)})</span>}</p>
                  <div className="mt-3 flex gap-2">
                    <Link to={`/order/${o.id}`} className="btn btn-line flex-1" aria-label={`Tingnan ang status ng order ${o.no}`}>Tingnan</Link>
                    <button type="button" className="btn btn-ink flex-1" onClick={() => reorder(o)} aria-label={`Order ulit ang order ${o.no}`}>Order ulit</button>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </main>
      <Footer />
    </div>
  )
}
