import { readFileSync } from 'node:fs'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf-8'))
// Tanggal build (UTC, YYYY-MM-DD) — disuntik saat build agar tiap deploy punya
// penanda versi yang bisa diverifikasi langsung di aplikasi.
const buildDate = new Date().toISOString().slice(0, 10)

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
    __BUILD_DATE__: JSON.stringify(buildDate),
  },
  server: {
    host: true,
    port: 5173,
  },
})
