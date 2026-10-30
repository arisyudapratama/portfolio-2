import { useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { awards, certificates, projects, skills } from '../data.js'
import { categoriesOf, lastSpan } from '../lib.js'
import { Icon } from './Icons.jsx'
import './Portfolio.css'

// Tab hanya muncul kalau datanya ada (tanpa tab kosong atau pesan untuk developer di situs publik).
const TABS = [
  { id: 'proyek', label: 'Proyek', show: projects.length > 0 },
  { id: 'sertifikat', label: 'Sertifikat & Penghargaan', show: certificates.length + awards.length > 0 },
  { id: 'stack', label: 'Tech Stack', show: skills.some((s) => s.items.length > 0) },
].filter((t) => t.show)

// Kategori → ilustrasi cover saat proyek belum punya gambar.
const MOCK_BY_CATEGORY = { Dashboard: 'chart', Bot: 'chat', Kreatif: 'orb' }

// Ganti state dengan animasi View Transitions kalau browser mendukung.
const withTransition = (fn) => (document.startViewTransition ? document.startViewTransition(() => flushSync(fn)) : fn())

function Mock({ kind }) {
  if (kind === 'chart')
    return (
      <span className="mock mock--chart">
        {[40, 65, 50, 85, 60, 95].map((h) => (
          <i key={h} style={{ '--h': `${h}%` }} />
        ))}
      </span>
    )
  if (kind === 'chat')
    return (
      <span className="mock mock--chat">
        <i />
        <i />
        <i />
      </span>
    )
  if (kind === 'orb')
    return (
      <span className="mock mock--orb">
        <i />
      </span>
    )
  return (
    <span className="mock mock--app">
      <i />
      <i />
      <i />
      <i />
    </span>
  )
}

function Cover({ project }) {
  if (project.image) {
    return <img className="cover" src={project.image} alt="" loading="lazy" decoding="async" width="800" height="500" />
  }
  return (
    <span className="cover cover--mock" aria-hidden="true">
      <span className="cover__window">
        <span className="cover__bar">
          <i />
          <i />
          <i />
        </span>
        <Mock kind={MOCK_BY_CATEGORY[project.category]} />
      </span>
    </span>
  )
}

function ProjectCard({ project, onOpen }) {
  const onMove = (e) => {
    const r = e.currentTarget.getBoundingClientRect()
    e.currentTarget.style.setProperty('--mx', `${e.clientX - r.left}px`)
    e.currentTarget.style.setProperty('--my', `${e.clientY - r.top}px`)
  }
  const extra = project.tech.length - 3

  return (
    <button
      type="button"
      className="project-card"
      style={{ '--accent-p': project.accent }}
      aria-haspopup="dialog"
      onClick={onOpen}
      onPointerMove={onMove}
    >
      <span className="project-card__media">
        <Cover project={project} />
      </span>
      <span className="project-card__body">
        <span className="project-card__meta">
          <span className="project-card__cat">{project.category}</span>
          <span>{project.year}</span>
        </span>
        <span className="project-card__title">{project.title}</span>
        <span className="project-card__summary">{project.summary}</span>
        <span className="tags">
          {project.tech.slice(0, 3).map((t) => (
            <span key={t} className="tag">
              {t}
            </span>
          ))}
          {extra > 0 && <span className="tag">+{extra}</span>}
        </span>
      </span>
    </button>
  )
}

function ProjectDialog({ ref, project }) {
  const close = () => ref.current.close()
  // Tutup hanya kalau klik dimulai dan berakhir di backdrop: seleksi teks yang dilepas di luar tidak menutup.
  const downOnBackdrop = useRef(false)
  return (
    <dialog
      ref={ref}
      className="project-dialog"
      aria-labelledby="project-dialog-title"
      onPointerDown={(e) => (downOnBackdrop.current = e.target === e.currentTarget)}
      onClick={(e) => downOnBackdrop.current && e.target === e.currentTarget && close()}
    >
      {project && (
        <div className="project-dialog__inner" style={{ '--accent-p': project.accent }}>
          <button type="button" className="project-dialog__close" aria-label="Tutup" onClick={close}>
            <Icon name="close" />
          </button>
          <Cover project={project} />
          <div className="project-dialog__body">
            <p className="project-dialog__meta">
              <span className="chip">{project.category}</span>
              <span className="chip">{project.year}</span>
            </p>
            <h3 id="project-dialog-title">{project.title}</h3>
            <p className="project-dialog__desc">{project.description}</p>
            {project.features.length > 0 && (
              <>
                <h4>Fitur utama</h4>
                <ul className="features">
                  {project.features.map((f) => (
                    <li key={f}>
                      <Icon name="check" size={16} />
                      {f}
                    </li>
                  ))}
                </ul>
              </>
            )}
            {project.tech.length > 0 && (
              <>
                <h4>Teknologi</h4>
                <ul className="tags">
                  {project.tech.map((t) => (
                    <li key={t} className="tag">
                      {t}
                    </li>
                  ))}
                </ul>
              </>
            )}
            {(project.demo || project.repo) && (
              <div className="project-dialog__links">
                {project.demo && (
                  <a className="btn btn--primary" href={project.demo} target="_blank" rel="noopener">
                    Buka demo <Icon name="arrowUpRight" size={16} />
                  </a>
                )}
                {project.repo && (
                  <a className="btn btn--ghost" href={project.repo} target="_blank" rel="noopener">
                    <Icon name="github" size={16} /> Lihat kode
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </dialog>
  )
}

function Projects() {
  const cats = categoriesOf(projects)
  const [cat, setCat] = useState(cats[0])
  const [open, setOpen] = useState(null)
  const dialog = useRef(null)
  // n = urutan di data.js: key dan view-transition-name tetap unik walau ada entri kembar
  const shown = projects.map((p, n) => ({ ...p, n })).filter((p) => cat === 'Semua' || p.category === cat)
  const span = { '--span-2': lastSpan(shown, 2), '--span-3': lastSpan(shown, 3) }

  const openProject = (project) => {
    flushSync(() => setOpen(project))
    dialog.current.showModal()
  }

  return (
    <>
      {cats.length > 2 && (
        <div className="filters" role="group" aria-label="Filter kategori proyek">
          {cats.map((c) => (
            <button
              key={c}
              type="button"
              className="chip filter"
              aria-pressed={cat === c}
              onClick={() => withTransition(() => setCat(c))}
            >
              {c}
            </button>
          ))}
        </div>
      )}
      <ul className="bento">
        {shown.map((p, i) => {
          // kartu terakhir melebar mengisi sisa baris; kalau jadi lebar di desktop, tata letaknya ikut kartu unggulan
          const last = i === shown.length - 1
          const wide = p.featured || (last && span['--span-3'] > 1)
          return (
            <li
              key={p.n}
              className={wide ? 'bento__item bento__item--wide' : 'bento__item'}
              style={{ viewTransitionName: `p-${p.n}`, ...(last && span) }}
              data-reveal
            >
              <ProjectCard project={p} onOpen={() => openProject(p)} />
            </li>
          )
        })}
      </ul>
      <ProjectDialog ref={dialog} project={open} />
    </>
  )
}

function Achievements() {
  return (
    <div className="achievements">
      {certificates.length > 0 && (
        <div>
          <h3 className="subhead">Sertifikat</h3>
          <ul className="certs">
            {certificates.map((c) => (
              <li key={c.title} className="cert" data-reveal>
                <span className="cert__icon">
                  <Icon name="award" size={22} />
                </span>
                <span className="cert__title">{c.title}</span>
                <span className="cert__issuer">{c.issuer}</span>
                <span className="cert__year">{c.year}</span>
                {c.url && (
                  <a className="cert__link" href={c.url} target="_blank" rel="noopener">
                    Lihat sertifikat <Icon name="arrowUpRight" size={14} />
                  </a>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
      {awards.length > 0 && (
        <div>
          <h3 className="subhead">Penghargaan</h3>
          <ul className="awards">
            {awards.map((a) => (
              <li key={a.title} className="award" data-reveal>
                <span className="award__icon">
                  <Icon name="trophy" size={22} />
                </span>
                <span className="award__text">
                  <span className="award__title">{a.title}</span>
                  <span className="award__event">{a.event}</span>
                </span>
                <span className="award__year">{a.year}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

function Stack() {
  const groups = skills.filter((s) => s.items.length > 0)
  const all = groups.flatMap((s) => s.items)
  return (
    <>
      <div className="stack">
        {groups.map((s) => (
          <div key={s.group} className="stack__group" data-reveal>
            <h3>{s.group}</h3>
            <ul>
              {s.items.map((item) => (
                <li key={item} className="chip">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="marquee" aria-hidden="true">
        <div className="marquee__track">
          {[...all, ...all].map((item, i) => (
            <span key={i}>{item}</span>
          ))}
        </div>
      </div>
    </>
  )
}

const PANELS = { proyek: Projects, sertifikat: Achievements, stack: Stack }

export default function Portfolio() {
  const [tab, setTab] = useState(TABS[0]?.id)
  if (TABS.length === 0) return null

  const select = (id) => withTransition(() => setTab(id))
  const onKeyDown = (e) => {
    const step = { ArrowRight: 1, ArrowLeft: -1 }[e.key]
    if (!step) return
    const i = TABS.findIndex((t) => t.id === tab)
    const next = TABS[(i + step + TABS.length) % TABS.length].id
    select(next)
    document.getElementById(`tab-${next}`).focus()
  }

  return (
    <section id="portofolio" className="section portfolio">
      <div className="container">
        <div className="section-head" data-reveal>
          <span className="section-head__index">02</span>
          <h2>Portofolio</h2>
        </div>
        {TABS.length > 1 && (
          <div className="tabs" role="tablist" aria-label="Isi portofolio" onKeyDown={onKeyDown}>
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                role="tab"
                id={`tab-${t.id}`}
                aria-selected={tab === t.id}
                aria-controls={`panel-${t.id}`}
                tabIndex={tab === t.id ? 0 : -1}
                onClick={() => select(t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>
        )}
        {TABS.map(({ id }) => {
          const Panel = PANELS[id]
          const tabpanel = TABS.length > 1 && { role: 'tabpanel', 'aria-labelledby': `tab-${id}`, tabIndex: 0 }
          return (
            <div key={id} id={`panel-${id}`} hidden={tab !== id} {...tabpanel}>
              <Panel />
            </div>
          )
        })}
      </div>
    </section>
  )
}
