import { useEffect, useRef } from 'react'
import { reduceMotion } from '../lib.js'

// ponytail: resolusi render rendah tetap (0.5–0.75×), naikkan kalau aurora terlihat terlalu blur di layar besar.
const renderSize = (canvas) => {
  const scale = Math.min(devicePixelRatio, 1) * (innerWidth < 768 ? 0.5 : 0.75)
  return {
    width: Math.max(1, Math.round(canvas.clientWidth * scale)),
    height: Math.max(1, Math.round(canvas.clientHeight * scale)),
  }
}

// Shader aurora berjalan di aurora.worker.js (OffscreenCanvas) supaya main thread bebas.
// data-state di canvas: off (tanpa WebGL) | static (1 frame) | running (animasi jalan)
export default function ShaderBg() {
  const host = useRef(null)

  useEffect(() => {
    // Canvas dibuat di sini, bukan di JSX: transferControlToOffscreen hanya bisa sekali per canvas,
    // dan remount (StrictMode/HMR) butuh canvas baru.
    const canvas = document.createElement('canvas')
    canvas.className = 'shader'
    host.current.append(canvas)
    if (!canvas.transferControlToOffscreen) {
      canvas.dataset.state = 'off' // browser lama: tetap pakai latar gradient CSS
      return () => canvas.remove()
    }

    let worker
    try {
      worker = new Worker(new URL('./aurora.worker.js', import.meta.url), { type: 'module' })
      const offscreen = canvas.transferControlToOffscreen()
      worker.postMessage({ type: 'init', canvas: offscreen, ...renderSize(canvas) }, [offscreen])
    } catch {
      // mis. browser tanpa module worker: hiasan ini tidak boleh menjatuhkan seluruh halaman
      worker?.terminate()
      canvas.dataset.state = 'off'
      return () => canvas.remove()
    }

    const teardown = []
    const dispose = () => {
      teardown.splice(0).forEach((fn) => fn())
      worker.terminate()
    }
    const off = () => {
      canvas.dataset.state = 'off'
      dispose()
    }
    worker.onerror = off // file worker gagal dimuat (mis. 404)

    worker.onmessage = ({ data }) => {
      if (data === 'off') return off()
      canvas.dataset.state = 'static' // 'ready': frame pertama sudah tergambar
      const ro = new ResizeObserver(() => worker.postMessage({ type: 'resize', ...renderSize(canvas) }))
      ro.observe(canvas)
      teardown.push(() => ro.disconnect())
      if (reduceMotion()) return

      // Animasi hanya jalan saat hero terlihat dan tab aktif (fallback setTimeout di worker tidak berhenti sendiri).
      let inView = false
      const sync = () => {
        const running = inView && !document.hidden
        worker.postMessage({ type: running ? 'start' : 'stop' })
        canvas.dataset.state = running ? 'running' : 'static'
      }
      const io = new IntersectionObserver(([entry]) => {
        inView = entry.isIntersecting
        sync()
      })
      io.observe(canvas)
      document.addEventListener('visibilitychange', sync)
      const onMove = (e) => {
        if (!inView) return // aurora berhenti: posisi pointer tidak dipakai
        const r = canvas.getBoundingClientRect()
        worker.postMessage({ type: 'pointer', x: (e.clientX - r.left) / r.width, y: 1 - (e.clientY - r.top) / r.height })
      }
      addEventListener('pointermove', onMove, { passive: true })
      teardown.push(
        () => io.disconnect(),
        () => document.removeEventListener('visibilitychange', sync),
        () => removeEventListener('pointermove', onMove),
      )
    }

    return () => {
      dispose()
      canvas.remove()
    }
  }, [])

  return <div ref={host} className="hero__bg" aria-hidden="true" />
}
