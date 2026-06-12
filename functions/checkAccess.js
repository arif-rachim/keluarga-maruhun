// Manggaleh server-side function: checkAccess
//
// Memeriksa apakah sebuah nomor telepon ada di koleksi `whitelist`.
// Dipanggil dari frontend (client.functions.invoke('checkAccess', { phone })).
// Dijalankan di sandbox server (tanpa require/fetch/proses) — akses data via ctx.db.
//
// Return: { approved: boolean, name: string|null }

function canon(p) {
  // Normalkan nomor: ambil digit saja; awalan '0' (Indonesia) -> '62'.
  var d = String(p == null ? '' : p).replace(/[^0-9]/g, '')
  if (d.indexOf('0') === 0) d = '62' + d.slice(1)
  return d
}

module.exports = async (input, ctx) => {
  var phone = canon(input && input.phone)
  if (!phone) return { approved: false, name: null }
  var res = await ctx.db.list('whitelist', { phone: 'eq.' + phone, limit: 1 })
  var row = res && res.data && res.data[0]
  return { approved: !!row, name: row ? row.name || null : null }
}
