import test from 'node:test'
import { deepEqual, ok } from 'node:assert/strict'
import {
  categoriesOf,
  clampReach,
  faceAngle,
  lastSpan,
  ribbon,
  smoothRope,
  springStep,
  stepRope,
  tiltFromPointer,
  twistAt,
  typewriterStep,
} from './lib.js'

const T = { type: 70, erase: 40, hold: 1600 }
const W = ['Hi', 'Yo']

test('typewriterStep: mengetik, jeda, menghapus, lalu pindah kata', () => {
  deepEqual(typewriterStep({ word: 0, text: '', deleting: false }, W, T), {
    state: { word: 0, text: 'H', deleting: false },
    delay: 70,
  })
  deepEqual(typewriterStep({ word: 0, text: 'Hi', deleting: false }, W, T), {
    state: { word: 0, text: 'Hi', deleting: true },
    delay: 1600,
  })
  deepEqual(typewriterStep({ word: 0, text: 'Hi', deleting: true }, W, T), {
    state: { word: 0, text: 'H', deleting: true },
    delay: 40,
  })
  deepEqual(typewriterStep({ word: 1, text: '', deleting: true }, W, T), {
    state: { word: 0, text: '', deleting: false },
    delay: 70,
  })
})

test('tiltFromPointer: tengah netral, sudut maksimal, di luar kartu di-clamp', () => {
  const r = { left: 0, top: 0, width: 200, height: 100 }
  deepEqual(tiltFromPointer(100, 50, r, 12), { rx: 0, ry: 0, px: 50, py: 50 })
  deepEqual(tiltFromPointer(200, 0, r, 12), { rx: 12, ry: 12, px: 100, py: 0 })
  deepEqual(tiltFromPointer(-50, 500, r, 12), { rx: -12, ry: -12, px: 0, py: 100 })
})

test('categoriesOf: "Semua" lalu kategori unik sesuai urutan data', () => {
  deepEqual(categoriesOf([{ category: 'Web' }, { category: 'Bot' }, { category: 'Web' }]), ['Semua', 'Web', 'Bot'])
  deepEqual(categoriesOf([]), ['Semua'])
})

test('lastSpan: kartu terakhir melebar mengisi sisa baris (kartu unggulan = 2 kolom)', () => {
  const c = {}
  const f = { featured: true }
  deepEqual(lastSpan([f, c, c, c, c, c], 3), 3)
  deepEqual(lastSpan([f, c, c, c, c, c], 2), 2)
  deepEqual(lastSpan([f, c], 3), 1)
  deepEqual(lastSpan([c, c, f], 3), 3) // unggulan tidak muat di sisa 1 kolom → pindah baris
  deepEqual(lastSpan([c], 3), 3)
})

// Parameter seperti di IdCard (desktop): tali 216px / 10 segmen, kartu berat 220px di bawah klip.
const hangingRope = (L, segs, D) => {
  const pts = Array.from({ length: segs + 1 }, (_, i) => ({ x: (L * i) / segs, y: 0, w: i ? 1 : 0 }))
  pts.push({ x: L + D, y: 0, w: 0.1 })
  for (const p of pts) Object.assign(p, { px: p.x, py: p.y })
  return { pts, len: [...Array(segs).fill(L / segs), D] }
}

test('stepRope: tali yang dilepas mendatar akhirnya menggantung lurus, panjang terjaga, jangkar diam', () => {
  for (const [L, segs, D] of [
    [216, 10, 220],
    [56, 4, 178],
  ]) {
    const rope = hangingRope(L, segs, D)
    for (let i = 0; i < 4000; i++) stepRope(rope, { gravity: 1.6, damping: 0.985, iterations: 16 })
    const card = rope.pts.at(-1)
    ok(Math.abs(card.x) < 1 && Math.abs(card.y - (L + D)) < (L + D) * 0.01, `kartu di ${card.x}, ${card.y}`)
    deepEqual([rope.pts[0].x, rope.pts[0].y], [0, 0])
    rope.len.forEach((len, i) => {
      const [a, b] = [rope.pts[i], rope.pts[i + 1]]
      ok(Math.abs(Math.hypot(b.x - a.x, b.y - a.y) - len) < len * 0.01, `segmen ${i} melar`)
    })
  }
})

test('clampReach: di dalam jangkauan tetap, di luar terasa karet, tidak naik melewati batas atas', () => {
  deepEqual(clampReach(30, 40, 100, 0), { x: 30, y: 40 })
  deepEqual(clampReach(0, 200, 100, 0), { x: 0, y: 125 })
  deepEqual(clampReach(50, -10, 100, 20), { x: 50, y: 20 })
})

test('twistAt: tali atas lurus, lipatan 90° di tengah pilinan, ujung bawah ikut kartu', () => {
  deepEqual([0, 0.35, 0.675, 1].map((t) => Math.round(twistAt(t, 180))), [0, 0, 90, 180])
  deepEqual(twistAt(1, 0), 0)
})

test('smoothRope: melewati titik asli dan menambah sampel di antaranya', () => {
  const out = smoothRope(
    [
      { x: 0, y: 0 },
      { x: 0, y: 10 },
      { x: 0, y: 20 },
    ],
    3,
  )
  deepEqual(out.length, 7)
  deepEqual([out[0], out[3], out[6]], [{ x: 0, y: 0 }, { x: 0, y: 10 }, { x: 0, y: 20 }])
  ok(out.every((p, i) => p.x === 0 && (i === 0 || p.y > out[i - 1].y)))
})

test('ribbon: tanpa pilinan selebar tali; terpilin 180° ada lipatan selebar nol dan ujung bawah sisi belakang', () => {
  const line = Array.from({ length: 21 }, (_, i) => ({ x: 0, y: i * 5 }))
  const widths = (r) => r.left.map((l, i) => Math.hypot(l[0] - r.right[i][0], l[1] - r.right[i][1]))
  const flat = ribbon(line, line.map(() => 0), 30)
  ok(widths(flat).every((w) => Math.abs(w - 30) < 1e-9))
  ok(flat.quads.every((q) => !q.back))
  const twisted = ribbon(line, line.map((_, i) => twistAt(i / 20, 180)), 30)
  ok(Math.min(...widths(twisted)) < 0.01, 'tidak ada lipatan')
  ok(!twisted.quads[0].back && twisted.quads.at(-1).back, 'sisi depan/belakang salah')
})

test('springStep: pegas teredam mencapai target dengan sedikit lewatan (kartu berputar balik)', () => {
  let [x, v] = [0, 0]
  let peak = 0
  for (let i = 0; i < 300; i++) {
    ;[x, v] = springStep(x, v, 180, 0.0136, 0.128)
    peak = Math.max(peak, x)
    if (i === 59) ok(Math.abs(x - 180) < 8, `setelah 1 s masih di ${x}`)
  }
  ok(peak > 180 && peak < 215, `lewatan ${peak}`)
  ok(Math.abs(x - 180) < 0.01 && Math.abs(v) < 0.01)
})

test('faceAngle: sudut sisi kartu yang menghadap penonton, antara -90 dan 90', () => {
  deepEqual([0, 30, 170, 180, 190, -30, 380].map(faceAngle), [0, 30, -10, 0, 10, -30, 20])
})
