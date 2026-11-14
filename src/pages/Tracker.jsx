import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Header from '../components/Header.jsx'
import { useStore } from '../store.jsx'
import { STAGES, T_COOK, T_READY, liveStatus } from '../lib/status.js'
import { fbGetOrder, fbSetStatus, fbEnabled } from '../lib/firebase.js'
import { fmtTime, pad, vibrate } from '../lib/util.js'
import { peso } from '../data/menu.js'

const COPY = {
  received: ['Natanggap na!', 'Pinapainit na ni Manong ang kawali.'],
  cooking: ['Pinriprito na…', 'Naririnig mo ba ’yung sizzle? Konti na lang.'],
  ready: ['Ready na!', 'Kunin mo na sa kanto habang mainit pa.'],
  done: ['Busog! Salamat.', 'Nakuha mo na ang order mo. Balik ka ulit ha.'],
}

function Kawali({ status }) {
  const cooking = status === 'cooking'
  const hasFood = status === 'cooking' || status === 'ready'
  const steam = status !== 'done'
  return (
    <svg viewBox="0 0 260 190" className="mx-auto w-full max-w-xs" role="img"
      aria-label={cooking ? 'Kawali na may pinriprito at umuusok' : status === 'ready' ? 'Kawali na may lutong pagkain' : 'Kawali'}>
      {steam && [70, 105, 140].map((x, i) => (
        <path key={x} className="steam" style={{ animationDelay: `${i * 0.6}s` }} d={`M${x} 70c-8-10 8-16 0-26s8-16 0-26`} fill="none" stroke="#FFF4E0" strokeWidth="5" strokeLinecap="round" opacity="0" />
      ))}
      <rect x="170" y="98" width="84" height="16" rx="8" fill="#1C0A03" stroke="#FFF4E0" strokeWidth="5" />
      <path d="M14 92h184c0 46-34 76-92 76S14 138 14 92z" fill="#1C0A03" stroke="#FFF4E0" strokeWidth="6" strokeLinejoin="round" />
      <ellipse cx="106" cy="92" rx="92" ry="18" fill="#FFC531" stroke="#FFF4E0" strokeWidth="6" />
      <ellipse cx="80" cy="88" rx="30" ry="5" fill="#fff" opacity="0.35" />
      {hasFood && (
        <g>
          {[[62, 84, '#D98A3D', 15], [98, 80, '#FF6A13', 17], [134, 85, '#D98A3D', 14], [164, 88, '#8A4B22', 11]].map(([x, y, c, r], i) => (
            <g key={i} className={cooking ? 'fry' : ''} style={{ animationDelay: `${i * 0.15}s` }}>
              <circle cx={x} cy={y} r={r} fill={c} stroke="#FFF4E0" strokeWidth="4" />
              <ellipse cx={x - r / 3} cy={y - r / 3} rx={r / 3.2} ry={r / 5} fill="#fff" opacity="0.5" />
            </g>
          ))}
        </g>
      )}
      {cooking && [[46, 96], [82, 100], [118, 99], [150, 98], [176, 94]].map(([x, y], i) => (
        <circle key={i} className="bubble" style={{ animationDelay: `${i * 0.18}s` }} cx={x} cy={y} r="4" fill="none" stroke="#FFF4E0" strokeWidth="2.5" />
      ))}
      {status === 'ready' && <path d="M30 40l-10-10M48 28l-4-14M226 44l10-10" stroke="#FFC531" strokeWidth="6" strokeLinecap="round" />}
    </svg>
  )
}

let audioCtx
function playDing() {
  if (!audioCtx) return
  const t = audioCtx.currentTime
  // short sizzle (filtered noise) + two-note ding
  const len = audioCtx.sampleRate * 0.35
  const buf = audioCtx.createBuffer(1, len, audioCtx.sampleRate)
  const data = buf.getChannelData(0)
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len)
  const noise = audioCtx.createBufferSource(); noise.buffer = buf
  const hp = audioCtx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 4000
  const ng = audioCtx.createGain(); ng.gain.value = 0.12
  noise.connect(hp).connect(ng).connect(audioCtx.destination); noise.start(t)
  ;[[880, 0.3], [1320, 0.48]].forEach(([freq, at]) => {
    const o = audioCtx.createOscillator(); const g = audioCtx.createGain()
    o.type = 'sine'; o.frequency.value = freq
    g.gain.setValueAtTime(0.0001, t + at); g.gain.exponentialRampToValueAtTime(0.3, t + at + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + at + 0.6)
    o.connect(g).connect(audioCtx.destination); o.start(t + at); o.stop(t + at + 0.65)
  })
}

