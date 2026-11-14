import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import Header from '../components/Header.jsx'
import Footer from '../components/Footer.jsx'
import FoodSticker, { SHAPES } from '../components/FoodSticker.jsx'
import { MENU, SAWSAWAN, byId, peso } from '../data/menu.js'
import { useStore } from '../store.jsx'
import { flyToBilao } from '../lib/fly.js'
import { reducedMotion } from '../lib/util.js'

gsap.registerPlugin(useGSAP, ScrollTrigger)
ScrollTrigger.config({ ignoreMobileResize: true })

/* ---------- Hero: drag to tusok ---------- */
const HERO = [
  { id: 'fishball', left: '4%', top: '4%', dur: 3.2 },
  { id: 'kwek', left: '36%', top: '0%', dur: 4.1 },
  { id: 'kikiam', left: '10%', top: '38%', dur: 3.7 },
  { id: 'isaw', left: '40%', top: '34%', dur: 4.6 },
  { id: 'turon', left: '20%', top: '70%', dur: 3.4 },
]
const SLOTS = ['10%', '39%', '68%']
const HINTS = ['I-drag ang fishball papunta sa stick — o i-tap lang', '2 pa!', '1 pa!', 'Puno na!']

function Hero() {
  const { add, toast } = useStore()
  const els = useRef({})
  const slots = useRef([])
  const skewer = useRef(null)
  const drag = useRef(null)
  const suppressClick = useRef(false)
  const [placed, setPlaced] = useState([])
  const [dragging, setDragging] = useState(null)

  const moveTo = (el, vars) => (reducedMotion() ? gsap.set(el, { x: vars.x, y: vars.y }) : gsap.to(el, { overwrite: true, ...vars }))
  const springBack = (id) => moveTo(els.current[id], { x: 0, y: 0, duration: 0.7, ease: 'elastic.out(1, 0.55)' })

  const tusok = (id) => {
    if (placed.includes(id)) return
    if (placed.length >= SLOTS.length) { toast('Puno na ang stick! I-reset muna.'); springBack(id); return }
    const el = els.current[id]
    const r = el.getBoundingClientRect()
    const s = slots.current[placed.length].getBoundingClientRect()
    moveTo(el, {
      x: gsap.getProperty(el, 'x') + (s.left + s.width / 2) - (r.left + r.width / 2),
      y: gsap.getProperty(el, 'y') + (s.top + s.height / 2) - (r.top + r.height / 2),
      duration: 0.45, ease: 'back.out(2.4)',
    })
    setPlaced((p) => [...p, id])
    add(id)
    toast(`${byId[id].name} — naitusok! +1`)
  }

  const handlers = (id) => ({
    onPointerDown: (e) => {
      if (placed.includes(id) || (e.pointerType === 'mouse' && e.button !== 0)) return
      const el = els.current[id]
      drag.current = { id, sx: e.clientX, sy: e.clientY, ox: gsap.getProperty(el, 'x'), oy: gsap.getProperty(el, 'y'), moved: false }
      try { el.setPointerCapture(e.pointerId) } catch { /* ignore */ }
    },
    onPointerMove: (e) => {
      const d = drag.current
      if (!d || d.id !== id) return
      const dx = e.clientX - d.sx, dy = e.clientY - d.sy
      if (!d.moved) {
        if (Math.hypot(dx, dy) < 8) return
        d.moved = true
        setDragging(id)
      }
      gsap.set(els.current[id], { x: d.ox + dx, y: d.oy + dy })
    },
    onPointerUp: () => {
      const d = drag.current
      drag.current = null
      if (!d || d.id !== id) return
      setDragging(null)
      if (!d.moved) return // a plain tap: the click handler tusoks it
      suppressClick.current = true
      setTimeout(() => { suppressClick.current = false }, 60)
      const r = els.current[id].getBoundingClientRect()
      const k = skewer.current.getBoundingClientRect()
      const cx = r.left + r.width / 2, cy = r.top + r.height / 2
      const near = Math.abs(cx - (k.left + k.width / 2)) < 78 && cy > k.top - 40 && cy < k.bottom + 40
      if (near) tusok(id)
      else springBack(id)
    },
    onPointerCancel: () => { if (drag.current?.id === id) { drag.current = null; setDragging(null); springBack(id) } },
    onClick: () => { if (!suppressClick.current) tusok(id) },
  })

  const reset = () => {
    placed.forEach((id) => springBack(id))
    setPlaced([])
  }

  return (
    <section className="banig relative overflow-hidden pb-10" aria-labelledby="hero-h">
      <Header />
      <div className="mx-auto max-w-6xl px-4">
        <h1 id="hero-h" className="display text-[23vw] leading-[0.95] text-yellow sm:text-[9rem]">Sarap ng kanto</h1>
        <p className="mt-2 max-w-sm text-lg">Fishball, kwek-kwek, isaw — itusok mo, kami na ang bahala.</p>

        <div id="drag" className="relative mx-auto mt-4 h-[350px] max-w-md select-none" role="group" aria-label="Laro: itusok ang pagkain sa stick">
          {/* bamboo skewer + slots */}
          <div ref={skewer} className="absolute bottom-0 right-[15%] top-0 w-2 rounded-full bg-stick shadow-[0_0_0_3px_rgb(28_10_3/0.25)]" aria-hidden="true">
            <span className="absolute -top-3 left-1/2 h-0 w-0 -translate-x-1/2 border-x-4 border-b-[14px] border-x-transparent border-b-stick" />
          </div>
          {SLOTS.map((top, i) => (
            <span key={top} ref={(n) => { slots.current[i] = n }} aria-hidden="true"
              className={`absolute right-[15%] h-[78px] w-[78px] translate-x-[calc(50%-4px)] rounded-full border-[3px] border-dashed ${i < placed.length ? 'border-transparent' : 'border-cream/80'}`}
              style={{ top }} />
          ))}

          {HERO.map(({ id, left, top, dur }) => {
            const on = placed.includes(id)
            return (
              <button
                key={id} type="button" ref={(n) => { els.current[id] = n }} {...handlers(id)}
                aria-disabled={on} aria-label={on ? `${byId[id].name} — nasa stick na` : `Itusok ang ${byId[id].name} sa stick`}
                className={`absolute rounded-full ${dragging === id ? 'z-20 cursor-grabbing' : on ? 'z-10' : 'z-10 cursor-grab'}`}
                style={{ left, top, touchAction: 'none' }}
              >
                <span className={`block transition-transform duration-150 ${on || dragging === id ? '' : 'bob'} ${dragging === id ? 'scale-[1.18]' : ''}`} style={{ animationDuration: `${dur}s` }}>
                  <FoodSticker type={id} size={76} style={dragging === id ? { filter: 'drop-shadow(0 14px 6px rgb(28 10 3 / 0.4))' } : undefined} />
                </span>
              </button>
            )
          })}
        </div>

        <p aria-live="polite" className="mt-3 text-center text-lg font-bold">{HINTS[placed.length]}</p>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          <Link to="/menu" className="btn btn-yellow text-lg">Tingnan ang menu →</Link>
          <button type="button" className="btn btn-line" onClick={reset} disabled={!placed.length}>I-reset ang stick</button>
        </div>
      </div>
    </section>
  )
}

