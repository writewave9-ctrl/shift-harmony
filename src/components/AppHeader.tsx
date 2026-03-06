import { ThemeToggle } from '@/components/ThemeToggle';

interface AppHeaderProps {
  title?: string;
}

export const AppHeader = ({ title = 'Align' }: AppHeaderProps) => {
  return (
    <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-xl border-b border-border/40 px-4 h-14 flex items-center justify-between">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-sm">
          <span className="text-sm font-bold text-primary-foreground">A</span>
        </div>
        <span className="text-sm font-semibold text-foreground tracking-tight">{title}</span>
      </div>
      <ThemeToggle />
    </header>
  );
};
