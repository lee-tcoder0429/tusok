import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import Header from '../components/Header.jsx'
import Footer from '../components/Footer.jsx'

// Each entry: [pattern, where it lives, link]. Links with a #hash scroll to and focus the element.
const GROUPS = [
  ['Navigation', [
    ['Top menu', 'Header links sa desktop width (Menu, Kwento, Promo, Board).', '/menu#top-menu'],
    ['Hamburger menu', 'Sa mobile width: bilog na button sa kanan ng header.', '/menu#hamburger'],
    ['Tabs', 'Category tabs na may bilang: Lahat / Prito / Ihaw / Matamis / Panulak.', '/menu#tabs'],
    ['Breadcrumbs', 'Home › Menu › Kategorya, sa itaas ng Menu page.', '/menu#breadcrumbs'],
  ]],
  ['Data input', [
    ['Form + inline validation', 'Checkout step 2: Pangalan at Email, validate on blur at submit. Kailangan may laman ang bilao.', '/checkout#steps'],
    ['Dropdowns', 'Sort sa Menu; Sawsawan at Pickup time sa checkout.', '/menu#sort'],
    ['Autocomplete', 'Mag-type ng “fish” sa search — naka-bold ang tugmang letra, gumagana ang arrow keys.', '/menu#search-input'],
  ]],
  ['Feedback', [
    ['Determinate progress', 'Checkout steps (Bilao → Detalye → Confirm) at ang progress bar ng order tracker.', '/checkout#steps'],
    ['Indeterminate progress', 'Spinner at gumagalaw na bar habang “Pinapadala…” sa confirm sheet.', '/checkout'],
    ['Toast confirmation + Undo', 'Pindutin ang “+ Tusok” sa kahit anong item.', '/menu#grid'],
    ['Modal confirmation', '“Sure na?” bottom sheet bago i-place ang order. Focus trap, Esc para isara.', '/checkout'],
    ['Notifications', 'In-app banner, browser notification, vibration at tunog pag “Ready na!” sa tracker; email confirmation pagka-order.', '/checkout'],
  ]],
  ['Search', [
    ['Icon, placeholder, focus state', 'Sticky search bar sa Menu.', '/menu#search-input'],
    ['Suggestions + recent searches', 'I-focus ang walang lamang search bar para makita ang mga huling hinanap.', '/menu#search-input'],
    ['Zero-result state', 'Hanapin ang “pizza”: “Wala niyan sa kanto.” + Clear all filters.', '/menu#search-input'],
  ]],
  ['Filters', [
    ['Checkboxes, price slider, toggle', 'Filters button (bottom sheet sa mobile, sidebar sa desktop).', '/menu#filters'],
    ['Chips, Clear all, live count', 'Lumalabas sa itaas ng grid kapag may aktibong filter.', '/menu#grid'],
  ]],
  ['Sorting', [
    ['Bestseller, presyo ↑↓, rating, bago', '“Ayusin” dropdown; sabay gumagana sa filters.', '/menu#sort-select'],
  ]],
  ['Recommendations', [
    ['Contextual strip', '“Bagay dito: …” — nag-iiba depende sa laman ng bilao.', '/menu#reco'],
  ]],
  ['Gestures', [
    ['Drag to tusok', 'I-drag ang sticker papunta sa stick. Fallback: tap o Enter/Space.', '/#drag'],
    ['Swipe to remove', 'I-swipe pakaliwa ang item sa bilao. Fallback: × button.', '/checkout#cart'],
    ['Tap ×3', 'Voucher reveal sa QR landing page.', '/v?promo=TUSOK50'],
    ['Scroll-driven story', 'Si Bunso, kumakagat habang nag-i-scroll.', '/#bunso'],
  ]],
  ['Accessibility', [
    ['Keyboard + focus', 'Subukan ang Tab sa kahit anong page: 3px focus ring, skip link, walang trap maliban sa bukas na dialog.', '/menu'],
    ['Radio group', 'Sawsawan picker: arrow keys para pumili.', '/#sawsawan'],
    ['Reduced motion', 'I-on ang “Reduce motion” sa OS: walang animation, static ang kwento ni Bunso.', '/'],
    ['Labels + contrast', 'Totoong button/link/label elements, aria-labels, text contrast ≥ 4.5:1.', '/menu'],
  ]],
]

export default function Patterns() {
  useEffect(() => { document.title = 'HCI Patterns — TUSOK' }, [])
  return (
    <div className="banig min-h-dvh">
      <Header />
      <main id="main" className="mx-auto max-w-3xl px-4 pb-16">
        <h1 className="display text-6xl text-yellow">HCI Patterns</h1>
        <p className="mt-2 max-w-xl">Listahan ng bawat pattern at kung saan ito makikita sa site. Pindutin ang “Show me” para tumalon doon.</p>
        <div className="mt-6 flex flex-col gap-4">
          {GROUPS.map(([group, items]) => (
            <section key={group} className="card on-light p-5" aria-labelledby={`g-${group}`}>
              <h2 id={`g-${group}`} className="display text-3xl">{group}</h2>
              <ul className="mt-2 divide-y-2 divide-dashed divide-ink/20">
                {items.map(([name, where, to]) => (
                  <li key={name} className="flex items-center gap-3 py-2.5">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold">{name}</h3>
                      <p className="text-sm">{where}</p>
                    </div>
                    <Link to={to} className="btn btn-ink shrink-0 !px-4 text-sm" aria-label={`Show me: ${name}`}>Show me</Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  )
}