/* ---------- Scroll story: Bunso takes a bite ---------- */
const MOUTH = { x: 108, y: 180 }
const ITEM_X = [24, 92, 160] // item centres along the skewer (local coords)
const BITES = [
  ['Kagat 1: Fishball', 'Malutong sa labas, malambot sa loob. Isang subo lang kay Bunso.'],
  ['Kagat 2: Kwek-kwek', 'Itlog ng pugo sa orange na batter. Namumula na ang pisngi niya.'],
  ['Kagat 3: Kikiam', 'Huling tusok na. Sayang kung may matitira sa stick.'],
]

function Bunso() {
  return (
    <g transform="translate(100 140)">
      {/* face */}
      <circle cx="0" cy="10" r="58" fill="#B5713A" stroke="#FFF4E0" strokeWidth="6" />
      {/* bangs */}
      <path d="M-52 -14Q-30 -44 0 -40Q30 -44 52 -14Q36 -6 26 -22Q16 -4 6 -22Q-4 -4 -14 -22Q-26 -4 -36 -20Q-44 -8 -52 -14Z" fill="#1C0A03" />
      {/* salakot */}
      <path d="M-98 -34L0 -96L98 -34Q0 -16 -98 -34Z" fill="#E7B77A" stroke="#FFF4E0" strokeWidth="6" strokeLinejoin="round" />
      <path d="M0 -96L-40 -30M0 -96L40 -30M0 -96V-26" stroke="#B8741C" strokeWidth="2.5" opacity="0.7" />
      <circle cx="0" cy="-96" r="5" fill="#BE185D" stroke="#FFF4E0" strokeWidth="3" />
      {/* cheeks */}
      <circle className="cheek" cx="-36" cy="28" r="10" fill="#F0766B" opacity="0.85" />
      <circle className="cheek" cx="40" cy="28" r="10" fill="#F0766B" opacity="0.85" />
      {/* eyes */}
      <circle className="eye-dot" cx="-20" cy="8" r="5.5" fill="#1C0A03" />
      <circle className="eye-dot" cx="22" cy="8" r="5.5" fill="#1C0A03" />
      <path className="eye-arc" d="M-28 11Q-20 1 -12 11M14 11Q22 1 30 11" fill="none" stroke="#1C0A03" strokeWidth="4.5" strokeLinecap="round" opacity="0" />
      {/* mouth + tongue */}
      <ellipse className="mouth" cx="8" cy="40" rx="13" ry="4" fill="#4A1208" />
      <ellipse className="tongue" cx="8" cy="48" rx="7" ry="4" fill="#F0766B" opacity="0" />
    </g>
  )
}

