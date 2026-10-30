import { useEffect } from 'react'
import About from './components/About.jsx'
import Contact from './components/Contact.jsx'
import Footer from './components/Footer.jsx'
import Hero from './components/Hero.jsx'
import Navbar from './components/Navbar.jsx'
import Portfolio from './components/Portfolio.jsx'

export default function App() {
  // Browser mencoba scroll ke #anchor sebelum React merender section-nya, jadi link
  // seperti /#portofolio terbuka di atas. Ulangi scroll-nya setelah render pertama.
  // Hash = input dari URL: tanpa decodeURIComponent (bisa throw untuk hash rusak), getElementById aman.
  useEffect(() => {
    const id = location.hash.slice(1)
    if (id) document.getElementById(id)?.scrollIntoView({ behavior: 'instant' })
  }, [])

  return (
    <>
      <a className="skip-link" href="#konten">
        Lewati ke konten
      </a>
      <div className="progress" aria-hidden="true" />
      <Navbar />
      <main id="konten">
        <Hero />
        <About />
        <Portfolio />
        <Contact />
      </main>
      <Footer />
    </>
  )
}
