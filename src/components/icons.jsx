// Kumpulan ikon garis (stroke) ringan, mengikuti gaya elegan aplikasi.
const base = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.7,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
}

export const IconPlus = (p) => (
  <svg viewBox="0 0 24 24" {...base} {...p}>
    <path d="M12 5v14M5 12h14" />
  </svg>
)

export const IconClose = (p) => (
  <svg viewBox="0 0 24 24" {...base} {...p}>
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
)

export const IconSearch = (p) => (
  <svg viewBox="0 0 24 24" {...base} {...p}>
    <circle cx="11" cy="11" r="7" />
    <path d="M20 20l-3.2-3.2" />
  </svg>
)

export const IconPlusSm = (p) => (
  <svg viewBox="0 0 24 24" {...base} {...p}>
    <path d="M12 6v12M6 12h12" />
  </svg>
)

export const IconMinus = (p) => (
  <svg viewBox="0 0 24 24" {...base} {...p}>
    <path d="M6 12h12" />
  </svg>
)

export const IconTarget = (p) => (
  <svg viewBox="0 0 24 24" {...base} {...p}>
    <circle cx="12" cy="12" r="7" />
    <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
  </svg>
)

export const IconPin = (p) => (
  <svg viewBox="0 0 24 24" {...base} {...p}>
    <path d="M12 21s-6.5-5.6-6.5-10.5A6.5 6.5 0 0 1 12 4a6.5 6.5 0 0 1 6.5 6.5C18.5 15.4 12 21 12 21z" />
    <circle cx="12" cy="10.5" r="2.3" />
  </svg>
)

export const IconUser = (p) => (
  <svg viewBox="0 0 24 24" {...base} {...p}>
    <circle cx="12" cy="8" r="4" />
    <path d="M5 20c0-3.5 3-6 7-6s7 2.5 7 6" />
  </svg>
)

export const IconTrash = (p) => (
  <svg viewBox="0 0 24 24" {...base} {...p}>
    <path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13" />
  </svg>
)

export const IconHeart = (p) => (
  <svg viewBox="0 0 24 24" {...base} {...p}>
    <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" />
  </svg>
)

export const IconBranch = (p) => (
  <svg viewBox="0 0 24 24" {...base} {...p}>
    <circle cx="12" cy="5" r="2.2" />
    <circle cx="6" cy="19" r="2.2" />
    <circle cx="18" cy="19" r="2.2" />
    <path d="M12 7.2v3.3M12 10.5c0 3-6 3-6 6.2M12 10.5c0 3 6 3 6 6.2" />
  </svg>
)

export const IconCheck = (p) => (
  <svg viewBox="0 0 24 24" {...base} {...p}>
    <path d="M5 12.5l4.5 4.5L19 7" />
  </svg>
)

export const IconArrowDown = (p) => (
  <svg viewBox="0 0 24 24" {...base} {...p}>
    <path d="M12 5v14M6 13l6 6 6-6" />
  </svg>
)

export const IconEdit = (p) => (
  <svg viewBox="0 0 24 24" {...base} {...p}>
    <path d="M16 4l4 4-11 11H5v-4L16 4z" />
  </svg>
)

export const IconCamera = (p) => (
  <svg viewBox="0 0 24 24" {...base} {...p}>
    <path d="M4 8h3l1.5-2h7L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z" />
    <circle cx="12" cy="13" r="3.2" />
  </svg>
)

// Atap Rumah Gadang — motif dekoratif tanduk kerbau.
export const RumahGadangRoof = (p) => (
  <svg viewBox="0 0 320 96" fill="none" {...p}>
    <g stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none">
      <path d="M10 86 C70 30 120 18 160 12 C200 18 250 30 310 86" opacity="0.9" />
      <path d="M40 86 C88 44 128 34 160 30 C192 34 232 44 280 86" opacity="0.55" />
      <path d="M76 86 C108 58 138 50 160 48 C182 50 212 58 244 86" opacity="0.35" />
      <path d="M160 48 L160 12" opacity="0.5" />
    </g>
  </svg>
)

// Hasilkan satu garis atap bergelombang dengan beberapa gonjong (tanduk kerbau).
function gonjongLine(width, peaks, baseY, tipY) {
  const seg = width / peaks
  let d = `M 0 ${baseY}`
  for (let i = 0; i < peaks; i++) {
    const x0 = i * seg
    const xc = x0 + seg / 2
    const x1 = x0 + seg
    // naik ke ujung gonjong yang runcing, lalu turun lagi
    d += ` C ${x0 + seg * 0.22} ${baseY - (baseY - tipY) * 0.35}, ${xc - seg * 0.06} ${tipY}, ${xc} ${tipY}`
    d += ` C ${xc + seg * 0.06} ${tipY}, ${x1 - seg * 0.22} ${baseY - (baseY - tipY) * 0.35}, ${x1} ${baseY}`
  }
  return d
}