function Story() {
  const root = useRef(null)
  const [bite, setBite] = useState(0)

  useGSAP(() => {
    const mm = gsap.matchMedia()
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      const q = gsap.utils.selector(root)
      const sec = root.current
      const bg = ['#FB923C', '#C2410C', '#BE185D']
      const fg = ['#1C0A03', '#FFF4E0', '#FFF4E0']
      const cards = q('.bite-card')
      const labels = []
      let current = 0

      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        // read the counter from the timeline itself so it stays in step with the scrubbed animation
        onUpdate: () => {
          const t = tl.time()
          const n = labels.filter((l) => t >= l).length
          if (n !== current) { current = n; setBite(n) }
        },
        scrollTrigger: { trigger: sec, start: 'top top', end: '+=2600', pin: true, scrub: 0.5, anticipatePin: 1 },
      })

      tl.fromTo(q('.skewer'), { x: 430 }, { x: MOUTH.x - ITEM_X[0] + 70, duration: 1 })
      ITEM_X.forEach((ix, i) => {
        tl.to(q('.skewer'), { x: MOUTH.x - ix, duration: 0.5 })
          .to(q('.mouth'), { attr: { ry: 17, rx: 15 }, duration: 0.3 }, '<0.1')
          .to(q('.tongue'), { opacity: 1, duration: 0.2 }, '<')
        labels.push(tl.duration())
        tl.to(q(`.item-${i}`), { scale: 0, opacity: 0, duration: 0.12, transformOrigin: '50% 50%' })
          .to(q('.mouth'), { attr: { ry: 4, rx: 13 }, duration: 0.12 }, '<')
          .to(q('.tongue'), { opacity: 0, duration: 0.1 }, '<')
          .to(q('.cheek'), { scale: 1.5, duration: 0.15, transformOrigin: '50% 50%' }, '<')
          .to(q('.eye-dot'), { opacity: 0, duration: 0.08 }, '<')
          .to(q('.eye-arc'), { opacity: 1, duration: 0.08 }, '<')
          .fromTo(q(`.crumb-${i}`), { y: 0, opacity: 1 }, { y: 50, opacity: 0, duration: 0.7, stagger: 0.06, immediateRender: false }, '<')
          .to(sec, { backgroundColor: bg[i], color: fg[i], duration: 0.5 }, '<')
          .to(q('.mouth'), { attr: { ry: 8 }, duration: 0.14, repeat: 5, yoyo: true }, '<0.12')
          .to(q('.cheek'), { scale: 1, duration: 0.2 })
          .to(q('.eye-dot'), { opacity: 1, duration: 0.1 }, '<')
          .to(q('.eye-arc'), { opacity: 0, duration: 0.1 }, '<')
      })
      tl.to(q('.skewer'), { x: 430, duration: 0.6 }).to({}, { duration: 0.6 })

      // text cards: intro, one per bite, then the "Ubos!" finale
      const end = tl.duration()
      const marks = [0, ...labels, end - 0.9]
      cards.forEach((card, i) => {
        if (i > 0) tl.fromTo(card, { autoAlpha: 0, y: 40 }, { autoAlpha: 1, y: 0, duration: 0.25, immediateRender: false }, marks[i] + 0.05)
        if (i < cards.length - 1) tl.to(card, { autoAlpha: 0, y: -40, duration: 0.2 }, marks[i + 1] - 0.2)
      })
    })
    const refresh = () => ScrollTrigger.refresh()
    document.fonts?.ready.then(refresh)
  }, { scope: root })

  return (
    <section ref={root} id="bunso" aria-labelledby="bunso-h"
      className="on-light relative flex flex-col overflow-hidden bg-yellow px-4 py-8 text-ink motion-safe:h-svh motion-safe:justify-center">
      <div className="mx-auto flex w-full max-w-md items-end justify-between">
        <h2 id="bunso-h" className="display text-5xl">Si Bunso,<br />gutom na.</h2>
        <p className="display text-3xl motion-reduce:hidden" aria-live="polite">Kagat {Math.min(bite, 3)}/3</p>
      </div>

      <svg viewBox="0 0 390 260" className="mx-auto mt-2 w-full max-w-md" role="img" aria-label="Si Bunso, batang naka-salakot, kumakain ng fishball, kwek-kwek at kikiam mula sa stick">
        <defs><clipPath id="past-mouth"><rect x={MOUTH.x} y="0" width="400" height="260" /></clipPath></defs>
        <Bunso />
        {/* clipped at the mouth so the stick and each item disappear into it */}
        <g clipPath="url(#past-mouth)">
        <g className="skewer" transform="translate(170 0)">
          <line x1="-12" y1={MOUTH.y} x2="300" y2={MOUTH.y} stroke="#FFF4E0" strokeWidth="10" strokeLinecap="round" />
          <line x1="-12" y1={MOUTH.y} x2="300" y2={MOUTH.y} stroke="#E7B77A" strokeWidth="5" strokeLinecap="round" />
          {['fishball', 'kwek', 'kikiam'].map((t, i) => (
            <g key={t} className={`item-${i}`}>
              <g transform={`translate(${ITEM_X[i] - 31} ${MOUTH.y - 31}) scale(0.62)`}>{SHAPES[t]}</g>
            </g>
          ))}
        </g>
        </g>
        {[0, 1, 2].map((i) => (
          <g key={i}>
            {[[-10, 0], [2, 6], [14, -2]].map(([dx, dy], j) => (
              <circle key={j} className={`crumb-${i}`} cx={MOUTH.x + dx} cy={MOUTH.y + 14 + dy} r="3.5" fill={['#D98A3D', '#FF6A13', '#8A4B22'][i]} stroke="#FFF4E0" strokeWidth="1.5" opacity="0" />
            ))}
          </g>
        ))}
      </svg>

      <div className="relative mx-auto mt-2 w-full max-w-md motion-safe:h-44 motion-reduce:flex motion-reduce:flex-col motion-reduce:gap-3">
        <div className="bite-card motion-safe:absolute motion-safe:inset-x-0 motion-safe:top-0">
          <p className="text-lg font-bold">Mag-scroll para pakainin si Bunso.</p>
          <svg viewBox="0 0 24 24" width="28" height="28" className="mt-1 motion-reduce:hidden" aria-hidden="true"><path d="M12 4v15M5 13l7 7 7-7" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </div>
        {BITES.map(([t, d]) => (
          <div key={t} className="bite-card card p-4 motion-safe:invisible motion-safe:absolute motion-safe:inset-x-0 motion-safe:top-0 motion-safe:opacity-0">
            <h3 className="display text-3xl">{t}</h3>
            <p className="mt-1">{d}</p>
          </div>
        ))}
        <div className="bite-card card p-4 motion-safe:invisible motion-safe:absolute motion-safe:inset-x-0 motion-safe:top-0 motion-safe:opacity-0">
          <h3 className="display text-3xl">Ubos! Busog na si Bunso.</h3>
          <Link to="/menu" className="btn btn-ink mt-3 w-full">Ubos na? Order ka pa →</Link>
        </div>
      </div>
    </section>
  )
}

