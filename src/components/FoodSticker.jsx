// Sticker-style food: flat shapes, thick cream outline, small highlight.
const C = '#FFF4E0'
const O = { stroke: C, strokeWidth: 10, strokeLinejoin: 'round', strokeLinecap: 'round', paintOrder: 'stroke' }
const hi = (x, y, rx = 9, ry = 5, rot = -30) => (
  <ellipse cx={x} cy={y} rx={rx} ry={ry} fill="#fff" opacity="0.5" transform={`rotate(${rot} ${x} ${y})`} />
)
const stick = (
  <>
    <line x1="50" y1="4" x2="50" y2="97" stroke={C} strokeWidth="10" strokeLinecap="round" />
    <line x1="50" y1="4" x2="50" y2="97" stroke="#E7B77A" strokeWidth="4.5" strokeLinecap="round" />
  </>
)
const cup = 'M27 26h46l-6 60a6 6 0 0 1-6 5H39a6 6 0 0 1-6-5z'

export const SHAPES = {
  fishball: (
    <>
      <circle cx="50" cy="50" r="36" fill="#D98A3D" {...O} />
      <circle cx="62" cy="62" r="5" fill="#B86A24" /><circle cx="44" cy="68" r="3" fill="#B86A24" /><circle cx="68" cy="44" r="2.5" fill="#B86A24" />
      {hi(37, 35, 11, 6)}
    </>
  ),
  kwek: (
    <>
      <ellipse cx="50" cy="50" rx="40" ry="33" fill="#FF6A13" {...O} />
      {[[34, 56], [50, 66], [66, 54], [58, 38], [44, 44], [72, 42]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="3.2" fill="#C2410C" />)}
      {hi(34, 34, 11, 5)}
    </>
  ),
  kikiam: (
    <g transform="rotate(-20 50 50)">
      <ellipse cx="50" cy="50" rx="42" ry="21" fill="#8A4B22" {...O} />
      <path d="M26 54q24 10 48 0" fill="none" stroke="#6B3716" strokeWidth="3" strokeLinecap="round" />
      {hi(34, 41, 12, 4, 0)}
    </g>
  ),
  chickenskin: (
    <>
      <path d="M20 56c-6-14 6-30 20-28 6-12 26-10 30 2 13 2 17 18 9 27 2 14-14 22-26 16-12 8-31 0-33-17z" fill="#E2A23B" {...O} />
      {[[38, 50], [56, 44], [64, 60], [46, 66], [30, 60]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="3" fill="#B8741C" />)}
      {hi(42, 36, 9, 4)}
    </>
  ),
  isaw: (
    <>
      {stick}
      <path d="M30 20C78 22 78 36 50 38C22 40 22 54 50 56C78 58 78 72 50 74C30 75 26 82 34 86" fill="none" stroke={C} strokeWidth="25" strokeLinecap="round" />
      <path d="M30 20C78 22 78 36 50 38C22 40 22 54 50 56C78 58 78 72 50 74C30 75 26 82 34 86" fill="none" stroke="#7A3E1D" strokeWidth="15" strokeLinecap="round" />
      <path d="M32 17C60 17 70 22 68 28" fill="none" stroke="#fff" opacity="0.4" strokeWidth="3" strokeLinecap="round" />
    </>
  ),
  betamax: (
    <>
      {stick}
      {[16, 40, 64].map((y) => (
        <g key={y}>
          <rect x="30" y={y} width="40" height="20" rx="5" fill="#3B1A0E" {...O} />
          <rect x="35" y={y + 4} width="14" height="3.5" rx="1.75" fill="#fff" opacity="0.35" />
        </g>
      ))}
    </>
  ),
  turon: (
    <g transform="rotate(-18 50 50)">
      <rect x="14" y="33" width="72" height="34" rx="15" fill="#E3A02B" {...O} />
      <path d="M34 36l-6 28M52 36l-6 28M70 36l-6 28" stroke="#B8741C" strokeWidth="3" strokeLinecap="round" />
      {hi(30, 42, 10, 3.5, 0)}
    </g>
  ),
  bananacue: (
    <>
      {stick}
      <ellipse cx="50" cy="33" rx="21" ry="17" fill="#C9781C" {...O} />
      <ellipse cx="50" cy="66" rx="21" ry="17" fill="#C9781C" {...O} />
      {hi(41, 25, 8, 4)}{hi(41, 58, 8, 4)}
      <circle cx="58" cy="38" r="2" fill="#FFF4E0" /><circle cx="60" cy="70" r="2" fill="#FFF4E0" /><circle cx="46" cy="74" r="1.6" fill="#FFF4E0" />
    </>
  ),
  taho: (
    <>
      <path d={cup} fill="#F6E3B8" {...O} />
      <path d="M27 26h46l-1.6 16H28.6z" fill="#7C2D12" />
      {[[40, 36], [52, 33], [62, 37], [46, 60], [58, 70], [42, 78]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="3" fill="#431407" />)}
      <rect x="35" y="48" width="4" height="26" rx="2" fill="#fff" opacity="0.6" />
    </>
  ),
  gulaman: (
    <>
      <line x1="62" y1="6" x2="54" y2="60" stroke={C} strokeWidth="11" strokeLinecap="round" />
      <line x1="62" y1="6" x2="54" y2="60" stroke="#FFC531" strokeWidth="5" strokeLinecap="round" />
      <path d={cup} fill="#A8321A" {...O} />
      <rect x="38" y="52" width="10" height="10" rx="2" fill="#6B1A0C" /><rect x="54" y="64" width="10" height="10" rx="2" fill="#6B1A0C" /><rect x="42" y="72" width="8" height="8" rx="2" fill="#6B1A0C" />
      <circle cx="58" cy="48" r="3" fill="#431407" /><circle cx="46" cy="42" r="3" fill="#431407" />
      <rect x="34" y="34" width="4" height="30" rx="2" fill="#fff" opacity="0.45" />
    </>
  ),
}

export default function FoodSticker({ type, size = 72, title, className = '', style }) {
  return (
    <svg
      viewBox="0 0 100 100" width={size} height={size} className={`sticker ${className}`} style={style}
      role={title ? 'img' : undefined} aria-label={title} aria-hidden={title ? undefined : true} focusable="false"
    >
      {SHAPES[type] ?? SHAPES.fishball}
    </svg>
  )
}
