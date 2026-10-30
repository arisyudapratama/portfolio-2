import { useEffect, useRef, useState } from 'react'
import { profile, socials } from '../data.js'
import {
  clampReach,
  faceAngle,
  reduceMotion,
  ribbon,
  smoothRope,
  springStep,
  stepRope,
  tiltFromPointer,
  twistAt,
} from '../lib.js'
import { Icon } from './Icons.jsx'
import './IdCard.css'

const TILT_VARS = ['--rx', '--ry', '--px', '--py']
const initials = (name) =>
  name
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
const strapText = Array(10).fill(profile.brand).join('   ')

// Fisika lanyard, satuan px per langkah 1/60 s. Tali = rantai titik ringan, kartu = titik berat di ujungnya.
const STEP = 1000 / 60
// Redaman 0.95/langkah: ayunan mengecil ±78%/detik, jadi kartu berayun ±1–2 kali lalu tenang (±3 s)
const PHYSICS = { gravity: 2, damping: 0.95, iterations: 16 }
const CARD_W = 0.1 // invers massa kartu (titik tali = 1)
const HOLD = 0.4 // kartu yang dipegang menyusul pointer sebesar ini per langkah: terasa berat, tidak menempel kaku
// Putaran 3D kartu sebagai pegas (k, c per langkah): yaw = berputar di sumbu tali (ζ ≈ 0.55, jadi saat
// dibalik sedikit lewat lalu mantap), pitch = miring maju-mundur. Kecepatan kartu (px/langkah) memberi
// sudut tujuan sesaat seperti hambatan udara, dibatasi `max` derajat.
const YAW = { k: 0.0136, c: 0.128, perV: 2.5, max: 25 }
const PITCH = { k: 0.0178, c: 0.133, perV: 1, max: 8 }
const STRAP_W = 30
const FRONT = [36, 86, 214] // warna sisi depan dan belakang tali
const BACK = [22, 52, 150]
const QUADS = 40 // polygon siap pakai untuk pita tali