// Silhouette penuh Rumah Gadang: atap bergonjong berlapis + badan rumah berpilar.
// Dipakai sebagai ornamen latar (watermark) dan di layar pembuka.
export const RumahGadang = ({ peaks = 5, ...p }) => {
  const W = 400
  const baseY = 132
  return (
    <svg viewBox="0 0 400 220" fill="none" {...p}>
      <g stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
        {/* Atap berlapis */}
        <path d={gonjongLine(W, peaks, baseY, 20)} strokeWidth="2.4" opacity="0.95" />
        <path
          d={gonjongLine(W, peaks, baseY + 16, 54)}
          strokeWidth="1.6"
          opacity="0.5"
          transform="translate(0,-4)"
        />
        {/* Garis bubungan tengah tiap gonjong */}
        {Array.from({ length: peaks }).map((_, i) => {
          const x = (W / peaks) * (i + 0.5)
          return <path key={i} d={`M ${x} ${baseY} L ${x} 22`} strokeWidth="1" opacity="0.28" />
        })}
        {/* Badan rumah (dinding melebar ke bawah, khas Rumah Gadang) */}
        <path
          d={`M 44 ${baseY} L 30 200 L 370 200 L 356 ${baseY}`}
          strokeWidth="2"
          opacity="0.7"
        />
        {/* Pilar / tonggak */}
        {Array.from({ length: 6 }).map((_, i) => {
          const t = i / 5
          const xTop = 44 + (356 - 44) * t
          const xBot = 30 + (370 - 30) * t
          return (
            <path
              key={`p${i}`}
              d={`M ${xTop} ${baseY + 6} L ${xBot} 198`}
              strokeWidth="1.2"
              opacity="0.4"
            />
          )
        })}
        {/* Lantai panggung */}
        <path d="M 22 200 L 378 200" strokeWidth="2" opacity="0.6" />
      </g>
    </svg>
  )
}

// Ornamen songket — deretan belah ketupat tipis sebagai pembatas/aksen.
export const SongketBand = (p) => (
  <svg viewBox="0 0 240 16" fill="none" {...p}>
    <g stroke="currentColor" strokeWidth="1" fill="none" opacity="0.6">
      {Array.from({ length: 10 }).map((_, i) => {
        const x = 12 + i * 24
        return (
          <g key={i}>
            <path d={`M ${x} 2 L ${x + 7} 8 L ${x} 14 L ${x - 7} 8 Z`} />
            <circle cx={x} cy="8" r="1.1" fill="currentColor" stroke="none" />
          </g>
        )
      })}
      <path d="M0 8 H4 M236 8 H240" />
    </g>
  </svg>
)

export const IconRefresh = (p) => (
  <svg viewBox="0 0 24 24" {...base} {...p}>
    <path d="M20 11a8 8 0 0 0-14.3-3.7M4 13a8 8 0 0 0 14.3 3.7" />
    <path d="M20 4v4h-4M4 20v-4h4" />
  </svg>
)

export const IconPhone = (p) => (
  <svg viewBox="0 0 24 24" {...base} {...p}>
    <path d="M5 4h3l2 5-2.5 1.5a11 11 0 0 0 5 5L19 13l2 5v3a1 1 0 0 1-1 1A16 16 0 0 1 4 5a1 1 0 0 1 1-1z" />
  </svg>
)

export const IconInbox = (p) => (
  <svg viewBox="0 0 24 24" {...base} {...p}>
    <path d="M4 13l2.5-7h11L20 13M4 13v5a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-5M4 13h4l1.5 2.5h5L16 13h4" />
  </svg>
)

export const IconUnfold = (p) => (
  <svg viewBox="0 0 24 24" {...base} {...p}>
    <path d="M8 9l4-4 4 4M8 15l4 4 4-4" />
  </svg>
)

export const IconFold = (p) => (
  <svg viewBox="0 0 24 24" {...base} {...p}>
    <path d="M8 5l4 4 4-4M8 19l4-4 4 4" />
  </svg>
)

export const IconSparkle = (p) => (
  <svg viewBox="0 0 24 24" {...base} {...p}>
    <path d="M12 3l1.6 5.0L18.6 9.6 13.6 11.2 12 16.2 10.4 11.2 5.4 9.6 10.4 8z" />
    <path d="M18.5 15.5l.6 1.9 1.9.6-1.9.6-.6 1.9-.6-1.9-1.9-.6 1.9-.6z" />
  </svg>
)

export const IconGlobe = (p) => (
  <svg viewBox="0 0 24 24" {...base} {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M3 12h18M12 3c2.5 2.5 2.5 15 0 18M12 3c-2.5 2.5-2.5 15 0 18" />
  </svg>
)
