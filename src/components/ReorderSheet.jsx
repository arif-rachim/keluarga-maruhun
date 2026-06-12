import { useState } from 'react'
import { motion, Reorder } from 'framer-motion'
import { IconClose } from './icons.jsx'
import { initials } from '../lib/format.js'
import { useI18n } from '../i18n/i18n.jsx'

const Grip = () => (
  <svg viewBox="0 0 16 16" width="14" height="14">
    <circle cx="5" cy="3.5" r="1.3" fill="currentColor" />
    <circle cx="11" cy="3.5" r="1.3" fill="currentColor" />
    <circle cx="5" cy="8" r="1.3" fill="currentColor" />
    <circle cx="11" cy="8" r="1.3" fill="currentColor" />
    <circle cx="5" cy="12.5" r="1.3" fill="currentColor" />
    <circle cx="11" cy="12.5" r="1.3" fill="currentColor" />
  </svg>
)

// Lembar usulan ubah urutan anak: seret daftar, isi nama pengaju, kirim usulan.
export function ReorderSheet({ person, items, defaultRequester, onClose, onSubmit }) {
  const { t } = useI18n()
  const [orderIds, setOrderIds] = useState(() => items.map((c) => c.id))
  const [requester, setRequester] = useState(defaultRequester || '')
  const [note, setNote] = useState('')
  const [error, setError] = useState('')
  const byId = new Map(items.map((c) => [c.id, c]))

  const submit = () => {
    if (!requester.trim()) {
      setError(t('req.err_requester'))
      return
    }
    onSubmit({ orderedCodes: orderIds, requester: requester.trim(), note: note.trim() })
  }

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
        <div className="sheet-head">
          <div>
            <div className="eyebrow">{t('req.reorder_eyebrow')}</div>
            <h2>{t('req.reorder_title')}</h2>
          </div>
          <button className="close-btn" onClick={onClose} aria-label="Tutup">
            <IconClose />
          </button>
        </div>

        <p className="auth-note">{t('req.reorder_hint2', { name: person.name })}</p>

        <Reorder.Group
          as="div"
          axis="y"
          values={orderIds}
          onReorder={setOrderIds}
          className="child-reorder"
        >
          {orderIds.map((id) => {
            const c = byId.get(id)
            if (!c) return null
            return (
              <Reorder.Item
                key={id}
                value={id}
                as="div"
                className="child-row"
                data-no-pan
                whileDrag={{ scale: 1.03, cursor: 'grabbing' }}
              >
                <span className="child-grip" aria-hidden="true">
                  <Grip />
                </span>
                <span className="dot">{initials(c.name)}</span>
                <span className="child-name">{c.name}</span>
              </Reorder.Item>
            )
          })}
        </Reorder.Group>

        <div className="field" style={{ marginTop: 14 }}>
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
