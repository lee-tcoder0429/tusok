export const STAGES = [
  { key: 'received', label: 'Natanggap' },
  { key: 'cooking', label: 'Pinriprito na' },
  { key: 'ready', label: 'Ready na!' },
  { key: 'done', label: 'Nakuha mo na' },
]
// Simulated demo timing
export const T_COOK = 12000
export const T_READY = 25000

export function liveStatus(order, now = Date.now()) {
  if (order.status === 'done') return 'done'
  const e = now - order.createdAt
  return e >= T_READY ? 'ready' : e >= T_COOK ? 'cooking' : 'received'
}
