import { motion } from 'framer-motion'
import { initials, lifespan, placeLabel, genderClass } from '../lib/format.js'
import { useI18n } from '../i18n/i18n.jsx'
import {
  IconClose,
  IconPin,
  IconPlusSm,
  IconTrash,
  IconHeart,
  IconPhone,
} from './icons.jsx'

function RelChip({ person, index = 0, onClick }) {
  return (
    <motion.button
      className="rel-chip"
      onClick={() => onClick(person.id)}
      data-no-pan
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 + index * 0.04, duration: 0.3 }}
      whileTap={{ scale: 0.96 }}
    >
      <span className="dot">{initials(person.name)}</span>
      {person.name}
    </motion.button>
  )
}

export function PersonDetail({ person, people, byId, onClose, onSelect, onAddTo, onRemove }) {
  const { t } = useI18n()
  if (!person) return null

  const parent = person.parentId ? byId.get(person.parentId) : null
  // Kumpulkan semua pasangan (dukung pasangan ganda + tautan dua arah).
  const spouseIdSet = new Set([
    ...(Array.isArray(person.spouseIds) ? person.spouseIds : []),
    ...(person.spouseId ? [person.spouseId] : []),
  ])
  for (const p of people) {
    if (p.spouseId === person.id) spouseIdSet.add(p.id)
    if (Array.isArray(p.spouseIds) && p.spouseIds.includes(person.id)) spouseIdSet.add(p.id)
  }
  const spouses = [...spouseIdSet].map((id) => byId.get(id)).filter(Boolean)
  // Anak = lewat garis keturunan (parentId) ATAU sebagai ibu (parent2Id).
  const children = people.filter(
    (p) => p.parentId === person.id || p.parent2Id === person.id,
  )
  const siblings = parent
    ? people.filter((p) => p.parentId === parent.id && p.id !== person.id)
    : []

  const place = placeLabel(person)
  const years = lifespan(person)

  return (
    <div className="scrim" onClick={onClose}>
      <motion.div
        className="sheet"
        onClick={(e) => e.stopPropagation()}
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 60, opacity: 0 }}
        transition={{ type: 'spring', damping: 28, stiffness: 280 }}
      >
        <div className="sheet-grip" />
        <button
          className="close-btn"
          onClick={onClose}
          aria-label="Tutup"
          style={{ position: 'absolute', top: 16, right: 18 }}
        >
          <IconClose />
        </button>

        <div className="detail-hero">
          <motion.span
            className={`avatar ${genderClass(person.gender)}`}
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', damping: 18, stiffness: 220 }}
          >
            {person.photo ? (
              <img src={person.photo} alt={person.name} />
            ) : (
              <span className="initials">{initials(person.name)}</span>
            )}
          </motion.span>
          <h2>{person.name}</h2>
          {years && <div className="sub">{years}</div>}
          <div className="detail-tags">
            {place && (
              <div className="detail-tag">
                <IconPin />
                {place}
              </div>
            )}
            {person.phone && (
              <a
                className="detail-tag detail-tag-wa"
                href={`https://wa.me/${person.phone.replace(/[^\d]/g, '')}`}
                target="_blank"
                rel="noreferrer"
                data-no-pan
              >
                <IconPhone />
                {person.phone}
              </a>
            )}
          </div>
        </div>

        {person.bio && <p className="detail-bio">“{person.bio}”</p>}

        <div className="detail-rels">
          {parent && (
            <div className="rel-group">
              <div className="rel-label">{t('detail.parents')}</div>
              <div className="rel-chips">
                <RelChip person={parent} onClick={onSelect} />
              </div>
            </div>
          )}

          {spouses.length > 0 && (
            <div className="rel-group">
              <div className="rel-label">{t('detail.spouse')}</div>
              <div className="rel-chips">
                {spouses.map((s, i) => (
                  <RelChip key={s.id} person={s} index={i} onClick={onSelect} />
                ))}
              </div>
            </div>
          )}

          {children.length > 0 && (
            <div className="rel-group">
              <div className="rel-label">
                {t('detail.children')} ({children.length})
              </div>
              <div className="rel-chips">
                {children.map((c, i) => (
                  <RelChip key={c.id} person={c} index={i} onClick={onSelect} />
                ))}
              </div>
            </div>
          )}

          {siblings.length > 0 && (
            <div className="rel-group">
              <div className="rel-label">
                {t('detail.siblings')} ({siblings.length})
              </div>
              <div className="rel-chips">
                {siblings.map((s, i) => (
                  <RelChip key={s.id} person={s} index={i} onClick={onSelect} />
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="detail-actions">
          <button className="btn btn-ghost" onClick={() => onAddTo('child', person.id)}>
            <IconPlusSm />
            {t('detail.add_child')}
          </button>
          {spouses.length === 0 && (
            <button className="btn btn-ghost" onClick={() => onAddTo('spouse', person.id)}>
              <IconHeart />
              {t('detail.add_spouse')}
            </button>
          )}
        </div>

        {person.parentId && (
          <div style={{ marginTop: 10 }}>
            <button
              className="btn btn-danger"
              style={{ width: '100%', justifyContent: 'center' }}
              onClick={() => onRemove(person.id)}
            >
              <IconTrash />
              {t('detail.remove')}
            </button>
          </div>
        )}
      </motion.div>
    </div>
  )
}
