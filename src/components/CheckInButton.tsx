import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Check, MapPin, Fingerprint } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CheckInButtonProps {
  isCheckedIn: boolean;
  checkInTime?: string;
  onCheckIn: () => void;
  className?: string;
}

export const CheckInButton: React.FC<CheckInButtonProps> = ({
  isCheckedIn,
  checkInTime,
  onCheckIn,
  className,
}) => {
  const [isAnimating, setIsAnimating] = useState(false);

  const handleCheckIn = () => {
    if (isCheckedIn) return;
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
          <span>Proximity verified</span>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('text-center', className)}>
      <button
        onClick={handleCheckIn}
        disabled={isAnimating}
        className={cn(
          'w-24 h-24 mx-auto rounded-full bg-primary flex items-center justify-center transition-all duration-300',
          !isAnimating && 'checkin-glow hover:scale-105',
          isAnimating && 'scale-95 opacity-80'
        )}
      >
        {isAnimating ? (
          <div className="w-8 h-8 border-3 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
        ) : (
          <Fingerprint className="w-10 h-10 text-primary-foreground" strokeWidth={1.5} />
        )}
      </button>
      <p className="text-lg font-semibold text-foreground mt-3">Check In</p>
      <p className="text-sm text-muted-foreground mt-1">Tap when you arrive</p>
    </div>
  );
};
