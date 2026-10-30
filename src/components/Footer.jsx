import { nav, profile, socials } from '../data.js'
import { Icon } from './Icons.jsx'

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer__grid">
        <div>
          <a className="brand" href="#beranda">
            {profile.brand}
          </a>
          <p className="footer__tagline">{profile.tagline}</p>
        </div>
        <nav aria-label="Navigasi footer">
          <ul className="footer__links">
            {nav.map((item) => (
              <li key={item.id}>
                <a href={`#${item.id}`}>{item.label}</a>
              </li>
            ))}
          </ul>
        </nav>
        <ul className="footer__links">
          {socials.map((s) => (
            <li key={s.name}>
              <a href={s.url} target="_blank" rel="noopener">
                <Icon name={s.icon} size={16} />
                {s.name}
              </a>
            </li>
          ))}
        </ul>
      </div>
      <div className="container footer__bottom">
        <p>
          © {new Date().getFullYear()} {profile.name}
        </p>
        <a className="footer__top" href="#beranda">
          Kembali ke atas <Icon name="arrowUp" size={16} />
        </a>
      </div>
    </footer>
  )
}
