import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
} from 'react'
import { motion } from 'framer-motion'
import { buildLayout, NODE_W, NODE_H } from '../lib/layout.js'
import { usePanZoom } from '../hooks/usePanZoom.js'
import { PersonCard } from './PersonCard.jsx'
import { useI18n } from '../i18n/i18n.jsx'
import {
  IconPlusSm,
  IconMinus,
  IconTarget,
  IconUnfold,
  IconFold,
} from './icons.jsx'

// Bangun garis penghubung orang tua -> anak sebagai kurva halus.
function edgePath(e) {
  const { from, to } = e
  const midY = (from.y + to.y) / 2
  return `M ${from.x} ${from.y} C ${from.x} ${midY}, ${to.x} ${midY}, ${to.x} ${to.y}`
}

export const TreeView = forwardRef(function TreeView(
  { people, collapsed, selectedId, onSelect, onToggle, onExpandAll, onCollapseAll },
  ref,
) {
  const { t } = useI18n()
  const stageRef = useRef(null)
  const { transform, dragging, fitToBounds, focusOn, centerOn, zoomBy } =
    usePanZoom(stageRef)

  const layout = useMemo(() => buildLayout(people, collapsed), [people, collapsed])
  const didInit = useRef(false)
  const indexById = useMemo(() => {
    const m = new Map()
    layout.nodes.forEach((n, i) => m.set(n.id, i))
    return m
  }, [layout])

  // Tampilan awal: berpusat pada sang tetua (akar) di bagian atas, skala terbaca.
  useEffect(() => {
    if (didInit.current) return
    if (layout.nodes.length === 0) return
    const id = requestAnimationFrame(() => {
      const root =
        layout.nodes.find((n) => n.depth === 0 && !n.person.parentId) ||
        layout.nodes[0]
      const fitScale = Math.min(
        (stageRef.current?.clientWidth - 120) / layout.bounds.width || 1,
        1.1,
      )
      if (fitScale >= 0.55) {
        fitToBounds(layout.bounds, { animate: false, pad: 60, top: 80 })
      } else {
        centerOn(
          { x: root.connectX, y: root.y + NODE_H / 2 },
          0.72,
          0.24,
          false,
        )
      }
      didInit.current = true
    })
    return () => cancelAnimationFrame(id)
  }, [layout, fitToBounds, centerOn])

  useImperativeHandle(ref, () => ({
    focusPerson(id) {
      const node = layout.nodeById.get(id)
      if (node) {
        focusOn({ x: node.x + NODE_W / 2, y: node.y + NODE_H / 2 }, 1)
        return
      }
      for (const n of layout.nodes) {
        const sp = n.spouses.find((s) => s.id === id)
        if (sp) {
          focusOn({ x: sp.x + NODE_W / 2, y: n.y + NODE_H / 2 }, 1)
          return
        }
      }
    },
    fit() {
      fitToBounds(layout.bounds, { animate: true, pad: 60, top: 80 })
    },
    // Saat sebuah node dibuka, geser agar node itu ke atas & anak-anaknya tampak.
    revealPerson(id) {
      const node = layout.nodeById.get(id)
      if (!node) return
      const s = Math.min(Math.max(transform.scale, 0.42), 0.72)
      centerOn(
        { x: node.connectX, y: node.y + NODE_H / 2 },
        s,
        0.26,
        true,
      )
    },
  }))

  const anyCollapsed = collapsed && collapsed.size > 0

  return (
    <div ref={stageRef} className={`stage${dragging ? ' dragging' : ''}`}>
      <div
        className="stage-canvas"
        style={{
          transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
        }}
      >
        {/* Garis keturunan — tergambar perlahan */}
        <svg
          className="edges-svg"
          width={layout.bounds.width + layout.bounds.minX}
          height={layout.bounds.height}
        >
          {layout.edges.map((e, i) => (
            <motion.path
              key={e.id}
              className="edge-path"
              d={edgePath(e)}
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 0.7, delay: Math.min(i * 0.03, 0.4), ease: 'easeInOut' }}
            />
          ))}
        </svg>

        {/* Tautan hati di antara dua bubble pasangan */}
        {layout.nodes.flatMap((n) =>
          n.spouses.map((sp) => {
            const c1 = n.x + NODE_W / 2 // pusat avatar orang utama
            const c2 = sp.x + NODE_W / 2 // pusat avatar pasangan
            const lo = Math.min(c1, c2)
            const hi = Math.max(c1, c2)
            const AVR = 26 // radius avatar
            return (
              <motion.div
                key={`sp-${n.id}-${sp.id}`}
                className="spouse-link"
                style={{ left: lo + AVR, top: n.y + 28, width: Math.max(10, hi - lo - 2 * AVR) }}
                initial={{ scaleX: 0, opacity: 0 }}
                animate={{ scaleX: 1, opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.2 }}
              />
            )
          }),
        )}

        {/* Kartu orang utama */}
        {layout.nodes.map((n) => (
          <PersonCard
            key={n.id}
            person={n.person}
            x={n.x}
            y={n.y}
            index={indexById.get(n.id) || 0}
            isRoot={n.depth === 0 && !n.person.parentId}
            isSelected={selectedId === n.person.id}
            hasChildren={n.hasChildren}
            collapsed={n.collapsed}
            childCount={n.childCount}
            onSelect={onSelect}
            onToggle={onToggle}
          />
        ))}

        {/* Kartu pasangan (tidak punya tombol collapse sendiri) */}
        {layout.nodes.flatMap((n) =>
          n.spouses.map((sp) => (
            <PersonCard
              key={`spouse-card-${n.id}-${sp.id}`}
              person={sp.person}
              x={sp.x}
              y={n.y}
              index={indexById.get(n.id) || 0}
              isRoot={false}
              isSelected={selectedId === sp.person.id}
              hasChildren={false}
              collapsed={false}
              childCount={0}
              onSelect={onSelect}
              onToggle={onToggle}
            />
          )),
        )}
      </div>

      {/* Kontrol */}
      <div className="zoom-dock" data-no-pan>
        <button
          className="zoom-btn"
          onClick={anyCollapsed ? onExpandAll : onCollapseAll}
          aria-label={anyCollapsed ? t('tree.expand_all') : t('tree.collapse_all')}
          title={anyCollapsed ? t('tree.expand_all') : t('tree.collapse_all')}
        >
          {anyCollapsed ? <IconUnfold /> : <IconFold />}
        </button>
        <button className="zoom-btn" onClick={() => zoomBy(1.25)} aria-label="Perbesar">
          <IconPlusSm />
        </button>
        <button className="zoom-btn" onClick={() => zoomBy(0.8)} aria-label="Perkecil">
          <IconMinus />
        </button>
        <button
          className="zoom-btn"
          onClick={() => fitToBounds(layout.bounds, { animate: true, pad: 60, top: 80 })}
          aria-label="Pas-kan ke layar"
        >
          <IconTarget />
        </button>
      </div>
    </div>
  )
})
