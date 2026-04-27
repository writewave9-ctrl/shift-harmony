import { QueryClient, QueryCache, MutationCache } from '@tanstack/react-query';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

/**
 * Production-grade React Query client.
 *
 * - Sensible stale times so we don't hammer the API but feel fresh.
 * - Smart retry: 1 attempt for queries, none for mutations (we want
 *   immediate user feedback, not silent retries on intent-to-write).
 * - Refetch on window focus + reconnect — feels "live" without polling.
 * - Centralized error reporting via the sanitized logger; user-facing
 *   toasts only when meta.silent !== true.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      retry: (failureCount, error: any) => {
        // Don't retry on auth / permission errors
        const code = error?.code || error?.status;
        if (code === 'PGRST301' || code === 401 || code === 403) return false;
        return failureCount < 1;
      },
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      refetchOnMount: true,
    },
    mutations: {
      retry: false,
    },
  },
  queryCache: new QueryCache({
    onError: (error, query) => {
      logger.error('[query]', { key: query.queryKey, error });
      const silent = (query.meta as { silent?: boolean } | undefined)?.silent;
      if (!silent) {
        // Only surface if the user is actively waiting (no observers means background refetch)
        if (query.state.data === undefined) {
          toast.error('Something went wrong loading data', {
            description: 'Please check your connection and try again.',
          });
        }
      }
    },
  }),
  mutationCache: new MutationCache({
    onError: (error, _variables, _context, mutation) => {
      logger.error('[mutation]', { key: mutation.options.mutationKey, error });
    },
  }),
});

/**
 * Stable, hierarchical query keys. Hierarchical so we can invalidate at
 * any level (e.g. invalidate all "shifts" or just "shifts for team X").
 */
export const qk = {
  shifts: {
    all: ['shifts'] as const,
    byTeam: (teamId: string) => ['shifts', 'team', teamId] as const,
    byWorker: (workerId: string) => ['shifts', 'worker', workerId] as const,
    detail: (shiftId: string) => ['shifts', 'detail', shiftId] as const,
  },
  notifications: {
    all: ['notifications'] as const,
    byUser: (userId: string) => ['notifications', userId] as const,
  },
  team: {
    members: (teamId: string) => ['team', teamId, 'members'] as const,
    settings: (teamId: string) => ['team', teamId, 'settings'] as const,
    invitations: (teamId: string) => ['team', teamId, 'invitations'] as const,
    memberships: (userId: string) => ['team', 'memberships', userId] as const,
  },
  swaps: {
    byTeam: (teamId: string) => ['swaps', 'team', teamId] as const,
    byWorker: (workerId: string) => ['swaps', 'worker', workerId] as const,
  },
  callOffs: {
    byTeam: (teamId: string) => ['callOffs', 'team', teamId] as const,
    byWorker: (workerId: string) => ['callOffs', 'worker', workerId] as const,
  },
  shiftRequests: {
    byTeam: (teamId: string) => ['shiftRequests', 'team', teamId] as const,
    byWorker: (workerId: string) => ['shiftRequests', 'worker', workerId] as const,
  },
  shiftActivity: {
    byShift: (shiftId: string) => ['shiftActivity', shiftId] as const,
  },
  templates: {
    byTeam: (teamId: string) => ['templates', teamId] as const,
  },
} as const;
