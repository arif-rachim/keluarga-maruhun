import { useCallback, useEffect, useRef, useState } from 'react'

// Hook pan & zoom untuk "stage" pohon keluarga.
// Mendukung: drag (mouse/1 jari), pinch (2 jari), dan roda mouse.
const MIN_SCALE = 0.08
const MAX_SCALE = 2.2

export function usePanZoom(stageRef) {
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 })
  const [dragging, setDragging] = useState(false)
  const stateRef = useRef(transform)
  stateRef.current = transform

  const pointers = useRef(new Map())
  const gesture = useRef(null)

  const clampScale = (s) => Math.min(MAX_SCALE, Math.max(MIN_SCALE, s))

  // Animasikan perpindahan ke transform target (untuk "fit" & "focus").
  const animateTo = useCallback((target, duration = 600) => {
    const start = { ...stateRef.current }
    const t0 = performance.now()
    const ease = (t) => 1 - Math.pow(1 - t, 3)
    function step(now) {
      const k = Math.min(1, (now - t0) / duration)
      const e = ease(k)
      setTransform({
        x: start.x + (target.x - start.x) * e,
        y: start.y + (target.y - start.y) * e,
        scale: start.scale + (target.scale - start.scale) * e,
      })
      if (k < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [])

  // Pas-kan bounds konten ke dalam viewport.
  const fitToBounds = useCallback(
    (bounds, opts = {}) => {
      const el = stageRef.current
      if (!el || !bounds) return
      const vw = el.clientWidth
      const vh = el.clientHeight
      const pad = opts.pad ?? 80
      const scale = clampScale(
        Math.min((vw - pad * 2) / bounds.width, (vh - pad * 2) / bounds.height, 1.1),
      )
      const x = vw / 2 - (bounds.minX + bounds.width / 2) * scale
      const y = (opts.top ?? pad) - bounds.minY * scale
      const target = { x, y, scale }
      if (opts.animate) animateTo(target, opts.duration)
      else setTransform(target)
    },
    [stageRef, animateTo],
  )

  // Posisikan satu titik di viewport: vy = fraksi vertikal (0=atas, 0.5=tengah).
  const centerOn = useCallback(
    (point, scale, vy = 0.5, animate = true) => {
      const el = stageRef.current
      if (!el) return
      const s = clampScale(scale)
      const target = {
        x: el.clientWidth / 2 - point.x * s,
        y: el.clientHeight * vy - point.y * s,
        scale: s,
      }
      if (animate) animateTo(target, 650)
      else setTransform(target)
    },
    [stageRef, animateTo],
  )

  // Fokus ke satu titik (mis. kartu hasil pencarian).
  const focusOn = useCallback(
    (point, scale) => {
      const el = stageRef.current
      if (!el) return
      const s = clampScale(scale ?? Math.max(stateRef.current.scale, 0.85))
      const x = el.clientWidth / 2 - point.x * s
      const y = el.clientHeight * 0.42 - point.y * s
      animateTo({ x, y, scale: s }, 650)
    },
    [stageRef, animateTo],
  )

  const zoomBy = useCallback(
    (factor) => {
      const el = stageRef.current
      if (!el) return
      const cur = stateRef.current
      const ns = clampScale(cur.scale * factor)
      const cx = el.clientWidth / 2
      const cy = el.clientHeight / 2
      // Zoom terhadap titik tengah viewport.
      const x = cx - ((cx - cur.x) / cur.scale) * ns
      const y = cy - ((cy - cur.y) / cur.scale) * ns
      setTransform({ x, y, scale: ns })
    },
    [stageRef],
  )

  useEffect(() => {
    const el = stageRef.current
    if (!el) return

    const getMid = () => {
      const pts = [...pointers.current.values()]
      return {
        x: (pts[0].x + pts[1].x) / 2,
        y: (pts[0].y + pts[1].y) / 2,
      }
    }
    const getDist = () => {
      const pts = [...pointers.current.values()]
      return Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y)
    }

    const onDown = (e) => {
      // Abaikan jika menekan elemen interaktif (kartu, tombol).
      if (e.target.closest('[data-no-pan]')) return
      el.setPointerCapture?.(e.pointerId)
      pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })

      if (pointers.current.size === 1) {
        setDragging(true)
        gesture.current = {
          mode: 'pan',
          startX: e.clientX,
          startY: e.clientY,
          origin: { ...stateRef.current },
        }
      } else if (pointers.current.size === 2) {
        gesture.current = {
          mode: 'pinch',
          startDist: getDist(),
          startMid: getMid(),
          origin: { ...stateRef.current },
        }
      }
    }

    const onMove = (e) => {
      if (!pointers.current.has(e.pointerId)) return
      pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
      const g = gesture.current
      if (!g) return

      if (g.mode === 'pan' && pointers.current.size === 1) {
        const dx = e.clientX - g.startX
        const dy = e.clientY - g.startY
        setTransform({ x: g.origin.x + dx, y: g.origin.y + dy, scale: g.origin.scale })
      } else if (g.mode === 'pinch' && pointers.current.size === 2) {
        const dist = getDist()
        const mid = getMid()
        const ns = clampScale((g.origin.scale * dist) / g.startDist)
        // Jaga titik tengah pinch tetap di bawah jari.
        const wx = (g.startMid.x - g.origin.x) / g.origin.scale
        const wy = (g.startMid.y - g.origin.y) / g.origin.scale
        setTransform({ x: mid.x - wx * ns, y: mid.y - wy * ns, scale: ns })
      }
    }

    const onUp = (e) => {
      pointers.current.delete(e.pointerId)
      if (pointers.current.size === 0) {
        setDragging(false)
        gesture.current = null
      } else if (pointers.current.size === 1) {
        const [pt] = [...pointers.current.values()]
        setDragging(true)
        gesture.current = {
          mode: 'pan',
          startX: pt.x,
          startY: pt.y,
          origin: { ...stateRef.current },
        }
      }
    }

    const onWheel = (e) => {
      e.preventDefault()
      const cur = stateRef.current
      const factor = Math.exp(-e.deltaY * 0.0016)
      const ns = clampScale(cur.scale * factor)
      const rect = el.getBoundingClientRect()
      const px = e.clientX - rect.left
      const py = e.clientY - rect.top
      const x = px - ((px - cur.x) / cur.scale) * ns
      const y = py - ((py - cur.y) / cur.scale) * ns
      setTransform({ x, y, scale: ns })
    }

    el.addEventListener('pointerdown', onDown)
    el.addEventListener('pointermove', onMove)
    el.addEventListener('pointerup', onUp)
    el.addEventListener('pointercancel', onUp)
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => {
      el.removeEventListener('pointerdown', onDown)
      el.removeEventListener('pointermove', onMove)
      el.removeEventListener('pointerup', onUp)
      el.removeEventListener('pointercancel', onUp)
      el.removeEventListener('wheel', onWheel)
    }
  }, [stageRef])

  return { transform, dragging, fitToBounds, focusOn, centerOn, zoomBy }
}
