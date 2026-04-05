import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/lib/auth";
import Index from "./pages/Index.tsx";
import Auth from "./pages/Auth.tsx";
import Dashboard from "./pages/Dashboard.tsx";
import Bots from "./pages/Bots.tsx";
import CreateAgent from "./pages/CreateAgent.tsx";
import Knowledge from "./pages/Knowledge.tsx";
import Analytics from "./pages/Analytics.tsx";
import Leads from "./pages/Leads.tsx";
import SettingsPage from "./pages/SettingsPage.tsx";
import WidgetDemo from "./pages/WidgetDemo.tsx";
import AdminDashboard from "./pages/AdminDashboard.tsx";
import Billing from "./pages/Billing.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/bots" element={<Bots />} />
            <Route path="/create-agent" element={<CreateAgent />} />
            <Route path="/knowledge" element={<Knowledge />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/leads" element={<Leads />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/billing" element={<Billing />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/widget/:botId" element={<WidgetDemo />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
