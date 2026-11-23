import { Link } from 'react-router-dom'

const email = 'angelazhao998@gmail.com'

export default function Contact() {
  function openEmailDraft(event) {
    event.preventDefault()
    const fields = new FormData(event.currentTarget)
    const subject = encodeURIComponent('Message from your portfolio')
    const body = encodeURIComponent(`${fields.get('message').trim()}\n\nFrom ${fields.get('name').trim()} (${fields.get('email').trim()})`)
    window.location.href = `mailto:${email}?subject=${subject}&body=${body}`
  }

  return <main className="paper">
    <header className="page-nav"><Link to="/">Angela Zhao</Link><Link to="/Projects">Projects</Link></header>
    <h1>Contact</h1>
    <p>Have a project in mind or want to say hello?</p>
    <div className="contact-layout">
      <address className="contact-links">
        <a href={`mailto:${email}`}>{email}</a>
        <a href="https://www.linkedin.com/in/angela-zhao-c29">LinkedIn ↗</a>
        <a href="https://github.com/Cinumin">GitHub ↗</a>
      </address>
      <form className="contact-form" onSubmit={openEmailDraft} aria-labelledby="send-message">
        <h2 id="send-message">Send a message</h2>
        <p>Opens a draft in your email app for you to send.</p>
        <label>Your name<input name="name" autoComplete="name" required maxLength={120}/></label>
        <label>Your email<input name="email" type="email" autoComplete="email" required maxLength={254}/></label>
        <label>Message<textarea name="message" rows={6} required maxLength={4000}/></label>
        <button type="submit">Open email draft</button>
      </form>
    </div>
  </main>
}
