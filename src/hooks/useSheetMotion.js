import { useIsMobile } from './useIsMobile.js'

// Animasi sheet (slide + fade) di desktop; di HP TANPA animasi (instan) supaya
// muncul/menutup panel tidak terasa berat/jelek di perangkat murah.
// Dipakai dengan: <motion.div className="sheet" {...useSheetMotion()} />
export function useSheetMotion() {
  const isMobile = useIsMobile()
  return isMobile
    ? {}
    : {
        initial: { y: 60, opacity: 0 },
        animate: { y: 0, opacity: 1 },
        exit: { y: 60, opacity: 0 },
        transition: { type: 'spring', damping: 28, stiffness: 280 },
      }
}
