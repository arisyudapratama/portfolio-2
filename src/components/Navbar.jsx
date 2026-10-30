import { useEffect, useRef, useState } from 'react'
import { nav, profile } from '../data.js'
import { Icon } from './Icons.jsx'
import './Navbar.css'

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [active, setActive] = useState(nav[0]?.id)
  const [open, setOpen] = useState(false)
  const toggle = useRef(null)
  const menu = useRef(null)

  useEffect(() => {
    const onScroll = () => setScrolled(scrollY > 24)
    onScroll()
    addEventListener('scroll', onScroll, { passive: true })
    return () => removeEventListener('scroll', onScroll)
  }, [])

  // Link aktif = section yang sedang melintasi tengah viewport.
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setActive(e.target.id)),
      { rootMargin: '-45% 0px -50% 0px' },
    )
    nav.forEach(({ id }) => {
      const el = document.getElementById(id)
      if (el) io.observe(el)
    })
    return () => io.disconnect()
  }, [])

  useEffect(() => {
    document.body.classList.toggle('menu-open', open)
    // Selama menu terbuka, halaman di belakang overlay tidak bisa difokus atau diklik.
    for (const el of document.querySelectorAll('main, footer')) el.inert = open
    if (!open) return
    menu.current.querySelector('a')?.focus()
    const close = () => setOpen(false)
    const onKey = (e) => {
      if (e.key !== 'Escape') return
      close()
      toggle.current.focus()
    }
    // Layar melebar (rotasi/resize) melewati breakpoint: tombol menu hilang, jadi tutup menunya.
    const wide = matchMedia('(min-width: 900px)')
    addEventListener('keydown', onKey)
    wide.addEventListener('change', close)
    return () => {
      removeEventListener('keydown', onKey)
      wide.removeEventListener('change', close)
    }
  }, [open])

  return (
    // Link mana pun di header (menu, brand, CTA) menutup menu.
    <header className="navbar" data-scrolled={scrolled} onClick={(e) => e.target.closest('a') && setOpen(false)}>
      <div className="container navbar__inner">
        <a className="brand navbar__brand" href="#beranda">
          {profile.brand}
        </a>
        <nav ref={menu} id="menu" className="navbar__nav" aria-label="Navigasi utama" data-open={open}>
          <ul>
            {nav.map((item, i) => (
              <li key={item.id} style={{ '--i': i }}>
                <a href={`#${item.id}`} aria-current={active === item.id ? 'true' : undefined}>
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <a className="btn btn--primary navbar__cta" href="#kontak">
          Hubungi
        </a>
        <button
          ref={toggle}
          type="button"
          className="navbar__toggle"
          aria-expanded={open}
          aria-controls="menu"
          aria-label={open ? 'Tutup menu' : 'Buka menu'}
          onClick={() => setOpen((o) => !o)}
        >
          <Icon name={open ? 'close' : 'menu'} size={22} />
        </button>
      </div>
    </header>
  )
}
