import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import {
  isManggalehEnabled,
  checkAccess,
  loadSession,
  saveSession,
  canonPhone,
} from '../data/manggaleh.js'

// Konteks akses: mengelola "login" ringan (nama + nomor telepon) yang dicocokkan
// dengan whitelist di server. Menentukan apakah pengguna boleh menyunting.
//
// Tanpa Manggaleh (mode localStorage), tidak ada gerbang — semua boleh menyunting
// seperti perilaku asli aplikasi.
const AccessContext = createContext(null)

export function AccessProvider({ children }) {
  const enabled = isManggalehEnabled()
  const [session, setSession] = useState(() => (enabled ? loadSession() : null))
  const [pending, setPending] = useState(false)
  const [error, setError] = useState(null)

  // Verifikasi ulang sesi tersimpan saat mount — nomor bisa saja sudah dicabut
  // dari whitelist sejak terakhir masuk.
  useEffect(() => {
    if (!enabled || !session?.phone) return
    let alive = true
    checkAccess(session.phone)
      .then((r) => {
        if (alive && !r.approved) {
          saveSession(null)
          setSession(null)
        }
      })
      .catch(() => {
        /* offline: pertahankan sesi lokal */
      })
    return () => {
      alive = false
    }
    // hanya saat mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled])

  const signIn = useCallback(async (name, phone) => {
    setPending(true)
    setError(null)
    try {
      const r = await checkAccess(phone)
      if (r.approved) {
        const s = {
          name: (name || '').trim() || r.name || 'Dunsanak',
          phone: canonPhone(phone),
        }
        saveSession(s)
        setSession(s)
        return { ok: true }
      }
      setError('not_whitelisted')
      return { ok: false, error: 'not_whitelisted' }
    } catch {
      setError('network')
      return { ok: false, error: 'network' }
    } finally {
      setPending(false)
    }
  }, [])

  const signOut = useCallback(() => {
    saveSession(null)
    setSession(null)
  }, [])

  const clearError = useCallback(() => setError(null), [])

  // Tanpa Manggaleh: bebas menyunting. Dengan Manggaleh: hanya bila ada sesi.
  const canEdit = !enabled || !!session

  const value = useMemo(
    () => ({ enabled, session, canEdit, signIn, signOut, pending, error, clearError }),
    [enabled, session, canEdit, signIn, signOut, pending, error, clearError],
  )
  return <AccessContext.Provider value={value}>{children}</AccessContext.Provider>
}

export function useAccess() {
  const ctx = useContext(AccessContext)
  if (!ctx) throw new Error('useAccess harus dipakai di dalam AccessProvider')
  return ctx
}
