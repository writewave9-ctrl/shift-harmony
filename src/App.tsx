import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppProvider } from "@/contexts/AppContext";

// Pages
import RoleSelect from "./pages/RoleSelect";
import NotFound from "./pages/NotFound";

// Worker Pages
import { WorkerLayout } from "./layouts/WorkerLayout";
import { WorkerHome } from "./pages/worker/WorkerHome";
import { WorkerShifts } from "./pages/worker/WorkerShifts";
import { WorkerProfile } from "./pages/worker/WorkerProfile";
import { WorkerNotifications } from "./pages/worker/WorkerNotifications";

// Manager Pages
import { ManagerLayout } from "./layouts/ManagerLayout";
import { ManagerDashboard } from "./pages/manager/ManagerDashboard";
import { ManagerShifts } from "./pages/manager/ManagerShifts";
import { ManagerTeam } from "./pages/manager/ManagerTeam";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AppProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Role Selection */}
            <Route path="/" element={<RoleSelect />} />

            {/* Worker Routes */}
            <Route path="/worker" element={<WorkerLayout />}>
              <Route index element={<WorkerHome />} />
              <Route path="shifts" element={<WorkerShifts />} />
              <Route path="profile" element={<WorkerProfile />} />
              <Route path="notifications" element={<WorkerNotifications />} />
            </Route>

            {/* Manager Routes */}
            <Route path="/manager" element={<ManagerLayout />}>
              <Route index element={<ManagerDashboard />} />
              <Route path="shifts" element={<ManagerShifts />} />
              <Route path="team" element={<ManagerTeam />} />
            </Route>

            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AppProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
