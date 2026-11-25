import { Link, useParams, useLocation } from 'react-router-dom'
import artwork from './artwork.json'

export default function ArtworkDetail() {
  const { id } = useParams()
  const location = useLocation()
  const gallery = location.state?.artworkGallery === 'list' ? '/Gallery#art-portfolio-title' : '/Projects?gallery=artworks'
  const work = artwork.find(item => item.id === id)
  if (!work) return <main className="paper"><h1>Artwork not found</h1><Link to="/Gallery">Return to gallery</Link></main>
  const metadata = [
    ['Medium', work.medium], ['Dimensions', work.dimensions],
    ['Year', work.year], ['Created at', work.location],
  ].filter(([, value]) => value)
  return <main className="paper artwork-detail">
    <header className="page-nav"><Link to={gallery} aria-label="Back to artworks"><span className="nav-full">← Back to artworks</span><span className="nav-compact">← Artworks</span></Link><Link to="/">Home</Link><Link to="/Gallery">All projects</Link><Link to="/Projects" aria-label="Return to room"><span className="nav-full">Return to room</span><span className="nav-compact">Room</span></Link></header>
    <div className="artwork-detail-layout">
      <a href={import.meta.env.BASE_URL+'artwork/'+work.id+'.jpg'} aria-label={'Open '+work.title+' full size'}>
        <img src={import.meta.env.BASE_URL+'artwork/'+work.id+'.jpg'} alt={work.alt} width={work.width} height={work.height}/>
      </a>
      <div><p className="eyebrow">{work.group}</p><h1>{work.title}</h1>
        {metadata.length > 0 && <dl>{metadata.map(([label,value])=><div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>}
        {work.description && work.description.split('\n').filter(Boolean).map((paragraph,index)=><p key={index}>{paragraph}</p>)}
      </div>
    </div>
  </main>
}
