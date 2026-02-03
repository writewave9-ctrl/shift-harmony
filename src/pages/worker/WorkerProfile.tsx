import { currentWorker } from '@/data/mockData';
import { ChevronLeft, User, Clock, TrendingUp, Star, Settings, LogOut, Moon, Sun } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useTheme } from '@/components/ThemeProvider';

export const WorkerProfile = () => {
  const navigate = useNavigate();
  const { setUserRole } = useApp();
  const { theme, setTheme, resolvedTheme } = useTheme();

  const hoursRemaining = currentWorker.weeklyHoursTarget - currentWorker.weeklyHoursWorked;

  const willingnessLabels = {
    high: 'Always available',
    medium: 'Sometimes available',
    low: 'Prefer not',
  };

  const willingnessColors = {
    high: 'text-success',
    medium: 'text-warning-foreground',
    low: 'text-muted-foreground',
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border/50 px-4 py-4">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/worker')}
            className="p-2 -ml-2 rounded-lg hover:bg-accent transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-semibold text-foreground">Profile</h1>
        </div>
      </header>

      <div className="px-4 py-6 space-y-6">
        {/* Profile Card */}
        <section className="card-elevated rounded-2xl p-6 text-center">
          <div className="w-20 h-20 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <User className="w-10 h-10 text-primary" />
          </div>
          <h2 className="text-xl font-bold text-foreground">{currentWorker.name}</h2>
          <p className="text-muted-foreground">{currentWorker.position}</p>
          <p className="text-sm text-muted-foreground mt-1">{currentWorker.email}</p>
        </section>

        {/* Stats */}
        <section className="card-elevated rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">This Week</h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-muted-foreground">
                <Clock className="w-4 h-4" />
                Hours Worked
              </span>
              <div className="text-right">
                <span className="font-semibold text-foreground">
                  {currentWorker.weeklyHoursWorked}h
                </span>
                <span className="text-muted-foreground"> / {currentWorker.weeklyHoursTarget}h</span>
              </div>
            </div>

            <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary rounded-full transition-all"
                style={{ width: `${(currentWorker.weeklyHoursWorked / currentWorker.weeklyHoursTarget) * 100}%` }}
              />
            </div>

            {hoursRemaining > 0 && (
              <p className="text-sm text-success font-medium">
                {hoursRemaining} hours available to pick up
              </p>
            )}
          </div>
        </section>

        {/* Preferences */}
        <section className="card-elevated rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Preferences</h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-muted-foreground">
                <TrendingUp className="w-4 h-4" />
                Extra Shifts
              </span>
              <span className={`font-medium ${willingnessColors[currentWorker.willingnessForExtra]}`}>
                {willingnessLabels[currentWorker.willingnessForExtra]}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-muted-foreground">
                <Star className="w-4 h-4" />
                Your Reliability
              </span>
              <div className="flex items-center gap-2">
                <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-success rounded-full"
                    style={{ width: `${currentWorker.reliabilityScore}%` }}
                  />
                </div>
                <span className="text-sm font-medium">{currentWorker.reliabilityScore}%</span>
              </div>
            </div>
          </div>
        </section>

        {/* Appearance */}
        <section className="card-elevated rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Appearance</h3>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-muted-foreground">
              {resolvedTheme === 'dark' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
              Theme
            </span>
            <div className="flex items-center gap-2">
              <span className="text-sm capitalize">{theme}</span>
              <ThemeToggle />
            </div>
          </div>
        </section>

        {/* Actions */}
        <section className="space-y-2">
          <button className="w-full card-elevated rounded-xl p-4 flex items-center gap-3 hover:bg-accent/50 transition-colors">
            <Settings className="w-5 h-5 text-muted-foreground" />
            <span className="font-medium">Settings</span>
          </button>
          
          <button 
            onClick={() => {
              setUserRole('manager');
              navigate('/manager');
            }}
            className="w-full card-elevated rounded-xl p-4 flex items-center gap-3 hover:bg-accent/50 transition-colors"
          >
            <LogOut className="w-5 h-5 text-muted-foreground" />
            <span className="font-medium">Switch to Manager View</span>
          </button>
        </section>
      </div>
    </div>
  );
};
