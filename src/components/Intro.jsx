import { motion } from 'framer-motion'
import { RumahGadang, SongketBand, IconArrowDown } from './icons.jsx'
import { useI18n } from '../i18n/i18n.jsx'
import { useCountUp } from '../hooks/useCountUp.js'
import { RestorationReveal } from './RestorationReveal.jsx'

function Stat({ value, label, delay }) {
  const n = useCountUp(value, { delay })
  return (
    <div className="intro-stat">
      <div className="n">{n}</div>
      <div className="l">{label}</div>
    </div>
  )
}

// Layar pembuka — kesan pertama yang megah, dengan hero foto restorasi.
export function Intro({ stats, onEnter }) {
  const { t } = useI18n()
  return (
    <motion.div
      className="intro"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.6 } }}
    >
      {/* Silhouette Rumah Gadang besar sebagai latar */}
      <motion.div
        className="intro-house"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 0.09, y: 0 }}
        transition={{ duration: 1.6, ease: [0.22, 1, 0.36, 1] }}
      >
        <RumahGadang peaks={5} style={{ width: '100%', color: 'var(--gold)' }} />
      </motion.div>

      <div className="intro-inner">
        <motion.div
          className="intro-portrait"
          initial={{ opacity: 0, y: 18, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
        >
          <RestorationReveal />
        </motion.div>

        <motion.div
          className="eyebrow"
          initial={{ opacity: 0, letterSpacing: '0.6em' }}
          animate={{ opacity: 1, letterSpacing: '0.32em' }}
          transition={{ delay: 0.3, duration: 0.9 }}
        >
          {t('intro.eyebrow')}
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 1, ease: [0.22, 1, 0.36, 1] }}
        >
          {t('intro.title_pre')} <em>Maruhun</em>
        </motion.h1>

        <motion.div
          className="intro-songket gold-text"
          initial={{ opacity: 0, scaleX: 0.4 }}
          animate={{ opacity: 0.7, scaleX: 1 }}
          transition={{ delay: 0.55, duration: 0.9 }}
        >
          <SongketBand style={{ width: 200, color: 'var(--gold)' }} />
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.65, duration: 0.9 }}
        >
          {t('intro.tagline')}
        </motion.p>

        <motion.div
          className="intro-stats"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.85, duration: 0.9 }}
        >
          <Stat value={stats.total} label={t('intro.members')} delay={900} />
          <div className="intro-divider" />
          <Stat value={stats.countries} label={t('intro.countries')} delay={1000} />
          <div className="intro-divider" />
          <Stat value={stats.living} label={t('intro.living')} delay={1100} />
        </motion.div>

        <motion.button
          className="btn btn-primary"
          onClick={onEnter}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.05, duration: 0.8 }}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.97 }}
          style={{ height: 52, padding: '0 26px' }}
        >
          {t('intro.enter')}
          <IconArrowDown style={{ width: 18, height: 18 }} />
        </motion.button>
      </div>
    </motion.div>
  )
}
