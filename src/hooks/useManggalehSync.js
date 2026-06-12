import { useEffect } from 'react'
import {
  isManggalehEnabled,
  SEED_ON_EMPTY,
  listPeople,
  insertManyPeople,
  subscribePeople,
} from '../data/manggaleh.js'
import { SEED_PEOPLE } from '../data/seed.js'

// Sinkronisasi BACA-saja dengan Manggaleh (offline-first).
//
// Pada model usulan, aplikasi tidak pernah menulis `people` langsung — perubahan
// hanya terjadi setelah sebuah usulan disetujui (di server). Maka hook ini cukup:
//   1. Boot instan dari cache lokal (localStorage) — dilakukan useFamily.
//   2. Saat mount: muat data remote -> jadikan sumber kebenaran.
//   3. Event realtime (mis. usulan disetujui) -> muat ulang -> state terbarui.
//
// Tanpa env Manggaleh, hook ini tidak melakukan apa-apa.
export function useManggalehSync(_people, setPeople) {
  const enabled = isManggalehEnabled()

  useEffect(() => {
    if (!enabled) return
    let unsub = null
    let cancelled = false

    ;(async () => {
      try {
        let remote = await listPeople()
        if (SEED_ON_EMPTY && remote.length === 0) {
          await insertManyPeople(SEED_PEOPLE)
          remote = await listPeople()
        }
        if (!cancelled) setPeople(remote)
      } catch (e) {
        console.warn('Manggaleh: gagal memuat data remote, memakai cache lokal.', e)
      }

      try {
        unsub = await subscribePeople((remote) => {
          if (!cancelled) setPeople(remote)
        })
      } catch (e) {
        console.warn('Manggaleh: realtime tidak aktif.', e)
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
  }, [enabled, setPeople])
}
