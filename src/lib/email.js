import emailjs from '@emailjs/browser'
import { withTimeout } from './util.js'

const SERVICE = import.meta.env.VITE_EMAILJS_SERVICE_ID
const TEMPLATE = import.meta.env.VITE_EMAILJS_TEMPLATE_ID
const KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY
export const emailReady = Boolean(SERVICE && TEMPLATE && KEY)

// Rejects (never throws synchronously) when keys are missing so callers can degrade gracefully.
export function sendEmail(params) {
  if (!emailReady) return Promise.reject(new Error('EmailJS not configured'))
  return withTimeout(emailjs.send(SERVICE, TEMPLATE, params, { publicKey: KEY }), 10000)
}
