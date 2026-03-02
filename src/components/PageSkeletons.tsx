import { Skeleton } from '@/components/ui/skeleton';

// ─── Worker Home ─────────────────────────
export const WorkerHomeSkeleton = () => (
  <div className="min-h-screen bg-background pb-24">
    <header className="px-4 pt-8 pb-6">
      <Skeleton className="h-4 w-24 mb-2" />
      <Skeleton className="h-7 w-40 mb-1" />
      <Skeleton className="h-4 w-28" />
    </header>
    <div className="px-4 space-y-6">
      <div className="card-elevated rounded-2xl overflow-hidden">
        <div className="px-5 py-3 border-b border-border/50">
          <Skeleton className="h-4 w-28" />
        </div>
        <div className="p-5 space-y-4">
          <div className="text-center space-y-3">
            <Skeleton className="h-10 w-48 mx-auto" />
            <Skeleton className="h-4 w-36 mx-auto" />
          </div>
          <Skeleton className="h-12 w-full rounded-xl" />
        </div>
      </div>
      {[1, 2].map(i => (
        <div key={i} className="card-elevated rounded-xl p-4">
          <Skeleton className="h-4 w-20 mb-3" />
          <Skeleton className="h-5 w-40 mb-1" />
          <Skeleton className="h-4 w-32" />
        </div>
      ))}
    </div>
  </div>
);

