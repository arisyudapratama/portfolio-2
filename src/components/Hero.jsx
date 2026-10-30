import { useEffect, useState } from 'react'
import { profile, socials } from '../data.js'
import { reduceMotion, typewriterStep } from '../lib.js'
import { Icon } from './Icons.jsx'
import IdCard from './IdCard.jsx'
import ShaderBg from './ShaderBg.jsx'
import './Hero.css'

function useTypewriter(words) {
  const [text, setText] = useState(() => (reduceMotion() ? (words[0] ?? '') : ''))
  useEffect(() => {
    if (reduceMotion() || words.length === 0) return
    let state = { word: 0, text: '', deleting: false }
    let id = setTimeout(function tick() {
      const next = typewriterStep(state, words)
      state = next.state
      setText(state.text)
      id = setTimeout(tick, next.delay)
    }, 700)
    return () => clearTimeout(id)
  }, [words])
  return text
}

// Komponen sendiri supaya tiap ketukan hanya me-render teks ini, bukan seluruh hero + kartu ID.
function Typewriter({ words }) {
  return <span className="hero__typed">{useTypewriter(words)}</span>
}

export default function Hero() {
  let i = 0 // urutan stagger animasi masuk

  return (
    <section id="beranda" className="hero">
      <ShaderBg />
      <div className="container hero__grid">
        <div className="hero__copy">
          {profile.available && (
            <p className="hero__status rise" style={{ '--i': i++ }}>
              <span className="hero__dot" aria-hidden="true" />
              Terbuka untuk proyek
            </p>
          )}
          <h1 className="hero__title">
            <span className="hero__line">
              <span className="hero__word rise" style={{ '--i': i++ }}>
                Halo,
              </span>{' '}
              <span className="hero__word rise" style={{ '--i': i++ }}>
                saya
              </span>
            </span>
            <span className="hero__line rise" style={{ '--i': i++ }}>
              <span className="gradient-text">{profile.name}</span>
            </span>
          </h1>
          {profile.roles.length > 0 && (
            <p className="hero__role rise" style={{ '--i': i++ }}>
              <span aria-hidden="true">
                &gt; <Typewriter words={profile.roles} />
                <span className="hero__caret" />
              </span>
              <span className="sr-only">{profile.roles.join(', ')}</span>
            </p>
          )}
          <p className="hero__intro rise" style={{ '--i': i++ }}>
            {profile.intro}
          </p>
          <div className="hero__cta rise" style={{ '--i': i++ }}>
            <a className="btn btn--primary" href="#portofolio">
              Lihat Proyek
            </a>
            <a className="btn btn--ghost" href="#kontak">
              Hubungi Saya
            </a>
          </div>
          <ul className="hero__social rise" style={{ '--i': i++ }}>
            {socials.map((s) => (
              <li key={s.name}>
                <a className="chip" href={s.url} target="_blank" rel="noopener">
                  <Icon name={s.icon} size={16} />
                  {s.name}
                </a>
              </li>
            ))}
          </ul>
        </div>
        <div className="hero__card rise" style={{ '--i': i++ }}>
          <IdCard />
        </div>
      </div>
      <a className="hero__scroll" href="#tentang" aria-label="Gulir ke bagian Tentang">
        <span aria-hidden="true">Gulir</span>
        <span className="hero__scroll-line" aria-hidden="true" />
      </a>
    </section>
  )
}
