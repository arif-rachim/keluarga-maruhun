import { useEffect, useState } from 'react'

// True bila layar selebar HP (≤ 768px) — dipakai memilih tampilan ringan
// (tree-folder) alih-alih chart pan/zoom yang berat.
const QUERY = '(max-width: 768px)'

function read() {
  if (typeof window === 'undefined' || !window.matchMedia) return false
  return window.matchMedia(QUERY).matches
}

export function useIsMobile() {
  const [mobile, setMobile] = useState(read)
  useEffect(() => {
    const mq = window.matchMedia(QUERY)
    const update = () => setMobile(mq.matches)
    update()
    mq.addEventListener?.('change', update)
    window.addEventListener('resize', update)
    return () => {
      mq.removeEventListener?.('change', update)
      window.removeEventListener('resize', update)
    }
  }, [])
  return mobile
}
