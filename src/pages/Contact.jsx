import { Link, useSearchParams } from 'react-router-dom'

const email = 'angelazhao998@gmail.com'
const contactUrl = 'https://cinumin.github.io/forest-portfolio/#/Contact'

export default function Contact() {
  const [params] = useSearchParams()

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
      <form className="contact-form" method="POST" action={`https://formsubmit.co/${email}`} aria-labelledby="send-message">
        <h2 id="send-message">Send a message</h2>
        {params.get('sent') === '1' && <p role="status">Thanks for your message.</p>}
        <input type="hidden" name="_subject" value="New message from your portfolio"/>
        <input type="hidden" name="_next" value={contactUrl + '?sent=1'}/>
        <div hidden><label>Leave this blank<input name="_honey" type="text" tabIndex={-1} autoComplete="off"/></label></div>
        <label>Your name<input name="name" autoComplete="name" required maxLength={120}/></label>
        <label>Your email<input name="email" type="email" autoComplete="email" required maxLength={254}/></label>
        <label>Message<textarea name="message" rows={6} required maxLength={4000}/></label>
        <button type="submit">Send message</button>
      </form>
    </div>
  </main>
}
