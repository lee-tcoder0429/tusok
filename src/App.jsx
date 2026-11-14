import { lazy, Suspense, useEffect } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import Toasts from './components/Toasts.jsx'

const Home = lazy(() => import('./pages/Home.jsx'))
const Shop = lazy(() => import('./pages/Shop.jsx'))
const Voucher = lazy(() => import('./pages/Voucher.jsx'))
const Checkout = lazy(() => import('./pages/Checkout.jsx'))
const Tracker = lazy(() => import('./pages/Tracker.jsx'))
const Board = lazy(() => import('./pages/Board.jsx'))
const Orders = lazy(() => import('./pages/Orders.jsx'))
const Patterns = lazy(() => import('./pages/Patterns.jsx'))

// Scroll to top on navigation, or to the #hash target (used by the HCI Patterns "Show me" links).
function ScrollManager() {
  const { pathname, hash } = useLocation()
  useEffect(() => {
    if (!hash) { window.scrollTo(0, 0); return }
    let tries = 0
    const t = setInterval(() => {
      const el = document.getElementById(hash.slice(1))
      if (el) {
        el.scrollIntoView({ block: 'start' })
        if (!el.hasAttribute('tabindex') && !/^(A|BUTTON|INPUT|SELECT)$/.test(el.tagName)) el.setAttribute('tabindex', '-1')
        el.focus({ preventScroll: true })
      }
      if (el || ++tries > 20) clearInterval(t)
    }, 100)
    return () => clearInterval(t)
  }, [pathname, hash])
  return null
}

export default function App() {
  return (
    <>
      <a href="#main" className="btn btn-yellow sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[80]">Laktawan papunta sa content</a>
      <ScrollManager />
      <Suspense fallback={<div className="p-8 font-bold" role="status">Naglo-load…</div>}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/menu" element={<Shop />} />
          <Route path="/v" element={<Voucher />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/order/:id" element={<Tracker />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/board" element={<Board />} />
          <Route path="/patterns" element={<Patterns />} />
          <Route path="*" element={<Home />} />
        </Routes>
      </Suspense>
      <Toasts />
    </>
  )
}