export default function Tracker() {
  const { id } = useParams()
  const { orders, addOrder, updateOrder } = useStore()
  const order = orders.find((o) => String(o.id) === String(Number(id)))
  const [now, setNow] = useState(Date.now())
  const [lookup, setLookup] = useState(fbEnabled ? 'loading' : 'missing')
  const [bannerClosed, setBannerClosed] = useState(false)
  const [noticeClosed, setNoticeClosed] = useState(false)
  const [sound, setSound] = useState(false)
  const soundRef = useRef(false)
  const canNotify = typeof window !== 'undefined' && 'Notification' in window
  const [askNotif, setAskNotif] = useState(() => canNotify && Notification.permission === 'default' && !localStorage.getItem('tusok:notif-asked'))

  const status = order ? liveStatus(order, now) : null

  useEffect(() => { document.title = `Order #${pad(Number(id) || 0)} — TUSOK` }, [id])

  // Order opened on another device (e.g. from the email link): try Firestore.
  useEffect(() => {
    if (order || !fbEnabled) return
    let live = true
    fbGetOrder(id).then((o) => { if (!live) return; if (o) addOrder(o); else setLookup('missing') })
    return () => { live = false }
  }, [order, id, addOrder])

  useEffect(() => {
    if (!order || status === 'done') return
    const t = setInterval(() => setNow(Date.now()), 500)
    return () => clearInterval(t)
  }, [order?.id, status])

  useEffect(() => {
    if (!order) return
    if (status !== order.status) { updateOrder(order.id, { status }); fbSetStatus(order.id, status) }
    if (status === 'ready' && !order.notified) {
      updateOrder(order.id, { notified: true })
      vibrate([120, 60, 120])
      if (soundRef.current) playDing()
      if (canNotify && Notification.permission === 'granted') {
        try { new Notification(`TUSOK: Ready na ang order #${order.no}!`, { body: `${order.name}, kunin mo na sa kanto habang mainit pa.` }) } catch { /* some mobile browsers need a service worker */ }
      }
    }
  }, [status, order?.id])

  if (!order) {
    return (
      <div className="banig min-h-dvh">
        <Header />
        <main id="main" className="mx-auto max-w-xl px-4 pb-16">
          <h1 className="display text-5xl text-yellow">{lookup === 'loading' ? 'Hinahanap ang order…' : `Walang order #${id} dito`}</h1>
          {lookup !== 'loading' && <p className="mt-3">Baka ibang phone o browser ang ginamit mo sa pag-order. Dito lang naka-save ang order sa device na pinag-orderan.</p>}
          <Link to="/menu" className="btn btn-yellow mt-5">Tingnan ang menu →</Link>
        </main>
      </div>
    )
  }

  const idx = STAGES.findIndex((s) => s.key === status)
  const elapsed = now - order.createdAt
  const pct = status === 'done' ? 100 : status === 'ready' ? 85 : Math.round(Math.min(elapsed / T_READY, 1) * 85)
  const times = { received: order.createdAt, cooking: order.createdAt + T_COOK, ready: order.createdAt + T_READY, done: order.doneAt }
  const [title, sub] = COPY[status]

  const toggleSound = () => {
    const on = !sound
    setSound(on); soundRef.current = on
    if (on) {
      try { audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)(); audioCtx.resume(); playDing() } catch { /* no audio */ }
    }
  }
  const answerNotif = async (yes) => {
    localStorage.setItem('tusok:notif-asked', '1')
    setAskNotif(false)
    if (yes) { try { await Notification.requestPermission() } catch { /* ignore */ } }
  }

  return (
    <div className={`min-h-dvh ${status === 'ready' ? 'bg-magenta' : status === 'done' ? 'bg-brown' : 'banig'}`}>
      {status === 'ready' && !bannerClosed && (
        <div id="banner" role="alert" className="banner-in fixed inset-x-0 top-0 z-50 p-3">
          <div className="on-light mx-auto flex max-w-xl items-center gap-3 rounded-[22px] bg-yellow p-3 pl-5 font-bold text-ink shadow-[0_5px_0_rgb(28_10_3/0.35)]">
            <span className="flex-1">Ready na ang order #{order.no}! Kunin mo na, {order.name}.</span>
            <button type="button" onClick={() => setBannerClosed(true)} aria-label="Isara ang notification" className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-ink">
              <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M5 5l14 14M19 5L5 19" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" /></svg>
            </button>
          </div>
        </div>
      )}
      <Header />
      <main id="main" className="mx-auto max-w-xl px-4 pb-20">
        {order.emailFailed && !noticeClosed && (
          <div role="status" className="on-light mb-3 flex items-center gap-2 rounded-2xl bg-cream p-3 pl-4 text-sm text-ink">
            <span className="flex-1">Hindi na-send ang email, pero pasok ang order mo.</span>
            <button type="button" onClick={() => setNoticeClosed(true)} className="min-h-11 px-2 font-bold underline">OK</button>
          </div>
        )}

        <p className="font-bold">Order #{order.no} · {order.name}</p>
        <h1 className="display text-7xl text-yellow" aria-live="polite">{title}</h1>
        <p className="mt-1 text-lg">{sub}</p>

        <div className="my-4"><Kawali status={status} /></div>

        <div id="progress" role="progressbar" aria-label="Progress ng order" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct}
          aria-valuetext={`${pct}% — ${STAGES[idx].label}`} className="h-4 overflow-hidden rounded-full bg-ink/45">
          <div className="h-full rounded-full bg-yellow transition-[width] duration-500 ease-linear" style={{ width: `${pct}%` }} />
        </div>

        <ol className="mt-4 flex flex-col gap-2">
          {STAGES.map((s, i) => {
            const done = i <= idx
            return (
              <li key={s.key} aria-current={i === idx ? 'step' : undefined}
                className={`flex items-center gap-3 rounded-2xl px-3 py-2 ${i === idx ? 'bg-ink/35' : ''} ${done ? '' : 'opacity-75'}`}>
                <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${done ? 'bg-yellow text-ink' : 'border-2 border-cream'}`}>
                  {done
                    ? <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M4 12.5l5.5 5.5L20 7" fill="none" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    : <span className="text-sm font-bold" aria-hidden="true">{i + 1}</span>}
                </span>
                <span className="flex-1 font-bold">{s.label}<span className="sr-only">{done ? ' — tapos na' : ' — hinihintay'}</span></span>
                {done && times[s.key] && <time className="text-sm tabular-nums" dateTime={new Date(times[s.key]).toISOString()}>{fmtTime(times[s.key])}</time>}
              </li>
            )
          })}
        </ol>

        <div className="mt-5 flex flex-col gap-2">
          {status === 'ready' && (
            <button type="button" className="btn btn-yellow w-full" onClick={() => updateOrder(order.id, { status: 'done', doneAt: Date.now() }) || fbSetStatus(order.id, 'done')}>Nakuha ko na</button>
          )}
          <Link to="/menu" className={`btn w-full ${status === 'done' ? 'btn-yellow' : 'btn-line'}`}>Tusok ulit</Link>
        </div>

        {askNotif && status !== 'ready' && status !== 'done' && (
          <section id="notif" aria-label="Notification" className="card on-light mt-5 p-4">
            <h2 className="display text-2xl">I-notify ka namin?</h2>
            <p className="mt-1 text-sm">Magpapadala kami ng isang notification pag ready na ang order mo, para di mo kailangang bantayan ang screen. Wala nang iba.</p>
            <div className="mt-3 flex gap-2">
              <button type="button" className="btn btn-ink flex-1" onClick={() => answerNotif(true)}>Sige, i-notify ako</button>
              <button type="button" className="btn btn-line" onClick={() => answerNotif(false)}>Hindi na</button>
            </div>
          </section>
        )}

        <div className="mt-5 flex items-center justify-between gap-3 rounded-2xl bg-ink/30 px-4 py-2">
          <span id="sound-label" className="font-bold">Tunog pag ready</span>
          <button type="button" role="switch" aria-checked={sound} aria-labelledby="sound-label" onClick={toggleSound}
            className={`btn !min-h-11 ${sound ? 'btn-yellow' : 'btn-line'}`}>{sound ? 'On' : 'Off'}</button>
        </div>

        <section aria-label="Buod ng order" className="card on-light mt-5 p-4">
          <h2 className="display text-2xl">Order mo</h2>
          <ul className="mt-2 flex flex-col gap-1">
            {order.items.map((i) => <li key={i.id} className="flex justify-between"><span>{i.qty} × {i.name}</span><span>{peso(i.qty * i.price)}</span></li>)}
            {order.discount > 0 && <li className="flex justify-between font-bold text-[#9F1239]"><span>Voucher {order.promo}</span><span>−{peso(order.discount)}</span></li>}
          </ul>
          <p className="mt-2 flex justify-between border-t-2 border-dashed border-ink/40 pt-2 text-lg font-bold"><span>Total</span><span>{peso(order.total)}</span></p>
          <p className="mt-1 text-sm">Sawsawan: {order.sawsawan} · Pickup: {order.pickup}</p>
        </section>
      </main>
    </div>
  )
}
