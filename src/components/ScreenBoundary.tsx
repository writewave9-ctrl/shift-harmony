import React, { Suspense } from 'react';
import { ErrorBoundary, FallbackProps } from 'react-error-boundary';
import { useQueryClient } from '@tanstack/react-query';
import { AlertOctagon, RefreshCw, Home } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { logger } from '@/lib/logger';

const DefaultLoader: React.FC<{ label?: string }> = ({ label = 'Loading' }) => (
  <div
    role="status"
    aria-label={label}
    className="min-h-[60vh] flex flex-col items-center justify-center px-6 gap-4"
  >
    <div className="w-full max-w-md space-y-3">
      <Skeleton className="h-8 w-1/2 rounded-lg" />
      <Skeleton className="h-4 w-3/4 rounded" />
      <div className="grid gap-3 mt-6">
        <Skeleton className="h-24 w-full rounded-2xl" />
        <Skeleton className="h-24 w-full rounded-2xl" />
        <Skeleton className="h-24 w-full rounded-2xl" />
      </div>
    </div>
    <span className="sr-only">{label}…</span>
  </div>
);

const DefaultErrorFallback: React.FC<FallbackProps & { homeHref?: string }> = ({
  error,
  resetErrorBoundary,
  homeHref = '/',
}) => {
  const qc = useQueryClient();
  const handleRetry = () => {
    qc.invalidateQueries();
    resetErrorBoundary();
  };
  return (
    <div
      role="alert"
      className="min-h-[60vh] flex flex-col items-center justify-center px-6"
    >
      <div className="max-w-md w-full bg-card border border-border/60 rounded-3xl p-8 shadow-soft text-center">
        <div className="mx-auto w-14 h-14 rounded-2xl bg-destructive-muted text-destructive flex items-center justify-center mb-4 shadow-inset-hairline">
          <AlertOctagon className="w-7 h-7" strokeWidth={1.8} />
        </div>
        <h2 className="font-display text-xl font-semibold text-foreground tracking-tight">
          Something went wrong on this screen
        </h2>
        <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
          We hit an unexpected hiccup loading this view. Your data is safe — try
          again in a moment, or head back home.
        </p>
        {import.meta.env.DEV && error?.message && (
          <pre className="mt-4 text-[11px] text-left bg-muted/60 rounded-lg p-3 overflow-x-auto text-muted-foreground">
            {error.message}
          </pre>
        )}
        <div className="flex gap-2 justify-center mt-6">
          <Button onClick={handleRetry} className="rounded-xl gap-2">
            <RefreshCw className="w-4 h-4" /> Try again
          </Button>
          <Button asChild variant="outline" className="rounded-xl gap-2">
            <Link to={homeHref}>
              <Home className="w-4 h-4" /> Go home
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

interface ScreenBoundaryProps {
  children: React.ReactNode;
  /** Optional custom loader; defaults to a premium skeleton */
  fallback?: React.ReactNode;
  /** Where the "Go home" button should navigate */
  homeHref?: string;
  /** Label for screen readers while loading */
  loadingLabel?: string;
}

/**
 * ScreenBoundary
 *
 * Composes Suspense + react-error-boundary with premium empty/error states.
 * - Loader: editorial skeleton, never a raw spinner.
 * - Error: friendly card with retry (invalidates RQ cache) and home link.
 * - Sanitized logging in production via the project logger.
 */
export const ScreenBoundary: React.FC<ScreenBoundaryProps> = ({
  children,
  fallback,
  homeHref,
  loadingLabel,
}) => {
  return (
    <ErrorBoundary
      onError={(error, info) => logger.error('[screen]', { error, info })}
      FallbackComponent={(props) => (
        <DefaultErrorFallback {...props} homeHref={homeHref} />
      )}
    >
      <Suspense fallback={fallback ?? <DefaultLoader label={loadingLabel} />}>
        {children}
      </Suspense>
    </ErrorBoundary>
  );
};
