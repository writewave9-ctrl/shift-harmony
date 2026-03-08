export const LandingFooter = () => (
  <footer className="border-t border-border/40 py-8">
    <div className="max-w-6xl mx-auto px-5 flex flex-col sm:flex-row items-center justify-between gap-4">
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
          <span className="text-xs font-bold text-primary">A</span>
        </div>
        <span className="text-sm text-muted-foreground">&copy; 2026 Align. All rights reserved.</span>
      </div>
      <div className="flex items-center gap-6 text-sm text-muted-foreground">
        <button className="hover:text-foreground transition-colors">Privacy</button>
        <button className="hover:text-foreground transition-colors">Terms</button>
        <button className="hover:text-foreground transition-colors">Support</button>
      </div>
    </div>
  </footer>
);
