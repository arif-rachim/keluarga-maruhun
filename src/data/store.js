// Lapisan penyimpanan data.
// Saat ini memakai localStorage (data tersimpan di perangkat masing-masing).
// Seluruh akses data lewat fungsi di sini, sehingga nanti mudah diganti
// ke backend cloud (mis. Supabase) tanpa mengubah komponen UI.

import { SEED_PEOPLE } from './seed.js'

const STORAGE_KEY = 'silsilah-maruhun:v26'
const DIACRITICS = new RegExp('[\\u0300-\\u036f]', 'g')

export function loadPeople() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return structuredCloneSafe(SEED_PEOPLE)
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return structuredCloneSafe(SEED_PEOPLE)
    }
    return parsed
  } catch (err) {
    console.warn('Gagal memuat data, memakai data awal.', err)
    return structuredCloneSafe(SEED_PEOPLE)
  }
}

export function savePeople(people) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(people))
  } catch (err) {
    console.error('Gagal menyimpan data.', err)
  }
}

export function resetPeople() {
  localStorage.removeItem(STORAGE_KEY)
  return structuredCloneSafe(SEED_PEOPLE)
}

export function generateId(name) {
  const slug = (name || 'anggota')
    .toLowerCase()
    .normalize('NFD')
    .replace(DIACRITICS, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 24)
  const rand = Math.random().toString(36).slice(2, 7)
  return `${slug || 'anggota'}-${rand}`
}

function structuredCloneSafe(value) {
  return JSON.parse(JSON.stringify(value))
}
