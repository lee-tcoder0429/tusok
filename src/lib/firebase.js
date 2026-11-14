// Optional live board. Everything here is lazy-loaded and only runs when the env keys exist.
const cfg = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}
export const fbEnabled = Boolean(cfg.apiKey && cfg.projectId && cfg.appId)

let ready
function fb() {
  if (!ready) {
    ready = (async () => {
      const { initializeApp } = await import('firebase/app')
      const fs = await import('firebase/firestore')
      return { fs, db: fs.getFirestore(initializeApp(cfg)) }
    })()
  }
  return ready
}

export async function fbNextNo() {
  const { fs, db } = await fb()
  const ref = fs.doc(db, 'meta', 'counter')
  return fs.runTransaction(db, async (t) => {
    const snap = await t.get(ref)
    const n = (snap.exists() ? snap.data().n || 0 : 0) + 1
    t.set(ref, { n })
    return n
  })
}

export async function fbWriteOrder(o) {
  if (!fbEnabled) return
  try {
    const { fs, db } = await fb()
    // No email address is stored — only what the board and tracker need.
    await fs.setDoc(fs.doc(db, 'orders', String(o.id)), {
      id: o.id, no: o.no, name: o.name, status: o.status, createdAt: o.createdAt,
      items: o.items, total: o.total, sawsawan: o.sawsawan, pickup: o.pickup,
    })
  } catch (e) { console.warn('Firestore write failed', e) }
}

export async function fbSetStatus(id, status) {
  if (!fbEnabled) return
  try {
    const { fs, db } = await fb()
    await fs.updateDoc(fs.doc(db, 'orders', String(id)), { status })
  } catch (e) { console.warn('Firestore status failed', e) }
}

export async function fbGetOrder(id) {
  if (!fbEnabled) return null
  try {
    const { fs, db } = await fb()
    const snap = await fs.getDoc(fs.doc(db, 'orders', String(id)))
    return snap.exists() ? snap.data() : null
  } catch { return null }
}

// Returns an unsubscribe function
export function fbSubscribe(cb) {
  let unsub = () => {}
  let cancelled = false
  fb().then(({ fs, db }) => {
    if (cancelled) return
    const q = fs.query(fs.collection(db, 'orders'), fs.orderBy('createdAt', 'desc'), fs.limit(30))
    unsub = fs.onSnapshot(q, (snap) => cb(snap.docs.map((d) => d.data())), (e) => console.warn('Firestore listen failed', e))
  }).catch((e) => console.warn('Firebase init failed', e))
  return () => { cancelled = true; unsub() }
}
