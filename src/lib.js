// Helper kecil bersama. Yang murni (tanpa DOM) diuji dengan `npm test`.

export const reduceMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches

// Satu langkah efek mesin ketik: kembalikan state berikutnya + jeda (ms) sebelum langkah selanjutnya.
export function typewriterStep({ word, text, deleting }, words, t = { type: 70, erase: 40, hold: 1600 }) {
  const full = words[word]
  if (!deleting) {
    if (text === full) return { state: { word, text, deleting: true }, delay: t.hold }
    return { state: { word, text: full.slice(0, text.length + 1), deleting: false }, delay: t.type }
  }
  if (text) return { state: { word, text: text.slice(0, -1), deleting: true }, delay: t.erase }
  return { state: { word: (word + 1) % words.length, text: '', deleting: false }, delay: t.type }
}

const clamp01 = (v) => Math.min(1, Math.max(0, v))

// Posisi pointer → sudut miring kartu (derajat) + posisi kilap (persen).
export function tiltFromPointer(x, y, rect, max = 12) {
  const nx = clamp01((x - rect.left) / rect.width)
  const ny = clamp01((y - rect.top) / rect.height)
  return { rx: (0.5 - ny) * 2 * max, ry: (nx - 0.5) * 2 * max, px: nx * 100, py: ny * 100 }
}

export const categoriesOf = (projects) => ['Semua', ...new Set(projects.map((p) => p.category))]

// Lebar (kolom) kartu terakhir supaya baris terakhir grid `cols` kolom terisi penuh.
// Kartu unggulan = 2 kolom; kartu yang tidak muat di sisa baris pindah ke baris baru, seperti auto-placement grid.
export function lastSpan(items, cols) {
  let used = 0
  let w = 1
  for (const p of items) {
    w = p.featured ? 2 : 1
    used = used + w > cols ? w : used + w
    if (used === cols) used = 0
  }
  return used ? w + cols - used : w
}

// --- Lanyard (IdCard): fisika tali verlet + geometri pita tali. Murni, tanpa DOM. ---

// Satu langkah verlet. pts: { x, y, px, py, w } — px/py = posisi langkah sebelumnya, w = invers massa
// (0 = terkunci); len[i] = panjang antara pts[i] dan pts[i + 1].
export function stepRope({ pts, len }, { gravity, damping, iterations }) {
  for (const p of pts) {
    if (!p.w) continue
    const vx = (p.x - p.px) * damping
    const vy = (p.y - p.py) * damping
    p.px = p.x
    p.py = p.y
    p.x += vx
    p.y += vy + gravity
  }
  for (let k = 0; k < iterations; k++) {
    for (let i = 0; i < len.length; i++) {
      const a = pts[i]
      const b = pts[i + 1]
      const w = a.w + b.w
      if (!w) continue
      const dx = b.x - a.x
      const dy = b.y - a.y
      const d = Math.hypot(dx, dy) || 1e-6
      const f = (d - len[i]) / d / w
      a.x += dx * f * a.w
      a.y += dy * f * a.w
      b.x -= dx * f * b.w
      b.y -= dy * f * b.w
    }
  }
  // Tali tidak bisa melar (boleh kendur): dari jangkar ke bawah, titik yang terlalu jauh ditarik mendekat.
  // Tanpa ini kartu yang berat membuat tali melar ±3% karena iterasi di atas tidak sempat konvergen.
  for (let i = 0; i < len.length; i++) {
    const a = pts[i]
    const b = pts[i + 1]
    const dx = b.x - a.x
    const dy = b.y - a.y
    const d = Math.hypot(dx, dy)
    if (b.w && d > len[i]) {
      b.x = a.x + (dx / d) * len[i]
      b.y = a.y + (dy / d) * len[i]
    }
  }
}

// Target kartu yang ditarik: jarak dari jangkar dibatasi `max` (lewat dari itu terasa karet), tidak di atas `minY`.
export function clampReach(x, y, max, minY) {
  const d = Math.hypot(x, y)
  const k = d > max ? (max + (d - max) * 0.25) / d : 1
  return { x: x * k, y: Math.max(y * k, minY) }
}

// Pilinan tali (derajat) di posisi t (0 = jangkar, 1 = klip) saat kartu berputar `flip` derajat:
// tali bagian atas tetap lurus, pilinan menumpuk di dekat klip.
export function twistAt(t, flip) {
  const s = Math.min(1, Math.max(0, (t - 0.35) / 0.65))
  return flip * s * s * (3 - 2 * s)
}

// Catmull-Rom seragam: `k` sampel per segmen, melewati semua titik asli.
export function smoothRope(pts, k) {
  const cr = (a, b, c, d, t) =>
    0.5 * (2 * b + (c - a) * t + (2 * a - 5 * b + 4 * c - d) * t * t + (3 * b - a - 3 * c + d) * t * t * t)
  const out = []
  for (let i = 0; i < pts.length - 1; i++) {
    const [a, b, c, d] = [pts[i - 1] || pts[i], pts[i], pts[i + 1], pts[i + 2] || pts[i + 1]]
    for (let j = 0; j < k; j++) out.push({ x: cr(a.x, b.x, c.x, d.x, j / k), y: cr(a.y, b.y, c.y, d.y, j / k) })
  }
  const end = pts.at(-1)
  out.push({ x: end.x, y: end.y })
  return out
}

// Pita tali dari garis tengah `pts` dan pilinan per titik (derajat): lebar = width·|cos θ|, dan titik
// selebar nol disisipkan tepat di lipatan (cos berganti tanda). quads: back = sisi belakang tali yang
// terlihat, light = |cos θ| untuk bayangan.
export function ribbon(pts, twist, width) {
  const s = []
  let pc
  pts.forEach((p, i) => {
    const c = Math.cos((twist[i] * Math.PI) / 180)
    if (i && (pc < 0) !== (c < 0)) {
      const f = pc / (pc - c)
      const a = pts[i - 1]
      s.push({ x: a.x + (p.x - a.x) * f, y: a.y + (p.y - a.y) * f, c: 0 })
    }
    s.push({ x: p.x, y: p.y, c })
    pc = c
  })
  const left = []
  const right = []
  s.forEach((p, i) => {
    const a = s[Math.max(0, i - 1)]
    const b = s[Math.min(s.length - 1, i + 1)]
    const tl = Math.hypot(b.x - a.x, b.y - a.y) || 1
    const h = (width / 2) * Math.abs(p.c)
    const nx = (-(b.y - a.y) / tl) * h
    const ny = ((b.x - a.x) / tl) * h
    left.push([p.x + nx, p.y + ny])
    right.push([p.x - nx, p.y - ny])
  })
  const quads = s.slice(1).map((p, i) => {
    const c = (s[i].c + p.c) / 2
    return { points: [left[i], left[i + 1], right[i + 1], right[i]], back: c < 0, light: Math.abs(c) }
  })
  return { left, right, quads, center: s }
}

// Satu langkah pegas teredam (per langkah 1/60 s): k = kekakuan, c = redaman. Mengembalikan [posisi, kecepatan].
export function springStep(x, v, target, k, c) {
  const nv = v + (target - x) * k - v * c
  return [x + nv, nv]
}

// Sudut (derajat) sisi kartu yang sedang menghadap penonton, -90..90: 0 = tepat menghadap depan/belakang.
export function faceAngle(yaw) {
  const a = (((yaw % 360) + 540) % 360) - 180
  return a > 90 ? a - 180 : a < -90 ? a + 180 : a
}
