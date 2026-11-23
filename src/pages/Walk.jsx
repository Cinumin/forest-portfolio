import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { createForest, stationPosition, trailLength } from './forestScene'
import { ProjectContent } from './Gallery'
import { projects } from './projectData'

export default function Walk() {
  const host = useRef(null), forest = useRef(null), location = useRef(null)
  const [active, setActive] = useState(0)
  const [failed, setFailed] = useState(false)
  useEffect(() => {
    let fallbackFrame
    try {
      forest.current = createForest(host.current, projects.length, setActive, z => {
        location.current?.setAttribute('cx', String(10 + z / trailLength * 160))
      })
    } catch {
      fallbackFrame = requestAnimationFrame(() => setFailed(true))
    }
    return () => {
      cancelAnimationFrame(fallbackFrame)
      forest.current?.destroy()
      forest.current = null
    }
  }, [])
  const project = projects[active]
  return <main className="walk">
    <div className="walk-stage" ref={host}/>
    <header className="walk-head"><p className="eyebrow">Projects</p><h2>Forest Walk</h2><Link to="/">Home</Link><Link to="/Gallery">Project list</Link></header>
    {failed ? <p className="walk-fallback">3D is unavailable in this browser. <Link to="/Gallery">Browse all projects</Link>.</p> : <>
      <aside className="walk-card" aria-label="Project stop">
        <p className="eyebrow">{project.group} · {active + 1} / {projects.length}</p>
        <h2 aria-live="polite">{project.title}</h2><ProjectContent key={project.title} project={project}/>
        <svg className="walk-map" viewBox="0 0 180 28" width="100%" height="32" aria-label="Position along the forest trail">
          <path d="M10 14H170" stroke="#50799c" strokeWidth="2"/>
          {projects.map((p, i) => <circle key={p.title} cx={10 + stationPosition(i) / trailLength * 160} cy="14" r="3" fill={i === active ? '#ffd9a8' : '#8cb6d6'}/>)}
          <circle ref={location} cx="12" cy="14" r="3.5" fill="white"/>
        </svg>
        <div className="walk-steps">{projects.map((p, i) => <button key={p.title} aria-label={p.title} aria-current={i === active} onClick={() => forest.current?.seek(i)}>{i + 1}</button>)}</div>
      </aside>
      <div className="walk-controls"><small>Drag to look · W/S to walk · Click a lantern to open its project</small>
        <button disabled={active === 0} onClick={() => forest.current?.seek(active - 1)}>← Previous stop</button>
        <button disabled={active === projects.length - 1} onClick={() => forest.current?.seek(active + 1)}>Next stop →</button>
      </div>
    </>}
  </main>
}
