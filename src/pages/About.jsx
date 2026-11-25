import { Link } from 'react-router-dom'
import resume from './resume.json'
import artistStatement from '../data/artistStatement.json'
export default function About() {
  return <main className="paper"><header className="page-nav"><Link to="/">Home</Link><Link to="/Projects">Projects</Link></header>
    <div className="about-intro"><div><p className="eyebrow">About Me</p><h1>A curious mind,<br/>many ways to create.</h1><p>Hello, I’m Angela. I’m studying applied mathematics at Columbia College and work across art, design, and software.</p></div>
      <img src={import.meta.env.BASE_URL+'forest/painting.jpg'} alt="Detail of Angela’s painted snowy forest"/></div>
    <section><h2>Artist statement</h2><p>{artistStatement}</p></section>
    <h2>Résumé</h2>
    {resume.map(({ title, rows }) => <section className="resume-section" key={title}><h3>{title}</h3>
      {rows.map(row => row.url ? <p key={row.text}><a href={row.url}>{row.text}</a></p> : <p key={row.text}>{row.text}</p>)}
    </section>)}
  </main>
}
