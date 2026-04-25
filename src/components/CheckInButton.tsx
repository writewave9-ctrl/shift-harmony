import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { Check, MapPin, Fingerprint, AlertCircle, ShieldCheck, Clock4 } from 'lucide-react';

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
      </div>
    );
  }

  const showProximityWarning = requiresProximity && isWithinProximity === false;
  const showProximitySuccess = requiresProximity && isWithinProximity === true;
  const buttonDisabled = isAnimating || checkingLocation || showProximityWarning;

  return (
    <div className={cn('text-center', className)}>
      <button
        onClick={handleCheckIn}
        disabled={buttonDisabled}
        aria-label="Check in"
        className={cn(
          'w-28 h-28 mx-auto rounded-full bg-primary flex items-center justify-center transition-all duration-300 shadow-floating',
          !buttonDisabled && 'checkin-glow hover:scale-105 active:scale-95',
          (isAnimating || checkingLocation) && 'scale-95 opacity-80',
          showProximityWarning && 'bg-destructive/85',
        )}
      >
        {isAnimating || checkingLocation ? (
          <div className="w-9 h-9 border-[3px] border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
        ) : showProximityWarning ? (
          <AlertCircle className="w-11 h-11 text-primary-foreground" strokeWidth={1.5} />
        ) : (
          <Fingerprint className="w-11 h-11 text-primary-foreground" strokeWidth={1.5} />
        )}
      </button>

      <p className="font-display text-[19px] font-semibold text-foreground mt-3 tracking-tight">
        {checkingLocation ? 'Checking location…' : showProximityWarning ? 'Too far away' : 'Tap to check in'}
      </p>

      <span className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-muted text-muted-foreground ring-1 ring-border">
        Not checked in
      </span>

      {locationError ? (
        <p className="text-sm text-destructive mt-1.5">{locationError}</p>
      ) : showProximityWarning && distanceMeters ? (
        <p className="text-sm text-destructive mt-1.5">
          You are {Math.round(distanceMeters)}m away from the location
        </p>
      ) : showProximitySuccess ? (
        <p className="text-sm text-success mt-1.5 flex items-center justify-center gap-1">
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
