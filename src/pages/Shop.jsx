import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import Header from '../components/Header.jsx'
import Footer from '../components/Footer.jsx'
import FoodSticker from '../components/FoodSticker.jsx'
import Sheet from '../components/Sheet.jsx'
import Stepper from '../components/Stepper.jsx'
import { MENU, SAWSAWAN, byId, peso } from '../data/menu.js'
import { useStore } from '../store.jsx'
import { flyToBilao } from '../lib/fly.js'

const CATS = [['lahat', 'Lahat'], ['prito', 'Prito'], ['ihaw', 'Ihaw'], ['matamis', 'Matamis'], ['panulak', 'Panulak']]
const CAT_LABEL = Object.fromEntries(CATS)
const SORTS = {
  bestseller: ['Bestseller', (a, b) => b.sold - a.sold],
  asc: ['Presyo: low → high', (a, b) => a.price - b.price || b.sold - a.sold],
  desc: ['Presyo: high → low', (a, b) => b.price - a.price || b.sold - a.sold],
  rating: ['Rating', (a, b) => b.rating - a.rating],
  bago: ['Bago', (a, b) => b.addedAt.localeCompare(a.addedAt)],
}
const F0 = { spicy: false, sweet: false, cheap: false, max: 40, avail: false }
const CHECKS = [
  ['spicy', 'Maanghang', (it) => it.tags.includes('maanghang')],
  ['sweet', 'Matamis', (it) => it.tags.includes('matamis')],
  ['cheap', '₱20 pababa', (it) => it.price <= 20],
]
const TILE = { prito: 'bg-yellow', ihaw: 'bg-magenta', matamis: 'bg-orange', panulak: 'bg-brown' }
const RECENT_KEY = 'tusok:recent'

const norm = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
function matches(it, q) {
  const n = norm(q).replace(/₱/g, '').trim()
  if (!n) return true
  if (/^\d+$/.test(n)) return it.price === Number(n)
  return norm([it.name, it.category, ...it.tags].join(' ')).includes(n)
}
const passes = (it, f) =>
  CHECKS.every(([k, , fn]) => !f[k] || fn(it)) && it.price <= f.max && (!f.avail || it.available)

const SUGGEST_POOL = [
  ...MENU.map((m) => m.name), 'maanghang', 'matamis', 'bestseller', 'prito', 'ihaw', 'panulak',
  ...[...new Set(MENU.map((m) => m.price))].sort((a, b) => a - b).map((p) => `₱${p}`),
]

function Bold({ text, q }) {
  const i = norm(text).indexOf(norm(q))
  if (i < 0 || !q) return text
  return <>{text.slice(0, i)}<strong className="font-bold underline decoration-2">{text.slice(i, i + q.length)}</strong>{text.slice(i + q.length)}</>
}

