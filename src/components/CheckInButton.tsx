import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { Check, MapPin, Fingerprint, AlertCircle, ShieldCheck, Clock4, RotateCw, ChevronDown, HelpCircle, Settings, Wifi } from 'lucide-react';

export type AttendanceState = 'not_checked_in' | 'present' | 'late' | 'manually_approved';

interface CheckInButtonProps {
  isCheckedIn: boolean;
  checkInTime?: string;
  /** Server-side attendance status to drive visual variant */
  attendanceStatus?: AttendanceState;
  /** True if a manager overrode the worker's status */
  isManagerOverride?: boolean;
  /** Optional reason chip from manager override */
  overrideReason?: string | null;
  onCheckIn: () => void;
  className?: string;
  requiresProximity?: boolean;
  isWithinProximity?: boolean | null;
  distanceMeters?: number | null;
  checkingLocation?: boolean;
  locationError?: string | null;
  onCheckLocation?: () => void;
}

const STATE_THEME: Record<AttendanceState, {
  ringBg: string;
  innerBg: string;
  icon: React.ElementType;
  iconColor: string;
  label: string;
  pillClass: string;
}> = {
  present: {
    ringBg: 'bg-success-muted',
    innerBg: 'bg-success',
    icon: Check,
    iconColor: 'text-success-foreground',
    label: 'Present',
    pillClass: 'bg-success-muted text-success ring-1 ring-success/25',
  },
  late: {
    ringBg: 'bg-warning-muted',
    innerBg: 'bg-warning',
    icon: Clock4,
    iconColor: 'text-warning-foreground',
    label: 'Late',
    pillClass: 'bg-warning-muted text-warning ring-1 ring-warning/30',
  },
  manually_approved: {
    ringBg: 'bg-info-muted',
    innerBg: 'bg-info',
    icon: ShieldCheck,
    iconColor: 'text-info-foreground',
    label: 'Manually approved',
    pillClass: 'bg-info-muted text-info ring-1 ring-info/25',
  },
  not_checked_in: {
    ringBg: 'bg-muted',
    innerBg: 'bg-muted-foreground/40',
    icon: AlertCircle,
    iconColor: 'text-muted-foreground',
    label: 'Not checked in',
    pillClass: 'bg-muted text-muted-foreground ring-1 ring-border',
  },
};

