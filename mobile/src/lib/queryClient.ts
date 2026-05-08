import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      retry: (failureCount, error: any) => {
        const code = error?.code || error?.status;
        if (code === 'PGRST301' || code === 401 || code === 403) return false;
        return failureCount < 1;
      },
      refetchOnReconnect: true,
      refetchOnMount: true,
    },
    mutations: { retry: false },
  },
});

export const qk = {
  shifts: {
    all: ['shifts'] as const,
    byTeam: (teamId: string) => ['shifts', 'team', teamId] as const,
    byWorker: (workerId: string) => ['shifts', 'worker', workerId] as const,
    detail: (shiftId: string) => ['shifts', 'detail', shiftId] as const,
  },
  notifications: {
    byUser: (userId: string) => ['notifications', userId] as const,
  },
  team: {
    members: (teamId: string) => ['team', teamId, 'members'] as const,
    settings: (teamId: string) => ['team', teamId, 'settings'] as const,
  },
  swaps: {
    byTeam: (teamId: string) => ['swaps', 'team', teamId] as const,
  },
  callOffs: {
    byTeam: (teamId: string) => ['callOffs', 'team', teamId] as const,
  },
  shiftRequests: {
    byTeam: (teamId: string) => ['shiftRequests', 'team', teamId] as const,
  },
};
