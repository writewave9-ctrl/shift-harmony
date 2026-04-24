import { cn } from '@/lib/utils';

interface AlignLogoProps {
  size?: number;
  className?: string;
  withWordmark?: boolean;
  wordmarkClassName?: string;
}

/**
 * Align logo — premium sculpted mark.
 *
 * Concept: a precision arc orbiting a focal point, intersected by a single
 * vertical alignment axis. Reads as orchestration around a shared moment in
 * time. Built entirely from primitive geometry so it stays crisp at 16px.
 */
export const AlignLogo = ({ size = 32, className, withWordmark = false, wordmarkClassName }: AlignLogoProps) => (
  <div className={cn('inline-flex items-center gap-2.5', className)}>
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Align"
      role="img"
    >
      <defs>
        {/* Squircle backdrop — deep forest gradient, app-icon worthy */}
        <linearGradient id="align-bg" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="hsl(168 38% 22%)" />
          <stop offset="100%" stopColor="hsl(170 45% 12%)" />
        </linearGradient>
        {/* Subtle inner sheen */}
        <radialGradient id="align-sheen" cx="0.3" cy="0.2" r="0.9">
          <stop offset="0%" stopColor="hsl(168 60% 70% / 0.18)" />
          <stop offset="60%" stopColor="hsl(168 60% 70% / 0)" />
        </radialGradient>
        {/* Arc gradient — bright teal fading to sage */}
        <linearGradient id="align-arc" x1="8" y1="8" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="hsl(165 70% 75%)" />
          <stop offset="100%" stopColor="hsl(168 50% 50%)" />
        </linearGradient>
        {/* Focal dot gradient */}
        <radialGradient id="align-dot" cx="0.35" cy="0.3" r="0.75">
          <stop offset="0%" stopColor="hsl(160 80% 88%)" />
          <stop offset="100%" stopColor="hsl(168 55% 58%)" />
        </radialGradient>
      </defs>

      {/* Squircle backdrop */}
      <rect x="0" y="0" width="40" height="40" rx="11" fill="url(#align-bg)" />
      <rect x="0" y="0" width="40" height="40" rx="11" fill="url(#align-sheen)" />
      <rect x="0.5" y="0.5" width="39" height="39" rx="10.5" fill="none" stroke="hsl(168 40% 65% / 0.18)" />

      {/* Outer precision arc — three-quarter ring */}
      <path
        d="M 30.5 12 A 12 12 0 1 0 30.5 28"
        stroke="url(#align-arc)"
        strokeWidth="2.6"
        strokeLinecap="round"
        fill="none"
        opacity="0.95"
      />

      {/* Inner alignment axis — single vertical bar through center */}
      <rect x="18.7" y="11" width="2.6" height="18" rx="1.3" fill="hsl(165 70% 75%)" opacity="0.92" />

      {/* Crown focal dot — the aligned target */}
      <circle cx="30.5" cy="20" r="3.2" fill="url(#align-dot)" />
      <circle cx="29.6" cy="19" r="0.85" fill="hsl(0 0% 100% / 0.55)" />

      {/* Baseline indicator */}
      <rect x="13" y="32" width="14" height="1.4" rx="0.7" fill="hsl(168 50% 60%)" opacity="0.45" />
    </svg>
    {withWordmark && (
      <span className={cn('text-base font-semibold tracking-tight text-foreground', wordmarkClassName)}>
        Align
      </span>
    )}
  </div>
);
