import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { byId } from './data/menu.js'

export const VOUCHERS = { TUSOK50: 50 }
const KEY = 'tusok:v1'
const DEFAULTS = { cart: {}, promo: null, sawsawan: 'matamis', orders: [], favs: [] }

function load() {
  try {
    return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY) || '{}') }
  } catch {
    return DEFAULTS
  }
}

const Ctx = createContext(null)
export const useStore = () => useContext(Ctx)

export function StoreProvider({ children }) {
  const [s, setS] = useState(load)
  const [toasts, setToasts] = useState([])
  const [bump, setBump] = useState(0)
  const tid = useRef(0)

  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(s)) } catch { /* private mode */ }
  }, [s])

  // Keep tabs on the same device in sync (the /board fallback relies on this)
  useEffect(() => {
    const f = (e) => { if (e.key === KEY) setS(load()) }
    window.addEventListener('storage', f)
    return () => window.removeEventListener('storage', f)
  }, [])

  const dismiss = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), [])
  const toast = useCallback((msg, action) => {
    const id = ++tid.current
    setToasts([{ id, msg, action }]) // one at a time so toasts never stack over buttons
    setTimeout(() => dismiss(id), action ? 5000 : 3000)
  }, [dismiss])

  const add = useCallback((id, n = 1) => {
    setS((p) => {
      const cart = { ...p.cart }
      const q = (cart[id] || 0) + n
      if (q > 0) cart[id] = q
      else delete cart[id]
      return { ...p, cart }
    })
    if (n > 0) setBump((b) => b + 1)
  }, [])
  const setQty = useCallback((id, q) => setS((p) => {
    const cart = { ...p.cart }
    if (q > 0) cart[id] = q
    else delete cart[id]
    return { ...p, cart }
  }), [])
  const clearCart = useCallback(() => setS((p) => ({ ...p, cart: {} })), [])
  const applyPromo = useCallback((code) => {
    const c = String(code || '').trim().toUpperCase()
    if (!VOUCHERS[c]) return false
    setS((p) => (p.promo === c ? p : { ...p, promo: c }))
    return true
  }, [])
  const removePromo = useCallback(() => setS((p) => ({ ...p, promo: null })), [])
  const toggleFav = useCallback((id) => setS((p) => ({ ...p, favs: p.favs.includes(id) ? p.favs.filter((x) => x !== id) : [...p.favs, id] })), [])
  const setSawsawan = useCallback((v) => setS((p) => ({ ...p, sawsawan: v })), [])
  const addOrder = useCallback((o) => setS((p) => ({ ...p, orders: [...p.orders.filter((x) => x.id !== o.id), o] })), [])
  const updateOrder = useCallback((id, patch) => setS((p) => ({
    ...p, orders: p.orders.map((o) => (o.id === id ? { ...o, ...patch } : o)),
  })), [])

  const value = useMemo(() => {
    const lines = Object.entries(s.cart).map(([id, qty]) => ({ ...byId[id], qty })).filter((l) => l.name)
    const count = lines.reduce((a, l) => a + l.qty, 0)
    const subtotal = lines.reduce((a, l) => a + l.qty * l.price, 0)
    const discount = Math.min(subtotal, VOUCHERS[s.promo] || 0)
    const total = Math.max(0, subtotal - discount)
    return {
      ...s, lines, count, subtotal, discount, total, toasts, bump,
      toggleFav, add, setQty, clearCart, applyPromo, removePromo, setSawsawan, addOrder, updateOrder, toast, dismiss,
    }
  }, [s, toasts, bump, toggleFav, add, setQty, clearCart, applyPromo, removePromo, setSawsawan, addOrder, updateOrder, toast, dismiss])

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
