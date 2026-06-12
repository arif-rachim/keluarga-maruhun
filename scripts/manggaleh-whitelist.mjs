// Kelola whitelist nomor telepon (siapa yang boleh menyunting silsilah).
//
// MEMERLUKAN SERVICE KEY (mgsk_…) — akses admin. JANGAN taruh service key di
// .env yang ber-prefix VITE_ (akan ikut ke bundle) dan JANGAN di-commit.
// Berikan lewat env saat menjalankan:
//
//   MANGGALEH_SERVICE_KEY=mgsk_xxx \
//     node --env-file=.env.local scripts/manggaleh-whitelist.mjs list
//   MANGGALEH_SERVICE_KEY=mgsk_xxx \
//     node --env-file=.env.local scripts/manggaleh-whitelist.mjs add 0812-3456-7890 "Budi"
//   MANGGALEH_SERVICE_KEY=mgsk_xxx \
//     node --env-file=.env.local scripts/manggaleh-whitelist.mjs remove 0812-3456-7890
import { createClient } from '@manggaleh/sdk'

const E = process.env
const svc = E.MANGGALEH_SERVICE_KEY
if (!svc) {
  console.error('Set MANGGALEH_SERVICE_KEY (service key mgsk_…). Jangan di-commit / jangan pakai prefix VITE_.')
  process.exit(1)
}
const cfg = {
  baseUrl: E.VITE_MANGGALEH_BASE_URL,
  tenant: E.VITE_MANGGALEH_TENANT,
  env: E.VITE_MANGGALEH_ENV || 'dev',
  apiKey: svc,
}
if (!cfg.baseUrl || !cfg.tenant) {
  console.error('Env Manggaleh belum lengkap. Jalankan dengan --env-file=.env.local')
  process.exit(1)
}

function canon(p) {
  let d = String(p ?? '').replace(/[^0-9]/g, '')
  if (d.startsWith('0')) d = '62' + d.slice(1)
  return d
}

const c = createClient(cfg)
const wl = c.data.from('whitelist')

async function listAll() {
  const out = []
  let cursor
  do {
    const { data, nextCursor } = await wl.page({ limit: 200, cursor })
    out.push(...data)
    cursor = nextCursor ?? undefined
  } while (cursor)
  return out
}

const [cmd, arg1, ...rest] = process.argv.slice(2)
const name = rest.join(' ')

async function main() {
  if (cmd === 'list') {
    const rows = await listAll()
    if (!rows.length) return console.log('(whitelist kosong)')
    for (const r of rows) console.log(`${r.phone}\t${r.name || ''}`)
    console.log(`\nTotal: ${rows.length}`)
    return
  }
  if (cmd === 'add') {
    const phone = canon(arg1)
    if (!phone) return fail('nomor wajib. Contoh: add 0812-3456-7890 "Budi"')
    try {
      await wl.insert({ phone, name: name || null })
      console.log(`✓ ditambahkan: ${phone} ${name ? '(' + name + ')' : ''}`)
    } catch (e) {
      if (String(e.message || '').match(/uniqu|exist|duplicate/i)) console.log(`(sudah ada: ${phone})`)
      else throw e
    }
    return
  }
  if (cmd === 'remove') {
    const phone = canon(arg1)
    const rows = await listAll()
    const hit = rows.find((r) => r.phone === phone)
    if (!hit) return console.log(`(tidak ditemukan: ${phone})`)
    await wl.remove(hit.id)
    console.log(`✓ dihapus: ${phone}`)
    return
  }
  fail('perintah: list | add <phone> [name] | remove <phone>')
}

function fail(msg) {
  console.error(msg)
  process.exit(1)
}

main().catch((e) => {
  console.error('Gagal:', e.message)
  process.exit(1)
})
