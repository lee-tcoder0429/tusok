import { fbEnabled, fbNextNo } from './firebase.js'
import { withTimeout } from './util.js'

export async function nextOrderId() {
  if (fbEnabled) {
    try { return await withTimeout(fbNextNo(), 5000) } catch { /* fall back to local counter */ }
  }
  const n = (Number(localStorage.getItem('tusok:counter')) || 0) + 1
  localStorage.setItem('tusok:counter', String(n))
  return n
}
