import { cn } from '@/lib/utils';

interface AlignLogoProps {
  size?: number;
  className?: string;
  withWordmark?: boolean;
  wordmarkClassName?: string;
}

/**
 * Align logo — premium abstract mark.
 *
 * Concept: three precision bars of escalating height anchored on a shared baseline,
 * crowned by an aligned orb. Reads as "elements brought into alignment".
 * Uses theme tokens and dual gradients for depth. Adapts to light/dark.
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
        <linearGradient id="align-bg" x1="4" y1="4" x2="36" y2="36" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.16" />
          <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.04" />
        </linearGradient>
        <linearGradient id="align-bar" x1="20" y1="6" x2="20" y2="34" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="hsl(var(--primary))" />
          <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.65" />
        </linearGradient>
        <linearGradient id="align-orb" x1="14" y1="6" x2="26" y2="14" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="hsl(var(--primary))" />
          <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.75" />
        </linearGradient>
      </defs>

      {/* Soft squircle container */}
      <rect x="0" y="0" width="40" height="40" rx="11" fill="url(#align-bg)" />
      <rect x="0.5" y="0.5" width="39" height="39" rx="10.5" fill="none" stroke="hsl(var(--primary) / 0.18)" />

      {/* Three precision bars rising into alignment */}
      <rect x="9"  y="20" width="3.4" height="11" rx="1.7" fill="url(#align-bar)" opacity="0.75" />
      <rect x="14.8" y="15" width="3.4" height="16" rx="1.7" fill="url(#align-bar)" opacity="0.9" />
      <rect x="20.6" y="11" width="3.4" height="20" rx="1.7" fill="url(#align-bar)" />

      {/* Crown orb — the aligned target */}
      <circle cx="29" cy="11.5" r="3.4" fill="url(#align-orb)" />
      <circle cx="29" cy="11.5" r="3.4" fill="none" stroke="hsl(var(--primary))" strokeOpacity="0.35" />
      {/* Inner highlight on orb */}
      <circle cx="27.9" cy="10.4" r="0.9" fill="hsl(0 0% 100% / 0.55)" />

      {/* Baseline — the alignment reference */}
      <rect x="7" y="32" width="20" height="1.6" rx="0.8" fill="hsl(var(--primary))" opacity="0.55" />
    </svg>
    {withWordmark && (
      <span className={cn('text-base font-semibold tracking-tight text-foreground', wordmarkClassName)}>
        Align
      </span>
    )}
  </div>
);