/* ---------- Parallax stickers (decorative, behind text, never block taps) ---------- */
function Par({ type, size = 64, speed = 1, className }) {
  return (
    <span data-par={speed} aria-hidden="true" className={`pointer-events-none absolute z-0 opacity-90 ${className}`}>
      <FoodSticker type={type} size={size} />
    </span>
  )
}

/* ---------- Sawsawan picker ---------- */
const SAUCE = { matamis: '#7C2D12', maanghang: '#DC2626', suka: '#F3E3A6' }
function Bottle({ id }) {
  return (
    <svg viewBox="0 0 60 110" width="72" height="132" aria-hidden="true" className="sticker">
      <rect x="22" y="4" width="16" height="14" rx="3" fill="#1C0A03" stroke="#FFF4E0" strokeWidth="4" />
      <path d="M24 18h12v10c8 4 12 10 12 20v46a8 8 0 0 1-8 8H20a8 8 0 0 1-8-8V48c0-10 4-16 12-20z" fill={SAUCE[id]} stroke="#FFF4E0" strokeWidth="5" strokeLinejoin="round" />
      <rect x="18" y="56" width="24" height="22" rx="4" fill="#FFF4E0" />
      {id === 'maanghang' && <path d="M24 72q8-14 14-6" fill="none" stroke="#DC2626" strokeWidth="4" strokeLinecap="round" />}
      {id === 'matamis' && <circle cx="30" cy="67" r="6" fill="#7C2D12" />}
      {id === 'suka' && <><circle cx="26" cy="67" r="4" fill="none" stroke="#BE185D" strokeWidth="2.5" /><circle cx="35" cy="69" r="3" fill="none" stroke="#BE185D" strokeWidth="2.5" /></>}
      <rect x="17" y="34" width="4" height="16" rx="2" fill="#fff" opacity="0.5" />
    </svg>
  )
}

