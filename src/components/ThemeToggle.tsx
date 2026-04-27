import { Moon, Sun } from 'lucide-react';
import { useTheme } from './ThemeProvider';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { haptics } from '@/lib/haptics';

interface ThemeToggleProps {
  className?: string;
  /** Visual size — matches header icon button by default */
  size?: 'sm' | 'md';
}

/**
 * One-click light/dark toggle.
 *
 * No menu. No "system" option (it lives in profile if the user wants it).
 * A single tap flips the resolved theme — fast, decisive, premium.
 * The icon cross-fades and gently rotates for a tactile feel.
 */
export const ThemeToggle = ({ className, size = 'md' }: ThemeToggleProps) => {
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const dimensions = size === 'sm' ? 'h-8 w-8' : 'h-9 w-9';

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      onClick={() => {
        haptics.light();
        setTheme(isDark ? 'light' : 'dark');
      }}
      className={cn(
        dimensions,
        'relative overflow-hidden rounded-full border border-border/40 bg-card/60 backdrop-blur-md',
        'transition-all duration-300 hover:border-primary/30 hover:bg-card hover:shadow-glow',
        className,
      )}
    >
      <Sun
        className={cn(
          'absolute h-[1.05rem] w-[1.05rem] transition-all duration-500 ease-out',
          isDark
            ? 'rotate-90 scale-50 opacity-0'
            : 'rotate-0 scale-100 opacity-100 text-warning',
        )}
      />
      <Moon
        className={cn(
          'absolute h-[1.05rem] w-[1.05rem] transition-all duration-500 ease-out',
          isDark
            ? 'rotate-0 scale-100 opacity-100 text-primary'
            : '-rotate-90 scale-50 opacity-0',
        )}
      />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
};
