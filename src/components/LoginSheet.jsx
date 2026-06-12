import { useState } from 'react'
import { motion } from 'framer-motion'
import { IconClose, IconPhone } from './icons.jsx'
import { useI18n } from '../i18n/i18n.jsx'
import { useAccess } from '../access/useAccess.jsx'

// Lembar "masuk" ringan: nama + nomor telepon. Nomor dicek ke whitelist di
// server; bila cocok, pengguna boleh menyunting silsilah.
export function LoginSheet({ onClose }) {
  const { t } = useI18n()
  const { signIn, pending, error, clearError } = useAccess()
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')

  const submit = async () => {
    if (!phone.trim()) return
    const r = await signIn(name, phone)
    if (r.ok) onClose()
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
            <div className="eyebrow">{t('auth.eyebrow')}</div>
            <h2>{t('auth.title')}</h2>
          </div>
          <button className="close-btn" onClick={onClose} aria-label="Tutup">
            <IconClose />
          </button>
        </div>

        <p className="auth-note">{t('auth.note')}</p>

        <div className="field">
          <label>{t('auth.name')}</label>
          <input
            className="input"
            placeholder={t('auth.name_ph')}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="field">
          <label>{t('auth.phone')}</label>
          <input
            className="input"
            type="tel"
            inputMode="tel"
            placeholder={t('auth.phone_ph')}
            value={phone}
            onChange={(e) => {
              setPhone(e.target.value)
              if (error) clearError()
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') submit()
            }}
          />
        </div>

        {error && (
          <div className="auth-error">
            {t(error === 'not_whitelisted' ? 'auth.err_denied' : 'auth.err_network')}
          </div>
        )}

        <div className="detail-actions" style={{ marginTop: 6 }}>
          <button className="btn btn-ghost" onClick={onClose}>
            {t('add.cancel')}
          </button>
          <button
            className="btn btn-primary"
            onClick={submit}
            disabled={pending || !phone.trim()}
          >
            <IconPhone />
            {pending ? t('auth.checking') : t('auth.submit')}
          </button>
        </div>
      </motion.div>
    </div>
  )
}
