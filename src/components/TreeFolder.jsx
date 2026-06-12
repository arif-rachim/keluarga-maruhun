import { useEffect, useMemo, useRef } from 'react'
import { initials, lifespan, genderClass } from '../lib/format.js'
import { useI18n } from '../i18n/i18n.jsx'
import { IconUnfold, IconFold } from './icons.jsx'

// Tampilan ringan ala "folder" untuk HP: daftar bertingkat yang bisa dibuka-tutup.
// Tanpa pan/zoom, SVG, atau animasi per-node — jauh lebih ringan dari chart.
// Berbagi state `collapsed` / `onToggle` / `onSelect` dengan App (sama seperti chart).

// Hitung relasi sekali: pasangan menempel, anak per induk, akar.
// (Logika menempelnya pasangan disamakan dengan lib/layout.js agar konsisten.)
function useRelations(people) {
  return useMemo(() => {
    const byId = new Map(people.map((p) => [p.id, p]))
    const indexOf = new Map(people.map((p, i) => [p.id, i]))
    const isParent = new Set()
    for (const p of people) if (p.parentId && byId.has(p.parentId)) isParent.add(p.parentId)
    const anchorScore = (p) =>
      (p.parentId && byId.has(p.parentId) ? 2 : 0) + (isParent.has(p.id) ? 1 : 0)

    const attached = new Set()
    const spousesByOwner = new Map()
    const push = (o, s) => {
      if (!spousesByOwner.has(o)) spousesByOwner.set(o, [])
      spousesByOwner.get(o).push(s)
    }
    for (const p of people) {
      if (!Array.isArray(p.spouseIds)) continue
      for (const sid of p.spouseIds) {
        if (byId.has(sid) && !attached.has(sid) && sid !== p.id) {
          attached.add(sid)
          push(p.id, byId.get(sid))
        }
      }
    }
    for (const p of people) {
      if (!p.spouseId || !byId.has(p.spouseId)) continue
      if (attached.has(p.id) || Array.isArray(p.spouseIds)) continue
      const partner = byId.get(p.spouseId)
      if (Array.isArray(partner.spouseIds)) continue
      const sp = anchorScore(p)
      const sq = anchorScore(partner)
      const pAtt = sp < sq || (sp === sq && indexOf.get(p.id) > indexOf.get(partner.id))
      if (pAtt && !attached.has(p.id)) {
        attached.add(p.id)
        push(partner.id, p)
      }
    }

    const childrenOf = new Map()
    for (const p of people) {
      if (attached.has(p.id)) continue
      if (p.parentId && byId.has(p.parentId)) {
        if (!childrenOf.has(p.parentId)) childrenOf.set(p.parentId, [])
        childrenOf.get(p.parentId).push(p)
      }
    }
    for (const list of childrenOf.values())
      list.sort(
        (a, b) =>
          (a.order ?? 1e9) - (b.order ?? 1e9) ||
          (a.birthYear || 9999) - (b.birthYear || 9999) ||
          a.name.localeCompare(b.name),
      )
    const roots = people.filter((p) => !p.parentId && !attached.has(p.id))
    return { childrenOf, spousesByOwner, roots }
  }, [people])
}

export function TreeFolder({
  people,
  collapsed,
  selectedId,
  highlightId,
  onSelect,
  onToggle,
  onExpandAll,
  onCollapseAll,
}) {
  const { t } = useI18n()
  const { childrenOf, spousesByOwner, roots } = useRelations(people)

  // Susun hanya baris yang TERLIHAT (subtree ter-collapse tidak dirender).
  const rows = useMemo(() => {
    const out = []
    const walk = (p, depth) => {
      const kids = childrenOf.get(p.id) || []
      const isCol = collapsed?.has(p.id)
      out.push({
        person: p,
        depth,
        childCount: kids.length,
        collapsed: isCol,
        spouses: spousesByOwner.get(p.id) || [],
      })
      if (kids.length && !isCol) for (const k of kids) walk(k, depth + 1)
    }
    for (const r of roots) walk(r, 0)
    return out
  }, [roots, childrenOf, spousesByOwner, collapsed])

  // Geser baris tersorot (dari pencarian) ke tengah.
  const highlightRef = useRef(null)
  useEffect(() => {
    if (highlightId && highlightRef.current) {
      highlightRef.current.scrollIntoView({ block: 'center', behavior: 'smooth' })
    }
  }, [highlightId, rows])

  const anyCollapsed = collapsed && collapsed.size > 0

  return (
    <div className="folder">
      <div className="folder-toolbar" data-no-pan>
        <span className="folder-count">
          {people.length} · {t('intro.members')}
        </span>
        <button
          className="btn btn-ghost btn-icon"
          onClick={anyCollapsed ? onExpandAll : onCollapseAll}
          title={anyCollapsed ? t('tree.expand_all') : t('tree.collapse_all')}
          aria-label={anyCollapsed ? t('tree.expand_all') : t('tree.collapse_all')}
        >
          {anyCollapsed ? <IconUnfold /> : <IconFold />}
        </button>
      </div>

      <div className="folder-list">
        {rows.map((r) => {
          const p = r.person
          const isSel = selectedId === p.id
          const isHi = highlightId === p.id
          const years = lifespan(p)
          return (
            <div
              key={p.id}
              ref={isHi ? highlightRef : null}
              className={`folder-row${isSel ? ' is-selected' : ''}${isHi ? ' is-highlight' : ''}`}
              style={{ paddingLeft: 8 + r.depth * 16 }}
            >
              {r.childCount > 0 ? (
                <button
                  className={`folder-chevron${r.collapsed ? '' : ' open'}`}
                  onClick={() => onToggle(p.id)}
                  aria-label={r.collapsed ? t('tree.expand_all') : t('tree.collapse_all')}
                >
                  <svg viewBox="0 0 16 16" width="13" height="13">
                    <path
                      d="M6 4l4 4-4 4"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              ) : (
                <span className="folder-chevron folder-chevron-empty" />
              )}

              <button className="folder-name" onClick={() => onSelect(p.id)}>
                <span className={`folder-dot ${genderClass(p.gender)}`}>
                  {p.photo ? <img src={p.photo} alt="" /> : initials(p.name)}
                </span>
                <span className="folder-text">
                  <span className="folder-title">
                    {p.name}
                    {r.spouses.length > 0 && (
                      <span className="folder-spouse"> ♥ {r.spouses.map((s) => s.name).join(', ')}</span>
                    )}
                  </span>
                  {(years || r.childCount > 0) && (
                    <span className="folder-sub">
                      {years}
                      {years && r.childCount > 0 ? ' · ' : ''}
                      {r.childCount > 0 ? t('folder.kids', { n: r.childCount }) : ''}
                    </span>
                  )}
                </span>
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
