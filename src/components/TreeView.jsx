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

// Garis penghubung orang tua -> anak (kurva halus), mengikuti arah pohon.
function edgePath(e, horizontal) {
  const { from, to } = e
  if (horizontal) {
    const midX = (from.x + to.x) / 2
    return `M ${from.x} ${from.y} C ${midX} ${from.y}, ${midX} ${to.y}, ${to.x} ${to.y}`
  }
  const midY = (from.y + to.y) / 2
  return `M ${from.x} ${from.y} C ${from.x} ${midY}, ${to.x} ${midY}, ${to.x} ${to.y}`
}

export const TreeView = forwardRef(function TreeView(
  { people, collapsed, orientation, selectedId, highlightId, onSelect, onToggle, onExpandAll, onCollapseAll },
  ref,
) {
  const { t } = useI18n()
  const stageRef = useRef(null)
  const { transform, dragging, fitToBounds, focusOn, centerOn, zoomBy } =
    usePanZoom(stageRef)

  const layout = useMemo(
    () => buildLayout(people, collapsed, orientation),
    [people, collapsed, orientation],
  )
  const horizontal = layout.horizontal
  const didInit = useRef(false)
  const indexById = useMemo(() => {
    const m = new Map()
    layout.nodes.forEach((n, i) => m.set(n.id, i))
    return m
  }, [layout])

  // Tampilan awal & saat orientasi berubah: berpusat pada sang tetua (akar).
  useEffect(() => {
    didInit.current = false // re-center bila orientasi berganti
  }, [orientation])
  useEffect(() => {
    if (didInit.current) return
    if (layout.nodes.length === 0) return
    const id = requestAnimationFrame(() => {
      const root =
        layout.nodes.find((n) => n.depth === 0 && !n.person.parentId) ||
        layout.nodes[0]
      const el = stageRef.current
      const fitW = ((el?.clientWidth || 360) - 120) / layout.bounds.width
      const fitH = ((el?.clientHeight || 640) - 160) / layout.bounds.height
      const fitScale = Math.min(fitW, fitH)
      if (fitScale >= 0.55) {
        fitToBounds(layout.bounds, { animate: false, pad: 60, top: 80 })
      } else {
        centerOn(
          { x: root.x + NODE_W / 2, y: root.y + NODE_H / 2 },
          0.72,
          horizontal ? 0.5 : 0.24,
          false,
        )
      }
      didInit.current = true
    })
    return () => cancelAnimationFrame(id)
  }, [layout, fitToBounds, centerOn, horizontal])

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
        { x: node.x + NODE_W / 2, y: node.y + NODE_H / 2 },
        s,
        horizontal ? 0.5 : 0.26,
        true,
      )
    },
  }))

  const anyCollapsed = collapsed && collapsed.size > 0

  return (
    <div ref={stageRef} className={`stage${dragging ? ' dragging' : ''}`}>
      <div
        className={`stage-canvas${horizontal ? ' is-horizontal' : ''}`}
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
              d={edgePath(e, horizontal)}
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 0.7, delay: Math.min(i * 0.03, 0.4), ease: 'easeInOut' }}
            />
          ))}
        </svg>

        {/* Tautan hati di antara dua bubble pasangan (horizontal/vertikal) */}
        {layout.nodes.flatMap((n) =>
          n.spouses.map((sp) => {
            const AVR = 26 // radius avatar
            const AVC = 30 // jarak pusat avatar dari atas kartu
            const ax = n.x + NODE_W / 2
            const ay = n.y + AVC
            const bx = sp.x + NODE_W / 2
            const by = sp.y + AVC
            const vertical = Math.abs(by - ay) > Math.abs(bx - ax)
            const style = vertical
              ? {
                  left: ax - 1,
                  top: Math.min(ay, by) + AVR,
                  width: 2,
                  height: Math.max(10, Math.abs(by - ay) - 2 * AVR),
                }
              : {
                  left: Math.min(ax, bx) + AVR,
                  top: ay - 1,
                  height: 2,
                  width: Math.max(10, Math.abs(bx - ax) - 2 * AVR),
                }
            return (
              <motion.div
                key={`sp-${n.id}-${sp.id}`}
                className={`spouse-link${vertical ? ' vertical' : ''}`}
                style={style}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
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
            isHighlighted={highlightId === n.person.id}
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
              y={sp.y}
              index={indexById.get(n.id) || 0}
              isRoot={false}
              isSelected={selectedId === sp.person.id}
              isHighlighted={highlightId === sp.person.id}
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
