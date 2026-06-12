import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
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

  // Grup pasangan (pada orang berpasangan ganda) bisa dibuka-tutup sendiri.
  // Default TERTUTUP: tampilkan dulu pasangannya, anak baru muncul saat diklik.
  const [openSpouses, setOpenSpouses] = useState(() => new Set())
  const toggleSpouse = useCallback((id) => {
    setOpenSpouses((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }, [])

  // Semua id pasangan dari orang berpasangan ganda (untuk buka/tutup semua).
  const multiSpouseIds = useMemo(() => {
    const s = new Set()
    for (const arr of spousesByOwner.values())
      if (arr.length > 1) for (const sp of arr) s.add(sp.id)
    return s
  }, [spousesByOwner])

  // Susun hanya baris yang TERLIHAT (subtree ter-collapse tidak dirender).
  // Untuk orang berpasangan GANDA, anak dikelompokkan per ibu (parent2Id):
  // tiap pasangan jadi sub-baris yang bisa di-collapse sendiri.
  const rows = useMemo(() => {
    const out = []
    const walk = (p, depth) => {
      const kids = childrenOf.get(p.id) || []
      const spouses = spousesByOwner.get(p.id) || []
      const multi = spouses.length > 1
      const isCol = collapsed?.has(p.id)
      out.push({
        kind: 'person',
        person: p,
        depth,
        childCount: kids.length,
        collapsed: isCol,
        hasKids: kids.length > 0,
        spouses: multi ? [] : spouses, // pasangan tunggal ditampilkan inline
      })
      if (!kids.length || isCol) return

      if (!multi) {
        for (const k of kids) walk(k, depth + 1)
        return
      }
      // Pasangan ganda: tiap pasangan jadi grup yang bisa dibuka-tutup.
      for (const s of spouses) {
        const grp = kids.filter((k) => k.parent2Id === s.id)
        const sOpen = openSpouses.has(s.id)
        out.push({
          kind: 'spouse',
          person: s,
          depth: depth + 1,
          childCount: grp.length,
          hasKids: grp.length > 0,
          collapsed: !sOpen,
        })
        if (grp.length && sOpen) for (const k of grp) walk(k, depth + 2)
      }
      const leftover = kids.filter((k) => !spouses.some((s) => s.id === k.parent2Id))
      for (const k of leftover) walk(k, depth + 1)
    }
    for (const r of roots) walk(r, 0)
    return out
  }, [roots, childrenOf, spousesByOwner, collapsed, openSpouses])

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
          onClick={
            anyCollapsed
              ? () => {
                  onExpandAll?.()
                  setOpenSpouses(new Set(multiSpouseIds))
                }
              : () => {
                  onCollapseAll?.()
                  setOpenSpouses(new Set())
                }
          }
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

          // Sub-baris pasangan (pada orang berpasangan ganda) — bisa di-collapse.
          // Panah = buka/tutup anak; nama = buka detail pasangannya.
          if (r.kind === 'spouse') {
            return (
              <div
                key={`sp-${p.id}`}
                ref={isHi ? highlightRef : null}
                className={`folder-row is-spouse${isSel ? ' is-selected' : ''}${isHi ? ' is-highlight' : ''}`}
                style={{ paddingLeft: 8 + r.depth * 16 }}
              >
                {r.hasKids ? (
                  <button
                    className={`folder-chevron${r.collapsed ? '' : ' open'}`}
                    onClick={() => toggleSpouse(p.id)}
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
                  <span className="folder-heart" aria-hidden="true">♥</span>
                  <span className={`folder-dot ${genderClass(p.gender)}`}>
                    {p.photo ? <img src={p.photo} alt="" /> : initials(p.name)}
                  </span>
                  <span className="folder-text">
                    <span className="folder-title">{p.name}</span>
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
          }

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
                      <span className="folder-spouse">
                        {' '}
                        ♥{' '}
                        {r.spouses.map((s, i) => (
                          <span
                            key={s.id}
                            className="folder-spouse-link"
                            role="button"
                            tabIndex={0}
                            onClick={(e) => {
                              e.stopPropagation()
                              onSelect(s.id)
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.stopPropagation()
                                onSelect(s.id)
                              }
                            }}
                          >
                            {s.name}
                            {i < r.spouses.length - 1 ? ', ' : ''}
                          </span>
                        ))}
                      </span>
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
