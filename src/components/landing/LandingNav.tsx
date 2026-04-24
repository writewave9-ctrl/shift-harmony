import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';
import { AlignLogo } from '@/components/AlignLogo';
import { cn } from '@/lib/utils';

const scrollTo = (id: string) => {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
};

export const LandingNav = () => {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <nav
      className={cn(
        'sticky top-0 z-50 transition-all duration-300',
        scrolled
          ? 'bg-background/85 backdrop-blur-xl border-b border-border/60 shadow-soft'
          : 'bg-background/40 backdrop-blur-md border-b border-transparent',
      )}
    >
      <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
        <button
          onClick={() => navigate('/')}
          className="rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        >
          <AlignLogo size={34} withWordmark wordmarkClassName="text-[17px]" />
        </button>
        <div className="flex items-center gap-0.5 sm:gap-1">
          <button
            onClick={() => scrollTo('features')}
            className="hidden sm:inline-flex px-3.5 py-1.5 text-[13.5px] text-muted-foreground hover:text-foreground transition-colors rounded-lg"
          >
            Features
          </button>
          <button
            onClick={() => scrollTo('pricing')}
            className="hidden sm:inline-flex px-3.5 py-1.5 text-[13.5px] text-muted-foreground hover:text-foreground transition-colors rounded-lg"
          >
            Pricing
          </button>
          <button
            onClick={() => scrollTo('faq')}
            className="hidden sm:inline-flex px-3.5 py-1.5 text-[13.5px] text-muted-foreground hover:text-foreground transition-colors rounded-lg"
          >
            FAQ
          </button>
          <div className="w-px h-5 bg-border/60 mx-1.5 hidden sm:block" />
          <ThemeToggle />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/auth')}
            className="text-[13.5px] h-9"
          >
            Sign in
          </Button>
          <Button
            size="sm"
            onClick={() => navigate('/auth')}
            className="rounded-xl text-[13.5px] h-9 px-4 bg-gradient-primary shadow-soft hover:shadow-elevated transition-shadow"
          >
            Get started
          </Button>
        </div>
      </div>
    </nav>
  );
};
