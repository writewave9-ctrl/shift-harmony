import { useState } from 'react';
import { cn } from '@/lib/utils';
import { WorkerCard } from '@/components/WorkerCard';
import { workers } from '@/data/mockData';
import { 
  ChevronLeft, 
  Users,
  Search,
  TrendingUp,
  TrendingDown,
  Minus
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Worker } from '@/types/align';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export const ManagerTeam = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null);

  const filteredWorkers = workers.filter(w => 
    w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    w.position.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Categorize workers
  const overloaded = filteredWorkers.filter(w => w.weeklyHoursWorked >= w.weeklyHoursTarget);
  const available = filteredWorkers.filter(w => 
    w.weeklyHoursWorked < w.weeklyHoursTarget && 
    w.willingnessForExtra !== 'low'
  );
  const balanced = filteredWorkers.filter(w => 
    w.weeklyHoursWorked < w.weeklyHoursTarget && 
    w.willingnessForExtra === 'low'
  );

  return (
    <div className="min-h-screen bg-background pb-8">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border/50 px-4 py-4 lg:px-8">
        <div className="flex items-center gap-3 mb-4">
          <button 
            onClick={() => navigate('/manager')}
            className="p-2 -ml-2 rounded-lg hover:bg-accent transition-colors lg:hidden"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-lg font-semibold text-foreground">Team</h1>
            <p className="text-xs text-muted-foreground">{workers.length} members</p>
          </div>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or position..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </header>

      <div className="px-4 py-6 lg:px-8 space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-3">
          <div className="card-elevated rounded-xl p-3 text-center">
            <div className="flex items-center justify-center gap-1 text-success mb-1">
              <TrendingUp className="w-4 h-4" />
              <span className="text-xl font-bold">{available.length}</span>
            </div>
            <p className="text-xs text-muted-foreground">Available</p>
          </div>
          <div className="card-elevated rounded-xl p-3 text-center">
            <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
              <Minus className="w-4 h-4" />
              <span className="text-xl font-bold">{balanced.length}</span>
            </div>
            <p className="text-xs text-muted-foreground">Balanced</p>
          </div>
          <div className="card-elevated rounded-xl p-3 text-center">
            <div className="flex items-center justify-center gap-1 text-warning mb-1">
              <TrendingDown className="w-4 h-4" />
              <span className="text-xl font-bold">{overloaded.length}</span>
            </div>
            <p className="text-xs text-muted-foreground">At Capacity</p>
          </div>
        </div>

        {/* Available for More */}
        {available.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-success" />
              Can Take More Shifts
            </h2>
            <div className="space-y-3">
              {available.map(worker => (
                <WorkerCard
                  key={worker.id}
                  worker={worker}
                  showReliability
                  onClick={() => setSelectedWorker(worker)}
                />
              ))}
            </div>
          </section>
        )}

        {/* Balanced */}
        {balanced.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <Minus className="w-4 h-4 text-muted-foreground" />
              Prefer Current Load
            </h2>
            <div className="space-y-3">
              {balanced.map(worker => (
                <WorkerCard
                  key={worker.id}
                  worker={worker}
                  showReliability
                  onClick={() => setSelectedWorker(worker)}
                />
              ))}
            </div>
          </section>
        )}

        {/* At Capacity */}
        {overloaded.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-warning" />
              At or Over Target
            </h2>
            <div className="space-y-3">
              {overloaded.map(worker => (
                <WorkerCard
                  key={worker.id}
                  worker={worker}
                  showReliability
                  onClick={() => setSelectedWorker(worker)}
                />
              ))}
            </div>
          </section>
        )}

        {filteredWorkers.length === 0 && (
          <div className="text-center py-12">
            <Users className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">No team members found</p>
          </div>
        )}
      </div>

      {/* Worker Detail Dialog */}
      <Dialog open={!!selectedWorker} onOpenChange={() => setSelectedWorker(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedWorker?.name}</DialogTitle>
          </DialogHeader>
          
          {selectedWorker && (
            <div className="space-y-4 pt-4">
              <WorkerCard
                worker={selectedWorker}
                showReliability
                showHours
              />
              
              <div className="p-4 rounded-xl bg-accent/50 border border-border/50">
                <p className="text-xs font-medium text-muted-foreground mb-2">CONTACT</p>
                <p className="text-sm">{selectedWorker.email}</p>
                {selectedWorker.phone && (
                  <p className="text-sm text-muted-foreground">{selectedWorker.phone}</p>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