function Sawsawan() {
  const { sawsawan, setSawsawan } = useStore()
  const refs = useRef({})
  const onKey = (e) => {
    const i = SAWSAWAN.findIndex((s) => s.id === sawsawan)
    const d = ['ArrowRight', 'ArrowDown'].includes(e.key) ? 1 : ['ArrowLeft', 'ArrowUp'].includes(e.key) ? -1 : 0
    if (!d) return
    e.preventDefault()
    const next = SAWSAWAN[(i + d + SAWSAWAN.length) % SAWSAWAN.length].id
    setSawsawan(next)
    refs.current[next]?.focus()
  }
  return (
    <section id="sawsawan" className="on-light relative overflow-hidden bg-yellow px-4 py-14 text-ink" aria-labelledby="saw-h">
      <Par type="kikiam" size={70} speed={1.3} className="-left-4 top-8" />
      <Par type="chickenskin" size={60} speed={0.7} className="-right-3 bottom-10" />
      <div className="relative z-10 mx-auto max-w-md">
        <h2 id="saw-h" className="display text-6xl">Anong sawsawan mo?</h2>
        <p className="mt-2">Piliin ngayon, naka-set na ’yan pagdating sa checkout.</p>
        <div role="radiogroup" aria-labelledby="saw-h" onKeyDown={onKey} className="mt-12 grid grid-cols-3 gap-2">
          {SAWSAWAN.map((s) => {
            const on = s.id === sawsawan
            return (
              <button key={s.id} ref={(n) => { refs.current[s.id] = n }} type="button" role="radio" aria-checked={on} tabIndex={on ? 0 : -1}
                onClick={() => setSawsawan(s.id)}
                className={`relative flex flex-col items-center rounded-[24px] border-[3px] px-1 pb-3 pt-4 transition-transform duration-200 ${on ? '-translate-y-3 border-ink bg-cream' : 'border-transparent'}`}>
                {on && <span key={s.id} className="dip absolute -top-10 left-1/2 -ml-[22px]"><FoodSticker type="fishball" size={44} /></span>}
                <Bottle id={s.id} />
                <span className="display mt-2 text-xl">{s.name}</span>
                <span className="text-xs leading-tight">{s.desc}</span>
              </button>
            )
          })}
        </div>
        <p aria-live="polite" className="mt-5 font-bold">Napili: {SAWSAWAN.find((s) => s.id === sawsawan)?.name}</p>
      </div>
    </section>
  )
}

