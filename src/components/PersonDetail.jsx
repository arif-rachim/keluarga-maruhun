import { useEffect, useMemo, useRef, useState } from 'react'
import { motion, Reorder } from 'framer-motion'
import { initials, lifespan, placeLabel, genderClass } from '../lib/format.js'
import { useI18n } from '../i18n/i18n.jsx'
import {
  IconClose,
  IconPin,
  IconPlusSm,
  IconTrash,
  IconHeart,
  IconPhone,
  IconEdit,
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

export function PersonDetail({
  person,
  people,
  byId,
  onClose,
  onSelect,
  onAddTo,
  onEdit,
  onRemove,
  onReorderChildren,
  onReorderPropose,
  requestMode = false,
}) {
  const { t } = useI18n()

  // Anak (lewat parentId atau sebagai ibu/parent2Id), terurut: urutan manual
  // dulu, lalu tahun lahir, lalu nama.
  const childList = useMemo(() => {
    if (!person) return []
    return people
      .filter((p) => p.parentId === person.id || p.parent2Id === person.id)
      .sort(
        (a, b) =>
          (a.order ?? 1e9) - (b.order ?? 1e9) ||
          (a.birthYear || 9999) - (b.birthYear || 9999) ||
          a.name.localeCompare(b.name),
      )
  }, [people, person])

  // Urutan lokal untuk drag-and-drop; sinkron ulang bila daftar anak berubah
  // (mis. ada penambahan/penghapusan), tapi tetap pertahankan hasil seret.
  const [orderIds, setOrderIds] = useState(() => childList.map((c) => c.id))
  useEffect(() => {
    const ids = childList.map((c) => c.id)
    setOrderIds((prev) => {
      const sameSet =
        prev.length === ids.length && prev.every((id) => ids.includes(id))
      return sameSet ? prev : ids
    })
  }, [childList])

  const draggedRef = useRef(false)
  const handleReorder = (ids) => {
    setOrderIds(ids)
    onReorderChildren?.(ids)
  }

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

          {orderIds.length > 0 && (
            <div className="rel-group">
              <div className="rel-label">
                {t('detail.children')} ({orderIds.length})
                {!requestMode && orderIds.length > 1 && (
                  <span className="rel-hint">{t('detail.reorder_hint')}</span>
                )}
              </div>
              {requestMode ? (
                <div className="rel-chips">
                  {orderIds.map((cid, i) => {
                    const c = byId.get(cid)
                    if (!c) return null
                    return <RelChip key={cid} person={c} index={i} onClick={onSelect} />
                  })}
                </div>
              ) : (
              <Reorder.Group
                as="div"
                axis="y"
                values={orderIds}
                onReorder={handleReorder}
                className="child-reorder"
              >
                {orderIds.map((cid) => {
                  const c = byId.get(cid)
                  if (!c) return null
                  return (
                    <Reorder.Item
                      key={cid}
                      value={cid}
                      as="div"
                      className="child-row"
                      data-no-pan
                      whileDrag={{ scale: 1.03, cursor: 'grabbing' }}
                      onPointerDown={() => {
                        draggedRef.current = false
                      }}
                      onDragStart={() => {
                        draggedRef.current = true
                      }}
                      onClick={() => {
                        if (!draggedRef.current) onSelect(cid)
                      }}
                    >
                      <span className="child-grip" aria-hidden="true">
                        <svg viewBox="0 0 16 16" width="14" height="14">
                          <circle cx="5" cy="3.5" r="1.3" fill="currentColor" />
                          <circle cx="11" cy="3.5" r="1.3" fill="currentColor" />
                          <circle cx="5" cy="8" r="1.3" fill="currentColor" />
                          <circle cx="11" cy="8" r="1.3" fill="currentColor" />
                          <circle cx="5" cy="12.5" r="1.3" fill="currentColor" />
                          <circle cx="11" cy="12.5" r="1.3" fill="currentColor" />
                        </svg>
                      </span>
                      <span className="dot">{initials(c.name)}</span>
                      <span className="child-name">{c.name}</span>
                    </Reorder.Item>
                  )
                })}
              </Reorder.Group>
              )}
              {requestMode && orderIds.length > 1 && (
                <button
                  className="btn btn-ghost reorder-btn"
                  onClick={() => onReorderPropose?.(person)}
                >
                  {t('detail.req_reorder')}
                </button>
              )}
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
            {t(requestMode ? 'detail.req_add_child' : 'detail.add_child')}
          </button>
          {spouses.length === 0 && (
            <button className="btn btn-ghost" onClick={() => onAddTo('spouse', person.id)}>
              <IconHeart />
              {t(requestMode ? 'detail.req_add_spouse' : 'detail.add_spouse')}
            </button>
          )}
        </div>

        <div className="detail-actions" style={{ marginTop: 10 }}>
          <button className="btn btn-ghost" onClick={() => onEdit(person)}>
            <IconEdit />
            {t(requestMode ? 'detail.req_edit' : 'detail.edit')}
          </button>
          {person.parentId && (
            <button className="btn btn-danger" onClick={() => onRemove(person.id)}>
              <IconTrash />
              {t(requestMode ? 'detail.req_remove' : 'detail.remove')}
            </button>
          )}
        </div>
      </motion.div>
    </div>
  )
}
