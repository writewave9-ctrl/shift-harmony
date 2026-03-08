import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/components/ThemeProvider";
import { useRealtimeNotifications } from "@/hooks/useRealtimeNotifications";
import { Skeleton } from "@/components/ui/skeleton";

// Pages
import Auth from "./pages/Auth";
import { ResetPassword } from "./pages/ResetPassword";
import RoleSelect from "./pages/RoleSelect";
import NotFound from "./pages/NotFound";
import { Landing } from "./pages/Landing";

// Worker Pages
import { WorkerLayout } from "./layouts/WorkerLayout";
import { WorkerHome } from "./pages/worker/WorkerHome";
import { WorkerShifts } from "./pages/worker/WorkerShifts";
import { WorkerProfile } from "./pages/worker/WorkerProfile";
import { WorkerNotifications } from "./pages/worker/WorkerNotifications";
import WorkerShiftHistory from "./pages/worker/WorkerShiftHistory";

// Manager Pages
import { ManagerLayout } from "./layouts/ManagerLayout";
import { ManagerDashboard } from "./pages/manager/ManagerDashboard";
import { ManagerShifts } from "./pages/manager/ManagerShifts";
import { ManagerTeam } from "./pages/manager/ManagerTeam";
import { ManagerSettings } from "./pages/manager/ManagerSettings";
import { ManagerAnalytics } from "./pages/manager/ManagerAnalytics";
import { ManagerShiftRequests } from "./pages/manager/ManagerShiftRequests";

const queryClient = new QueryClient();

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

    <Route path="/demo" element={<RoleSelect />} />

    {/* Worker Routes - only workers can access */}
    <Route path="/worker" element={
      <ProtectedRoute>
        <RoleGate allowed={['worker']} fallback="/manager">
          <WorkerLayout />
        </RoleGate>
      </ProtectedRoute>
    }>
      <Route index element={<WorkerHome />} />
      <Route path="shifts" element={<WorkerShifts />} />
      <Route path="history" element={<WorkerShiftHistory />} />
      <Route path="profile" element={<WorkerProfile />} />
      <Route path="notifications" element={<WorkerNotifications />} />
    </Route>

    {/* Manager Routes - only managers/admins can access */}
    <Route path="/manager" element={
      <ProtectedRoute>
        <RoleGate allowed={['manager', 'admin']} fallback="/worker">
          <ManagerLayout />
        </RoleGate>
      </ProtectedRoute>
    }>
      <Route index element={<ManagerDashboard />} />
      <Route path="shifts" element={<ManagerShifts />} />
      <Route path="team" element={<ManagerTeam />} />
      <Route path="analytics" element={<ManagerAnalytics />} />
      <Route path="requests" element={<ManagerShiftRequests />} />
      <Route path="settings" element={<ManagerSettings />} />
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
