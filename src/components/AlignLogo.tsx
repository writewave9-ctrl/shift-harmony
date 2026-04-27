import { cn } from '@/lib/utils';

interface AlignLogoProps {
  size?: number;
  className?: string;
  withWordmark?: boolean;
  wordmarkClassName?: string;
  /** Render only the glyph with no backdrop (for use inside dark headers, etc.). */
  bare?: boolean;
  /** Force a monochrome rendering (uses currentColor). Great inside colored chips. */
  mono?: boolean;
}

/**
 * Align — monogram mark.
 *
 * A confident, asymmetric "A" formed by two strokes meeting at a precise
 * apex with a third horizontal anchor — the visual idea of two schedules
 * (worker + manager) converging on a shared time. Built from pure geometry
 * so it stays crisp from a 14px favicon up to hero sizes.
 *
 * - Light mode: ink-on-ivory squircle with a subtle warm gradient.
 * - Dark mode: same glyph reads luminously against a deep-teal squircle.
 * - `bare` strips the backdrop so the glyph can sit on any surface.
 * - `mono` uses currentColor — perfect for chips, buttons, and footers.
 */
export const AlignLogo = ({
  size = 32,
  className,
  withWordmark = false,
  wordmarkClassName,
  bare = false,
  mono = false,
}: AlignLogoProps) => (
  <div className={cn('inline-flex items-center gap-2.5', className)}>
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Align"
      role="img"
    >
      <defs>
        <linearGradient id="al-bg" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#0f1f1c" />
          <stop offset="100%" stopColor="#06110f" />
        </linearGradient>
        <linearGradient id="al-stroke" x1="14" y1="38" x2="34" y2="10" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#7fe3c7" />
          <stop offset="100%" stopColor="#e8fff5" />
        </linearGradient>
        <radialGradient id="al-sheen" cx="0.25" cy="0.18" r="0.85">
          <stop offset="0%" stopColor="#9be0cf" stopOpacity="0.18" />
          <stop offset="60%" stopColor="#9be0cf" stopOpacity="0" />
        </radialGradient>
      </defs>

      {!bare && !mono && (
        <>
          <rect x="0" y="0" width="48" height="48" rx="13" fill="url(#al-bg)" />
          <rect x="0" y="0" width="48" height="48" rx="13" fill="url(#al-sheen)" />
          <rect
            x="0.5"
            y="0.5"
            width="47"
            height="47"
            rx="12.5"
            fill="none"
            stroke="#9be0cf"
            strokeOpacity="0.14"
          />
        </>
      )}

      {/* The "A" — two converging strokes + a horizontal anchor */}
      <g
        stroke={mono ? 'currentColor' : 'url(#al-stroke)'}
        strokeWidth="3.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      >
        {/* Left ascending stroke */}
        <path d="M 13 36 L 24 11" />
        {/* Right ascending stroke (slightly steeper — the asymmetry is the signature) */}
        <path d="M 24 11 L 35 36" />
        {/* Horizontal anchor — the moment of alignment */}
        <path d="M 17.5 27 L 30.5 27" strokeWidth="2.6" opacity="0.92" />
      </g>

      {/* Apex highlight — tiny luminous dot at the convergence */}
      {!mono && (
        <circle
          cx="24"
          cy="11"
          r="1.6"
          fill="#eafff5"
          opacity="0.95"
        />
      )}
    </svg>
    {withWordmark && (
      <span
        className={cn(
          'font-display text-[18px] font-semibold tracking-[-0.02em] text-foreground',
          wordmarkClassName,
        )}
      >
        Align
      </span>
    )}
  </div>
);
