import { useEffect, useRef, useState } from 'react'
import { profile, socials } from '../data.js'
import { Icon } from './Icons.jsx'
import './Contact.css'

export default function Contact() {
  const [copied, setCopied] = useState(false)
  const timer = useRef(0)
  useEffect(() => () => clearTimeout(timer.current), [])

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(profile.email)
      setCopied(true)
      clearTimeout(timer.current)
      timer.current = setTimeout(() => setCopied(false), 2000)
    } catch {
      location.href = `mailto:${profile.email}`
    }
  }

  return (
    <section id="kontak" className="section contact">
      <div className="container">
        <div className="section-head" data-reveal>
          <span className="section-head__index">03</span>
          <h2>Kontak</h2>
        </div>
        <p className="contact__headline" data-reveal>
          Punya ide? Yuk wujudkan bareng.
        </p>
        <div className="contact__mail" data-reveal>
          <a className="contact__email" href={`mailto:${profile.email}`}>
            {profile.email}
          </a>
          <button type="button" className="btn btn--ghost" aria-label="Salin email" onClick={copyEmail}>
            <Icon name={copied ? 'check' : 'copy'} size={18} />
            <span aria-hidden="true">{copied ? 'Disalin' : 'Salin'}</span>
          </button>
        </div>
        <div className="contact__actions" data-reveal>
          <a className="btn btn--primary" href={`mailto:${profile.email}`}>
            <Icon name="mail" size={18} />
            Kirim email
          </a>
          {profile.whatsapp && (
            <a
              className="btn btn--ghost"
              href={`https://wa.me/${profile.whatsapp.replace(/\D/g, '')}`}
              target="_blank"
              rel="noopener"
            >
              <Icon name="whatsapp" size={18} />
              Chat WhatsApp
            </a>
          )}
        </div>
        <ul className="contact__socials">
          {socials.map((s) => (
            <li key={s.name} data-reveal>
              <a className="social" href={s.url} target="_blank" rel="noopener">
                <Icon name={s.icon} size={22} />
                <span className="social__name">{s.name}</span>
                <span className="social__arrow">
                  <Icon name="arrowUpRight" size={18} />
                </span>
              </a>
            </li>
          ))}
        </ul>
        <p className="contact__meta">
          <span>
            <Icon name="mapPin" size={16} />
            {profile.location}
          </span>
          {profile.available && (
            <span>
              <span className="contact__dot" aria-hidden="true" />
              Terbuka untuk proyek
            </span>
          )}
        </p>
        <p className="toast" role="status">
          {copied ? 'Email disalin' : ''}
        </p>
      </div>
    </section>
  )
}
