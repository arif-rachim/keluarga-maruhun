import { useEffect, useState } from 'react'

// Mengembalikan arah pohon yang cocok dengan orientasi layar:
//  - portrait (HP berdiri)  -> 'horizontal' (kiri ke kanan, memanfaatkan tinggi)
//  - landscape / layar lebar -> 'vertical' (atas ke bawah, memanfaatkan lebar)
function pick() {
  if (typeof window === 'undefined') return 'vertical'
  // Layar cukup lebar (laptop/tablet landscape) selalu vertikal.
  if (window.innerWidth >= 820) return 'vertical'
  const portrait = window.matchMedia('(orientation: portrait)').matches
  return portrait ? 'horizontal' : 'vertical'
}

export function useTreeOrientation() {
  const [orientation, setOrientation] = useState(pick)
  useEffect(() => {
    const update = () => setOrientation(pick())
    window.addEventListener('resize', update)
    window.addEventListener('orientationchange', update)
    return () => {
      window.removeEventListener('resize', update)
      window.removeEventListener('orientationchange', update)
    }
  }, [])
  return orientation
}
