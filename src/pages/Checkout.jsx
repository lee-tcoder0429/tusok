import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Header from '../components/Header.jsx'
import FoodSticker from '../components/FoodSticker.jsx'
import Sheet from '../components/Sheet.jsx'
import Stepper from '../components/Stepper.jsx'
import { SAWSAWAN, peso } from '../data/menu.js'
import { useStore } from '../store.jsx'
import { nextOrderId } from '../lib/orders.js'
import { sendEmail } from '../lib/email.js'
import { fbWriteOrder } from '../lib/firebase.js'
import { SITE_URL, pad } from '../lib/util.js'

const STEPS = ['Bilao', 'Detalye', 'Confirm']
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const validators = {
  name: (v) => (v.trim() ? '' : 'Ilagay ang pangalan mo para matawag ka namin.'),
  email: (v) => (!v.trim() ? 'Kailangan ang email para sa confirmation.' : EMAIL_RE.test(v.trim()) ? '' : 'Kulang ang email — dapat may @ at domain.'),
}

function pickupOptions() {
  const out = ['ASAP (~10 min)']
  const d = new Date(Date.now() + 15 * 60000)
  d.setMinutes(Math.ceil(d.getMinutes() / 15) * 15, 0, 0)
  for (let i = 0; i < 4; i++) {
    out.push(d.toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit' }))
    d.setMinutes(d.getMinutes() + 15)
  }
  return out
}

function Progress({ step }) {
  return (
    <div id="steps" className="mt-2">
      <div role="progressbar" aria-label="Progress ng checkout" aria-valuemin={1} aria-valuemax={3} aria-valuenow={step}
        aria-valuetext={`Step ${step} ng 3: ${STEPS[step - 1]}`} className="h-3 overflow-hidden rounded-full bg-ink/40">
        <div className="h-full rounded-full bg-yellow transition-[width] duration-300" style={{ width: `${(step / 3) * 100}%` }} />
      </div>
      <ol className="mt-2 flex justify-between text-sm font-bold" aria-hidden="true">
        {STEPS.map((s, i) => (
          <li key={s} className={`flex items-center gap-1.5 ${i + 1 <= step ? 'text-yellow' : 'text-cream/80'}`}>
            <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs ${i + 1 <= step ? 'bg-yellow text-ink' : 'border-2 border-cream/80'}`}>{i + 1}</span>{s}
          </li>
        ))}
      </ol>
    </div>
  )
}

const REVEAL = 96
function CartRow({ line, onRemove, setQty }) {
  const [dx, setDx] = useState(0)
  const [dragging, setDragging] = useState(false)
  const start = useRef(null)
  const down = (e) => {
    if (e.target.closest('button')) return
    start.current = { x: e.clientX, base: dx, moved: false }
  }
  const move = (e) => {
    const s = start.current
    if (!s) return
    const d = e.clientX - s.x
    if (!s.moved) {
      if (Math.abs(d) < 8) return
      s.moved = true
      setDragging(true)
      e.currentTarget.setPointerCapture?.(e.pointerId)
    }
    setDx(Math.min(0, Math.max(-REVEAL, s.base + d)))
  }
  const up = () => {
    if (!start.current) return
    start.current = null
    setDragging(false)
    setDx((d) => (d < -REVEAL / 2 ? -REVEAL : 0))
  }
  const revealed = dx <= -REVEAL / 2
  return (
    <li className="relative overflow-hidden rounded-[22px] bg-[#B91C1C]">
      <button type="button" onClick={() => onRemove(line)} tabIndex={revealed ? 0 : -1} aria-hidden={!revealed}
        className="on-dark absolute inset-y-0 right-0 flex w-24 items-center justify-center font-bold text-white">Alisin</button>
      <div
        onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}
        style={{ transform: `translateX(${dx}px)`, touchAction: 'pan-y', transition: dragging ? 'none' : 'transform 0.2s ease' }}
        className="relative flex select-none items-center gap-3 bg-cream p-2.5 text-ink"
      >
        <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-yellow"><FoodSticker type={line.id} size={52} /></span>
        <div className="min-w-0 flex-1">
          <p className="display truncate text-xl">{line.name}</p>
          <p className="text-sm">{peso(line.price)} · {line.unit}</p>
          <div className="mt-1 flex items-center justify-between gap-2">
            <Stepper value={line.qty} onChange={(q) => setQty(line.id, q)} label={line.name} />
            <span className="font-bold">{peso(line.price * line.qty)}</span>
          </div>
        </div>
        <button type="button" onClick={() => onRemove(line)} aria-label={`Alisin ang ${line.name} sa bilao`}
          className="flex h-11 w-11 shrink-0 items-center justify-center self-start rounded-full border-2 border-ink">
          <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M5 5l14 14M19 5L5 19" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" /></svg>
        </button>
      </div>
    </li>
  )
}

export default function Checkout() {
  const st = useStore()
  const { lines, count, subtotal, discount, total, promo } = st
  const nav = useNavigate()
  const [step, setStep] = useState(1)
  const [confirm, setConfirm] = useState(false)
  const [sending, setSending] = useState(false)
  const pickups = useMemo(pickupOptions, [])
  const [form, setForm] = useState({ name: '', email: '', pickup: pickups[0] })
  const [errors, setErrors] = useState({})
  const [code, setCode] = useState('')
  const [codeErr, setCodeErr] = useState('')
  const refs = { name: useRef(null), email: useRef(null) }
  const heading = useRef(null)

  useEffect(() => { document.title = 'Bilao at Checkout — TUSOK' }, [])

  const shown = confirm ? 3 : step
  const sawName = SAWSAWAN.find((s) => s.id === st.sawsawan)?.name ?? 'Matamis'

  const removeLine = (l) => {
    st.setQty(l.id, 0)
    st.toast(`Inalis ang ${l.name}.`, { label: 'Undo', fn: () => st.setQty(l.id, l.qty) })
  }
  const applyCode = (e) => {
    e.preventDefault()
    if (st.applyPromo(code)) { setCodeErr(''); setCode(''); st.toast('Voucher applied! −₱50') }
    else setCodeErr('Di valid ang code na ’yan. Subukan ang TUSOK50.')
  }
  const blur = (k) => (e) => setErrors((p) => ({ ...p, [k]: validators[k](e.target.value) }))
  const goStep = (n) => { setStep(n); setTimeout(() => heading.current?.focus(), 0) }

  const review = (e) => {
    e.preventDefault()
    const errs = { name: validators.name(form.name), email: validators.email(form.email) }
    setErrors(errs)
    const bad = Object.keys(errs).find((k) => errs[k])
    if (bad) { refs[bad].current?.focus(); return }
    setConfirm(true)
  }

  const place = async () => {
    setSending(true)
    const id = await nextOrderId()
    const no = pad(id)
    const order = {
      id, no, name: form.name.trim(), email: form.email.trim(),
      items: lines.map((l) => ({ id: l.id, name: l.name, qty: l.qty, price: l.price, unit: l.unit })),
      subtotal, discount, total, promo: discount ? promo : null,
      sawsawan: sawName, pickup: form.pickup, createdAt: Date.now(), status: 'received', emailFailed: false,
    }
    const itemsText = [
      ...order.items.map((i) => `${i.qty} × ${i.name} (${i.unit}) — ₱${i.qty * i.price}`),
      ...(discount ? [`Voucher ${promo} — −₱${discount}`] : []),
    ].join('\n')
    try {
      await sendEmail({
        subject: `TUSOK order #${no} — natanggap na!`,
        message: `Salamat sa order mo sa TUSOK! Pasok na ang order #${no}. Ito ang resibo mo. Mag-e-email ulit kami pag ready na.`,
        to_name: order.name, to_email: order.email, order_no: `#${no}`, items: itemsText,
        total: `₱${total}`, sawsawan: sawName, pickup: order.pickup, track_url: `${SITE_URL}/order/${id}`,
      })
    } catch (err) {
      console.warn('Email not sent:', err)
      order.emailFailed = true
    }
    st.addOrder(order)
    fbWriteOrder(order)
    st.clearCart()
    st.removePromo()
    nav(`/order/${id}`)
  }

  const field = (k, label, props) => (
    <div>
      <label htmlFor={`f-${k}`} className="mb-1 block font-bold">{label} <span aria-hidden="true">*</span></label>
      <input
        id={`f-${k}`} ref={refs[k]} className="field" required value={form[k]}
        onChange={(e) => { setForm({ ...form, [k]: e.target.value }); if (errors[k]) setErrors({ ...errors, [k]: validators[k](e.target.value) }) }}
        onBlur={blur(k)} aria-invalid={errors[k] ? 'true' : 'false'} aria-describedby={errors[k] ? `e-${k}` : undefined} {...props}
      />
      {errors[k] && <p id={`e-${k}`} role="alert" className="mt-1 text-sm font-bold text-[#B91C1C]">{errors[k]}</p>}
    </div>
  )

  const Summary = (
    <dl className="flex flex-col gap-1">
      <div className="flex justify-between"><dt>Subtotal</dt><dd>{peso(subtotal)}</dd></div>
      {discount > 0 && <div className="flex justify-between font-bold text-[#9F1239]"><dt>Voucher {promo}</dt><dd>−{peso(discount)}</dd></div>}
      <div className="flex justify-between border-t-2 border-dashed border-ink/40 pt-2 text-xl font-bold"><dt>Total</dt><dd>{peso(total)}</dd></div>
    </dl>
  )

  return (
    <div className="banig min-h-dvh">
      <Header />
      <main id="main" className="mx-auto max-w-xl px-4 pb-24">
        <h1 ref={heading} tabIndex={-1} className="display text-6xl text-yellow">{step === 1 ? 'Ang bilao mo' : 'Detalye mo'}</h1>
        <Progress step={shown} />

        {count === 0 ? (
          <div className="card on-light mt-6 flex flex-col items-center gap-3 p-8 text-center">
            <FoodSticker type="kwek" size={88} />
            <h2 className="display text-3xl">Wala pang laman ang bilao</h2>
            <p>Tusok ka muna ng fishball o kwek-kwek.</p>
            <Link to="/menu" className="btn btn-ink">Tingnan ang menu →</Link>
          </div>
        ) : step === 1 ? (
          <section aria-label="Laman ng bilao" className="mt-6">
            <p className="mb-2 text-sm">I-swipe pakaliwa ang item para alisin, o gamitin ang × button.</p>
            <ul id="cart" className="flex flex-col gap-2.5">
              {lines.map((l) => <CartRow key={l.id} line={l} onRemove={removeLine} setQty={st.setQty} />)}
            </ul>

            <div className="card on-light mt-4 p-4">
              {promo ? (
                <div id="voucher" className="mb-3 flex items-center justify-between gap-2 rounded-2xl border-2 border-dashed border-ink bg-yellow px-4 py-1.5 font-bold">
                  <span>{promo} <span className="font-medium">applied</span> −{peso(discount)}</span>
                  <button type="button" onClick={st.removePromo} className="min-h-11 underline" aria-label={`Alisin ang voucher ${promo}`}>Alisin</button>
                </div>
              ) : (
                <form id="voucher" onSubmit={applyCode} className="mb-3" noValidate>
                  <label htmlFor="code" className="mb-1 block font-bold">May voucher code ka?</label>
                  <div className="flex gap-2">
                    <input id="code" className="field uppercase" value={code} onChange={(e) => { setCode(e.target.value); setCodeErr('') }}
                      placeholder="TUSOK50" autoCapitalize="characters" autoComplete="off"
                      aria-invalid={codeErr ? 'true' : 'false'} aria-describedby={codeErr ? 'e-code' : undefined} />
                    <button className="btn btn-ink shrink-0">Apply</button>
                  </div>
                  {codeErr && <p id="e-code" role="alert" className="mt-1 text-sm font-bold text-[#B91C1C]">{codeErr}</p>}
                </form>
              )}
              {Summary}
            </div>

            <div className="mt-5 flex flex-col gap-2">
              <button type="button" className="btn btn-yellow w-full" onClick={() => goStep(2)}>Tuloy sa detalye →</button>
              <Link to="/menu" className="btn btn-line w-full">Dagdag pa ng tusok</Link>
            </div>
          </section>
        ) : (
          <form onSubmit={review} noValidate className="card on-light mt-6 flex flex-col gap-4 p-5" aria-label="Detalye ng order">
            {field('name', 'Pangalan', { type: 'text', autoComplete: 'given-name', placeholder: 'hal. Kent' })}
            {field('email', 'Email', { type: 'email', inputMode: 'email', autoComplete: 'email', placeholder: 'ikaw@email.com', autoCapitalize: 'none' })}
            <div>
              <label htmlFor="f-saw" className="mb-1 block font-bold">Sawsawan</label>
              <select id="f-saw" className="field" value={st.sawsawan} onChange={(e) => st.setSawsawan(e.target.value)}>
                {SAWSAWAN.map((s) => <option key={s.id} value={s.id}>{s.name} — {s.desc}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="f-pickup" className="mb-1 block font-bold">Kailan kukunin?</label>
              <select id="f-pickup" className="field" value={form.pickup} onChange={(e) => setForm({ ...form, pickup: e.target.value })}>
                {pickups.map((p) => <option key={p}>{p}</option>)}
              </select>
            </div>
            <p className="text-sm">Walang totoong bayad — demo lang ito. Total: <strong>{peso(total)}</strong></p>
            <div className="flex gap-2">
              <button type="button" className="btn btn-line" onClick={() => goStep(1)}>← Bilao</button>
              <button className="btn btn-ink flex-1">I-review ang order</button>
            </div>
          </form>
        )}
      </main>

      <Sheet open={confirm} onClose={() => setConfirm(false)} title="Sure na?" locked={sending}>
        <div className="flex flex-col gap-3">
          <ul className="flex flex-col gap-1">
            {lines.map((l) => <li key={l.id} className="flex justify-between"><span>{l.qty} × {l.name}</span><span>{peso(l.qty * l.price)}</span></li>)}
          </ul>
          {Summary}
          <p className="rounded-2xl bg-ink/10 p-3 text-sm">
            <strong>{form.name}</strong> · {form.email}<br />Sawsawan: <strong>{sawName}</strong> · Pickup: <strong>{form.pickup}</strong>
          </p>
          {sending && (
            <div role="progressbar" aria-label="Pinapadala ang order" aria-busy="true" className="h-2 overflow-hidden rounded-full bg-ink/15">
              <div className="indet h-full w-2/5 rounded-full bg-orange" />
            </div>
          )}
          <button type="button" className="btn btn-ink w-full" onClick={place} disabled={sending} aria-live="polite">
            {sending ? <><span className="spinner" aria-hidden="true" /> Pinapadala…</> : 'Oo, i-order na'}
          </button>
          <button type="button" className="btn btn-line w-full" onClick={() => setConfirm(false)} disabled={sending}>Teka, babaguhin ko</button>
        </div>
      </Sheet>
    </div>
  )
}
