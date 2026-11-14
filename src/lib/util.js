export const SITE_URL = (import.meta.env.VITE_SITE_URL || (typeof window !== 'undefined' ? window.location.origin : '')).replace(/\/$/, '')
export const VOUCHER_URL = `${SITE_URL}/v?promo=TUSOK50`
export const pad = (n) => String(n).padStart(3, '0')
export const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches
export const vibrate = (p) => { try { navigator.vibrate?.(p) } catch { /* unsupported */ } }
export const withTimeout = (promise, ms) =>
  Promise.race([promise, new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), ms))])
export const fmtTime = (ts) => new Date(ts).toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit', second: '2-digit' })
