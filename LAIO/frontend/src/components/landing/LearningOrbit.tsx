export default function LearningOrbit() {
  return (
    <svg
      viewBox="0 0 620 480"
      role="img"
      aria-labelledby="orbit-title orbit-desc"
      className="h-auto w-full"
    >
      <title id="orbit-title">Một từ đi qua vòng lặp học của LAIO</title>
      <desc id="orbit-desc">
        Từ mới được đặt trong quỹ đạo gồm học, trả lời, lên lịch và quay lại đúng ngày.
      </desc>
      <defs>
        <filter id="orbit-lift" x="-60%" y="-60%" width="220%" height="220%">
          <feDropShadow dx="0" dy="3" stdDeviation="4" floodColor="#0d2b24" floodOpacity="0.28" />
        </filter>
      </defs>

      <path d="M84 371c58-88 125-135 210-149 87-14 169 6 246 66" fill="none" stroke="#fff7d7" strokeWidth="56" strokeLinecap="round" opacity=".13" />
      <circle cx="304" cy="241" r="135" fill="#f8df7d" filter="url(#orbit-lift)" />
      <path d="M251 187h106v128H251z" fill="#fffdf7" />
      <path d="M272 220h65M272 247h49M272 274h57" stroke="#f0513e" strokeWidth="11" strokeLinecap="round" />
      <circle cx="267" cy="345" r="10" fill="#173f34" />
      <circle cx="340" cy="345" r="10" fill="#173f34" />
      <path d="M283 367c14 12 30 12 43 0" fill="none" stroke="#173f34" strokeWidth="7" strokeLinecap="round" />

      {/* Static pivot: SVG attribute transform only, never touched by CSS. */}
      <g transform="translate(304 241)">
        {/* Rotation: pure CSS transform on an element with no attribute transform of its own,
            so 0deg -> 360deg interpolates as a clean angle (not a matrix decomposition) and loops without drift. */}
        <g className="learning-orbit-spin">
          <g transform="translate(-220 -35)" filter="url(#orbit-lift)">
            <rect width="104" height="76" rx="22" fill="#76b5ff" />
            <path d="M27 29h51M27 49h32" stroke="#fff" strokeWidth="8" strokeLinecap="round" />
          </g>
          <g transform="translate(124 -163)" filter="url(#orbit-lift)">
            <circle cx="42" cy="42" r="42" fill="#f690b7" />
            <path d="M42 18v26l17 12" fill="none" stroke="#173f34" strokeWidth="7" strokeLinecap="round" />
          </g>
          <g transform="translate(142 103)" filter="url(#orbit-lift)">
            <rect width="106" height="78" rx="22" fill="#d8e78f" />
            <path d="m28 40 15 15 34-34" fill="none" stroke="#173f34" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
          </g>
        </g>
      </g>
    </svg>
  );
}