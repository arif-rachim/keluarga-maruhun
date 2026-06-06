import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { IconSearch, IconClose } from './icons.jsx'
import { lifespan, placeLabel } from '../lib/format.js'
import { useI18n } from '../i18n/i18n.jsx'

export function SearchBar({ people, onPick }) {
  const { t } = useI18n()
  const [q, setQ] = useState('')
  const [focused, setFocused] = useState(false)

  const results = useMemo(() => {
    const term = q.trim().toLowerCase()
    if (!term) return []
    return people
      .filter((p) =>
        [p.name, p.city, p.country].some((v) => (v || '').toLowerCase().includes(term)),
      )
      .slice(0, 6)
  }, [q, people])

  const open = focused && q.trim().length > 0

  return (
    <div className="search-wrap">
      <div className="search-box">
        <IconSearch />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 150)}
          placeholder={t('search.placeholder')}
          aria-label="Cari anggota keluarga"
        />
        {q && (
          <button onClick={() => setQ('')} aria-label="Bersihkan" data-no-pan>
            <IconClose style={{ width: 15, height: 15, color: 'var(--text-faint)' }} />
          </button>
        )}
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            className="search-results"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
          >
            {results.length === 0 ? (
              <div className="search-empty">{t('search.empty')}</div>
            ) : (
              results.map((p) => {
                const meta = [lifespan(p), placeLabel(p)].filter(Boolean).join(' · ')
                return (
                  <button
                    key={p.id}
                    className="search-item"
                    data-no-pan
                    onMouseDown={(e) => {
                      e.preventDefault()
                      onPick(p.id)
                      setQ('')
                    }}
                  >
                    <div>
                      <div className="si-name">{p.name}</div>
                      {meta && <div className="si-meta">{meta}</div>}
                    </div>
                  </button>
                )
              })
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
