import { useState } from 'react'
import { Link } from 'react-router-dom'

const endpoint = 'https://formspree.io/f/myewbdaa'
const email = 'angelazhao998@gmail.com'

export default function Contact() {
  const [status, setStatus] = useState('idle')

  async function sendMessage(event) {
    event.preventDefault()
    if (status === 'sending') return
    const form = event.currentTarget
    setStatus('sending')
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: new FormData(form),
        signal: AbortSignal.timeout(15000),
      })
      if (!response.ok) throw new Error('Form submission failed.')
      form.reset()
      setStatus('sent')
    } catch {
      setStatus('error')
    }
  }

  return <main className="paper">
    <header className="page-nav"><Link to="/">Home</Link><Link to="/Projects">Projects</Link></header>
    <h1>Contact</h1>
    <p>Have a project in mind or want to say hello?</p>
    <div className="contact-layout">
      <address className="contact-links">
        <a href={`mailto:${email}`}>{email}</a>
        <a href="https://www.linkedin.com/in/angela-zhao-c29">LinkedIn ↗</a>
        <a href="https://github.com/Cinumin">GitHub ↗</a>
      </address>
      <form className="contact-form" action={endpoint} method="POST" onSubmit={sendMessage} aria-labelledby="send-message">
        <h2 id="send-message">Send a message</h2>
        <label>Your name<input name="name" autoComplete="name" required maxLength={120}/></label>
        <label>Your email<input name="email" type="email" autoComplete="email" required maxLength={254}/></label>
        <label>Message<textarea name="message" rows={6} required maxLength={4000}/></label>
        <button type="submit" disabled={status === 'sending'}>{status === 'sending' ? 'Sending…' : 'Send message'}</button>
        {status === 'sent' && <p role="status">Thanks. Your message was sent.</p>}
        {status === 'error' && <p role="alert">We couldn’t confirm delivery. Your message is still here. You can retry or <a href={`mailto:${email}`}>email Angela directly</a>.</p>}
      </form>
    </div>
  </main>
}
