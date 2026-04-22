/**
 * Swap request countdown helpers.
 * "Due" is calculated against the shift start time — once the shift starts,
 * a pending swap is no longer actionable.
 */
export interface ShiftLite {
  date: string;       // 'YYYY-MM-DD'
  start_time: string; // 'HH:MM[:SS]'
}

export interface CountdownInfo {
  /** Short label like "Due in 2h", "Due in 35m", "Due now", "Overdue" */
  label: string;
  /** Tone for badge styling */
  tone: 'urgent' | 'soon' | 'normal' | 'overdue';
  /** Total minutes remaining (negative if past) */
  minutesRemaining: number;
}

export function getSwapCountdown(shift?: ShiftLite | null): CountdownInfo | null {
  if (!shift?.date || !shift?.start_time) return null;
  const [h, m] = shift.start_time.split(':').map(Number);
  const target = new Date(shift.date);
  target.setHours(h || 0, m || 0, 0, 0);
  const diffMs = target.getTime() - Date.now();
  const minutes = Math.round(diffMs / 60000);

  if (minutes < -5) return { label: 'Overdue', tone: 'overdue', minutesRemaining: minutes };
  if (minutes <= 5) return { label: 'Due now', tone: 'urgent', minutesRemaining: minutes };
  if (minutes < 60) return { label: `Due in ${minutes}m`, tone: 'urgent', minutesRemaining: minutes };

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    const tone: CountdownInfo['tone'] = hours < 4 ? 'urgent' : hours < 12 ? 'soon' : 'normal';
    return { label: `Due in ${hours}h`, tone, minutesRemaining: minutes };
  }
  const days = Math.floor(hours / 24);
  return { label: `Due in ${days}d`, tone: 'normal', minutesRemaining: minutes };
}
