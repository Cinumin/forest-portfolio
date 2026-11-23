import { Link } from 'react-router-dom'
import { projects } from './projectData'

export function ProjectContent({ project }) {
  const media = import.meta.env.BASE_URL + 'project-media/'
  return <>
    <p>{project.description}</p>
    {project.file ? <video controls playsInline preload="none" aria-label={project.title} poster={media + project.file + '.jpg'} src={media + project.file + '.mp4'}/> :
      <a href={project.url} target="_blank" rel="noreferrer">View project ↗</a>}
  </>
}

export default function Gallery() {
  return <main className="paper">
    <header className="page-nav"><Link to="/">Angela Zhao</Link><Link to="/Projects">Forest walk</Link></header>
    <h1>Projects</h1>
    {['Film & Video', 'Design & Development', 'Data Analysis'].map(group => <section key={group}>
      <h2>{group === 'Film & Video' ? 'Art Portfolio' : group}</h2>
      {group === 'Film & Video' && <p className="eyebrow">Film &amp; Video</p>}
      <div className="project-grid">{projects.filter(p => p.group === group).map(project =>
        <article key={project.title}><h3>{project.title}</h3><ProjectContent project={project}/></article>)}</div>
    </section>)}
  </main>
}
