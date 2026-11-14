import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="bg-ink px-5 py-10 text-cream">
      <div className="mx-auto flex max-w-6xl flex-col gap-4">
        <p className="display text-5xl">TUSOK<span className="text-yellow">.</span></p>
        <p className="max-w-sm text-cream/85">Sarap ng kanto, isang tusok lang. Demo site ito para sa HCI class — walang totoong bayad, pero totoo ang gutom.</p>
        <nav aria-label="Footer" className="flex flex-wrap gap-x-5 gap-y-1 font-bold">
          {[['/menu', 'Menu'], ['/v?promo=TUSOK50', 'Promo'], ['/board', 'Now Serving'], ['/patterns', 'HCI Patterns']].map(([to, l]) => (
            <Link key={to} to={to} className="flex min-h-11 items-center underline underline-offset-4">{l}</Link>
          ))}
        </nav>
      </div>
    </footer>
  )
}
