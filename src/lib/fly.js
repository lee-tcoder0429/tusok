import gsap from 'gsap'
import { reducedMotion } from './util.js'

// Flies a copy of the sticker inside `fromEl` into the Bilao pill.
export function flyToBilao(fromEl) {
  if (reducedMotion() || !fromEl) return
  const svg = fromEl.querySelector('svg') || fromEl
  const target = document.getElementById('bilao-pill')
  if (!svg || !target) return
  const a = svg.getBoundingClientRect()
  const b = target.getBoundingClientRect()
  const ghost = svg.cloneNode(true)
  Object.assign(ghost.style, {
    position: 'fixed', left: `${a.left}px`, top: `${a.top}px`, width: `${a.width}px`, height: `${a.height}px`,
    zIndex: 70, pointerEvents: 'none', margin: 0,
  })
  ghost.setAttribute('aria-hidden', 'true')
  document.body.appendChild(ghost)
  gsap.to(ghost, {
    x: b.left + b.width / 2 - (a.left + a.width / 2),
    y: b.top + b.height / 2 - (a.top + a.height / 2),
    scale: 0.25, rotation: 200, duration: 0.6, ease: 'power2.in',
    onComplete: () => ghost.remove(),
  })
}
