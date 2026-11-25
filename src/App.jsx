import { lazy, Suspense } from 'react'
import { HashRouter, Link, Route, Routes } from 'react-router-dom'
import RoomLoading from './components/RoomLoading'
import BackgroundMusic from './components/BackgroundMusic'
import Home from './pages/Home'
import About from './pages/About'
import Contact from './pages/Contact'
import Gallery from './pages/Gallery'
import ArtworkDetail from './pages/ArtworkDetail'
const LanternPath = lazy(() => import('./pages/LanternPath'))

export default function App() {
  return <HashRouter><BackgroundMusic /><Suspense fallback={<RoomLoading />}>
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/About" element={<About />} />
      <Route path="/Projects" element={<LanternPath />} />
      <Route path="/Artworks/:id" element={<ArtworkDetail />} />
      <Route path="/Gallery" element={<Gallery />} />
      <Route path="/Contact" element={<Contact />} />
    </Routes>
  </Suspense></HashRouter>
}
