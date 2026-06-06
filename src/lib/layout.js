// Algoritma tata letak pohon keturunan (mendukung pasangan ganda / poligami).
// Tiap "unit" = orang utama + 0..n pasangan menempel. Anak dikelompokkan
// per ibu (parent2Id): anak istri-1 di bawah istri-1, dst.

export const NODE_W = 116
export const NODE_H = 112
export const H_GAP = 16 // jarak antar saudara (lebih rapat)
export const V_GAP = 46 // jarak antar generasi
export const SPOUSE_GAP = 100 // pasangan dirapatkan (lebih kecil dari NODE_W)

const SLOT = NODE_W + H_GAP
const half = NODE_W / 2

export function buildLayout(people, collapsed = new Set()) {
  const byId = new Map(people.map((p) => [p.id, p]))
  const indexOf = new Map(people.map((p, i) => [p.id, i]))

  const isParent = new Set()
  for (const p of people) if (p.parentId && byId.has(p.parentId)) isParent.add(p.parentId)
  const anchorScore = (p) =>
    (p.parentId && byId.has(p.parentId) ? 2 : 0) + (isParent.has(p.id) ? 1 : 0)

  // Tentukan pasangan yang "menempel" pada pemiliknya.
  const attached = new Set()
  const spousesByOwner = new Map() // ownerId -> [personPasangan...]
  const pushSpouse = (ownerId, sp) => {
    if (!spousesByOwner.has(ownerId)) spousesByOwner.set(ownerId, [])
    spousesByOwner.get(ownerId).push(sp)
  }
  // 1) Pasangan eksplisit lewat spouseIds (mis. dua istri)
  for (const p of people) {
    if (!Array.isArray(p.spouseIds)) continue
    for (const sid of p.spouseIds) {
      if (byId.has(sid) && !attached.has(sid) && sid !== p.id) {
        attached.add(sid)
        pushSpouse(p.id, byId.get(sid))
      }
    }
  }
  // 2) Pasangan tunggal lewat spouseId (anchor-score menentukan siapa menempel)
  for (const p of people) {
    if (!p.spouseId || !byId.has(p.spouseId)) continue
    if (attached.has(p.id) || Array.isArray(p.spouseIds)) continue
    const partner = byId.get(p.spouseId)
    if (Array.isArray(partner.spouseIds)) continue // sudah ditangani sisi eksplisit
    const sp = anchorScore(p)
    const sq = anchorScore(partner)
    const pAttached = sp < sq || (sp === sq && indexOf.get(p.id) > indexOf.get(partner.id))
    if (pAttached && !attached.has(p.id)) {
      attached.add(p.id)
      pushSpouse(partner.id, p)
    }
  }

  // Anak per induk (yang bukan pasangan menempel).
  const childrenOf = new Map()
  for (const p of people) {
    if (attached.has(p.id)) continue
    if (p.parentId && byId.has(p.parentId)) {
      if (!childrenOf.has(p.parentId)) childrenOf.set(p.parentId, [])
      childrenOf.get(p.parentId).push(p)
    }
  }
  for (const list of childrenOf.values()) {
    list.sort((a, b) => (a.birthYear || 9999) - (b.birthYear || 9999) || a.name.localeCompare(b.name))
  }

  const roots = people.filter((p) => !p.parentId && !attached.has(p.id))

  // Keturunan dari node yang di-collapse (disembunyikan).
  const hidden = new Set()
  const collectDesc = (id) => {
    for (const c of childrenOf.get(id) || []) {
      hidden.add(c.id)
      collectDesc(c.id)
    }
  }
  for (const cid of collapsed) collectDesc(cid)

  const nodes = []
  const placed = new Set()
  let cursor = 0

  // Tempatkan sekelompok anak, kembalikan pusat-x kelompok + daftar id.
  function placeGroup(gk, depth) {
    if (!gk.length) {
      const center = cursor + half
      cursor += SLOT
      return { center, childIds: [] }
    }
    const cn = gk.map((k) => place(k, depth)).filter(Boolean)
    const center = (cn[0].connectX + cn[cn.length - 1].connectX) / 2
    cursor = Math.max(cursor, center + half + H_GAP)
    return { center, childIds: gk.map((k) => k.id) }
  }

  function place(person, depth) {
    if (placed.has(person.id)) return null
    placed.add(person.id)

    const spouses = spousesByOwner.get(person.id) || []
    const allKids = childrenOf.get(person.id) || []
    const isCollapsed = collapsed.has(person.id) && allKids.length > 0
    const kids = isCollapsed ? [] : allKids

    const node = {
      id: person.id,
      person,
      depth,
      y: depth * (NODE_H + V_GAP),
      hasChildren: allKids.length > 0,
      collapsed: isCollapsed,
      childCount: allKids.length,
      spouses: [],
      bonds: [],
      x: 0,
      connectX: 0,
    }

    if (spouses.length <= 1) {
      const spouse = spouses[0] || null
      const hasSpouse = !!spouse
      let leftX
      if (kids.length === 0) {
        leftX = cursor
        cursor += hasSpouse ? SPOUSE_GAP + NODE_W + H_GAP : SLOT
      } else {
        const cn = kids.map((k) => place(k, depth + 1)).filter(Boolean)
        const mid = (cn[0].connectX + cn[cn.length - 1].connectX) / 2
        leftX = mid - half - (hasSpouse ? SPOUSE_GAP / 2 : 0)
        const rightEdge = leftX + (hasSpouse ? SPOUSE_GAP + NODE_W : NODE_W)
        cursor = Math.max(cursor, rightEdge + H_GAP)
      }
      node.x = leftX
      const coupleCenter = leftX + half + (hasSpouse ? SPOUSE_GAP / 2 : 0)
      node.connectX = coupleCenter
      if (hasSpouse) node.spouses = [{ id: spouse.id, person: spouse, x: leftX + SPOUSE_GAP }]
      node.bonds = [{ centerX: coupleCenter, childIds: kids.map((k) => k.id) }]
    } else {
      // Pasangan ganda: kelompokkan anak per ibu (parent2Id).
      const wifeGroups = spouses.map((s) => kids.filter((k) => k.parent2Id === s.id))
      const leftover = kids.filter((k) => !spouses.some((s) => s.id === k.parent2Id))

      const g0 = placeGroup(wifeGroups[0], depth + 1)
      const gL = leftover.length ? placeGroup(leftover, depth + 1) : null
      const rest = []
      for (let i = 1; i < spouses.length; i++) rest.push(placeGroup(wifeGroups[i], depth + 1))

      const wifeCenters = [g0.center, ...rest.map((r) => r.center)]
      const personCenter = gL
        ? gL.center
        : wifeCenters.reduce((a, b) => a + b, 0) / wifeCenters.length

      node.x = personCenter - half
      node.connectX = personCenter
      node.spouses = spouses.map((s, i) => ({ id: s.id, person: s, x: wifeCenters[i] - half }))
      node.bonds = spouses.map((s, i) => ({
        centerX: wifeCenters[i],
        childIds: (i === 0 ? g0 : rest[i - 1]).childIds,
      }))
      if (gL) node.bonds.push({ centerX: personCenter, childIds: gL.childIds })
      cursor = Math.max(cursor, node.x + NODE_W + H_GAP)
    }

    nodes.push(node)
    return node
  }

  for (const root of roots) {
    place(root, 0)
    cursor += SLOT
  }

  const orphans = people.filter(
    (p) => !placed.has(p.id) && !attached.has(p.id) && !hidden.has(p.id),
  )
  const maxDepth = nodes.reduce((m, n) => Math.max(m, n.depth), 0)
  for (const o of orphans) {
    place(o, maxDepth + 1)
    cursor += SLOT
  }

  // Edges induk -> anak (dari tiap "bond" / ikatan).
  const nodeById = new Map(nodes.map((n) => [n.id, n]))
  const edges = []
  for (const n of nodes) {
    for (const b of n.bonds) {
      for (const cid of b.childIds) {
        const child = nodeById.get(cid)
        if (!child) continue
        edges.push({
          id: `${n.id}-${cid}`,
          from: { x: b.centerX, y: n.y + NODE_H },
          to: { x: child.connectX, y: child.y },
        })
      }
    }
  }

  // Bounds (termasuk kartu pasangan).
  let minX = Infinity
  let maxX = -Infinity
  let maxY = 0
  for (const n of nodes) {
    const xs = [n.x, ...n.spouses.map((s) => s.x)]
    minX = Math.min(minX, ...xs)
    maxX = Math.max(maxX, ...xs.map((x) => x + NODE_W))
    maxY = Math.max(maxY, n.y + NODE_H)
  }
  if (!isFinite(minX)) {
    minX = 0
    maxX = NODE_W
  }
  const bounds = {
    minX: minX - H_GAP,
    minY: -V_GAP / 2,
    width: maxX - minX + H_GAP * 2,
    height: maxY + V_GAP,
  }

  return { nodes, edges, bounds, nodeById }
}
