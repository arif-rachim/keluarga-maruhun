import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { translations, LANGUAGES } from './translations.js'

const LANG_KEY = 'silsilah-maruhun:lang'
const I18nContext = createContext(null)

function detectInitial() {
  try {
    const saved = localStorage.getItem(LANG_KEY)
    if (saved && translations[saved]) return saved
  } catch {
    // abaikan
  }
  return 'id'
}

export function I18nProvider({ children }) {
  const [lang, setLang] = useState(detectInitial)

  const changeLang = useCallback((code) => {
    if (!translations[code]) return
    setLang(code)
    try {
      localStorage.setItem(LANG_KEY, code)
    } catch {
      // abaikan
    }
  }, [])

  // t(key, vars) — ambil teks + ganti {placeholder}.
  const t = useCallback(
    (key, vars) => {
      const dict = translations[lang] || translations.id
      let str = dict[key] ?? translations.id[key] ?? key
      if (vars) {
        for (const k of Object.keys(vars)) {
          str = str.replace(new RegExp(`\\{${k}\\}`, 'g'), vars[k])
        }
      }
      return str
    },
    [lang],
  )

  const value = useMemo(
    () => ({ lang, setLang: changeLang, t, languages: LANGUAGES }),
    [lang, changeLang, t],
  )

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n() {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n harus dipakai di dalam I18nProvider')
  return ctx
}
