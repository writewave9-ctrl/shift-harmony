import { ThemeToggle } from '@/components/ThemeToggle';
import { useAuth } from '@/contexts/AuthContext';

interface AppHeaderProps {
  title?: string;
}

export const AppHeader = ({ title = 'Align' }: AppHeaderProps) => {
  return (
    <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-lg border-b border-border/50 px-4 h-12 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
          <span className="text-xs font-bold text-primary-foreground">A</span>
        </div>
        <span className="text-sm font-bold text-foreground">{title}</span>
      </div>
      <ThemeToggle />
    </header>
  );
};