const xy = ([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`
const shade = (rgb, k) => `rgb(${rgb.map((v) => Math.round(v * k)).join(',')})`
const clamp = (v, max) => Math.max(-max, Math.min(max, v))
const degOf = (rotate) => Number(rotate.match(/-?[\d.]+(?=deg)/)?.[0] ?? 0) // computed `rotate`: "2.3deg" / "y 4deg" / "none"

// Mesin lanyard. Saat diam yang berayun animasi CSS (.lanyard__swing); fisika hanya jalan saat kartu ditarik,
// berayun balik, atau berputar, lalu tidur lagi. Koordinat lokal: (0,0) = jangkar di tengah atas, y ke bawah.
function lanyard({ swing, sway, badge, card, turn, svg, still, skipClick }) {
  const [outline, center] = svg.querySelectorAll('path')
  const clip = badge.querySelector('.lanyard__clip')
  const polys = [...svg.querySelectorAll('polygon')]
  let L, D, segs, pts, len // panjang tali, klip → tengah kartu, jumlah segmen, titik, panjang segmen
  let flipTo = 0 // sisi tujuan: 0 = depan, 180 = belakang
  let [yaw, yawV, pitch, pitchV] = [0, 0, 0, 0]
  let physics = false // true: fisika menggantikan ayunan CSS (data-physics)
  let drag = null
  let raf = 0
  let last = 0
  let acc = 0
  let calm = 0

  const point = (x, y, w) => ({ x, y, px: x, py: y, w })
  // Pose diam (tali lurus ke bawah), diputar `a` radian di sekitar jangkar
  function rest(a = 0) {
    const [s, c] = [Math.sin(a), Math.cos(a)]
    pts = Array.from({ length: segs + 1 }, (_, i) => point((-s * L * i) / segs, (c * L * i) / segs, i ? 1 : 0))
    pts.push(point(-s * (L + D), c * (L + D), CARD_W))
    len = [...Array(segs).fill(L / segs), D]
  }

  function render() {
    const P = pts[segs]
    const C = pts[segs + 1]
    const dx = C.x - P.x
    const dy = C.y - P.y
    const d = Math.hypot(dx, dy) || 1
    badge.style.transform = physics ? `translate(${P.x}px, ${P.y - L}px) rotate(${Math.atan2(-dx, dy)}rad)` : ''
    turn.style.transform = `rotateX(${pitch.toFixed(2)}deg) rotateY(${yaw.toFixed(2)}deg)`
    // penjepit tersangkut di lubang kartu: ikut berputar di sumbu tali, tidak ikut miring
    clip.style.transform = `rotateY(${yaw.toFixed(2)}deg)`
    // kilap bergeser berlawanan arah putaran, seperti pantulan lampu yang diam
    turn.style.setProperty('--sheen', `${(clamp(-faceAngle(yaw) / 70, 1) * 30).toFixed(1)}%`)
    // tali sampai 6px masuk ke klip, searah kartu; bagian bawahnya terpilin mengikuti putaran kartu
    const line = smoothRope([...pts.slice(0, segs + 1), { x: P.x + (dx / d) * 6, y: P.y + (dy / d) * 6 }], 3)
    const r = ribbon(
      line,
      line.map((_, i) => twistAt(i / (line.length - 1), yaw)),
      STRAP_W,
    )
    outline.setAttribute('d', `M${[...r.left, ...r.right.reverse()].map(xy).join('L')}Z`)
    center.setAttribute('d', `M${r.center.map((p) => xy([p.x, p.y])).join('L')}`)
    polys.forEach((el, i) => {
      const q = r.quads[i]
      el.setAttribute('points', q ? q.points.map(xy).join(' ') : '')
      if (q) el.setAttribute('fill', shade(q.back ? BACK : FRONT, 0.55 + 0.45 * q.light))
    })
  }

  function tick() {
    const C = pts[segs + 1]
    if (physics) {
      if (drag?.active) {
        const t = clampReach(drag.tx, drag.ty, (L + D) * 1.02, 0.8 * D)
        Object.assign(C, { px: C.x, py: C.y, x: C.x + (t.x - C.x) * HOLD, y: C.y + (t.y - C.y) * HOLD })
      }
      stepRope({ pts, len }, PHYSICS)
    }
    // Putaran 3D: gerak menyamping memutar kartu di sumbu tali, gerak naik-turun memiringkannya
    const [vx, vy] = physics ? [C.x - C.px, C.y - C.py] : [0, 0]
    ;[yaw, yawV] = springStep(yaw, yawV, flipTo + clamp(vx * YAW.perV, YAW.max), YAW.k, YAW.c)
    ;[pitch, pitchV] = springStep(pitch, pitchV, clamp(-vy * PITCH.perV, PITCH.max), PITCH.k, PITCH.c)
    // sisa putaran < 0.3° tidak terlihat; setelah itu dikunci tepat di sisi yang dipilih
    const spinCalm = Math.abs(yaw - flipTo) < 0.3 && Math.abs(yawV) < 0.05 && Math.abs(pitch) < 0.3 && Math.abs(pitchV) < 0.05
    if (physics && !drag?.active) {
      // Tenang = nyaris diam, tepat di bawah jangkar (di ujung ayunan kecepatannya juga ≈ 0), putaran selesai
      const v = Math.max(...pts.map((p) => Math.hypot(p.x - p.px, p.y - p.py)))
      calm = v < 0.1 && Math.abs(C.x) < 2 && spinCalm ? calm + 1 : 0 // sisa 2px tidak terlihat; di-snap ke pose diam
      if (calm > 20) {
        physics = false
        rest()
        delete swing.dataset.physics // ayunan CSS mulai lagi dari 0° = pose diam
      }
    }
    if (!physics && spinCalm) [yaw, yawV, pitch, pitchV] = [flipTo, 0, 0, 0]
  }

  function frame(now) {
    acc = Math.min(Math.max(acc + now - last, 0), STEP * 3)
    last = now
    while (acc >= STEP) {
      acc -= STEP
      tick()
    }
    render()
    raf = physics || yaw !== flipTo || pitch !== 0 ? requestAnimationFrame(frame) : 0
  }

  function wake() {
    if (raf) return
    last = performance.now()
    acc = STEP
    raf = requestAnimationFrame(frame)
  }

  function measure() {
    L = badge.offsetTop
    D = card.offsetTop + card.offsetHeight / 2
    segs = Math.max(4, Math.min(10, Math.round(L / 20)))
    if (physics) {
      physics = false
      drag = null
      delete swing.dataset.physics
      delete card.dataset.dragging
    }
    rest()
    render()
  }

  const local = (x, y) => {
    const r = swing.getBoundingClientRect()
    return { x: x - r.left - r.width / 2, y: y - r.top }
  }

  // Ambil alih dari ayunan CSS di sudutnya saat ini (ayunan + putaran idle), supaya kartu tidak melompat
  function takeOver() {
    const a = (degOf(getComputedStyle(swing).rotate) * Math.PI) / 180
    yaw += degOf(getComputedStyle(sway).rotate)
    swing.dataset.physics = ''
    physics = true
    calm = 0
    rest(a)
  }

  function release() {
    const C = pts[segs + 1]
    C.w = CARD_W
    const vx = C.x - C.px
    const vy = C.y - C.py
    const v = Math.hypot(vx, vy)
    if (v > 40) Object.assign(C, { px: C.x - (vx * 40) / v, py: C.y - (vy * 40) / v }) // batas kecepatan lempar
    delete card.dataset.dragging
    wake()
  }

  const events = {
    pointerdown(e) {
      if (e.button !== 0) return
      skipClick.current = false
      drag = { id: e.pointerId, x: e.clientX, y: e.clientY, active: false }
      card.setPointerCapture(e.pointerId)
    },
    pointermove(e) {
      if (e.pointerId !== drag?.id) return
      if (!drag.active) {
        const dx = Math.abs(e.clientX - drag.x)
        const dy = Math.abs(e.clientY - drag.y)
        // Sentuhan: hanya geser ke samping yang mengayun kartu; geser atas/bawah dibiarkan jadi scroll halaman
        if (Math.hypot(dx, dy) < 6 || (e.pointerType !== 'mouse' && dy >= dx)) return
        if (!physics) takeOver()
        const C = pts[segs + 1]
        const p = local(drag.x, drag.y)
        Object.assign(drag, { active: true, ox: C.x - p.x, oy: C.y - p.y })
        C.w = 0 // kartu dipegang: ikut pointer
        card.dataset.dragging = ''
      }
      const p = local(e.clientX, e.clientY)
      drag.tx = p.x + drag.ox
      drag.ty = p.y + drag.oy
      wake()
    },
    pointerup(e) {
      if (e.pointerId !== drag?.id) return
      if (drag.active) {
        // klik dari mouseup yang sama bukan "balik kartu"; flag dilepas setelah event klik itu lewat
        skipClick.current = true
        setTimeout(() => (skipClick.current = false))
        release()
      }
      drag = null
    },
    pointercancel(e) {
      if (e.pointerId !== drag?.id) return
      if (drag.active) release()
      drag = null
    },
  }

  if (!still) for (const [type, fn] of Object.entries(events)) card.addEventListener(type, fn)
  const ro = new ResizeObserver(measure)
  ro.observe(swing)
  measure()

  return {
    flip(to) {
      if (to === flipTo) return
      flipTo = to
      if (!still) return wake()
      yaw = to
      render()
    },
    stop() {
      cancelAnimationFrame(raf)
      ro.disconnect()
      for (const [type, fn] of Object.entries(events)) card.removeEventListener(type, fn)
    },
  }
}

export default function IdCard() {
  const [flipped, setFlipped] = useState(false)
  const [still] = useState(reduceMotion) // reduced motion: kartu tidak bisa ditarik, tanpa ayunan
  const swing = useRef(null)
  const sway = useRef(null)
  const badge = useRef(null)
  const card = useRef(null)
  const turn = useRef(null)
  const svg = useRef(null)
  const engine = useRef(null)
  const skipClick = useRef(false)

  useEffect(() => {
    const parts = {
      swing: swing.current,
      sway: sway.current,
      badge: badge.current,
      card: card.current,
      turn: turn.current,
      svg: svg.current,
    }
    engine.current = lanyard({ ...parts, still, skipClick })
    return engine.current.stop
  }, [still])
  useEffect(() => engine.current.flip(flipped ? 180 : 0), [flipped])

  const onMove = (e) => {
    if (e.pointerType !== 'mouse') return
    const t = tiltFromPointer(e.clientX, e.clientY, card.current.getBoundingClientRect())
    const s = card.current.style
    s.setProperty('--rx', `${t.rx}deg`)
    s.setProperty('--ry', `${t.ry}deg`)
    s.setProperty('--px', `${t.px}%`)
    s.setProperty('--py', `${t.py}%`)
  }
  const onLeave = () => TILT_VARS.forEach((k) => card.current.style.removeProperty(k))

  return (
    <div className="lanyard" data-draggable={still ? undefined : ''}>
      <div ref={swing} className="lanyard__swing">
        <svg ref={svg} className="lanyard__rope" width="1" height="1" aria-hidden="true">
          <defs>
            <clipPath id="lanyard-clip">
              <path />
            </clipPath>
            <linearGradient id="lanyard-fade-grad" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="24">
              <stop offset="0" stopColor="#fff" stopOpacity="0" />
              <stop offset="1" stopColor="#fff" />
            </linearGradient>
            {/* tali muncul dari bawah navbar: 24px teratas memudar */}
            <mask id="lanyard-fade" maskUnits="userSpaceOnUse" x="-2000" y="-100" width="4000" height="4000">
              <rect x="-2000" y="0" width="4000" height="4000" fill="url(#lanyard-fade-grad)" />
            </mask>
          </defs>
          <g mask="url(#lanyard-fade)">
            {Array.from({ length: QUADS }, (_, i) => (
              <polygon key={i} />
            ))}
            {/* kilap + teks dipotong mengikuti bentuk pita: ikut menyempit di lipatan */}
            <g clipPath="url(#lanyard-clip)">
              <path id="lanyard-path" className="lanyard__shine" />
              <text className="lanyard__text">
                <textPath href="#lanyard-path">{strapText}</textPath>
              </text>
            </g>
          </g>
        </svg>
        <span ref={badge} className="lanyard__badge">
          <span className="lanyard__clip" aria-hidden="true" />
          <button
            ref={card}
            type="button"
            className="idcard"
            aria-pressed={flipped}
            onClick={() => skipClick.current || setFlipped((f) => !f)}
            onPointerMove={onMove}
            onPointerLeave={onLeave}
          >
            {/* Nama tombol = teks yang terlihat (WCAG 2.5.3), diawali aksinya; sisi yang tersembunyi tidak dibacakan. */}
            <span className="sr-only">Balik kartu: </span>
            {/* sway = putaran kecil ayunan idle (CSS) · inner = tilt hover · turn = putaran fisika (JS) */}
            <span ref={sway} className="idcard__sway">
              <span className="idcard__inner">
                <span ref={turn} className="idcard__turn">
                  <span className="idcard__face idcard__front" aria-hidden={flipped}>
                    <span className="idcard__sheen" />
                    <span className="idcard__slot" />
                    <span className="idcard__top">
                      <span className="brand">{profile.brand}</span>
                      <span>No. 0001</span>
                    </span>
                    <span className="idcard__avatar">
                      {profile.photo ? <img src={profile.photo} alt="" draggable={false} /> : initials(profile.name)}
                    </span>
                    <span className="idcard__name">{profile.name}</span>
                    <span className="idcard__role">{profile.roles[0]}</span>
                    <span className="idcard__loc">
                      <Icon name="mapPin" size={14} />
                      {profile.location}
                    </span>
                    <span className="idcard__barcode" />
                    <span className="idcard__foot">
                      <span>Developer ID</span>
                      <span>{new Date().getFullYear()}</span>
                    </span>
                  </span>
                  <span className="idcard__face idcard__back" aria-hidden={!flipped}>
                    <span className="idcard__sheen" />
                    <span className="idcard__slot" />
                    <span className="idcard__back-title">Mari terhubung</span>
                    <span className="idcard__mail">{profile.email}</span>
                    <span className="idcard__list">
                      {socials.map((s) => (
                        <span key={s.name}>
                          <Icon name={s.icon} size={14} />
                          {s.name}
                        </span>
                      ))}
                    </span>
                    <span className="idcard__dots" />
                    <span className="idcard__foot">
                      <span>{profile.brand}</span>
                      <span>Balik lagi</span>
                    </span>
                  </span>
                  {/* ketebalan kartu: tepi kiri & kanan, terlihat saat kartu menyamping */}
                  <span className="idcard__edge idcard__edge--l" />
                  <span className="idcard__edge idcard__edge--r" />
                </span>
              </span>
            </span>
          </button>
        </span>
      </div>
      <p className="lanyard__hint" aria-hidden="true">
        <span className="lanyard__hint-mouse">
          {still ? 'Klik kartu untuk membalik' : 'Tarik kartunya, atau klik untuk membalik'}
        </span>
        <span className="lanyard__hint-touch">
          {still ? 'Ketuk kartu untuk membalik' : 'Geser ke samping, atau ketuk untuk membalik'}
        </span>
      </p>
    </div>
  )
}
