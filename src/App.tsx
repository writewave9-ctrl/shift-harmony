import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppProvider } from "@/contexts/AppContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/components/ThemeProvider";
import { useRealtimeNotifications } from "@/hooks/useRealtimeNotifications";
import { Skeleton } from "@/components/ui/skeleton";

// Pages
import Auth from "./pages/Auth";
import RoleSelect from "./pages/RoleSelect";
import NotFound from "./pages/NotFound";

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

// Protected route wrapper
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  
  // Enable realtime notifications for authenticated users
  useRealtimeNotifications();
  
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <Skeleton className="h-8 w-32 rounded-lg" />
        <Skeleton className="h-4 w-48 rounded" />
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/auth" replace />;
  }
  
  return <>{children}</>;
};

// Route based on role
const RoleRouter = () => {
  const { userRole, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <Skeleton className="h-8 w-32 rounded-lg" />
        <Skeleton className="h-4 w-48 rounded" />
      </div>
    );
  }
  
  if (userRole?.role === 'manager' || userRole?.role === 'admin') {
    return <Navigate to="/manager" replace />;
  }
  
  return <Navigate to="/worker" replace />;
};

// Public route (redirects to app if already logged in)
const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading, userRole } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <Skeleton className="h-8 w-32 rounded-lg" />
        <Skeleton className="h-4 w-48 rounded" />
      </div>
    );
  }
  
  if (user) {
    // Redirect based on role
    if (userRole?.role === 'manager' || userRole?.role === 'admin') {
      return <Navigate to="/manager" replace />;
    }
    return <Navigate to="/worker" replace />;
  }
  
  return <>{children}</>;
};

const AppRoutes = () => (
  <Routes>
    {/* Public Routes */}
    <Route path="/auth" element={
      <PublicRoute>
        <Auth />
      </PublicRoute>
    } />

    {/* Role Router (redirects based on user role) */}
    <Route path="/" element={
      <ProtectedRoute>
        <RoleRouter />
      </ProtectedRoute>
    } />

    {/* Demo Mode - Role Selection */}
    <Route path="/demo" element={<RoleSelect />} />

    {/* Worker Routes */}
    <Route path="/worker" element={
      <ProtectedRoute>
        <WorkerLayout />
      </ProtectedRoute>
    }>
      <Route index element={<WorkerHome />} />
      <Route path="shifts" element={<WorkerShifts />} />
      <Route path="history" element={<WorkerShiftHistory />} />
      <Route path="profile" element={<WorkerProfile />} />
      <Route path="notifications" element={<WorkerNotifications />} />
    </Route>

    {/* Manager Routes */}
    <Route path="/manager" element={
      <ProtectedRoute>
        <ManagerLayout />
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
          <AppProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <AppRoutes />
            </BrowserRouter>
          </AppProvider>
        </AuthProvider>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
