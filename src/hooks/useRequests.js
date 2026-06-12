import { useEffect, useMemo, useState, useSyncExternalStore } from 'react'
import { isManggalehEnabled, getRequestsLive, fromRequestRow } from '../data/manggaleh.js'

// Daftar usulan perubahan memakai STORE LIVE Manggaleh:
//  - usulan yang dikirim tampil OPTIMISTIK seketika (rollback bila gagal),
//  - rekonsiliasi realtime efisien (tak perlu muat-ulang seluruh daftar).
// Aktif hanya bila Manggaleh menyala.
const EMPTY = []
const NOOP_SUB = () => () => {}

export function useRequests() {
  const enabled = isManggalehEnabled()
  const [store, setStore] = useState(null)

  useEffect(() => {
    if (!enabled) return
    let cancelled = false
    getRequestsLive()
      .then((s) => {
        if (!cancelled) setStore(s)
      })
      .catch((e) => console.warn('Manggaleh: store usulan gagal dimuat.', e))
    return () => {
      cancelled = true
    }
  }, [enabled])

  const rows = useSyncExternalStore(
    store ? store.subscribe : NOOP_SUB,
    store ? store.getSnapshot : () => EMPTY,
  )

  const requests = useMemo(() => rows.map(fromRequestRow), [rows])
  const pending = useMemo(() => requests.filter((r) => r.status === 'pending'), [requests])

  return { enabled, requests, pending, loaded: !!store }
}
