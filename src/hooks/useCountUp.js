import { useEffect, useRef, useState } from 'react'

// Animasi angka menghitung naik dari 0 ke target.
export function useCountUp(target, { duration = 1100, delay = 0 } = {}) {
  const [value, setValue] = useState(0)
  const raf = useRef(0)

  useEffect(() => {
    let start = null
    const from = 0
    const ease = (t) => 1 - Math.pow(1 - t, 3)
    const tick = (now) => {
      if (start === null) start = now
      const k = Math.min(1, (now - start) / duration)
      setValue(Math.round(from + (target - from) * ease(k)))
      if (k < 1) raf.current = requestAnimationFrame(tick)
    }
    const timer = setTimeout(() => {
      raf.current = requestAnimationFrame(tick)
    }, delay)
    return () => {
      clearTimeout(timer)
      cancelAnimationFrame(raf.current)
    }
  }, [target, duration, delay])

  return value
}
