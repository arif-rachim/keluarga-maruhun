import { memo } from 'react'
import { motion } from 'framer-motion'
import { NODE_W } from '../lib/layout.js'
import { initials, genderClass } from '../lib/format.js'
import { useI18n } from '../i18n/i18n.jsx'

// Kartu anggota minimalis: avatar + nama (tanpa kotak/border), plus
// tombol collapse/expand bila punya keturunan.
function PersonCardBase({
  person,
  x,
  y,
  index = 0,
  isRoot,
  isSelected,
  isHighlighted,
  hasChildren,
  collapsed,
  childCount,
  onSelect,
  onToggle,
}) {
  const { t } = useI18n()
  return (
    <motion.div
      className="node"
      style={{ left: x, top: y, width: NODE_W }}
      initial={{ opacity: 0, scale: 0.85, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{
        delay: Math.min(index * 0.04, 0.5),
        duration: 0.4,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      <motion.button
        data-no-pan
        className={`node-tap${isSelected ? ' is-selected' : ''}${isHighlighted ? ' is-highlight' : ''}${isRoot ? ' is-root' : ''}`}
        whileHover={{ y: -2 }}
        whileTap={{ scale: 0.96 }}
        onClick={(e) => {
          e.stopPropagation()
          onSelect(person.id)
        }}
      >
        {isRoot && <span className="node-elder">{t('card.elder')}</span>}
        <span className={`avatar ${genderClass(person.gender)}`}>
          {person.photo ? (
            <img src={person.photo} alt={person.name} draggable={false} />
          ) : (
            <span className="initials">{initials(person.name)}</span>
          )}
        </span>
        <span className="node-name">{person.name}</span>
      </motion.button>

      {hasChildren && (
        <button
          data-no-pan
          className={`node-toggle${collapsed ? ' collapsed' : ''}`}
          onClick={(e) => {
            e.stopPropagation()
            onToggle(person.id)
          }}
          aria-label={collapsed ? 'Buka' : 'Tutup'}
        >
          {collapsed ? (
            <span className="toggle-count">{childCount}</span>
          ) : (
            <svg viewBox="0 0 16 16" width="13" height="13">
              <path
                d="M4 8h8"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          )}
        </button>
      )}
    </motion.div>
  )
}

export const PersonCard = memo(PersonCardBase)
