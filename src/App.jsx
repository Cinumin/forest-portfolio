import { lazy, Suspense } from 'react'
import { HashRouter, Link, Route, Routes } from 'react-router-dom'
import Home from './pages/Home'
import About from './pages/About'
import Contact from './pages/Contact'
import Gallery from './pages/Gallery'
const Walk = lazy(() => import('./pages/Walk'))

export default function App() {
  return <HashRouter><Suspense fallback={<main className="paper"><p>Loading the forest…</p><Link to="/Gallery">Open project list</Link></main>}>
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/About" element={<About />} />
      <Route path="/Projects" element={<Walk />} />
      <Route path="/Gallery" element={<Gallery />} />
      <Route path="/Contact" element={<Contact />} />
    </Routes>
  </Suspense></HashRouter>
}
