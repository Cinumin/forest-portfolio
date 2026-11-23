import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'

function CrystalSnow() {
  const ref = useRef(null)
  useEffect(() => {
    const canvas = ref.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const reduced = matchMedia('(prefers-reduced-motion: reduce)')
    let width, height, particles, frame
    const resize = () => {
      const ratio = Math.min(devicePixelRatio || 1, 2)
      width = canvas.clientWidth
      height = canvas.clientHeight
      canvas.width = width * ratio
      canvas.height = height * ratio
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0)
      particles = Array.from({ length: Math.min(780, Math.max(190, Math.floor(width * height / 1500))) }, () =>
        Array.from({ length: 6 }, () => Math.random()))
    }
    function draw(ms) {
      const time = reduced.matches ? 0 : ms / 1000
      ctx.clearRect(0, 0, width, height)
      for (const [u, v, depth, phase, tint, speed] of particles) {
        const x = (u * width + Math.sin(time * .37 + phase * 24) * (5 + depth * 13) + width) % width
        const y = (v * height + time * (6 + speed * 31)) % height
        const sparkle = Math.pow(.5 + .5 * Math.sin(time * (1.3 + speed * 3) + phase * 45), 7)
        const radius = .36 + depth * .61
        ctx.fillStyle = tint > .7 ? '#c4e7ff' : '#f5faff'
        ctx.globalAlpha = .15 + depth * .32 + sparkle * .43
        ctx.fillRect(x - radius / 2, y - radius / 2, radius, radius)
        if (sparkle < .23 || depth < .31) continue
        const arm = radius + sparkle * (1.1 + depth * 2.8)
        ctx.beginPath()
        ctx.moveTo(x, y - arm); ctx.lineTo(x + .45, y - .35)
        ctx.lineTo(x + arm * .82, y); ctx.lineTo(x + .45, y + .35)
        ctx.lineTo(x, y + arm); ctx.lineTo(x - .45, y + .35)
        ctx.lineTo(x - arm * .82, y); ctx.lineTo(x - .45, y - .35)
        ctx.closePath(); ctx.fill()
      }
      ctx.globalAlpha = 1
      if (!reduced.matches) frame = requestAnimationFrame(draw)
    }
    const restart = () => { cancelAnimationFrame(frame); resize(); draw(performance.now()) }
    restart()
    window.addEventListener('resize', restart)
    reduced.addEventListener('change', restart)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('resize', restart)
      reduced.removeEventListener('change', restart)
    }
  }, [])
  return <canvas className="home-snow" ref={ref} aria-hidden="true" />
}

export default function Home() {
  const base = import.meta.env.BASE_URL
  return <main className="home" style={{ backgroundImage: `url(${base}forest/painting.jpg)` }}>
    <div className="home-masthead"><span>Angela Zhao / Portfolio</span><span>Art · Design · Exploration</span></div>
    <img className="home-figures" src={base + 'forest/figures.svg'} alt="A boy with a lantern faces a girl made of snow." />
    <CrystalSnow />
    <div className="home-menu"><h1>Angela Zhao</h1><nav aria-label="Portfolio">
      <Link to="/About">About Me</Link><Link to="/Projects">Projects</Link><Link to="/Contact">Contact</Link>
    </nav></div>
    <small className="home-credit">© Angela Zhao</small>
  </main>
}
