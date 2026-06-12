// Setel PIN persetujuan (6 digit) untuk function `resolveRequest`.
//
// Menyuntik PIN ke kode function lalu mem-push-nya. PIN asli TIDAK pernah
// ditulis ke repo — hanya ada di server (kode function) dan di env-mu saat ini.
//
// Prasyarat: sudah `mg login --url https://api.manggaleh.com` (memakai sesi
// owner yang tersimpan di ~/.manggaleh/config.json).
//
//   MANGGALEH_APPROVE_PIN=123456 node scripts/manggaleh-set-pin.mjs
//
// Opsional override: MANGGALEH_PROJECT, MANGGALEH_ENV (default silsilah-maruhun/dev).
import { readFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const PIN = process.env.MANGGALEH_APPROVE_PIN
if (!/^\d{6}$/.test(PIN || '')) {
  console.error('Set MANGGALEH_APPROVE_PIN ke 6 digit angka. Contoh: MANGGALEH_APPROVE_PIN=482913')
  process.exit(1)
}

const PROJECT = process.env.MANGGALEH_PROJECT || 'silsilah-maruhun'
const ENV = process.env.MANGGALEH_ENV || 'dev'
const BASE = 'https://api.manggaleh.com'
const ORIGIN = 'https://manggaleh.com' // origin tepercaya untuk control-plane

const cfgPath = process.env.MANGGALEH_CONFIG || join(homedir(), '.manggaleh', 'config.json')
let cookie
try {
  cookie = JSON.parse(readFileSync(cfgPath, 'utf8')).cookie
} catch {
  console.error('Belum login. Jalankan: mg login --url https://api.manggaleh.com')
  process.exit(1)
}

const here = dirname(fileURLToPath(import.meta.url))
const fnPath = join(here, '..', 'functions', 'resolveRequest.js')
let code = readFileSync(fnPath, 'utf8')
if (!code.includes("var APPROVE_PIN = '000000'")) {
  console.error('Tidak menemukan placeholder PIN di functions/resolveRequest.js.')
  process.exit(1)
}
code = code.replace("var APPROVE_PIN = '000000'", `var APPROVE_PIN = '${PIN}'`)

async function api(path, init = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method: init.method || 'GET',
    headers: {
      origin: ORIGIN,
      cookie,
      ...(init.body !== undefined ? { 'content-type': 'application/json' } : {}),
    },
    body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
  })
  const text = await res.text()
  const json = text ? JSON.parse(text) : null
  if (!res.ok) throw new Error((json && (json.error || json.message)) || `HTTP ${res.status}`)
  return json
}

const fnBase = `/api/projects/${PROJECT}/environments/${ENV}/functions`
const existing = await api(fnBase)
const match = (existing.functions || []).find((f) => f.name === 'resolveRequest')
if (match) {
  await api(`${fnBase}/${match.id}`, { method: 'PATCH', body: { code } })
  console.log('✓ PIN diperbarui (function resolveRequest di-update).')
} else {
  await api(fnBase, { method: 'POST', body: { name: 'resolveRequest', code } })
  console.log('✓ PIN disetel (function resolveRequest dibuat).')
}
