import { useEffect, useRef } from 'react'
import {
  isManggalehEnabled,
  SEED_ON_EMPTY,
  listPeople,
  insertPerson,
  insertManyPeople,
  patchPerson,
  deletePerson,
  subscribePeople,
} from '../data/manggaleh.js'
import { SEED_PEOPLE } from '../data/seed.js'

// Sinkronisasi offline-first dengan Manggaleh.
//
// Alur:
//  1. Aplikasi tetap boot instan dari cache lokal (localStorage) — tanpa kedip.
//  2. Saat mount (bila aktif): muat data remote -> jadikan sumber kebenaran.
//  3. Setiap perubahan lokal didorong ke remote sebagai diff (insert/patch/del).
//  4. Event realtime memuat ulang daftar -> state ikut terbarui.
//
// Trik anti-loop: hydrate & realtime memakai REFERENSI array yang sama untuk
// `setPeople(remote)` dan `synced.current = remote`. Effect pendorong melewati
// perubahan yang `people === synced.current` (artinya berasal dari remote,
// bukan mutasi lokal), sehingga tak ada gema balik ke server.
export function useManggalehSync(people, setPeople) {
  const enabled = isManggalehEnabled()
  const synced = useRef(null) // array people terakhir yang sama dengan remote

  // Hydrate awal + langganan realtime.
  useEffect(() => {
    if (!enabled) return
    let unsub = null
    let cancelled = false

    ;(async () => {
      try {
        let remote = await listPeople()
        if (SEED_ON_EMPTY && remote.length === 0) {
          // Isi data awal sekali ke proyek kosong, lalu muat ulang.
          await Promise.allSettled(SEED_PEOPLE.map((p) => insertPerson(p)))
          remote = await listPeople()
        }
        if (cancelled) return
        synced.current = remote
        setPeople(remote)
      } catch (e) {
        console.warn('Manggaleh: gagal memuat data remote, memakai cache lokal.', e)
      }

      try {
        unsub = await subscribePeople((remote) => {
          if (cancelled) return
          synced.current = remote
          setPeople(remote)
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

  // Dorong perubahan lokal ke remote.
  useEffect(() => {
    if (!enabled) return
    const prev = synced.current
    if (prev === null) return // belum hydrate
    if (people === prev) return // perubahan berasal dari remote -> jangan pantulkan
    synced.current = people
    pushDiff(prev, people)
  }, [enabled, people])
}

// Hitung selisih dua snapshot lalu kirim ke Manggaleh.
async function pushDiff(prev, next) {
  const prevById = new Map(prev.map((p) => [p.id, p]))
  const nextById = new Map(next.map((p) => [p.id, p]))
  const jobs = []

  for (const p of next) {
    const before = prevById.get(p.id)
    if (!before) jobs.push(insertPerson(p))
    else if (!samePerson(before, p)) jobs.push(patchPerson(p.id, p))
  }
  for (const p of prev) {
    if (!nextById.has(p.id)) jobs.push(deletePerson(p.id))
  }

  if (!jobs.length) return
  const results = await Promise.allSettled(jobs)
  const failed = results.filter((r) => r.status === 'rejected')
  if (failed.length) {
    console.warn(`Manggaleh: ${failed.length} perubahan gagal disinkronkan.`, failed[0].reason)
  }
}

// Perbandingan dangkal cukup: objek dibangun konsisten di useFamily/seed.
// Bila beda, paling buruk hanya menghasilkan satu patch berlebih.
function samePerson(a, b) {
  return JSON.stringify(a) === JSON.stringify(b)
}
