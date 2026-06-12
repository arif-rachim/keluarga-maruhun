import { useEffect, useState } from 'react'
import { isManggalehEnabled, listRequests, subscribeRequests } from '../data/manggaleh.js'

// Daftar usulan perubahan (hydrate + realtime). Aktif hanya bila Manggaleh menyala.
export function useRequests() {
  const enabled = isManggalehEnabled()
  const [requests, setRequests] = useState([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    if (!enabled) return
    let unsub = null
    let cancelled = false
    ;(async () => {
      try {
        const r = await listRequests()
        if (!cancelled) {
          setRequests(r)
          setLoaded(true)
        }
      } catch (e) {
        console.warn('Manggaleh: gagal memuat usulan.', e)
      }
      try {
        unsub = await subscribeRequests((r) => {
          if (!cancelled) setRequests(r)
        })
      } catch (e) {
        console.warn('Manggaleh: realtime usulan mati.', e)
      }
    })()
    return () => {
      cancelled = true
      if (typeof unsub === 'function') {
        try {
          unsub()
        } catch {
          /* abaikan */
        }
      }
    }
  }, [enabled])

  const pending = requests.filter((r) => r.status === 'pending')
  return { enabled, requests, pending, loaded }
}