/* ---------- Page ---------- */
const STEPS = [
  ['Tusok.', 'Pumili sa menu at i-tap ang “+ Tusok”. Diretso ’yan sa bilao mo.'],
  ['Sawsaw.', 'Piliin ang sawsawan: matamis, maanghang, o suka.'],
  ['Ulit.', 'Kunin sa kanto pag “Ready na!” — tapos tusok ulit.'],
]

export default function Home() {
  const { add, toast } = useStore()
  const page = useRef(null)
  const best = [...MENU].sort((a, b) => b.sold - a.sold).slice(0, 4)

  useEffect(() => { document.title = 'TUSOK — Sarap ng kanto' }, [])

  useGSAP(() => {
    const mm = gsap.matchMedia()
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      gsap.utils.toArray('[data-par]', page.current).forEach((el) => {
        const s = Number(el.dataset.par) || 1
        gsap.fromTo(el, { y: 90 * s, rotation: -12 * s }, {
          y: -90 * s, rotation: 12 * s, ease: 'none',
          scrollTrigger: { trigger: el.parentElement, start: 'top bottom', end: 'bottom top', scrub: true },
        })
      })
    })
  }, { scope: page })

  const addBest = (it, e) => {
    add(it.id)
    flyToBilao(e.currentTarget.closest('li'))
    toast(`${it.name} — naitusok sa bilao!`, { label: 'Undo', fn: () => add(it.id, -1) })
  }

  return (
    <div ref={page}>
      <main id="main">
        <Hero />
        <Story />

        <section id="kwento" className="relative overflow-hidden bg-deep px-4 py-14" aria-labelledby="how-h">
          <Par type="isaw" size={84} speed={1.2} className="-right-5 top-6" />
          <Par type="turon" size={64} speed={0.6} className="-left-4 bottom-8" />
          <div className="relative z-10 mx-auto max-w-md">
            <h2 id="how-h" className="display text-7xl text-yellow">Tusok.<br />Sawsaw.<br />Ulit.</h2>
            <ol className="mt-8 flex flex-col gap-5">
              {STEPS.map(([t, d], i) => (
                <li key={t} className="flex gap-4">
                  <span className="display flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-magenta text-3xl" aria-hidden="true">{i + 1}</span>
                  <div><h3 className="display text-3xl">{t}</h3><p className="text-cream/90">{d}</p></div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section id="bestsellers" className="relative overflow-hidden bg-magenta px-4 py-14" aria-labelledby="best-h">
          <Par type="gulaman" size={72} speed={1.1} className="-right-3 top-4" />
          <Par type="bananacue" size={66} speed={0.8} className="-left-4 top-1/2" />
          <Par type="taho" size={56} speed={1.4} className="right-2 bottom-2" />
          <div className="relative z-10 mx-auto max-w-md md:max-w-4xl">
            <h2 id="best-h" className="display text-6xl">Laging ubos</h2>
            <p className="mt-1">Apat na pinaka-binabalikan sa kanto.</p>
            <ul className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
              {best.map((it) => (
                <li key={it.id} className="card on-light flex flex-col p-2.5">
                  <span className="flex h-24 items-center justify-center rounded-[20px] bg-yellow"><FoodSticker type={it.id} size={76} /></span>
                  <h3 className="display mt-2 px-1 text-xl">{it.name}</h3>
                  <p className="flex justify-between px-1 text-sm"><span>{it.unit}</span><strong>{peso(it.price)}</strong></p>
                  <button type="button" className="btn btn-ink mt-2 w-full" onClick={(e) => addBest(it, e)} aria-label={`Idagdag ang ${it.name} sa bilao`}>+ Tusok</button>
                </li>
              ))}
            </ul>
            <Link to="/menu" className="btn btn-yellow mt-6 w-full md:w-auto">Buong menu →</Link>
          </div>
        </section>

        <Sawsawan />
      </main>
      <Footer />
    </div>
  )
}