function Search({ q, setQ }) {
  const [focus, setFocus] = useState(false)
  const [active, setActive] = useState(-1)
  const [recent, setRecent] = useState(() => { try { return JSON.parse(localStorage.getItem(RECENT_KEY)) || [] } catch { return [] } })
  const input = useRef(null)
  const typed = q.trim()
  const list = typed
    ? SUGGEST_POOL.filter((s) => norm(s).includes(norm(typed)) && norm(s) !== norm(typed)).slice(0, 6)
    : recent
  const open = focus && list.length > 0

  const saveRecent = (r) => { setRecent(r); try { localStorage.setItem(RECENT_KEY, JSON.stringify(r)) } catch { /* ignore */ } }
  const commit = (v) => {
    const val = v.trim()
    setQ(val); setActive(-1); setFocus(false)
    if (val) saveRecent([val, ...recent.filter((r) => norm(r) !== norm(val))].slice(0, 5))
  }
  const onKey = (e) => {
    if (e.key === 'ArrowDown' && list.length) { e.preventDefault(); setFocus(true); setActive((a) => (a + 1) % list.length) }
    else if (e.key === 'ArrowUp' && list.length) { e.preventDefault(); setActive((a) => (a <= 0 ? list.length - 1 : a - 1)) }
    else if (e.key === 'Enter') { e.preventDefault(); commit(active >= 0 && open ? list[active] : q) }
    else if (e.key === 'Escape') { setFocus(false); setActive(-1) }
  }

  return (
    <div id="search" className="on-light relative" role="search">
      <label htmlFor="search-input" className="sr-only">Maghanap sa menu</label>
      <svg viewBox="0 0 24 24" width="22" height="22" className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink" aria-hidden="true">
        <circle cx="10.5" cy="10.5" r="6.5" fill="none" stroke="currentColor" strokeWidth="2.6" /><path d="M15.5 15.5L21 21" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
      </svg>
      <input
        ref={input} id="search-input" type="text" inputMode="search" autoComplete="off" enterKeyHint="search"
        role="combobox" aria-expanded={open} aria-controls="search-list" aria-autocomplete="list"
        aria-activedescendant={open && active >= 0 ? `sugg-${active}` : undefined}
        placeholder="Hanap: fishball, maanghang, ₱20…"
        value={q}
        onChange={(e) => { setQ(e.target.value); setActive(-1); setFocus(true) }}
        onFocus={() => setFocus(true)}
        onBlur={() => setTimeout(() => setFocus(false), 120)}
        onKeyDown={onKey}
        className="h-13 w-full rounded-full border-[3px] border-ink bg-cream pl-12 pr-13 text-base font-medium text-ink placeholder:text-ink/60 focus:bg-white"
      />
      {q && (
        <button type="button" aria-label="Burahin ang hinahanap" onClick={() => { setQ(''); input.current?.focus() }}
          className="absolute right-1 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full text-ink">
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M5 5l14 14M19 5L5 19" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" /></svg>
        </button>
      )}
      <div className={open ? 'absolute inset-x-0 top-full z-30 mt-2 overflow-hidden rounded-[22px] border-[3px] border-ink bg-cream text-ink' : 'hidden'}>
        {!typed && open && (
          <div className="flex items-center justify-between px-4 pt-2 text-sm font-bold text-ink/75">
            <span id="recent-label">Mga huling hinanap</span>
            <button type="button" className="min-h-11 px-2 underline" onMouseDown={(e) => e.preventDefault()} onClick={() => saveRecent([])}>Burahin</button>
          </div>
        )}
        <ul id="search-list" role="listbox" aria-label={typed ? 'Mga suggestion' : 'Mga huling hinanap'}>
          {open && list.map((s, i) => (
            <li
              key={s} id={`sugg-${i}`} role="option" aria-selected={i === active}
              onMouseDown={(e) => e.preventDefault()} onClick={() => commit(s)} onMouseEnter={() => setActive(i)}
              className={`flex min-h-11 cursor-pointer items-center px-4 ${i === active ? 'bg-yellow' : ''}`}
            >
              <Bold text={s} q={typed} />
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

function Filters({ f, setF, base, pre }) {
  return (
    <div className="flex flex-col gap-4">
      <fieldset>
        <legend className="mb-1 font-bold">Uri</legend>
        {CHECKS.map(([k, label, fn]) => (
          <label key={k} htmlFor={`${pre}-${k}`} className="flex min-h-11 cursor-pointer items-center gap-3">
            <input id={`${pre}-${k}`} type="checkbox" checked={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.checked })} className="h-6 w-6 accent-[#C2410C]" />
            <span className="flex-1">{label}</span>
            <span className="rounded-full bg-ink/10 px-2 text-sm font-bold">{base.filter(fn).length}</span>
          </label>
        ))}
      </fieldset>
      <div>
        <label htmlFor={`${pre}-max`} className="flex justify-between font-bold">
          <span>Presyo</span><output htmlFor={`${pre}-max`}>Hanggang ₱{f.max}</output>
        </label>
        <input
          id={`${pre}-max`} type="range" min="15" max="40" step="5" value={f.max}
          onChange={(e) => setF({ ...f, max: Number(e.target.value) })}
          aria-valuetext={`Hanggang ₱${f.max}`} className="h-11 w-full accent-[#C2410C]"
        />
        <div className="flex justify-between text-sm text-ink/75" aria-hidden="true"><span>₱15</span><span>₱40</span></div>
      </div>
      <label htmlFor={`${pre}-avail`} className="flex min-h-11 cursor-pointer items-center justify-between gap-3 font-bold">
        Available ngayon
        <input id={`${pre}-avail`} type="checkbox" role="switch" checked={f.avail} onChange={(e) => setF({ ...f, avail: e.target.checked })} className="peer sr-only" />
        <span aria-hidden="true" className="relative h-7 w-12 rounded-full bg-ink/30 transition-colors after:absolute after:left-1 after:top-1 after:h-5 after:w-5 after:rounded-full after:bg-cream after:transition-transform peer-checked:bg-orange peer-checked:after:translate-x-5 peer-focus-visible:outline peer-focus-visible:outline-[3px] peer-focus-visible:outline-offset-2 peer-focus-visible:outline-blue" />
      </label>
    </div>
  )
}

function Card({ it, onOpen, onAdd }) {
  return (
    <li className="card on-light flex flex-col p-2.5">
      <button type="button" onClick={() => onOpen(it)} aria-haspopup="dialog" aria-label={`Tingnan ang detalye ng ${it.name}`} className="flex flex-1 flex-col rounded-[20px] text-left">
        <span className={`relative flex h-28 w-full items-center justify-center rounded-[20px] ${TILE[it.category]}`}>
          <FoodSticker type={it.id} size={84} />
          <span className="absolute left-1.5 top-1.5 flex flex-col items-start gap-1">
            {it.tags.includes('bestseller') && <span className="rounded-full bg-ink px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-yellow">Bestseller</span>}
            {it.tags.includes('maanghang') && <span className="rounded-full bg-cream px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-[#9F1239]">Maanghang</span>}
          </span>
        </span>
        <span className="display mt-2 block px-1 text-xl">{it.name}</span>
        <span className="flex items-center justify-between px-1 text-sm">
          <span className="text-ink/80">{it.unit}</span>
          <span aria-label={`Rating ${it.rating} sa 5`} className="font-bold"><span aria-hidden="true">★ </span>{it.rating}</span>
        </span>
        <span className="mt-1 block px-1 text-lg font-bold">{peso(it.price)}</span>
      </button>
      <button
        type="button" className="btn btn-ink mt-2 w-full" disabled={!it.available}
        onClick={(e) => onAdd(it, 1, e.currentTarget.closest('li'))}
        aria-label={it.available ? `Idagdag ang ${it.name} sa bilao` : `${it.name}, ubos na`}
      >
        {it.available ? '+ Tusok' : 'Ubos na'}
      </button>
    </li>
  )
}

export default function Shop() {
  const { add, toast, cart, sawsawan, setSawsawan } = useStore()
  const [q, setQ] = useState('')
  const [cat, setCat] = useState('lahat')
  const [f, setF] = useState(F0)
  const [sort, setSort] = useState('bestseller')
  const [sheet, setSheet] = useState(false)
  const [view, setView] = useState(null)
  const [qty, setQtyLocal] = useState(1)

  useEffect(() => { document.title = 'Menu — TUSOK' }, [])

  const searched = useMemo(() => MENU.filter((it) => matches(it, q)), [q])
  const base = useMemo(() => searched.filter((it) => cat === 'lahat' || it.category === cat), [searched, cat])
  const results = useMemo(() => base.filter((it) => passes(it, f)).sort(SORTS[sort][1]), [base, f, sort])
  const catCount = (c) => searched.filter((it) => (c === 'lahat' || it.category === c) && passes(it, f)).length

  const chips = [
    q.trim() && { key: 'q', label: `“${q.trim()}”`, clear: () => setQ('') },
    cat !== 'lahat' && { key: 'cat', label: CAT_LABEL[cat], clear: () => setCat('lahat') },
    ...CHECKS.map(([k, label]) => f[k] && { key: k, label, clear: () => setF({ ...f, [k]: false }) }),
    f.max < 40 && { key: 'max', label: `Hanggang ₱${f.max}`, clear: () => setF({ ...f, max: 40 }) },
    f.avail && { key: 'avail', label: 'Available ngayon', clear: () => setF({ ...f, avail: false }) },
  ].filter(Boolean)
  const filterCount = chips.filter((c) => c.key !== 'q' && c.key !== 'cat').length
  const clearAll = () => { setQ(''); setCat('lahat'); setF(F0) }

  const onAdd = (it, n = 1, fromEl) => {
    add(it.id, n)
    flyToBilao(fromEl)
    toast('Naitusok sa bilao!', { label: 'Undo', fn: () => add(it.id, -n) })
  }

  // Contextual recommendation
  const reco = useMemo(() => {
    const cats = new Set(Object.keys(cart).map((id) => byId[id]?.category))
    if (!cats.size) return { it: byId.kwek, why: 'Di alam ang uunahin? Ito ang paborito ng kanto.' }
    if (!cats.has('panulak') && [...cats].every((c) => c === 'prito' || c === 'ihaw')) return { it: byId.gulaman, why: 'Puro prito ang bilao mo — kailangan mo ng panulak.' }
    if ([...cats].every((c) => c === 'matamis')) return { it: byId.fishball, why: 'Puro matamis ang bilao mo — samahan ng prito.' }
    if (!cats.has('panulak')) return { it: byId.gulaman, why: 'Wala ka pang panulak.' }
    if (!cats.has('matamis')) return { it: byId.turon, why: 'Panghimagas pagkatapos ng tusok.' }
    return null
  }, [cart])

  const tabs = useRef(null)
  const onTabKey = (e) => {
    const i = CATS.findIndex(([c]) => c === cat)
    const d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0
    if (!d) return
    e.preventDefault()
    const next = CATS[(i + d + CATS.length) % CATS.length][0]
    setCat(next)
    tabs.current?.querySelector(`[data-cat="${next}"]`)?.focus()
  }

  return (
    <div className="banig min-h-dvh">
      <Header />
      <main id="main" className="mx-auto max-w-6xl px-4 pb-16">
        <nav id="breadcrumbs" aria-label="Breadcrumb" className="pt-1 text-sm font-medium">
          <ol className="flex flex-wrap items-center gap-1">
            <li><Link to="/" className="inline-flex min-h-11 items-center underline underline-offset-4">Home</Link></li>
            <li aria-hidden="true">›</li>
            <li>{cat === 'lahat'
              ? <span aria-current="page" className="font-bold">Menu</span>
              : <button type="button" onClick={() => setCat('lahat')} className="min-h-11 underline underline-offset-4">Menu</button>}</li>
            {cat !== 'lahat' && <><li aria-hidden="true">›</li><li aria-current="page" className="font-bold">{CAT_LABEL[cat]}</li></>}
          </ol>
        </nav>

        <h1 className="display text-6xl text-yellow sm:text-7xl">Ano&apos;ng tusok mo?</h1>

        <div className="sticky top-0 z-30 -mx-4 mt-3 bg-orange px-4 py-2 banig">
          <Search q={q} setQ={setQ} />
        </div>

        <div id="tabs" ref={tabs} role="tablist" aria-label="Kategorya" onKeyDown={onTabKey}
          className="no-scrollbar -mx-4 mt-2 flex gap-2 overflow-x-auto px-4 py-2">
          {CATS.map(([c, label]) => (
            <button key={c} type="button" role="tab" data-cat={c} aria-selected={cat === c} aria-controls="grid" tabIndex={cat === c ? 0 : -1}
              onClick={() => setCat(c)}
              className={`flex min-h-11 shrink-0 items-center gap-2 rounded-full border-2 px-4 font-bold ${cat === c ? 'border-yellow bg-yellow text-ink' : 'border-cream text-cream'}`}>
              {label}
              <span className={`rounded-full px-2 text-sm ${cat === c ? 'bg-ink text-cream' : 'bg-ink/35'}`}>{catCount(c)}</span>
            </button>
          ))}
        </div>

        <div className="mt-3 lg:grid lg:grid-cols-[230px_1fr] lg:gap-8">
          <aside className="hidden lg:block" aria-label="Filters">
            <div className="card on-light sticky top-24 p-5">
              <h2 className="display mb-2 text-2xl">Filters</h2>
              <Filters f={f} setF={setF} base={base} pre="side" />
            </div>
          </aside>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <button id="filters" type="button" onClick={() => setSheet(true)} aria-haspopup="dialog" className="btn btn-cream lg:hidden">
                <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M4 6h16M7 12h10M10 18h4" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" /></svg>
                Filters{filterCount > 0 && <span className="rounded-full bg-ink px-2 text-sm text-cream">{filterCount}</span>}
              </button>
              <div id="sort" className="on-light ml-auto flex items-center gap-2">
                <label htmlFor="sort-select" className="text-sm font-bold text-cream">Ayusin:</label>
                <select id="sort-select" value={sort} onChange={(e) => setSort(e.target.value)}
                  className="min-h-11 rounded-full border-2 border-ink bg-cream px-3 font-bold text-ink">
                  {Object.entries(SORTS).map(([k, [label]]) => <option key={k} value={k}>{label}</option>)}
                </select>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <p aria-live="polite" role="status" className="mr-1 font-bold">{results.length} {results.length === 1 ? 'item' : 'items'}</p>
              {chips.length > 0 && (
                <ul id="chips" aria-label="Mga aktibong filter" className="contents">
                  {chips.map((c) => (
                    <li key={c.key}>
                      <button type="button" onClick={c.clear} aria-label={`Alisin ang filter: ${c.label}`}
                        className="flex min-h-11 items-center gap-2 rounded-full bg-ink pl-4 pr-3 text-sm font-bold text-cream">
                        {c.label}
                        <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><path d="M5 5l14 14M19 5L5 19" stroke="currentColor" strokeWidth="3" strokeLinecap="round" /></svg>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {chips.length > 0 && <button type="button" onClick={clearAll} className="min-h-11 px-2 font-bold underline underline-offset-4">Clear all</button>}
            </div>

            {results.length === 0 ? (
              <div id="grid" role="tabpanel" className="card on-light mt-4 flex flex-col items-center gap-3 p-8 text-center">
                <FoodSticker type="fishball" size={88} className="opacity-90" />
                <h2 className="display text-4xl">Wala niyan sa kanto.</h2>
                <p>Fishball kaya? Subukan ang ibang salita o alisin ang mga filter.</p>
                <button type="button" className="btn btn-ink" onClick={clearAll}>Clear all filters</button>
              </div>
            ) : (
              <ul id="grid" role="tabpanel" aria-label={`${CAT_LABEL[cat]} — ${results.length} items`} className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
                {results.map((it) => <Card key={it.id} it={it} onOpen={(x) => { setView(x); setQtyLocal(1) }} onAdd={onAdd} />)}
              </ul>
            )}

            {reco && (
              <section id="reco" aria-label="Rekomendasyon" className="mt-8 flex items-center gap-3 rounded-[26px] bg-magenta p-4 text-cream">
                <span className="flex h-20 w-20 shrink-0 items-center justify-center rounded-[20px] bg-yellow"><FoodSticker type={reco.it.id} size={64} /></span>
                <div className="min-w-0 flex-1">
                  <h2 className="display text-2xl">Bagay dito: {reco.it.name}</h2>
                  <p className="text-sm">{reco.why}</p>
                </div>
                <button type="button" className="btn btn-yellow shrink-0 !px-4" onClick={(e) => onAdd(reco.it, 1, e.currentTarget.closest('section'))}
                  aria-label={`Idagdag ang ${reco.it.name} sa bilao, ${peso(reco.it.price)}`}>+ Tusok</button>
              </section>
            )}
          </div>
        </div>
      </main>
      <Footer />

      <Sheet open={sheet} onClose={() => setSheet(false)} title="Filters">
        <Filters f={f} setF={setF} base={base} pre="sheet" />
        <div className="mt-5 flex gap-2">
          <button type="button" className="btn btn-line flex-1" onClick={() => setF(F0)}>Clear all</button>
          <button type="button" className="btn btn-ink flex-[2]" onClick={() => setSheet(false)}>Ipakita ang {results.length} items</button>
        </div>
      </Sheet>

      <Sheet open={!!view} onClose={() => setView(null)} title={view?.name ?? ''}>
        {view && (
          <div className="flex flex-col gap-4">
            <div className={`flex h-36 items-center justify-center rounded-[22px] ${TILE[view.category]}`}><FoodSticker type={view.id} size={120} title={view.name} /></div>
            <p>{view.desc}</p>
            <p className="flex items-center justify-between font-bold">
              <span>{peso(view.price)} · {view.unit}</span>
              <span aria-label={`Rating ${view.rating} sa 5`}><span aria-hidden="true">★ </span>{view.rating}</span>
            </p>
            <div className="flex items-center justify-between">
              <span className="font-bold">Ilan?</span>
              <Stepper value={qty} onChange={setQtyLocal} label={view.name} />
            </div>
            <div>
              <label htmlFor="qv-sawsawan" className="mb-1 block font-bold">Sawsawan</label>
              <select id="qv-sawsawan" className="field" value={sawsawan} onChange={(e) => setSawsawan(e.target.value)}>
                {SAWSAWAN.map((s) => <option key={s.id} value={s.id}>{s.name} — {s.desc}</option>)}
              </select>
            </div>
            <button type="button" className="btn btn-ink w-full" disabled={!view.available}
              onClick={() => { onAdd(view, qty); setView(null) }}>
              {view.available ? `+ Tusok — ${peso(view.price * qty)}` : 'Ubos na ngayon'}
            </button>
          </div>
        )}
      </Sheet>
    </div>
  )
}
