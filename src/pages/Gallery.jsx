import { createElement } from 'react'
import { Link } from 'react-router-dom'
import { projects } from './projectData'
import artwork from './artwork.json'

export function ProjectContent({ project }) {
  const media = import.meta.env.BASE_URL + 'project-media/'
  return <>
    <p>{project.description}</p>
    {project.file ? <video controls playsInline preload="none" aria-label={project.title} poster={media + project.file + '.jpg'} src={media + project.file + '.mp4'}/> :
      <a href={project.url} target="_blank" rel="noreferrer">View project ↗</a>}
  </>
}

const artGroups = ['Paintings', 'Drawings', 'Graphic Design']

function ArtworkGrid({ group }) {
  const media = import.meta.env.BASE_URL + 'artwork/'
  return <div className="artwork-grid">
    {artwork.filter(work => work.group === group).map(({ id, title, alt, width, height }) =>
      <figure className="artwork-piece" key={id}>
        <Link to={'/Artworks/'+id} state={{artworkGallery:'list'}} aria-label={`View ${title} details`}>
          <img src={media + id + '-thumb.jpg?v=2'} alt={alt} width={width} height={height} loading="lazy" decoding="async"/>
        </Link>
        <figcaption>{title}</figcaption>
      </figure>)}
  </div>
}

function ProjectGrid({ group, heading = 'h3' }) {
  return <div className="project-grid">{projects.filter(project => project.group === group).map(project =>
    <article key={project.title}>{createElement(heading, null, project.title)}<ProjectContent project={project}/></article>)}</div>
}

export default function Gallery() {
  return <main className="paper">
    <header className="page-nav"><Link to="/">Home</Link><Link to="/Projects">Return to room</Link></header>
    <h1>Projects</h1>
    <section aria-labelledby="art-portfolio-title">
      <h2 id="art-portfolio-title">Art Portfolio</h2>
      {artGroups.map(group => <div className="artwork-group" key={group}>
        <h3>{group}</h3>
        <ArtworkGrid group={group}/>
      </div>)}
      <div className="artwork-group"><h3>Film &amp; Video</h3><ProjectGrid group="Film & Video" heading="h4"/></div>
    </section>
    {['Design & Development', 'Data Analysis'].map(group => <section key={group}>
      <h2>{group}</h2>
      <ProjectGrid group={group}/>
    </section>)}
  </main>
}
