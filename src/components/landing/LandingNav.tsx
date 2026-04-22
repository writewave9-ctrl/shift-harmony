import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';
import { AlignLogo } from '@/components/AlignLogo';

const scrollTo = (id: string) => {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
};

export const LandingNav = () => {
  const navigate = useNavigate();

  return (
    <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/40">
      <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
        <AlignLogo size={36} withWordmark wordmarkClassName="text-lg" />
        <div className="flex items-center gap-1 sm:gap-3">
          <button onClick={() => scrollTo('features')} className="hidden sm:inline-flex px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">Features</button>
          <button onClick={() => scrollTo('pricing')} className="hidden sm:inline-flex px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">Pricing</button>
          <button onClick={() => scrollTo('faq')} className="hidden sm:inline-flex px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">FAQ</button>
          <ThemeToggle />
          <Button variant="ghost" size="sm" onClick={() => navigate('/auth')} className="text-sm">
            Sign in
          </Button>
          <Button size="sm" onClick={() => navigate('/auth')} className="rounded-xl text-sm">
            Get Started
          </Button>
        </div>
      </div>
    </nav>
  );
};
