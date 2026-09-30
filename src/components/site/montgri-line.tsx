/**
 * Signatura gràfica: la carena del Montgrí amb el castell dalt de tot, dibuixada amb un sol traç.
 * Decorativa (aria-hidden). Estàtica: animar el traç (stroke-dashoffset) repinta a cada fotograma.
 */
export function MontgriLine({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 1200 180" fill="none" aria-hidden="true" className={className} preserveAspectRatio="none">
      <path
        d="M0 168 C 90 160 150 150 210 128 S 330 96 390 104 S 480 120 540 92 C 580 74 610 60 640 58
           L 640 40 L 648 40 L 648 34 L 656 34 L 656 40 L 700 40 L 700 34 L 708 34 L 708 40 L 716 40 L 716 58
           C 760 62 800 84 850 98 S 960 112 1020 132 S 1130 158 1200 164"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
      <path
        d="M0 176 C 160 172 260 166 360 152 S 560 138 700 144 S 980 160 1200 172"
        stroke="currentColor"
        strokeOpacity=".45"
        strokeWidth="1.4"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
