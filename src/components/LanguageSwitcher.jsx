import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useI18n } from '../i18n/i18n.jsx'
import { IconGlobe, IconCheck } from './icons.jsx'

export function LanguageSwitcher() {
  const { lang, setLang, languages } = useI18n()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    const onDoc = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('pointerdown', onDoc)
    return () => document.removeEventListener('pointerdown', onDoc)
  }, [open])

  const current = languages.find((l) => l.code === lang)

  return (
    <div className="lang-switch" ref={ref}>
      <motion.button
        className="lang-trigger"
        onClick={() => setOpen((v) => !v)}
        whileTap={{ scale: 0.94 }}
        aria-label="Ganti bahasa"
      >
        <IconGlobe />
        <span>{current?.short}</span>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="lang-menu"
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
          >
            {languages.map((l) => (
              <button
                key={l.code}
                className={`lang-item${l.code === lang ? ' active' : ''}`}
                onClick={() => {
                  setLang(l.code)
                  setOpen(false)
                }}
              >
                <span className="lang-short">{l.short}</span>
                <span className="lang-label">{l.label}</span>
                {l.code === lang && <IconCheck className="lang-check" />}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
