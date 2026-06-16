// Sesi end-user BERSAMA untuk skrip (node).
//
// MASALAH yang diperbaiki: tiap skrip dulu memanggil signUp dengan email
// ber-timestamp (`smoke-<ts>@…`, `iqbal-<ts>@…`, dst), sehingga SETIAP kali
// dijalankan meninggalkan satu akun end-user permanen yang tak pernah dihapus.
// Setelah banyak run, akun menumpuk jadi puluhan/ratusan.
//
// SOLUSI: pakai SATU akun tetap yang dipakai ulang. signIn dulu; kalau belum
// ada, signUp SEKALI; kalau balapan/sudah ada, signIn lagi. Hasilnya: skrip
// hanya pernah membuat 1 akun, berapa pun seringnya dijalankan.
//
// Kredensial boleh dioverride lewat env (MANGGALEH_SCRIPT_EMAIL/PASSWORD);
// kalau tidak, dipakai default deterministik dari tenant.
export async function ensureScriptSession(client, cfg, label = 'script') {
  const email = process.env.MANGGALEH_SCRIPT_EMAIL || `script-shared@${cfg.tenant}.local`
  const password = process.env.MANGGALEH_SCRIPT_PASSWORD || 'manggaleh-script-shared'
  try {
    await client.auth.signIn({ email, password })
  } catch {
    try {
      await client.auth.signUp({ email, password, name: `Script (${label})` })
    } catch {
      // Balapan (akun keburu dibuat proses lain) atau sudah ada → coba signIn.
      await client.auth.signIn({ email, password })
    }
  }
  return client
}
