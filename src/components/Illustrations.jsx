// Hand-built clay-style illustrations (inline SVG, no image files needed)

export const Cloud = ({ className = '' }) => (
  <svg className={`cloud ${className}`} viewBox="0 0 130 74" aria-hidden="true">
    <g fill="#fdf9f3">
      <circle cx="36" cy="46" r="20" />
      <circle cx="64" cy="34" r="27" />
      <circle cx="94" cy="47" r="20" />
      <rect x="36" y="46" width="58" height="21" rx="10" />
    </g>
    <ellipse cx="64" cy="66" rx="46" ry="4" fill="#000" opacity=".05" />
  </svg>
)

export const Plant = ({ className = '' }) => (
  <svg className={`deco ${className}`} viewBox="0 0 120 190" aria-hidden="true">
    <path d="M60 130 C60 90 58 60 62 20" stroke="#7e9c5a" strokeWidth="6" fill="none" strokeLinecap="round" />
    <g fill="#8aa866">
      <ellipse cx="34" cy="100" rx="24" ry="11" transform="rotate(-38 34 100)" />
      <ellipse cx="88" cy="88" rx="24" ry="11" transform="rotate(38 88 88)" />
      <ellipse cx="32" cy="62" rx="22" ry="10" transform="rotate(-42 32 62)" />
      <ellipse cx="90" cy="50" rx="22" ry="10" transform="rotate(42 90 50)" />
      <ellipse cx="62" cy="22" rx="12" ry="22" />
    </g>
    <path d="M30 128h60l-8 54a8 8 0 0 1-8 6H46a8 8 0 0 1-8-6z" fill="#e9c9a3" />
    <rect x="26" y="120" width="68" height="16" rx="8" fill="#f0d5b3" />
  </svg>
)

export const Flower = ({ className = '' }) => (
  <svg className={`deco ${className}`} viewBox="0 0 110 170" aria-hidden="true">
    <path d="M55 112 C55 90 55 74 55 58" stroke="#7e9c5a" strokeWidth="5" fill="none" strokeLinecap="round" />
    <ellipse cx="34" cy="96" rx="18" ry="8" transform="rotate(-30 34 96)" fill="#8aa866" />
    <ellipse cx="76" cy="90" rx="18" ry="8" transform="rotate(30 76 90)" fill="#8aa866" />
    <g fill="#f5a9b8">
      <circle cx="55" cy="26" r="15" /><circle cx="80" cy="42" r="15" /><circle cx="70" cy="70" r="15" />
      <circle cx="40" cy="70" r="15" /><circle cx="30" cy="42" r="15" />
    </g>
    <circle cx="55" cy="49" r="12" fill="#f6d45c" />
    <path d="M24 112h62l-7 46a8 8 0 0 1-8 7H39a8 8 0 0 1-8-7z" fill="#f4a3b0" />
    <rect x="20" y="104" width="70" height="14" rx="7" fill="#f7b6c1" />
  </svg>
)

export const Mascot = ({ className = '' }) => (
  <svg className={`mascot ${className}`} viewBox="0 0 260 170" aria-hidden="true">
    {/* hair back + bun */}
    <circle cx="96" cy="26" r="21" fill="#7b4b36" />
    <circle cx="89" cy="19" r="8" fill="#9a6650" opacity=".7" />
    <path d="M74 96C64 44 100 18 140 22c46 4 62 40 54 84z" fill="#7b4b36" />
    {/* hoodie */}
    <path d="M22 170c0-38 32-58 76-62h64c44 4 76 24 76 62z" fill="#b9a2ea" />
    <path d="M96 108c10 22 58 22 68 0z" fill="#a38bdc" />
    <ellipse cx="60" cy="150" rx="26" ry="14" fill="#c4b0f0" />
    <ellipse cx="204" cy="150" rx="26" ry="14" fill="#c4b0f0" />
    {/* face */}
    <ellipse cx="132" cy="84" rx="46" ry="43" fill="#fbdcbf" />
    <path d="M86 72c6-30 46-42 76-30 16 7 20 22 16 34-18-16-46-18-66-12-10 4-18 10-26 18z" fill="#7b4b36" />
    <path d="M86 72c-8 10-6 30 2 40-8-14-6-28 4-40z" fill="#7b4b36" />
    {/* eyes */}
    <path d="M100 90q9-9 18 0" stroke="#3d2a22" strokeWidth="4" fill="none" strokeLinecap="round" />
    <circle cx="156" cy="90" r="8" fill="#2f2019" />
    <circle cx="159" cy="87" r="2.800" fill="#fff" />
    <path d="M144 78q12-8 24-2" stroke="#7b4b36" strokeWidth="4" fill="none" strokeLinecap="round" />
    {/* cheeks + mouth */}
    <ellipse cx="98" cy="106" rx="9" ry="6" fill="#f6a3a3" opacity=".6" />
    <ellipse cx="166" cy="106" rx="9" ry="6" fill="#f6a3a3" opacity=".6" />
    <path d="M118 104q14 20 30 0z" fill="#b34a55" />
    <path d="M124 105q9 5 18 0v3q-9 5-18 0z" fill="#fff" />
    {/* hand on cheek */}
    <circle cx="186" cy="118" r="15" fill="#fbdcbf" />
  </svg>
)

