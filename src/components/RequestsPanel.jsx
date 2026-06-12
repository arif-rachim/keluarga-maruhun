import { useState } from 'react'
import { motion } from 'framer-motion'
import { IconClose, IconCheck } from './icons.jsx'
import { useI18n } from '../i18n/i18n.jsx'

const OP_LABEL = { insert: 'req.op_add', update: 'req.op_edit', remove: 'req.op_remove' }

// Daftar usulan pending. Menyetujui/menolak butuh PIN (dicek di server).
export function RequestsPanel({ pending, onClose, onResolve }) {
  const { t } = useI18n()
  const [target, setTarget] = useState(null) // { code, action }
  const [pin, setPin] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  const start = (code, action) => {
    setTarget({ code, action })
    setPin('')
    setErr('')
  }
  const cancelPin = () => {
    setTarget(null)
    setPin('')
    setErr('')
  }
  const confirm = async () => {
    if (!/^\d{6}$/.test(pin)) {
      setErr('format')
      return
    }
    setBusy(true)
    setErr('')
    try {
      await onResolve(target.code, target.action, pin)
      cancelPin()
    } catch (e) {
      setErr(e.code === 'bad_pin' ? 'pin' : 'fail')
    } finally {
      setBusy(false)
    }
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
            <div className="eyebrow">{t('req.panel_eyebrow')}</div>
            <h2>
              {t('req.panel_title')} ({pending.length})
            </h2>
          </div>
          <button className="close-btn" onClick={onClose} aria-label="Tutup">
            <IconClose />
          </button>
        </div>

        {pending.length === 0 && <p className="auth-note">{t('req.empty')}</p>}

        <div className="req-list">
          {pending.map((r) => (
            <div className="req-card" key={r.id}>
              <div className="req-top">
                <span className={`req-badge req-${r.op}`}>{t(OP_LABEL[r.op] || 'req.op_edit')}</span>
                <span className="req-target">{r.targetName || '—'}</span>
              </div>
              {r.summary && <div className="req-summary">{r.summary}</div>}
              {r.note && <div className="req-note">“{r.note}”</div>}
              <div className="req-meta">{t('req.by', { name: r.requester || '—' })}</div>

              {target && target.code === r.id ? (
                <div className="req-pin">
                  <input
                    className="input"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder={t('req.pin_ph')}
                    value={pin}
                    autoFocus
                    onChange={(e) => {
                      setPin(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))
                      if (err) setErr('')
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') confirm()
                    }}
                  />
                  {err && (
                    <div className="auth-error">
                      {t(err === 'pin' ? 'req.err_pin' : err === 'format' ? 'req.err_pin_format' : 'req.err_fail')}
                    </div>
                  )}
                  <div className="detail-actions" style={{ marginTop: 6 }}>
                    <button className="btn btn-ghost" onClick={cancelPin} disabled={busy}>
                      {t('add.cancel')}
                    </button>
                    <button
                      className={`btn ${target.action === 'approve' ? 'btn-primary' : 'btn-danger'}`}
                      onClick={confirm}
                      disabled={busy || pin.length < 6}
                    >
                      {busy
                        ? t('req.processing')
                        : target.action === 'approve'
                          ? t('req.confirm_approve')
                          : t('req.confirm_reject')}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="detail-actions" style={{ marginTop: 8 }}>
                  <button className="btn btn-primary" onClick={() => start(r.id, 'approve')}>
                    <IconCheck />
                    {t('req.approve')}
                  </button>
                  <button className="btn btn-danger" onClick={() => start(r.id, 'reject')}>
                    {t('req.reject')}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}
