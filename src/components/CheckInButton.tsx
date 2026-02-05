import { useState } from 'react';
import { cn } from '@/lib/utils';
 import { Check, MapPin, Fingerprint, AlertCircle, Loader2 } from 'lucide-react';

interface CheckInButtonProps {
  isCheckedIn: boolean;
  checkInTime?: string;
  onCheckIn: () => void;
  className?: string;
   requiresProximity?: boolean;
   isWithinProximity?: boolean | null;
   distanceMeters?: number | null;
   checkingLocation?: boolean;
   locationError?: string | null;
   onCheckLocation?: () => void;
}

export const CheckInButton: React.FC<CheckInButtonProps> = ({
  isCheckedIn,
  checkInTime,
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

  const handleCheckIn = () => {
    if (isCheckedIn) return;
     
     // If proximity is required but not verified, check location first
     if (requiresProximity && isWithinProximity === null && onCheckLocation) {
       onCheckLocation();
       return;
     }
     
     // If proximity check failed, don't allow check-in
     if (requiresProximity && isWithinProximity === false) {
       return;
     }
 
    setIsAnimating(true);
    setTimeout(() => {
      onCheckIn();
      setIsAnimating(false);
    }, 600);
  };

  if (isCheckedIn) {
    return (
      <div className={cn('text-center', className)}>
        <div className="w-24 h-24 mx-auto rounded-full bg-success-muted flex items-center justify-center mb-3">
          <div className="w-16 h-16 rounded-full bg-success flex items-center justify-center checkmark-animate">
            <Check className="w-8 h-8 text-success-foreground" strokeWidth={3} />
          </div>
        </div>
        <p className="text-lg font-semibold text-foreground">Checked In</p>
        {checkInTime && (
          <p className="text-sm text-muted-foreground mt-1">at {checkInTime}</p>
        )}
        <div className="flex items-center justify-center gap-1.5 mt-2 text-xs text-muted-foreground">
          <MapPin className="w-3 h-3" />
           <span>{requiresProximity ? 'Proximity verified' : 'Check-in complete'}</span>
        </div>
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
        className={cn(
          'w-24 h-24 mx-auto rounded-full bg-primary flex items-center justify-center transition-all duration-300',
           !buttonDisabled && 'checkin-glow hover:scale-105',
           (isAnimating || checkingLocation) && 'scale-95 opacity-80',
           showProximityWarning && 'bg-destructive/80'
        )}
      >
         {isAnimating || checkingLocation ? (
          <div className="w-8 h-8 border-3 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
         ) : showProximityWarning ? (
           <AlertCircle className="w-10 h-10 text-primary-foreground" strokeWidth={1.5} />
        ) : (
          <Fingerprint className="w-10 h-10 text-primary-foreground" strokeWidth={1.5} />
        )}
      </button>
       
       <p className="text-lg font-semibold text-foreground mt-3">
         {checkingLocation ? 'Checking Location...' : showProximityWarning ? 'Too Far Away' : 'Check In'}
       </p>
       
       {locationError ? (
         <p className="text-sm text-destructive mt-1">{locationError}</p>
       ) : showProximityWarning && distanceMeters ? (
         <p className="text-sm text-destructive mt-1">
           You are {Math.round(distanceMeters)}m away from the location
         </p>
       ) : showProximitySuccess ? (
         <p className="text-sm text-success mt-1 flex items-center justify-center gap-1">
           <MapPin className="w-3 h-3" />
           Within range - Tap to check in
         </p>
       ) : requiresProximity && isWithinProximity === null ? (
         <p className="text-sm text-muted-foreground mt-1">Tap to verify location</p>
       ) : (
         <p className="text-sm text-muted-foreground mt-1">Tap when you arrive</p>
       )}
    </div>
  );
};
