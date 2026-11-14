import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home.jsx'
import Shop from './pages/Shop.jsx'
import Voucher from './pages/Voucher.jsx'
import Checkout from './pages/Checkout.jsx'
import Tracker from './pages/Tracker.jsx'
import Board from './pages/Board.jsx'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/menu" element={<Shop />} />
      <Route path="/v" element={<Voucher />} />
      <Route path="/checkout" element={<Checkout />} />
      <Route path="/order/:id" element={<Tracker />} />
      <Route path="/board" element={<Board />} />
      <Route path="*" element={<Home />} />
    </Routes>
  )
}
