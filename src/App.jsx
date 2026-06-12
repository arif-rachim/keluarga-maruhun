import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useFamily } from './hooks/useFamily.js'
import { useRequests } from './hooks/useRequests.js'
import { TreeView } from './components/TreeView.jsx'
import { Intro } from './components/Intro.jsx'
import { AddMemberSheet } from './components/AddMemberSheet.jsx'
import { PersonDetail } from './components/PersonDetail.jsx'
import { RequestsPanel } from './components/RequestsPanel.jsx'
import { SearchBar } from './components/SearchBar.jsx'
import { LanguageSwitcher } from './components/LanguageSwitcher.jsx'
import { IconPlus, IconCheck, IconRefresh, IconInbox, RumahGadangRoof } from './components/icons.jsx'
import { useI18n } from './i18n/i18n.jsx'
import { useTreeOrientation } from './hooks/useOrientation.js'
import { generateId } from './data/store.js'
import {
  isManggalehEnabled,
  submitRequest,
  resolveRequest,
  newRequestId,
  personToRow,
  loadRequester,
  saveRequester,
} from './data/manggaleh.js'

const REL_LABEL = { child: 'req.rel_child', spouse: 'req.rel_spouse' }

// Ringkasan singkat perubahan untuk ditampilkan di kartu usulan.
function editSummary(target, data, t) {
  const fields = [
    ['name', 'req.f_name'],
    ['city', 'req.f_city'],
    ['country', 'req.f_country'],
    ['birthYear', 'req.f_birth'],
    ['deathYear', 'req.f_death'],
    ['phone', 'req.f_phone'],
  ]
  const out = []
  for (const [k, label] of fields) {
    const ov = target[k] ?? ''
    const nv = data[k] ?? ''
    if (String(ov) !== String(nv)) out.push(`${t(label)}: ${ov || '—'} → ${nv || '—'}`)
  }
  if ((target.gender || '') !== (data.gender || '')) out.push(t('req.f_gender'))
  if ((target.bio || '') !== (data.bio || '')) out.push(t('req.f_bio'))
  if ((target.photo || null) !== (data.photo || null)) out.push(t('req.f_photo'))
  return out.length ? out.join('; ') : t('req.no_change')
}

