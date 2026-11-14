import emailjs from '@emailjs/browser'
import { withTimeout } from './util.js'

// EmailJS IDs and the public key are designed to be visible in the browser, so they are safe as
// fallbacks here. Env vars (Vercel) still override them.
const SERVICE = import.meta.env.VITE_EMAILJS_SERVICE_ID || 'service_mgtm8ve'
const TEMPLATE = import.meta.env.VITE_EMAILJS_TEMPLATE_ID || 'template_nimqile'
const KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY || 'esbifRw85Z_RUMaGj'
export const emailReady = Boolean(SERVICE && TEMPLATE && KEY)

// Rejects (never throws synchronously) when keys are missing so callers can degrade gracefully.
export function sendEmail(params) {
  if (!emailReady) return Promise.reject(new Error('EmailJS not configured'))
  return withTimeout(emailjs.send(SERVICE, TEMPLATE, params, { publicKey: KEY }), 10000)
}

// Short human-readable reason for a failed send (shown in the tracker notice to make debugging easy).
export const emailErrorText = (err) => String(err?.text || err?.message || err || 'unknown').slice(0, 140)
