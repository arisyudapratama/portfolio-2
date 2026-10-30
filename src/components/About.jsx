import { useEffect, useRef, useState } from 'react'
import { awards, certificates, education, experience, profile, projects } from '../data.js'
import { reduceMotion } from '../lib.js'
import './About.css'

function useCountUp(target, ms = 1200) {
  const ref = useRef(null)
  const [value, setValue] = useState(() => (reduceMotion() ? target : 0))

  useEffect(() => {
    if (reduceMotion()) return
    let raf = 0
    const io = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return
      io.disconnect()
      const t0 = performance.now()
      const tick = (now) => {
        const p = Math.min(1, (now - t0) / ms)
        setValue(Math.round(target * (1 - (1 - p) ** 3)))
        if (p < 1) raf = requestAnimationFrame(tick)
      }
      raf = requestAnimationFrame(tick)
    })
    io.observe(ref.current)
    return () => {
      io.disconnect()
      cancelAnimationFrame(raf)
    }
  }, [target, ms])

  return [ref, value]
}

// Angka beranimasi disembunyikan dari pembaca layar; mereka langsung mendapat nilai finalnya.
function Stat({ value, label }) {
  const [ref, n] = useCountUp(value)
  return (
    <div ref={ref} className="stat">
      <span className="sr-only">{value}</span>
      <span className="stat__value" aria-hidden="true">
        {n}
      </span>
      <span className="stat__label">{label}</span>
    </div>
  )
}

function Timeline({ title, items }) {
  if (items.length === 0) return null
  return (
    <div className="timeline">
      <h3 data-reveal>{title}</h3>
      <ol>
        {items.map((item) => (
          <li key={item.place + item.period} data-reveal>
            <span className="timeline__period">{item.period}</span>
            <span className="timeline__place">{item.place}</span>
            <span className="timeline__detail">{item.detail}</span>
          </li>
        ))}
      </ol>
    </div>
  )
}

export default function About() {
  const [lead, ...rest] = profile.about
  // Stat bernilai 0 disembunyikan: "0 Penghargaan" tidak membantu pengunjung.
  const stats = [
    [projects.length, 'Proyek'],
    [certificates.length, 'Sertifikat'],
    [awards.length, 'Penghargaan'],
  ].filter(([n]) => n > 0)

  return (
    <section id="tentang" className="section about">
      <div className="container">
        <div className="section-head" data-reveal>
          <span className="section-head__index">01</span>
          <h2>Tentang</h2>
        </div>
        <div className="about__grid">
          <div>
            {lead && (
              <p className="about__lead" data-reveal>
                {lead}
              </p>
            )}
            {rest.map((text) => (
              <p key={text} className="about__text" data-reveal>
                {text}
              </p>
            ))}
            {stats.length > 0 && (
              <div className="about__stats" data-reveal>
                {stats.map(([n, label]) => (
                  <Stat key={label} value={n} label={label} />
                ))}
              </div>
            )}
            {profile.now.length > 0 && (
              <div className="now" data-reveal>
                <h3>Sekarang</h3>
                <dl>
                  {profile.now.map((item) => (
                    <div key={item.label}>
                      <dt>{item.label}</dt>
                      <dd>{item.value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}
          </div>
          <div>
            <Timeline title="Pendidikan" items={education} />
            <Timeline title="Pengalaman" items={experience} />
          </div>
        </div>
      </div>
    </section>
  )
}