// ─── Worker Shifts ───────────────────────
export const WorkerShiftsSkeleton = () => (
  <div className="min-h-screen bg-background pb-24">
    <header className="px-4 py-4 border-b border-border/50">
      <Skeleton className="h-5 w-24 mb-1" />
      <Skeleton className="h-3 w-16" />
    </header>
    <div className="px-4 py-6 space-y-6">
      {[1, 2, 3].map(group => (
        <div key={group} className="space-y-3">
          <Skeleton className="h-4 w-20" />
          {[1, 2].map(i => (
            <div key={i} className="card-elevated rounded-xl p-4">
              <Skeleton className="h-5 w-32 mb-2" />
              <div className="flex gap-4">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-20" />
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  </div>
);

// ─── Worker History ──────────────────────
export const WorkerHistorySkeleton = () => (
  <div className="min-h-screen bg-background pb-24">
    <header className="px-4 pt-6 pb-4">
      <Skeleton className="h-4 w-24 mb-2" />
      <Skeleton className="h-7 w-40" />
    </header>
    <div className="px-4 space-y-3">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="card-elevated rounded-xl p-4">
          <div className="flex items-center gap-3">
            <Skeleton className="w-4 h-4 rounded-full" />
            <div className="flex-1">
              <Skeleton className="h-4 w-40 mb-2" />
              <Skeleton className="h-3 w-48" />
            </div>
            <Skeleton className="w-5 h-5" />
          </div>
        </div>
      ))}
    </div>
  </div>
);

// ─── Worker Profile ──────────────────────
export const WorkerProfileSkeleton = () => (
  <div className="min-h-screen bg-background pb-24">
    <header className="px-4 pt-6 pb-4">
      <Skeleton className="h-5 w-16" />
    </header>
    <div className="px-4 space-y-6">
      <div className="card-elevated rounded-2xl p-6">
        <div className="flex items-center gap-4">
          <Skeleton className="w-20 h-20 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-40" />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="card-elevated rounded-xl p-4 text-center space-y-2">
          <Skeleton className="w-10 h-10 mx-auto rounded-lg" />
          <Skeleton className="h-7 w-12 mx-auto" />
          <Skeleton className="h-3 w-24 mx-auto" />
        </div>
        <div className="card-elevated rounded-xl p-4 text-center space-y-2">
          <Skeleton className="w-10 h-10 mx-auto rounded-lg" />
          <Skeleton className="h-7 w-12 mx-auto" />
          <Skeleton className="h-3 w-24 mx-auto" />
        </div>
      </div>
      <div className="card-elevated rounded-2xl p-5 space-y-3">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-3 w-full" />
      </div>
    </div>
  </div>
);

// ─── Worker Notifications ────────────────
export const WorkerNotificationsSkeleton = () => (
  <div className="min-h-screen bg-background pb-24">
    <header className="px-4 py-4 border-b border-border/50">
      <Skeleton className="h-5 w-28 mb-1" />
      <Skeleton className="h-3 w-16" />
    </header>
    <div className="px-4 py-4 space-y-2">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="p-4 rounded-xl bg-card">
          <div className="flex gap-3">
            <Skeleton className="w-8 h-8 rounded-lg flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

// ─── Manager Dashboard ───────────────────
export const ManagerDashboardSkeleton = () => (
  <div className="min-h-screen bg-background pb-8">
    <header className="px-4 pt-8 pb-6 lg:px-8">
      <Skeleton className="h-4 w-16 mb-2" />
      <Skeleton className="h-7 w-48 mb-1" />
      <Skeleton className="h-4 w-56" />
    </header>
    <div className="px-4 lg:px-8 space-y-6">
      <Skeleton className="h-20 w-full rounded-xl" />
      <div className="grid grid-cols-3 gap-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="card-elevated rounded-xl p-4 text-center space-y-2">
            <Skeleton className="h-8 w-12 mx-auto" />
            <Skeleton className="h-3 w-14 mx-auto" />
          </div>
        ))}
      </div>
      <div className="card-elevated rounded-xl p-4 space-y-4">
        <Skeleton className="h-5 w-32" />
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="h-16 rounded-lg" />
          <Skeleton className="h-16 rounded-lg" />
        </div>
      </div>
      {[1, 2].map(i => (
        <div key={i} className="card-elevated rounded-xl p-4 space-y-3">
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      ))}
    </div>
  </div>
);

// ─── Manager Shifts ──────────────────────
export const ManagerShiftsSkeleton = () => (
  <div className="min-h-screen bg-background pb-8">
    <header className="px-4 py-4 border-b border-border/50 lg:px-8">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-5 w-16 mb-1" />
          <Skeleton className="h-3 w-12" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-20 rounded-lg" />
          <Skeleton className="h-9 w-16 rounded-lg" />
        </div>
      </div>
    </header>
    <div className="px-4 py-6 lg:px-8 space-y-6">
      {[1, 2].map(group => (
        <div key={group} className="space-y-3">
          <Skeleton className="h-4 w-24" />
          {[1, 2].map(i => (
            <div key={i} className="card-elevated rounded-xl p-4 space-y-3">
              <div className="flex justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-5 w-28" />
                  <Skeleton className="h-4 w-40" />
                </div>
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
              <div className="flex gap-2">
                <Skeleton className="h-9 flex-1 rounded-lg" />
                <Skeleton className="h-9 flex-1 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  </div>
);

// ─── Manager Team ────────────────────────
export const ManagerTeamSkeleton = () => (
  <div className="min-h-screen bg-background pb-8">
    <header className="px-4 py-4 border-b border-border/50 lg:px-8 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-5 w-12 mb-1" />
          <Skeleton className="h-3 w-20" />
        </div>
        <Skeleton className="h-9 w-20 rounded-lg" />
      </div>
      <Skeleton className="h-10 w-full rounded-lg" />
    </header>
    <div className="px-4 py-6 lg:px-8 space-y-6">
      <div className="grid grid-cols-3 gap-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="card-elevated rounded-xl p-3 text-center space-y-2">
            <Skeleton className="h-6 w-8 mx-auto" />
            <Skeleton className="h-3 w-16 mx-auto" />
          </div>
        ))}
      </div>
      {[1, 2, 3].map(i => (
        <div key={i} className="card-elevated rounded-xl p-4">
          <div className="flex items-center gap-3">
            <Skeleton className="w-10 h-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-3 w-20" />
            </div>
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  </div>
);

// ─── Manager Analytics ───────────────────
export const ManagerAnalyticsSkeleton = () => (
  <div className="min-h-screen bg-background pb-8">
    <header className="px-4 py-4 border-b border-border/50 lg:px-8">
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-9 w-32 rounded-lg" />
      </div>
    </header>
    <div className="px-4 lg:px-8 py-6 space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="card-elevated rounded-xl p-4 space-y-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-7 w-12" />
          </div>
        ))}
      </div>
      <div className="card-elevated rounded-xl p-6 space-y-4">
        <Skeleton className="h-5 w-36" />
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
      <div className="card-elevated rounded-xl p-6 space-y-4">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    </div>
  </div>
);

// ─── Manager Requests ────────────────────
export const ManagerRequestsSkeleton = () => (
  <div className="min-h-screen bg-background pb-8">
    <header className="px-4 py-4 border-b border-border/50 lg:px-8">
      <Skeleton className="h-5 w-32" />
    </header>
    <div className="px-4 lg:px-8 py-6 space-y-4">
      <Skeleton className="h-10 w-full rounded-lg" />
      {[1, 2, 3].map(i => (
        <div key={i} className="card-elevated rounded-xl p-4">
          <div className="flex items-start gap-3">
            <Skeleton className="w-10 h-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-3 w-20" />
              <div className="flex gap-2">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  </div>
);

// ─── Manager Settings ────────────────────
export const ManagerSettingsSkeleton = () => (
  <div className="min-h-screen bg-background pb-8">
    <header className="px-4 py-4 border-b border-border/50 lg:px-8">
      <Skeleton className="h-5 w-20" />
    </header>
    <div className="px-4 lg:px-8 py-6 space-y-6 max-w-2xl">
      {[1, 2, 3].map(i => (
        <div key={i} className="card-elevated rounded-xl p-6 space-y-4">
          <div className="space-y-2">
            <Skeleton className="h-5 w-36" />
            <Skeleton className="h-3 w-56" />
          </div>
          <div className="space-y-3">
            <Skeleton className="h-10 w-full rounded-lg" />
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>
          <Skeleton className="h-10 w-28 rounded-lg" />
        </div>
      ))}
    </div>
  </div>
);
