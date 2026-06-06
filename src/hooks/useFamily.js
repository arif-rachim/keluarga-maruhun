import { useCallback, useEffect, useMemo, useState } from 'react'
import { loadPeople, savePeople, resetPeople, generateId } from '../data/store.js'

// Hook pusat: mengelola seluruh data anggota keluarga + aksi mutasinya.
export function useFamily() {
  const [people, setPeople] = useState(() => loadPeople())

  useEffect(() => {
    savePeople(people)
  }, [people])

  const byId = useMemo(() => new Map(people.map((p) => [p.id, p])), [people])

  // Tambah anggota baru. relation: { type: 'child' | 'spouse', anchorId }
  const addPerson = useCallback((data, relation) => {
    const id = generateId(data.name)
    const newPerson = {
      id,
      name: data.name?.trim() || 'Tanpa Nama',
      gender: data.gender || 'L',
      birthYear: data.birthYear || null,
      deathYear: data.deathYear || null,
      city: data.city?.trim() || '',
      country: data.country?.trim() || '',
      bio: data.bio?.trim() || '',
      phone: data.phone?.trim() || '',
      photo: data.photo || null,
      parentId: null,
      spouseId: null,
    }

    setPeople((prev) => {
      let next = [...prev]
      if (relation?.type === 'child' && relation.anchorId) {
        newPerson.parentId = relation.anchorId
      } else if (relation?.type === 'spouse' && relation.anchorId) {
        newPerson.spouseId = relation.anchorId
        // Tautkan dua arah. Bila anchor sudah punya pasangan, pakai spouseIds.
        next = next.map((p) => {
          if (p.id !== relation.anchorId) return p
          const existing = Array.isArray(p.spouseIds)
            ? p.spouseIds
            : p.spouseId
              ? [p.spouseId]
              : []
          if (existing.length >= 1) {
            return { ...p, spouseIds: [...new Set([...existing, id])] }
          }
          return { ...p, spouseId: id }
        })
      }
      return [...next, newPerson]
    })
    return id
  }, [])

  const updatePerson = useCallback((id, patch) => {
    setPeople((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)))
  }, [])

  // Simpan urutan baru sekelompok anak. `orderedIds` = daftar id sesuai
  // urutan yang diinginkan; tiap anak diberi field `order` = posisinya.
  const reorderChildren = useCallback((orderedIds) => {
    const rank = new Map(orderedIds.map((id, i) => [id, i]))
    setPeople((prev) =>
      prev.map((p) => (rank.has(p.id) ? { ...p, order: rank.get(p.id) } : p)),
    )
  }, [])

  const removePerson = useCallback((id) => {
    setPeople((prev) => {
      return prev
        .filter((p) => p.id !== id)
        .map((p) => ({
          ...p,
          parentId: p.parentId === id ? null : p.parentId,
          parent2Id: p.parent2Id === id ? null : p.parent2Id,
          spouseId: p.spouseId === id ? null : p.spouseId,
          spouseIds: Array.isArray(p.spouseIds)
            ? p.spouseIds.filter((s) => s !== id)
            : p.spouseIds,
        }))
    })
  }, [])

  const reset = useCallback(() => {
    setPeople(resetPeople())
  }, [])

  const stats = useMemo(() => {
    const countries = new Set()
    let living = 0
    for (const p of people) {
      if (p.country) countries.add(p.country.trim())
      const deceased = p.deathYear || /almarhum/i.test(p.bio || '')
      if (!deceased) living += 1
    }
    return {
      total: people.length,
      countries: countries.size,
      living,
    }
  }, [people])

  return {
    people,
    byId,
    stats,
    addPerson,
    updatePerson,
    removePerson,
    reorderChildren,
    reset,
  }
}
