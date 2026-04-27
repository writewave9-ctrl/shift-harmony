import { ThemeToggle } from '@/components/ThemeToggle';
import { AlignLogo } from '@/components/AlignLogo';
import { WorkspaceSwitcher } from '@/components/WorkspaceSwitcher';

interface AppHeaderProps {
  title?: string;
  showWorkspaceSwitcher?: boolean;
}

export const AppHeader = ({ title = 'Align', showWorkspaceSwitcher = true }: AppHeaderProps) => {
  return (
    <header className="sticky top-0 z-50 bg-gradient-nav backdrop-blur-2xl border-b border-border/40 shadow-soft px-4 h-14 flex items-center justify-between">
      <div className="flex items-center gap-2.5 min-w-0">
        <AlignLogo size={30} />
        <span className="font-display text-[16px] font-semibold text-foreground tracking-[-0.02em] truncate">
          {title}
        </span>
      </div>
      <div className="flex items-center gap-1.5">
        {showWorkspaceSwitcher && <WorkspaceSwitcher />}
        <ThemeToggle />
      </div>
    </header>
  );
};
