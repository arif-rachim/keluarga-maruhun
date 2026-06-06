export function initials(name) {
  const parts = (name || '').trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export function lifespan(p) {
  if (!p) return ''
  const b = p.birthYear || ''
  const d = p.deathYear
  if (b && d) return `${b} – ${d}`
  if (b && !d) return `${b}`
  if (!b && d) return `w. ${d}`
  return ''
}

export function placeLabel(p) {
  if (!p) return ''
  const parts = [p.city, p.country].filter(Boolean)
  return parts.join(', ')
}

export function genderClass(g) {
  if (g === 'L') return 'male'
  if (g === 'P') return 'female'
  return ''
}
