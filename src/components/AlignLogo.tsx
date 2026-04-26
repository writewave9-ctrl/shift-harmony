import { cn } from '@/lib/utils';

interface AlignLogoProps {
  size?: number;
  className?: string;
  withWordmark?: boolean;
  wordmarkClassName?: string;
  /** Render the mark on a transparent backdrop (e.g. inside an existing colored container). */
  bare?: boolean;
}

/**
 * Align logo — "Convergence" mark.
 *
 * Concept: three offset arcs orbiting a single luminous focal point.
 * The arcs represent independent schedules (workers, managers, time)
 * aligning to one shared moment. Built from pure geometry so it stays
 * crisp from 14px favicon up to hero sizes, and reads cleanly in both
 * light and dark modes via a self-contained gradient backdrop.
 */
export const AlignLogo = ({
  size = 32,
  className,
  withWordmark = false,
  wordmarkClassName,
  bare = false,
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
        {/* Squircle backdrop — deep forest gradient */}
        <linearGradient id="align-bg" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#1d4a40" />
          <stop offset="55%" stopColor="#143832" />
          <stop offset="100%" stopColor="#0a201d" />
        </linearGradient>
        {/* Top-light sheen */}
        <radialGradient id="align-sheen" cx="0.28" cy="0.18" r="0.85">
          <stop offset="0%" stopColor="#9be0cf" stopOpacity="0.22" />
          <stop offset="55%" stopColor="#9be0cf" stopOpacity="0" />
        </radialGradient>
        {/* Outer arc gradient */}
        <linearGradient id="align-arc-outer" x1="6" y1="10" x2="42" y2="38" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#bff2e1" />
          <stop offset="100%" stopColor="#3f9d89" />
        </linearGradient>
        {/* Mid arc gradient */}
        <linearGradient id="align-arc-mid" x1="10" y1="14" x2="38" y2="34" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#7fd9c2" />
          <stop offset="100%" stopColor="#2c8170" />
        </linearGradient>
        {/* Inner arc gradient */}
        <linearGradient id="align-arc-inner" x1="14" y1="18" x2="34" y2="30" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#5cc4ad" />
          <stop offset="100%" stopColor="#1f6a5c" />
        </linearGradient>
        {/* Focal dot — the aligned target */}
        <radialGradient id="align-focal" cx="0.32" cy="0.28" r="0.8">
          <stop offset="0%" stopColor="#eafff5" />
          <stop offset="55%" stopColor="#a8eedc" />
          <stop offset="100%" stopColor="#3f9d89" />
        </radialGradient>
        {/* Soft halo behind focal dot */}
        <radialGradient id="align-halo" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="#a8eedc" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#a8eedc" stopOpacity="0" />
        </radialGradient>
      </defs>

      {!bare && (
        <>
          <rect x="0" y="0" width="48" height="48" rx="13" fill="url(#align-bg)" />
          <rect x="0" y="0" width="48" height="48" rx="13" fill="url(#align-sheen)" />
          <rect
            x="0.5"
            y="0.5"
            width="47"
            height="47"
            rx="12.5"
            fill="none"
            stroke="#9be0cf"
            strokeOpacity="0.15"
          />
        </>
      )}

      {/* Halo behind focal point */}
      <circle cx="34" cy="24" r="9" fill="url(#align-halo)" />

      {/* Three offset arcs converging on the focal point */}
      {/* Outer arc — widest sweep */}
      <path
        d="M 34 9.5 A 14.5 14.5 0 1 0 34 38.5"
        stroke="url(#align-arc-outer)"
        strokeWidth="2.6"
        strokeLinecap="round"
        fill="none"
        opacity="0.95"
      />
      {/* Middle arc — slightly inset */}
      <path
        d="M 34 13.5 A 10.5 10.5 0 1 0 34 34.5"
        stroke="url(#align-arc-mid)"
        strokeWidth="2.4"
        strokeLinecap="round"
        fill="none"
        opacity="0.9"
      />
      {/* Inner arc — closest to center */}
      <path
        d="M 34 17.5 A 6.5 6.5 0 1 0 34 30.5"
        stroke="url(#align-arc-inner)"
        strokeWidth="2.2"
        strokeLinecap="round"
        fill="none"
        opacity="0.85"
      />

      {/* Focal point — the aligned target */}
      <circle cx="34" cy="24" r="3.4" fill="url(#align-focal)" />
      <circle cx="33" cy="22.9" r="0.95" fill="#ffffff" fillOpacity="0.7" />
    </svg>
    {withWordmark && (
      <span
        className={cn(
          'font-display text-[17px] font-semibold tracking-tight text-foreground',
          wordmarkClassName,
        )}
      >
        Align
      </span>
    )}
  </div>
);