export default function App() {
  const { t } = useI18n()
  const orientation = useTreeOrientation()
  const requestMode = isManggalehEnabled()
  const { people, byId, stats, addPerson, updatePerson, removePerson, reorderChildren, reset } =
    useFamily()
  const { pending } = useRequests()
  const [showIntro, setShowIntro] = useState(true)
  const [requestsOpen, setRequestsOpen] = useState(false)
  const [selectedId, setSelectedId] = useState(null)
  const [highlightId, setHighlightId] = useState(null)
  const [addOpen, setAddOpen] = useState(false)
  const [addAnchor, setAddAnchor] = useState(null) // { type, anchorId }
  const [editTarget, setEditTarget] = useState(null) // person yang sedang diubah
  const [toast, setToast] = useState('')
  const treeRef = useRef(null)
  const toastTimer = useRef(null)
  const highlightTimer = useRef(null)

  // Semua orang yang punya keturunan, kecuali akar (tetua).
  const collapsibleIds = useMemo(() => {
    const hasKids = new Set()
    for (const p of people) if (p.parentId) hasKids.add(p.parentId)
    const roots = new Set(people.filter((p) => !p.parentId).map((p) => p.id))
    return new Set([...hasKids].filter((id) => !roots.has(id)))
  }, [people])

  // Mulai dalam keadaan ter-collapse: hanya tetua + anak langsungnya terlihat.
  const [collapsed, setCollapsed] = useState(() => new Set(collapsibleIds))
  const collapsedRef = useRef(collapsed)
  collapsedRef.current = collapsed

  const toggleCollapse = useCallback((id) => {
    const wasCollapsed = collapsedRef.current.has(id)
    setCollapsed((prev) => {
      const next = new Set(prev)
      if (wasCollapsed) next.delete(id)
      else next.add(id)
      return next
    })
    // Bila baru dibuka, geser tampilan ke node tsb agar anak-anaknya terlihat.
    if (wasCollapsed) setTimeout(() => treeRef.current?.revealPerson(id), 70)
  }, [])

  const handleReset = useCallback(() => {
    if (!window.confirm(t('reset.confirm'))) return
    reset()
    setTimeout(() => window.location.reload(), 60)
  }, [reset, t])

  const expandAll = useCallback(() => {
    setCollapsed(new Set())
    setTimeout(() => treeRef.current?.fit(), 80)
  }, [])
  const collapseAll = useCallback(() => {
    setCollapsed(new Set(collapsibleIds))
    setTimeout(() => treeRef.current?.fit(), 80)
  }, [collapsibleIds])

  const selected = selectedId ? byId.get(selectedId) : null

  const flashToast = useCallback((msg) => {
    setToast(msg)
    clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(''), 2600)
  }, [])

  useEffect(
    () => () => {
      clearTimeout(toastTimer.current)
      clearTimeout(highlightTimer.current)
    },
    [],
  )

  const handleSelect = useCallback((id) => {
    setSelectedId(id)
  }, [])

  // Dari hasil pencarian: buka leluhurnya, tengahkan node-nya, dan sorot
  // sebentar — tanpa membuka panel detail.
  const handlePickFromSearch = useCallback(
    (id) => {
      let cur = byId.get(id)
      if (cur && !cur.parentId && cur.spouseId && byId.has(cur.spouseId)) {
        cur = byId.get(cur.spouseId)
      }
      const toOpen = []
      let p = cur?.parentId ? byId.get(cur.parentId) : null
      while (p) {
        toOpen.push(p.id)
        p = p.parentId ? byId.get(p.parentId) : null
      }
      if (toOpen.length) {
        setCollapsed((prev) => {
          const next = new Set(prev)
          for (const aid of toOpen) next.delete(aid)
          return next
        })
      }
      setSelectedId(null)
      setHighlightId(id)
      clearTimeout(highlightTimer.current)
      highlightTimer.current = setTimeout(() => setHighlightId(null), 2600)
      setTimeout(() => treeRef.current?.focusPerson(id), toOpen.length ? 240 : 60)
    },
    [byId],
  )

  const openAdd = useCallback((type = 'child', anchorId = null) => {
    setEditTarget(null)
    setAddAnchor(anchorId ? { type, anchorId } : null)
    setAddOpen(true)
  }, [])

  const openEdit = useCallback((person) => {
    setSelectedId(null)
    setAddAnchor(null)
    setEditTarget(person)
    setAddOpen(true)
  }, [])

  const closeSheet = useCallback(() => {
    setAddOpen(false)
    setEditTarget(null)
  }, [])

  // Kirim usulan (mode Manggaleh) — tidak mengubah pohon langsung.
  const submitProposal = useCallback(
    async (req) => {
      try {
        await submitRequest(req)
        flashToast(t('req.toast_submitted'))
      } catch (e) {
        console.warn('Gagal mengirim usulan', e)
        flashToast(t('req.toast_failed'))
      }
    },
    [flashToast, t],
  )

  const handleAddSubmit = useCallback(
    (data, relation) => {
      const isEdit = relation?.type === 'edit'

      // ── Mode usulan: bangun request, jangan ubah pohon ──────────────────
      if (requestMode) {
        if (data.requester) saveRequester(data.requester)
        if (isEdit) {
          const target = byId.get(relation.anchorId)
          if (!target) return
          const updated = {
            ...target,
            name: data.name,
            gender: data.gender,
            birthYear: data.birthYear,
            deathYear: data.deathYear,
            city: data.city,
            country: data.country,
            phone: data.phone,
            bio: data.bio,
            photo: data.photo,
          }
          submitProposal({
            id: newRequestId(),
            op: 'update',
            targetCode: target.id,
            targetName: target.name,
            payload: personToRow(updated),
            relation: null,
            requester: data.requester,
            note: data.note,
            summary: editSummary(target, data, t),
          })
        } else {
          const newId = generateId(data.name)
          const newPerson = {
            id: newId,
            name: data.name,
            gender: data.gender,
            birthYear: data.birthYear,
            deathYear: data.deathYear,
            city: data.city,
            country: data.country,
            phone: data.phone,
            bio: data.bio,
            photo: data.photo,
            parentId: relation.type === 'child' ? relation.anchorId : null,
            spouseId: relation.type === 'spouse' ? relation.anchorId : null,
          }
          const anchorName = byId.get(relation.anchorId)?.name || ''
          submitProposal({
            id: newRequestId(),
            op: 'insert',
            targetCode: newId,
            targetName: data.name,
            payload: personToRow(newPerson),
            relation: { type: relation.type, anchorCode: relation.anchorId },
            requester: data.requester,
            note: data.note,
            summary: `${t('req.add_summary', { name: data.name })} · ${t(REL_LABEL[relation.type])} ${anchorName}`,
          })
        }
        setAddOpen(false)
        setEditTarget(null)
        return
      }

      // ── Mode langsung (localStorage) ────────────────────────────────────
      if (isEdit) {
        const id = relation.anchorId
        updatePerson(id, data)
        setAddOpen(false)
        setEditTarget(null)
        flashToast(t('toast.updated', { name: data.name || '—' }))
        setTimeout(() => treeRef.current?.focusPerson(id), 120)
        return
      }
      const id = addPerson(data, relation)
      setAddOpen(false)
      setSelectedId(null)
      setEditTarget(null)
      if (relation?.anchorId) {
        setCollapsed((prev) => {
          const next = new Set(prev)
          next.delete(relation.anchorId)
          return next
        })
      }
      flashToast(t('toast.added', { name: data.name || '—' }))
      setTimeout(() => treeRef.current?.focusPerson(id), 250)
    },
    [requestMode, byId, addPerson, updatePerson, submitProposal, flashToast, t],
  )

  const handleRemove = useCallback(
    (id) => {
      const p = byId.get(id)
      if (!p) return

      if (requestMode) {
        if (!window.confirm(t('req.remove_confirm', { name: p.name }))) return
        let requester = loadRequester()
        if (!requester) {
          requester = (window.prompt(t('req.ask_name')) || '').trim()
          if (!requester) return
          saveRequester(requester)
        }
        submitProposal({
          id: newRequestId(),
          op: 'remove',
          targetCode: p.id,
          targetName: p.name,
          payload: null,
          relation: null,
          requester,
          note: '',
          summary: t('req.remove_summary', { name: p.name }),
        })
        setSelectedId(null)
        return
      }

      if (!window.confirm(t('confirm.remove', { name: p.name }))) return
      removePerson(id)
      setSelectedId(null)
      flashToast(t('toast.removed', { name: p.name }))
    },
    [requestMode, byId, removePerson, submitProposal, flashToast, t],
  )

  const handleResolve = useCallback(
    async (code, action, pin) => {
      const res = await resolveRequest(code, action, pin)
      flashToast(t(action === 'approve' ? 'req.toast_approved' : 'req.toast_rejected'))
      return res
    },
    [flashToast, t],
  )

  return (
    <div className="app-shell">
      <AnimatePresence>
        {showIntro && <Intro stats={stats} onEnter={() => setShowIntro(false)} />}
      </AnimatePresence>

      {/* Top bar */}
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark">
            <RumahGadangRoof style={{ width: 24, height: 24, color: 'var(--gold)' }} />
          </div>
          <div className="brand-text">
            <div className="k">Maruhun</div>
            <div className="s">{t('brand.subtitle')}</div>
          </div>
        </div>
        <div className="topbar-actions">
          <button
            className="btn btn-ghost btn-icon"
            onClick={handleReset}
            aria-label={t('action.reset')}
            title={t('action.reset')}
          >
            <IconRefresh />
          </button>
          {requestMode && (
            <button
              className="btn btn-ghost btn-auth"
              onClick={() => setRequestsOpen(true)}
              title={t('req.panel_title')}
            >
              <IconInbox />
              <span className="btn-label">{t('req.inbox')}</span>
              {pending.length > 0 && <span className="req-count">{pending.length}</span>}
            </button>
          )}
          <LanguageSwitcher />
          <button className="btn btn-primary" onClick={() => openAdd()}>
            <IconPlus />
            <span className="btn-label">
              {t(requestMode ? 'action.propose_add' : 'action.register')}
            </span>
          </button>
        </div>
      </header>

      {/* Panggung pohon */}
      <main
        style={{
          position: 'relative',
          flex: 1,
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <SearchBar people={people} onPick={handlePickFromSearch} />

        <TreeView
          ref={treeRef}
          people={people}
          collapsed={collapsed}
          orientation={orientation}
          selectedId={selectedId}
          highlightId={highlightId}
          onSelect={handleSelect}
          onToggle={toggleCollapse}
          onExpandAll={expandAll}
          onCollapseAll={collapseAll}
        />

        <div className="stage-hint">{t('stage.hint')}</div>
      </main>

      {/* Detail orang */}
      <AnimatePresence>
        {selected && (
          <PersonDetail
            key={selected.id}
            person={selected}
            people={people}
            byId={byId}
            onClose={() => setSelectedId(null)}
            onSelect={handleSelect}
            onAddTo={(type, anchorId) => {
              setSelectedId(null)
              openAdd(type, anchorId)
            }}
            onEdit={openEdit}
            onRemove={handleRemove}
            onReorderChildren={reorderChildren}
            requestMode={requestMode}
          />
        )}
      </AnimatePresence>

      {/* Tambah / usul anggota */}
      <AnimatePresence>
        {addOpen && (
          <AddMemberSheet
            people={people}
            anchorId={addAnchor?.anchorId}
            anchorType={addAnchor?.type}
            editPerson={editTarget}
            onClose={closeSheet}
            onSubmit={handleAddSubmit}
            proposal={requestMode}
            defaultRequester={loadRequester()}
          />
        )}
      </AnimatePresence>

      {/* Panel usulan */}
      <AnimatePresence>
        {requestsOpen && (
          <RequestsPanel
            pending={pending}
            onClose={() => setRequestsOpen(false)}
            onResolve={handleResolve}
          />
        )}
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            className="toast"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
          >
            <IconCheck />
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
