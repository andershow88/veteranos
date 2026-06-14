/** Decorative, classic black-and-white football (pentagon pattern). */
export function SoccerBall({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden focusable="false">
      <defs>
        <radialGradient id="vb-ball" cx="38%" cy="30%" r="80%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="65%" stopColor="#eef2f6" />
          <stop offset="100%" stopColor="#c2ccd6" />
        </radialGradient>
        <clipPath id="vb-ball-clip">
          <circle cx="50" cy="50" r="46" />
        </clipPath>
      </defs>

      <circle cx="50" cy="50" r="46" fill="url(#vb-ball)" stroke="#111827" strokeWidth="2.5" />

      {/* Black patches: central pentagon + five edge pentagons */}
      <g clipPath="url(#vb-ball-clip)" fill="#111827">
        <path d="M 50 36 L 63.3 45.7 L 58.2 61.3 L 41.8 61.3 L 36.7 45.7 Z" />
        <path d="M 76.5 13.6 L 80.5 25.9 L 70 33.5 L 59.5 25.9 L 63.5 13.6 Z" />
        <path d="M 92.8 63.9 L 82.3 71.5 L 71.8 63.9 L 75.8 51.6 L 88.8 51.6 Z" />
        <path d="M 50 95 L 39.5 87.4 L 43.5 75.1 L 56.5 75.1 L 60.5 87.4 Z" />
        <path d="M 7.2 63.9 L 11.2 51.6 L 24.2 51.6 L 28.2 63.9 L 17.7 71.5 Z" />
        <path d="M 23.5 13.6 L 36.5 13.6 L 40.5 25.9 L 30 33.5 L 19.5 25.9 Z" />
      </g>

      {/* Seams from the central pentagon to the rim */}
      <g clipPath="url(#vb-ball-clip)" stroke="#111827" strokeWidth="2.2" strokeLinecap="round" fill="none">
        <path d="M 50 36 L 50 3" />
        <path d="M 63.3 45.7 L 94.7 35.5" />
        <path d="M 58.2 61.3 L 77.6 88" />
        <path d="M 41.8 61.3 L 22.4 88" />
        <path d="M 36.7 45.7 L 5.3 35.5" />
      </g>

      {/* Soft top-left highlight for a 3D feel */}
      <ellipse cx="37" cy="31" rx="13" ry="8" fill="#ffffff" opacity="0.4" />
    </svg>
  );
}
