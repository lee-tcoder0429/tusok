import { useParams } from 'react-router-dom'

export default function Tracker() {
  const { id } = useParams()
  return (
    <main className="min-h-dvh p-6">
      <h1 className="font-display text-5xl uppercase text-yellow">Order #{id}</h1>
    </main>
  )
}
