import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { IconClose } from './icons.jsx'
import { useI18n } from '../i18n/i18n.jsx'
import { useSheetMotion } from '../hooks/useSheetMotion.js'

// Lembar usulan pindah orang tua (re-parent): pilih orang tua baru (opsional ibu/
// pasangannya), lalu kirim usulan. Anak-anak orang ini ikut pindah otomatis
// karena mereka menunjuk ke orang ini sebagai induk.
export function MoveParentSheet({ person, people, byId, defaultRequester, onClose, onSubmit }) {
  const { t } = useI18n()
  const sheetMotion = useSheetMotion()

  // Kandidat orang tua: semua kecuali diri sendiri & keturunannya (cegah siklus).
  const candidates = useMemo(() => {
    const childrenOf = new Map()
    for (const p of people) {
      if (p.parentId) {
        if (!childrenOf.has(p.parentId)) childrenOf.set(p.parentId, [])
        childrenOf.get(p.parentId).push(p.id)
      }
    }
    const blocked = new Set([person.id])
    const stack = [person.id]
    while (stack.length) {
      const id = stack.pop()
      for (const c of childrenOf.get(id) || []) {
        if (!blocked.has(c)) {
          blocked.add(c)
          stack.push(c)
        }
      }
    }
    return people
      .filter((p) => !blocked.has(p.id))
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [people, person])

  const [parentId, setParentId] = useState(person.parentId || '')
  const [motherId, setMotherId] = useState(person.parent2Id || '')
  const [requester, setRequester] = useState(defaultRequester || '')
  const [note, setNote] = useState('')
  const [error, setError] = useState('')

  // Pasangan dari orang tua baru (untuk memilih ibu / parent2).
  const newParent = parentId ? byId.get(parentId) : null
  const parentSpouses = useMemo(() => {
    if (!newParent) return []
    const set = new Set([
      ...(Array.isArray(newParent.spouseIds) ? newParent.spouseIds : []),
      ...(newParent.spouseId ? [newParent.spouseId] : []),
    ])
    for (const p of people) {
      if (p.spouseId === newParent.id) set.add(p.id)
      if (Array.isArray(p.spouseIds) && p.spouseIds.includes(newParent.id)) set.add(p.id)
    }
    return [...set].map((id) => byId.get(id)).filter(Boolean)
  }, [newParent, people, byId])

  const onParentChange = (id) => {
    setParentId(id)
    setMotherId('') // reset pilihan ibu saat orang tua berganti
    if (error) setError('')
  }

  const submit = () => {
    if (!parentId) {
      setError(t('move.err_parent'))
      return
    }
    if (!requester.trim()) {
      setError(t('req.err_requester'))
      return
    }
    onSubmit({
      newParentId: parentId,
      newMotherId: motherId || null,
      requester: requester.trim(),
      note: note.trim(),
    })
  }

  return (
    <div className="scrim" onClick={onClose}>
      <motion.div className="sheet" onClick={(e) => e.stopPropagation()} {...sheetMotion}>
        <div className="sheet-grip" />
        <div className="sheet-head">
          <div>
            <div className="eyebrow">{t('move.eyebrow')}</div>
            <h2>{t('move.title')}</h2>
          </div>
          <button className="close-btn" onClick={onClose} aria-label="Tutup">
            <IconClose />
          </button>
        </div>

        <p className="auth-note">{t('move.hint', { name: person.name })}</p>

        <div className="field">
          <label>{t('move.new_parent')}</label>
          <select className="select" value={parentId} onChange={(e) => onParentChange(e.target.value)}>
            <option value="">{t('move.choose')}</option>
            {candidates.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
                {p.birthYear ? ` (${p.birthYear})` : ''}
              </option>
            ))}
          </select>
        </div>

        {parentSpouses.length > 0 && (
          <div className="field">
            <label>{t('move.mother')}</label>
            <select className="select" value={motherId} onChange={(e) => setMotherId(e.target.value)}>
              <option value="">{t('move.mother_none')}</option>
              {parentSpouses.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="field">
          <label>{t('req.your_name')}</label>
          <input
            className="input"
            placeholder={t('req.your_name_ph')}
            value={requester}
            onChange={(e) => {
              setRequester(e.target.value)
              if (error) setError('')
            }}
          />
        </div>
        <div className="field">
          <label>{t('req.note')}</label>
          <input
            className="input"
            placeholder={t('req.note_ph')}
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>

        {error && <div className="auth-error">{error}</div>}

        <div className="detail-actions" style={{ marginTop: 6 }}>
          <button className="btn btn-ghost" onClick={onClose}>
            {t('add.cancel')}
          </button>
          <button className="btn btn-primary" onClick={submit}>
            {t('req.submit')}
          </button>
        </div>
      </motion.div>
    </div>
  )
}
