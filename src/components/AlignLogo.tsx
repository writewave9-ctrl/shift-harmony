import { cn } from '@/lib/utils';

interface AlignLogoProps {
  size?: number;
  className?: string;
  withWordmark?: boolean;
  wordmarkClassName?: string;
}

/**
 * Align logo — abstract compass mark.
 * Three concentric arcs converge into a centered dot, suggesting "alignment".
 * Uses CSS variables so it adapts to light/dark themes automatically.
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
        <linearGradient id="align-grad" x1="6" y1="6" x2="34" y2="34" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="hsl(var(--primary))" />
          <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.7" />
        </linearGradient>
      </defs>
      {/* Soft container */}
      <rect x="0" y="0" width="40" height="40" rx="10" fill="hsl(var(--primary) / 0.08)" />
      {/* Outer arc */}
      <path
        d="M8 20 A12 12 0 0 1 32 20"
        stroke="url(#align-grad)"
        strokeWidth="2.4"
        strokeLinecap="round"
        fill="none"
      />
      {/* Middle arc */}
      <path
        d="M12 22 A8 8 0 0 1 28 22"
        stroke="url(#align-grad)"
        strokeWidth="2.2"
        strokeLinecap="round"
        fill="none"
        opacity="0.85"
      />
      {/* Inner arc */}
      <path
        d="M16 24 A4 4 0 0 1 24 24"
        stroke="url(#align-grad)"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
        opacity="0.75"
      />
      {/* Aligned center dot */}
      <circle cx="20" cy="28" r="2.2" fill="hsl(var(--primary))" />
    </svg>
    {withWordmark && (
      <span className={cn('text-base font-semibold tracking-tight text-foreground', wordmarkClassName)}>
        Align
      </span>
    )}
  </div>
);
