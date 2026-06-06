import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useAnimationControls } from 'framer-motion'
import { useI18n } from '../i18n/i18n.jsx'
import { IconSparkle } from './icons.jsx'

const ORIGINAL = '/photo/icon.jpg'
const RESTORED = '/photo/icon-restored.png'
const COLORED = '/photo/icon-restored-colored.png'

const WIPE_EASE = [0.76, 0, 0.24, 1]
const wait = (ms) => new Promise((r) => setTimeout(r, ms))

// Hero landing: memutar transisi restorasi foto keluarga Maruhun:
// Foto Asli  →  Dipulihkan (AI)  →  Diwarnai (AI), berulang.
// Lapisan tersusun: berwarna (bawah) · hitam-putih (tengah) · asli (atas).
// Lapisan atas "tersapu" dari kiri ke kanan untuk menyingkap lapisan di bawahnya.
export function RestorationReveal() {
  const { t } = useI18n()
  const orig = useAnimationControls()
  const restored = useAnimationControls()
  const scan = useAnimationControls()
  const frame = useAnimationControls()
  const [stage, setStage] = useState(0)
  const alive = useRef(true)

  useEffect(() => {
    alive.current = true

    const sweep = (ctrl) =>
      ctrl.start({
        clipPath: 'inset(0% 0% 0% 100%)',
        transition: { duration: 1.8, ease: WIPE_EASE },
      })

    const runScan = () => {
      scan.set({ left: '0%', opacity: 0 })
      scan.start({
        left: ['0%', '100%'],
        opacity: [0, 1, 1, 0],
        transition: { duration: 1.8, ease: WIPE_EASE, times: [0, 0.1, 0.85, 1] },
      })
    }

    async function loop() {
      try {
        while (alive.current) {
          // — Reset ke foto asli (saat frame masih tak terlihat), lalu fade-in —
          setStage(0)
          orig.set({ clipPath: 'inset(0% 0% 0% 0%)' })
          restored.set({ clipPath: 'inset(0% 0% 0% 0%)' })
          scan.set({ opacity: 0 })
          await frame.start({ opacity: 1, transition: { duration: 0.5 } })
          await wait(1700)
          if (!alive.current) break

          // — Singkap hasil restorasi (hitam-putih) —
          setStage(1)
          runScan()
          await sweep(orig)
          await wait(1500)
          if (!alive.current) break

          // — Singkap hasil pewarnaan —
          setStage(2)
          runScan()
          await sweep(restored)
          await wait(2800)
          if (!alive.current) break

          // — Pudar lalu ulangi —
          await frame.start({ opacity: 0, transition: { duration: 0.5 } })
        }
      } catch {
        // controls dibatalkan saat unmount — abaikan
      }
    }
    loop()
    return () => {
      alive.current = false
    }
  }, [orig, restored, scan, frame])

  const stageKey = ['original', 'restored', 'colored'][stage]
  const stageLabel = t(`ai.${stageKey}`)

  return (
    <div className="reveal-wrap">
      <motion.div className="reveal-frame" animate={frame} initial={{ opacity: 0 }}>
        {/* Lapisan berwarna (paling bawah) */}
        <img className="reveal-img" src={COLORED} alt="" draggable={false} />
        {/* Lapisan hitam-putih (tengah) */}
        <motion.img
          className="reveal-img"
          src={RESTORED}
          alt=""
          draggable={false}
          animate={restored}
        />
        {/* Lapisan asli (atas) */}
        <motion.img
          className="reveal-img reveal-original"
          src={ORIGINAL}
          alt="Foto asli keluarga Datuk Maruhun"
          draggable={false}
          animate={orig}
        />

        {/* Garis pemindai */}
        <motion.div className="reveal-scan" animate={scan} initial={{ opacity: 0 }} />

        {/* Bingkai & gradasi */}
        <div className="reveal-vignette" />
        <span className="reveal-corner tl" />
        <span className="reveal-corner tr" />
        <span className="reveal-corner bl" />
        <span className="reveal-corner br" />

        {/* Label tahap (di dalam bingkai, bawah) */}
        <div className="reveal-stagebar">
          <AnimatePresence mode="wait">
            <motion.span
              key={stageKey}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.35 }}
            >
              {stageLabel}
            </motion.span>
          </AnimatePresence>
          <div className="reveal-dots">
            {[0, 1, 2].map((i) => (
              <span key={i} className={`reveal-dot${i === stage ? ' on' : ''}`} />
            ))}
          </div>
        </div>
      </motion.div>

      {/* Pesan: foto direstorasi menggunakan AI */}
      <div className="reveal-badge">
        <IconSparkle />
        {t('ai.badge')}
      </div>
    </div>
  )
}
