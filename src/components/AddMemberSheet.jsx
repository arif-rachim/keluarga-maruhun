import { useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { IconClose, IconCamera, IconUser, IconEdit } from './icons.jsx'
import { useI18n } from '../i18n/i18n.jsx'

// Ubah file gambar menjadi data-URL terkompres agar muat di localStorage.
async function fileToCompressedDataURL(file, max = 320) {
  const dataUrl = await new Promise((res, rej) => {
    const r = new FileReader()
    r.onload = () => res(r.result)
    r.onerror = rej
    r.readAsDataURL(file)
  })
  const img = await new Promise((res, rej) => {
    const i = new Image()
    i.onload = () => res(i)
    i.onerror = rej
    i.src = dataUrl
  })
  const scale = Math.min(1, max / Math.max(img.width, img.height))
  const w = Math.round(img.width * scale)
  const h = Math.round(img.height * scale)
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  ctx.drawImage(img, 0, 0, w, h)
  return canvas.toDataURL('image/jpeg', 0.82)
}

export function AddMemberSheet({
  people,
  anchorId,
  anchorType,
  editPerson,
  onClose,
  onSubmit,
  proposal = false,
  defaultRequester = '',
}) {
  const { t } = useI18n()
  const isEdit = !!editPerson
  const [form, setForm] = useState(() =>
    editPerson
      ? {
          name: editPerson.name || '',
          gender: editPerson.gender ?? 'L',
          birthYear: editPerson.birthYear ?? '',
          deathYear: editPerson.deathYear ?? '',
          city: editPerson.city || '',
          country: editPerson.country || '',
          phone: editPerson.phone || '',
          bio: editPerson.bio || '',
          photo: editPerson.photo || null,
        }
      : {
          name: '',
          gender: 'L',
          birthYear: '',
          deathYear: '',
          city: '',
          country: '',
          phone: '',
          bio: '',
          photo: null,
        },
  )
  const [relType, setRelType] = useState(anchorType || 'child') // 'child' | 'spouse'
  const [anchor, setAnchor] = useState(anchorId || people[0]?.id || '')
  const [requester, setRequester] = useState(defaultRequester)
  const [note, setNote] = useState('')
  const [error, setError] = useState('')
  const fileRef = useRef(null)

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  // Calon pasangan: hanya yang belum punya pasangan.
  const anchorOptions =
    relType === 'spouse' ? people.filter((p) => !p.spouseId || p.id === anchorId) : people

  const handlePhoto = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const url = await fileToCompressedDataURL(file)
      set('photo', url)
    } catch {
      setError(t('add.err_photo'))
    }
  }

  const submit = () => {
    if (!form.name.trim()) {
      setError(t('add.err_name'))
      return
    }
    if (!isEdit && !anchor) {
      setError(t('add.err_anchor'))
      return
    }
    if (proposal && !requester.trim()) {
      setError(t('req.err_requester'))
      return
    }
    const data = {
      ...form,
      birthYear: form.birthYear ? Number(form.birthYear) : null,
      deathYear: form.deathYear ? Number(form.deathYear) : null,
      ...(proposal ? { requester: requester.trim(), note: note.trim() } : {}),
    }
    if (isEdit) {
      onSubmit(data, { type: 'edit', anchorId: editPerson.id })
    } else {
      onSubmit(data, { type: relType, anchorId: anchor })
    }
  }

  const anchorName = people.find((p) => p.id === anchor)?.name || ''
  const submitLabel = proposal
    ? t('req.submit')
    : isEdit
      ? t('add.save')
      : anchorName
        ? `${t('add.submit')} ${t('add.to')} ${anchorName.split(' ')[0]}`
        : t('add.submit')

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
            <div className="eyebrow">
              {proposal
                ? isEdit
                  ? t('req.edit_eyebrow')
                  : t('req.add_eyebrow')
                : isEdit
                  ? t('add.edit_eyebrow')
                  : t('add.eyebrow')}
            </div>
            <h2>
              {proposal
                ? isEdit
                  ? t('req.edit_title')
                  : t('req.add_title')
                : isEdit
                  ? t('add.edit_title')
                  : t('add.title')}
            </h2>
          </div>
          <button className="close-btn" onClick={onClose} aria-label="Tutup">
            <IconClose />
          </button>
        </div>

        {proposal && (
          <>
            <div className="field">
              <label>{t('req.your_name')}</label>
              <input
                className="input"
                placeholder={t('req.your_name_ph')}
                value={requester}
                onChange={(e) => setRequester(e.target.value)}
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
          </>
        )}

        {/* Relasi (hanya saat menambah anggota baru) */}
        {!isEdit && (
          <div className="field">
            <label>{t('add.relation')}</label>
            <div className="segmented" style={{ marginBottom: 10 }}>
              <button
                className={relType === 'child' ? 'active' : ''}
                onClick={() => setRelType('child')}
              >
                {t('add.rel_child')}
              </button>
              <button
                className={relType === 'spouse' ? 'active' : ''}
                onClick={() => setRelType('spouse')}
              >
                {t('add.rel_spouse')}
              </button>
            </div>
            <select
              className="select"
              value={anchor}
              onChange={(e) => setAnchor(e.target.value)}
            >
              {anchorOptions.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                  {p.birthYear ? ` (${p.birthYear})` : ''}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Foto + nama */}
        <div className="field">
          <label>{t('add.photo_name')}</label>
          <div className="photo-pick" style={{ marginBottom: 10 }}>
            <button
              type="button"
              className="photo-preview"
              onClick={() => fileRef.current?.click()}
              data-no-pan
            >
              {form.photo ? <img src={form.photo} alt="" /> : <IconCamera />}
            </button>
            <input
              className="input"
              placeholder={t('add.name_ph')}
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
            />
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            hidden
            onChange={handlePhoto}
          />
        </div>

        {/* Gender */}
        <div className="field">
          <label>{t('add.gender')}</label>
          <div className="segmented">
            <button
              className={form.gender === 'L' ? 'active' : ''}
              onClick={() => set('gender', 'L')}
            >
              {t('add.male')}
            </button>
            <button
              className={form.gender === 'P' ? 'active' : ''}
              onClick={() => set('gender', 'P')}
            >
              {t('add.female')}
            </button>
          </div>
        </div>

        {/* Tahun */}
        <div className="field">
          <label>{t('add.years')}</label>
          <div className="row">
            <input
              className="input"
              type="number"
              inputMode="numeric"
              placeholder={t('add.birth_ph')}
              value={form.birthYear}
              onChange={(e) => set('birthYear', e.target.value)}
            />
            <input
              className="input"
              type="number"
              inputMode="numeric"
              placeholder={t('add.death_ph')}
              value={form.deathYear}
              onChange={(e) => set('deathYear', e.target.value)}
            />
          </div>
        </div>

        {/* Domisili */}
        <div className="field">
          <label>{t('add.domicile')}</label>
          <div className="row">
            <input
              className="input"
              placeholder={t('add.city_ph')}
              value={form.city}
              onChange={(e) => set('city', e.target.value)}
            />
            <input
              className="input"
              placeholder={t('add.country_ph')}
              value={form.country}
              onChange={(e) => set('country', e.target.value)}
            />
          </div>
        </div>

        {/* Nomor WhatsApp */}
        <div className="field">
          <label>{t('add.phone')}</label>
          <input
            className="input"
            type="tel"
            inputMode="tel"
            placeholder={t('add.phone_ph')}
            value={form.phone}
            onChange={(e) => set('phone', e.target.value)}
          />
        </div>

        {/* Bio */}
        <div className="field">
          <label>{t('add.story')}</label>
          <textarea
            className="textarea"
            placeholder={t('add.story_ph')}
            value={form.bio}
            onChange={(e) => set('bio', e.target.value)}
          />
        </div>

        {error && <div className="form-error">{error}</div>}

        <div className="form-actions">
          <button className="btn btn-ghost" onClick={onClose}>
            {t('add.cancel')}
          </button>
          <motion.button
            className="btn btn-primary"
            onClick={submit}
            whileTap={{ scale: 0.97 }}
          >
            {isEdit ? <IconEdit /> : <IconUser />}
            {submitLabel}
          </motion.button>
        </div>
      </motion.div>
    </div>
  )
}