export const CheckInButton: React.FC<CheckInButtonProps> = ({
  isCheckedIn,
  checkInTime,
  attendanceStatus = 'present',
  isManagerOverride = false,
  overrideReason = null,
  onCheckIn,
  className,
  requiresProximity = false,
  isWithinProximity = null,
  distanceMeters = null,
  checkingLocation = false,
  locationError = null,
  onCheckLocation,
}) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [showRipple, setShowRipple] = useState(false);

  // Trigger a one-shot ripple when transitioning from not-checked-in to checked-in
  useEffect(() => {
    if (isCheckedIn) {
      setShowRipple(true);
      const t = setTimeout(() => setShowRipple(false), 1400);
      return () => clearTimeout(t);
    }
  }, [isCheckedIn]);

  const handleCheckIn = () => {
    if (isCheckedIn) return;
    if (requiresProximity && isWithinProximity === null && onCheckLocation) {
      onCheckLocation();
      return;
    }
    if (requiresProximity && isWithinProximity === false) return;

    setIsAnimating(true);
    setTimeout(() => {
      onCheckIn();
      setIsAnimating(false);
    }, 600);
  };

  if (isCheckedIn) {
    const theme = STATE_THEME[attendanceStatus];
    const Icon = theme.icon;

    return (
      <div className={cn('text-center', className)}>
        <div className="relative w-28 h-28 mx-auto">
          {/* Animated ripple ring on first check-in */}
          {showRipple && (
            <>
              <span
                aria-hidden
                className="absolute inset-0 rounded-full bg-primary/25 animate-[checkin-ripple_1.2s_ease-out_forwards]"
              />
              <span
                aria-hidden
                className="absolute inset-0 rounded-full bg-primary/15 animate-[checkin-ripple_1.2s_ease-out_0.15s_forwards]"
              />
            </>
          )}
          <div
            className={cn(
              'relative w-28 h-28 rounded-full flex items-center justify-center transition-colors duration-500',
              theme.ringBg,
            )}
          >
            <div
              className={cn(
                'w-[72px] h-[72px] rounded-full flex items-center justify-center shadow-floating transition-all duration-500',
                theme.innerBg,
                'checkmark-animate',
              )}
            >
              <Icon className={cn('w-9 h-9', theme.iconColor)} strokeWidth={3} />
            </div>
          </div>
        </div>

        <p className="font-display text-[19px] font-semibold text-foreground mt-4 tracking-tight">
          {attendanceStatus === 'not_checked_in' ? 'Awaiting check-in' : 'Checked in'}
        </p>

        <div className="mt-2 flex items-center justify-center gap-1.5 flex-wrap">
          <span className={cn('inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full', theme.pillClass)}>
            <Icon className="w-3 h-3" /> {theme.label}
          </span>
          {isManagerOverride && (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-accent text-accent-foreground ring-1 ring-border">
              <ShieldCheck className="w-3 h-3" /> Manager override
            </span>
          )}
        </div>

        {checkInTime && (
          <p className="text-sm text-muted-foreground mt-1.5">
            Logged at <span className="text-foreground font-medium">{checkInTime}</span>
          </p>
        )}

        {isManagerOverride && overrideReason && (
          <p className="text-[11px] text-muted-foreground mt-1 italic max-w-[16rem] mx-auto">
            "{overrideReason}"
          </p>
        )}

        {!isManagerOverride && (
          <div className="flex items-center justify-center gap-1.5 mt-2 text-xs text-muted-foreground">
            <MapPin className="w-3 h-3" />
            <span>{requiresProximity ? 'Proximity verified' : 'Check-in complete'}</span>
          </div>
        )}

        {/* Late — expanded troubleshooting w/ step-by-step guidance */}
        {attendanceStatus === 'late' && !isManagerOverride && (
          <CheckInTroubleshootingCard
            variant="late"
            className="mt-3"
          />
        )}

        {/* Helper text under "Not Checked In" (after a positive override that still shows not_checked_in) */}
        {attendanceStatus === 'not_checked_in' && (
          <div className="mt-2 max-w-[18rem] mx-auto">
            <p className="text-[11px] text-muted-foreground leading-snug">
              We didn't record a check-in. Tap below to try again — make sure location is enabled if your shift requires proximity.
            </p>
            <button
              type="button"
              onClick={onCheckIn}
              className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded press"
            >
              <RotateCw className="w-3 h-3" />
              Try check-in again
            </button>
          </div>
        )}
      </div>
    );
  }

  const showProximityWarning = requiresProximity && isWithinProximity === false;
  const showProximitySuccess = requiresProximity && isWithinProximity === true;
  const buttonDisabled = isAnimating || checkingLocation || showProximityWarning;

  return (
    <div className={cn('text-center', className)}>
      <div className="relative w-32 h-32 mx-auto">
        {/* Animated proximity progress ring while checking location */}
        {checkingLocation && (
          <svg
            className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none"
            viewBox="0 0 100 100"
            aria-hidden
          >
            <circle cx="50" cy="50" r="46" stroke="currentColor" strokeWidth="3"
              className="text-primary/15" fill="none" />
            <circle cx="50" cy="50" r="46" stroke="currentColor" strokeWidth="3"
              strokeLinecap="round" className="text-primary" fill="none"
              strokeDasharray="289" strokeDashoffset="72"
              style={{ animation: 'spin 1.4s linear infinite', transformOrigin: '50% 50%' }}
            />
          </svg>
        )}
        <button
          onClick={handleCheckIn}
          disabled={buttonDisabled}
          aria-label={showProximityWarning ? 'Out of range — cannot check in' : 'Check in'}
          aria-disabled={buttonDisabled}
          className={cn(
            // Larger 128px tap target with comfortable hit area
            'absolute inset-2 mx-auto rounded-full bg-primary flex items-center justify-center transition-all duration-300 shadow-floating focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 focus-visible:ring-offset-background',
            !buttonDisabled && 'checkin-glow hover:scale-[1.04] active:scale-95',
            (isAnimating || checkingLocation) && 'scale-95 opacity-90',
            showProximityWarning && 'bg-destructive',
          )}
        >
          {isAnimating ? (
            <div className="w-10 h-10 border-[3px] border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" aria-label="Loading" />
          ) : checkingLocation ? (
            <MapPin className="w-12 h-12 text-primary-foreground animate-pulse" strokeWidth={1.6} />
          ) : showProximityWarning ? (
            <AlertCircle className="w-12 h-12 text-destructive-foreground" strokeWidth={1.8} />
          ) : (
            <Fingerprint className="w-12 h-12 text-primary-foreground" strokeWidth={1.5} />
          )}
        </button>
      </div>

      <p className="font-display text-[19px] font-semibold text-foreground mt-3 tracking-tight">
        {checkingLocation ? 'Verifying location…' : showProximityWarning ? 'Too far away' : 'Tap to check in'}
      </p>

      <span className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-muted text-muted-foreground ring-1 ring-border">
        Not checked in
      </span>

      {locationError ? (
        <div role="alert" className="mt-3 mx-auto max-w-xs rounded-xl border border-destructive/25 bg-destructive-muted px-3 py-2.5 text-left">
          <p className="text-xs font-semibold text-destructive flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5" />
            Location unavailable
          </p>
          <p className="text-[11px] text-destructive/85 mt-1">{locationError}</p>
          {onCheckLocation && (
            <button
              type="button"
              onClick={onCheckLocation}
              className="mt-2 text-[11px] font-semibold text-destructive underline hover:no-underline"
            >
              Try again
            </button>
          )}
        </div>
      ) : showProximityWarning && distanceMeters ? (
        <div role="alert" className="mt-3 mx-auto max-w-xs rounded-xl border border-destructive/25 bg-destructive-muted px-3 py-2.5">
          <p className="text-xs font-semibold text-destructive">Out of range</p>
          <p className="text-[11px] text-destructive/85 mt-0.5">
            You're <span className="font-semibold">{Math.round(distanceMeters)}m</span> away — move closer, then re-verify your location.
          </p>
          {onCheckLocation && (
            <button
              type="button"
              onClick={onCheckLocation}
              className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-semibold text-destructive underline hover:no-underline"
            >
              <RotateCw className="w-3 h-3" />
              Try again
            </button>
          )}
        </div>
      ) : showProximitySuccess ? (
        <p className="text-sm text-success mt-1.5 flex items-center justify-center gap-1 font-medium">
          <MapPin className="w-3 h-3" />
          Within range — Tap to check in
        </p>
      ) : requiresProximity && isWithinProximity === null ? (
        <p className="text-sm text-muted-foreground mt-1.5">Tap to verify location</p>
      ) : (
        <p className="text-sm text-muted-foreground mt-1.5">Tap when you arrive</p>
      )}
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* Troubleshooting card — expandable guidance for late / out-of-range states. */
/* -------------------------------------------------------------------------- */

interface TroubleshootingCardProps {
  variant: 'late' | 'out_of_range' | 'location_error';
  onRetry?: () => void;
  retryLabel?: string;
  /** Recommended seconds to wait before retrying (used for retry-timing copy). */
  retryWaitSeconds?: number;
  className?: string;
}

const STEPS_LATE = [
  'Open the shift conversation and tell your team you’re on the way.',
  'Check in as soon as you arrive — managers can adjust the timestamp later.',
  'If you can’t reach the venue, request a call-off from the shift screen.',
];

const STEPS_OUT_OF_RANGE = [
  'Move closer to the venue — check-in needs you within the radius.',
  'Make sure phone location is enabled (Settings → Privacy → Location).',
  'Step outside if you’re indoors — GPS struggles through thick walls.',
  'Wait ~10 seconds for a fresh fix, then tap “Try again”.',
];

const STEPS_LOCATION_ERROR = [
  'Allow location access for this site in your browser settings.',
  'Toggle Wi-Fi or cellular data off and back on to refresh the signal.',
  'Reload the page if permissions were denied earlier in this session.',
  'Wait ~10 seconds, then tap “Try again”.',
];

export const CheckInTroubleshootingCard: React.FC<TroubleshootingCardProps> = ({
  variant,
  onRetry,
  retryLabel = 'Try again',
  retryWaitSeconds = 10,
  className,
}) => {
  const [open, setOpen] = useState(false);

  const config = {
    late: {
      title: 'Trouble checking in on time?',
      icon: Clock4,
      tone: 'warning' as const,
      steps: STEPS_LATE,
    },
    out_of_range: {
      title: 'Out of range — what to try',
      icon: MapPin,
      tone: 'destructive' as const,
      steps: STEPS_OUT_OF_RANGE,
    },
    location_error: {
      title: 'Location unavailable — what to try',
      icon: Wifi,
      tone: 'destructive' as const,
      steps: STEPS_LOCATION_ERROR,
    },
  }[variant];

  const Icon = config.icon;
  const isWarn = config.tone === 'warning';

  return (
    <div
      className={cn(
        'mx-auto max-w-xs rounded-xl border text-left overflow-hidden',
        isWarn
          ? 'border-warning/25 bg-warning-muted/40'
          : 'border-destructive/20 bg-destructive-muted/40',
        className,
      )}
    >
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        className={cn(
          'w-full flex items-center gap-2 px-3 py-2.5 text-left press',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-xl',
        )}
      >
        <span className={cn(
          'inline-flex items-center justify-center w-6 h-6 rounded-lg shrink-0',
          isWarn ? 'bg-warning/15 text-warning' : 'bg-destructive/15 text-destructive',
        )}>
          <Icon className="w-3.5 h-3.5" />
        </span>
        <span className={cn(
          'flex-1 text-[12px] font-semibold tracking-tight',
          isWarn ? 'text-warning' : 'text-destructive',
        )}>
          {config.title}
        </span>
        <ChevronDown
          className={cn(
            'w-3.5 h-3.5 transition-transform shrink-0',
            isWarn ? 'text-warning/70' : 'text-destructive/70',
            open && 'rotate-180',
          )}
          aria-hidden
        />
      </button>

      {open && (
        <div className="px-3 pb-3 -mt-0.5">
          <ol className="space-y-1.5 list-none">
            {config.steps.map((step, i) => (
              <li key={i} className="flex items-start gap-2 text-[11px] leading-snug text-foreground/85">
                <span className={cn(
                  'inline-flex w-4 h-4 rounded-full text-[9px] font-bold items-center justify-center shrink-0 mt-0.5 tabular-nums',
                  isWarn ? 'bg-warning/20 text-warning' : 'bg-destructive/15 text-destructive',
                )}>
                  {i + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>

          {variant !== 'late' && (
            <p className="mt-2 text-[10px] text-muted-foreground flex items-center gap-1">
              <HelpCircle className="w-3 h-3" />
              Wait ~{retryWaitSeconds}s between attempts so we can get a fresh location.
            </p>
          )}

          {variant === 'location_error' && (
            <p className="mt-1.5 text-[10px] text-muted-foreground flex items-start gap-1">
              <Settings className="w-3 h-3 mt-0.5 shrink-0" />
              <span>
                Browser address bar: tap the lock icon → Site settings → Location →
                <span className="font-semibold"> Allow</span>.
              </span>
            </p>
          )}

          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className={cn(
                'mt-3 w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-[12px] font-semibold press',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                isWarn
                  ? 'bg-warning text-warning-foreground hover:opacity-95'
                  : 'bg-destructive text-destructive-foreground hover:opacity-95',
              )}
            >
              <RotateCw className="w-3 h-3" />
              {retryLabel}
            </button>
          )}
        </div>
      )}
    </div>
  );
};
