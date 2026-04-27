import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { queryClient } from "@/lib/queryClient";

import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/components/ThemeProvider";
import { useRealtimeNotifications } from "@/hooks/useRealtimeNotifications";
import { Skeleton } from "@/components/ui/skeleton";
import { ScreenBoundary } from "@/components/ScreenBoundary";

// Pages
import Auth from "./pages/Auth";
import { ResetPassword } from "./pages/ResetPassword";
import AcceptInvite from "./pages/AcceptInvite";

import NotFound from "./pages/NotFound";
import { Landing } from "./pages/Landing";

// Worker Pages
import { WorkerLayout } from "./layouts/WorkerLayout";
import { WorkerHome } from "./pages/worker/WorkerHome";
import { WorkerShifts } from "./pages/worker/WorkerShifts";
import { WorkerProfile } from "./pages/worker/WorkerProfile";
import { WorkerNotifications } from "./pages/worker/WorkerNotifications";
import WorkerTeamDirectory from "./pages/worker/WorkerTeamDirectory";
import WorkerShiftHistory from "./pages/worker/WorkerShiftHistory";

// Manager Pages
import { ManagerLayout } from "./layouts/ManagerLayout";
import { ManagerDashboard } from "./pages/manager/ManagerDashboard";
import { ManagerShifts } from "./pages/manager/ManagerShifts";
import { ManagerTeam } from "./pages/manager/ManagerTeam";
import { ManagerSettings } from "./pages/manager/ManagerSettings";
import { ManagerAnalytics } from "./pages/manager/ManagerAnalytics";
import { ManagerShiftRequests } from "./pages/manager/ManagerShiftRequests";
import { ManagerNotifications } from "./pages/manager/ManagerNotifications";
import { ManagerAutoFill } from "./pages/manager/ManagerAutoFill";
import { ManagerSupport } from "./pages/manager/ManagerSupport";



const LoadingScreen = () => (
  <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
      <div className="w-6 h-6 rounded-md bg-primary animate-pulse" />
    </div>
    <Skeleton className="h-4 w-32 rounded" />
  </div>
);

// Protected route wrapper - requires authentication
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();

  useRealtimeNotifications();

  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/auth" replace />;

  return <>{children}</>;
};

// Role-gated route - requires specific role(s)
const RoleGate = ({ 
  children, 
  allowed, 
  fallback 
}: { 
  children: React.ReactNode; 
  allowed: Array<'admin' | 'manager' | 'worker'>; 
  fallback: string;
}) => {
  const { userRole, loading, user } = useAuth();

  if (loading) return <LoadingScreen />;

  // While role is still loading after auth, show loading
  if (user && !userRole) return <LoadingScreen />;

  if (!userRole || !allowed.includes(userRole.role)) {
    return <Navigate to={fallback} replace />;
  }

  return <>{children}</>;
};

// Route based on role
const RoleRouter = () => {
  const { userRole, loading } = useAuth();

  if (loading) return <LoadingScreen />;

  if (userRole?.role === 'manager' || userRole?.role === 'admin') {
    return <Navigate to="/manager" replace />;
  }

  return <Navigate to="/worker" replace />;
};

// Public route (redirects to app if already logged in)
const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading, userRole } = useAuth();

  if (loading) return <LoadingScreen />;
  if (user && !userRole) return <LoadingScreen />;

  if (user && userRole) {
    if (userRole.role === 'manager' || userRole.role === 'admin') {
      return <Navigate to="/manager" replace />;
    }
    return <Navigate to="/worker" replace />;
  }

  return <>{children}</>;
};

// Landing page - shows landing for unauthed, redirects authed users
const LandingRoute = () => {
  const { user, loading, userRole } = useAuth();

  if (loading) return <LoadingScreen />;
  if (user && !userRole) return <LoadingScreen />;

  if (user && userRole) {
    if (userRole.role === 'manager' || userRole.role === 'admin') {
      return <Navigate to="/manager" replace />;
    }
    return <Navigate to="/worker" replace />;
  }

  return <Landing />;
};

const AppRoutes = () => (
  <Routes>
    {/* Landing page for unauthenticated visitors */}
    <Route path="/" element={<LandingRoute />} />

    {/* Auth */}
    <Route path="/auth" element={
      <PublicRoute><Auth /></PublicRoute>
    } />
    <Route path="/reset-password" element={<ResetPassword />} />
    <Route path="/accept-invite" element={<AcceptInvite />} />

    

    {/* Worker Routes - only workers can access */}
    <Route path="/worker" element={
      <ProtectedRoute>
        <RoleGate allowed={['worker']} fallback="/manager">
          <WorkerLayout />
        </RoleGate>
      </ProtectedRoute>
    }>
      <Route index element={<ScreenBoundary homeHref="/worker"><WorkerHome /></ScreenBoundary>} />
      <Route path="shifts" element={<ScreenBoundary homeHref="/worker"><WorkerShifts /></ScreenBoundary>} />
      <Route path="team" element={<ScreenBoundary homeHref="/worker"><WorkerTeamDirectory /></ScreenBoundary>} />
      <Route path="history" element={<ScreenBoundary homeHref="/worker"><WorkerShiftHistory /></ScreenBoundary>} />
      <Route path="profile" element={<ScreenBoundary homeHref="/worker"><WorkerProfile /></ScreenBoundary>} />
      <Route path="notifications" element={<ScreenBoundary homeHref="/worker"><WorkerNotifications /></ScreenBoundary>} />
    </Route>

    {/* Manager Routes - only managers/admins can access */}
    <Route path="/manager" element={
      <ProtectedRoute>
        <RoleGate allowed={['manager', 'admin']} fallback="/worker">
          <ManagerLayout />
        </RoleGate>
      </ProtectedRoute>
    }>
      <Route index element={<ScreenBoundary homeHref="/manager"><ManagerDashboard /></ScreenBoundary>} />
      <Route path="shifts" element={<ScreenBoundary homeHref="/manager"><ManagerShifts /></ScreenBoundary>} />
      <Route path="team" element={<ScreenBoundary homeHref="/manager"><ManagerTeam /></ScreenBoundary>} />
      <Route path="analytics" element={<ScreenBoundary homeHref="/manager"><ManagerAnalytics /></ScreenBoundary>} />
      <Route path="requests" element={<ScreenBoundary homeHref="/manager"><ManagerShiftRequests /></ScreenBoundary>} />
      <Route path="notifications" element={<ScreenBoundary homeHref="/manager"><ManagerNotifications /></ScreenBoundary>} />
      <Route path="settings" element={<ScreenBoundary homeHref="/manager"><ManagerSettings /></ScreenBoundary>} />
      <Route path="shifts/auto-fill" element={<ScreenBoundary homeHref="/manager"><ManagerAutoFill /></ScreenBoundary>} />
      <Route path="support" element={<ScreenBoundary homeHref="/manager"><ManagerSupport /></ScreenBoundary>} />
    </Route>

    {/* Catch-all */}
    <Route path="*" element={<NotFound />} />
  </Routes>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <AuthProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <AppRoutes />
            </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