export const SittingMascot = ({ className = '' }) => (
  <svg className={`sitter ${className}`} viewBox="0 0 270 250" aria-hidden="true">
    {/* cushion */}
    <rect x="8" y="204" width="254" height="38" rx="19" fill="#b39be6" />
    <rect x="18" y="208" width="234" height="12" rx="6" fill="#cfbff4" opacity=".85" />
    {/* bun + hair back */}
    <circle cx="98" cy="18" r="20" fill="#7b4b36" />
    <circle cx="91" cy="11" r="8" fill="#9a6650" opacity=".7" />
    <path d="M76 88C66 36 102 10 142 14c46 4 62 40 54 84z" fill="#7b4b36" />
    {/* torso */}
    <path d="M92 116c-22 8-32 36-28 72h134c4-36-6-64-30-72z" fill="#b9a2ea" />
    <path d="M100 116c10 20 56 20 66 0z" fill="#a38bdc" />
    {/* hanging arm */}
    <path d="M84 132c-18 12-24 36-16 56" stroke="#b9a2ea" strokeWidth="24" strokeLinecap="round" fill="none" />
    <circle cx="70" cy="186" r="11" fill="#fbdcbf" />
    {/* legs crossed */}
    <ellipse cx="104" cy="194" rx="52" ry="19" fill="#6b4a3c" />
    <ellipse cx="168" cy="194" rx="52" ry="19" fill="#5a3d31" />
    <ellipse cx="58" cy="198" rx="18" ry="11" fill="#fff" />
    <ellipse cx="58" cy="202" rx="18" ry="6" fill="#b39be6" />
    <ellipse cx="214" cy="198" rx="18" ry="11" fill="#fff" />
    <ellipse cx="214" cy="202" rx="18" ry="6" fill="#b39be6" />
    {/* head */}
    <ellipse cx="134" cy="74" rx="46" ry="43" fill="#fbdcbf" />
    <path d="M88 62c6-30 46-42 76-30 16 7 20 22 16 34-18-16-46-18-66-12-10 4-18 10-26 18z" fill="#7b4b36" />
    <path d="M88 62c-8 10-6 30 2 40-8-14-6-28 4-40z" fill="#7b4b36" />
    <path d="M102 80q9-9 18 0" stroke="#3d2a22" strokeWidth="4" fill="none" strokeLinecap="round" />
    <circle cx="158" cy="80" r="8" fill="#2f2019" />
    <circle cx="161" cy="77" r="2.8" fill="#fff" />
    <path d="M146 68q12-8 24-2" stroke="#7b4b36" strokeWidth="4" fill="none" strokeLinecap="round" />
    <ellipse cx="100" cy="96" rx="9" ry="6" fill="#f6a3a3" opacity=".6" />
    <ellipse cx="168" cy="96" rx="9" ry="6" fill="#f6a3a3" opacity=".6" />
    <path d="M120 94q14 20 30 0z" fill="#b34a55" />
    <path d="M126 95q9 5 18 0v3q-9 5-18 0z" fill="#fff" />
    {/* arm with hand on cheek */}
    <path d="M176 128c18-2 26-14 24-32" stroke="#b9a2ea" strokeWidth="24" strokeLinecap="round" fill="none" />
    <circle cx="192" cy="100" r="14" fill="#fbdcbf" />
  </svg>
)
