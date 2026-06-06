import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useFamily } from './hooks/useFamily.js'
import { TreeView } from './components/TreeView.jsx'
import { Intro } from './components/Intro.jsx'
import { AddMemberSheet } from './components/AddMemberSheet.jsx'
import { PersonDetail } from './components/PersonDetail.jsx'
import { SearchBar } from './components/SearchBar.jsx'
import { LanguageSwitcher } from './components/LanguageSwitcher.jsx'
import { IconPlus, IconCheck, IconRefresh, RumahGadangRoof } from './components/icons.jsx'
import { useI18n } from './i18n/i18n.jsx'

export default function App() {
  const { t } = useI18n()
  const { people, byId, stats, addPerson, removePerson, reset } = useFamily()
  const [showIntro, setShowIntro] = useState(true)
  const [selectedId, setSelectedId] = useState(null)
  const [addOpen, setAddOpen] = useState(false)
  const [addAnchor, setAddAnchor] = useState(null) // { type, anchorId }
  const [toast, setToast] = useState('')
  const treeRef = useRef(null)
  const toastTimer = useRef(null)

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

  useEffect(() => () => clearTimeout(toastTimer.current), [])

  const handleSelect = useCallback((id) => {
    setSelectedId(id)
  }, [])

  const handlePickFromSearch = useCallback((id) => {
    treeRef.current?.focusPerson(id)
    setTimeout(() => setSelectedId(id), 400)
  }, [])

  const openAdd = useCallback((type = 'child', anchorId = null) => {
    setAddAnchor(anchorId ? { type, anchorId } : null)
    setAddOpen(true)
  }, [])

  const handleAddSubmit = useCallback(
    (data, relation) => {
      const id = addPerson(data, relation)
      setAddOpen(false)
      setSelectedId(null)
      // Pastikan induknya terbuka agar anggota baru langsung terlihat.
      if (relation?.anchorId) {
        setCollapsed((prev) => {
          const next = new Set(prev)
          next.delete(relation.anchorId)
          return next
        })
      }
      flashToast(t('toast.added', { name: data.name || '—' }))
      // Beri waktu layout diperbarui, lalu fokuskan.
      setTimeout(() => treeRef.current?.focusPerson(id), 250)
    },
    [addPerson, flashToast, t],
  )

  const handleRemove = useCallback(
    (id) => {
      const p = byId.get(id)
      if (!p) return
      const ok = window.confirm(t('confirm.remove', { name: p.name }))
      if (!ok) return
      removePerson(id)
      setSelectedId(null)
      flashToast(t('toast.removed', { name: p.name }))
    },
    [byId, removePerson, flashToast, t],
  )

  return (
    <div className="app-shell">
      <AnimatePresence>
        {showIntro && (
          <Intro stats={stats} onEnter={() => setShowIntro(false)} />
        )}
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
          <LanguageSwitcher />
          <button className="btn btn-primary" onClick={() => openAdd()}>
            <IconPlus />
            <span className="btn-label">{t('action.register')}</span>
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
          selectedId={selectedId}
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
            onRemove={handleRemove}
          />
        )}
      </AnimatePresence>

      {/* Tambah anggota */}
      <AnimatePresence>
        {addOpen && (
          <AddMemberSheet
            people={people}
            anchorId={addAnchor?.anchorId}
            anchorType={addAnchor?.type}
            onClose={() => setAddOpen(false)}
            onSubmit={handleAddSubmit}
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
